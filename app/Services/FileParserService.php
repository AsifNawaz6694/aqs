<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use PhpOffice\PhpSpreadsheet\Reader\Csv;
use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use PhpOffice\PhpWord\Element\Table;
use PhpOffice\PhpWord\Element\Row;
use PhpOffice\PhpWord\Element\Cell;
use PhpOffice\PhpWord\Element\TextRun;
use PhpOffice\PhpWord\Element\Text;

class FileParserService
{
    /**
     * Supported file extensions.
     */
    protected array $supportedExtensions = ['xlsx', 'xls', 'csv', 'docx'];

    /**
     * Parse an uploaded file and extract data.
     *
     * @param UploadedFile $file
     * @return array
     * @throws \Exception
     */
    public function parse(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $filename = $file->getClientOriginalName();

        Log::info('File parsing started', ['filename' => $filename, 'extension' => $extension, 'size' => $file->getSize()]);

        if (!in_array($extension, $this->supportedExtensions)) {
            Log::warning('Unsupported file format attempted', ['filename' => $filename, 'extension' => $extension]);
            throw new \Exception("Unsupported file format. Supported formats: " . implode(', ', $this->supportedExtensions));
        }

        try {
            $result = match ($extension) {
                'xlsx', 'xls' => $this->parseExcel($file),
                'csv' => $this->parseCsv($file),
                'docx' => $this->parseWord($file),
                default => throw new \Exception("Unsupported file format: {$extension}"),
            };

            Log::info('File parsed successfully', [
                'filename' => $filename,
                'rows' => $result['total_rows'] ?? 0,
                'columns' => $result['total_columns'] ?? 0,
            ]);

            return $result;
        } catch (\Exception $e) {
            Log::error('File parsing failed', ['filename' => $filename, 'extension' => $extension, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Parse Excel files (xlsx, xls).
     *
     * @param UploadedFile $file
     * @return array
     */
    protected function parseExcel(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $data = $worksheet->toArray(null, true, true, true);

        // Convert to standardized format
        $headers = [];
        $rows = [];
        $isFirstRow = true;

        foreach ($data as $rowIndex => $row) {
            // Filter out completely empty rows
            $filteredRow = array_filter($row, fn($cell) => $cell !== null && $cell !== '');

            if (empty($filteredRow)) {
                continue;
            }

            if ($isFirstRow) {
                // Use first row as headers or generate column letters
                $headers = array_map(function ($cell, $key) {
                    return $cell ?? $key;
                }, $row, array_keys($row));
                $isFirstRow = false;
            } else {
                $rows[] = array_values($row);
            }
        }

        return [
            'headers' => array_values($headers),
            'rows' => $rows,
            'total_rows' => count($rows),
            'total_columns' => count($headers),
            'source' => $file->getClientOriginalName(),
        ];
    }

    /**
     * Parse CSV files.
     *
     * @param UploadedFile $file
     * @return array
     */
    protected function parseCsv(UploadedFile $file): array
    {
        $handle = fopen($file->getPathname(), 'r');

        if ($handle === false) {
            throw new \Exception("Failed to open CSV file");
        }

        $headers = [];
        $rows = [];
        $isFirstRow = true;

        while (($row = fgetcsv($handle)) !== false) {
            // Filter out completely empty rows
            $filteredRow = array_filter($row, fn($cell) => $cell !== null && $cell !== '');

            if (empty($filteredRow)) {
                continue;
            }

            if ($isFirstRow) {
                $headers = $row;
                $isFirstRow = false;
            } else {
                $rows[] = $row;
            }
        }

        fclose($handle);

        return [
            'headers' => $headers,
            'rows' => $rows,
            'total_rows' => count($rows),
            'total_columns' => count($headers),
            'source' => $file->getClientOriginalName(),
        ];
    }

    /**
     * Parse Word documents (docx).
     *
     * @param UploadedFile $file
     * @return array
     */
    protected function parseWord(UploadedFile $file): array
    {
        $phpWord = WordIOFactory::load($file->getPathname());
        $tables = [];

        // Iterate through sections to find tables
        foreach ($phpWord->getSections() as $section) {
            foreach ($section->getElements() as $element) {
                if ($element instanceof Table) {
                    $tableData = $this->extractTableData($element);
                    if (!empty($tableData)) {
                        $tables[] = $tableData;
                    }
                }
            }
        }

        if (empty($tables)) {
            throw new \Exception("No tables found in the Word document");
        }

        // Use the first table with the most data
        $primaryTable = collect($tables)->sortByDesc(fn($t) => count($t['rows']))->first();

        return [
            'headers' => $primaryTable['headers'] ?? [],
            'rows' => $primaryTable['rows'] ?? [],
            'total_rows' => count($primaryTable['rows'] ?? []),
            'total_columns' => count($primaryTable['headers'] ?? []),
            'source' => $file->getClientOriginalName(),
            'all_tables' => $tables, // Include all tables for selection
        ];
    }

    /**
     * Extract data from a Word table.
     *
     * @param Table $table
     * @return array
     */
    protected function extractTableData(Table $table): array
    {
        $rows = $table->getRows();
        $headers = [];
        $data = [];
        $isFirstRow = true;

        foreach ($rows as $row) {
            $cells = $row->getCells();
            $rowData = [];

            foreach ($cells as $cell) {
                $cellText = $this->extractCellText($cell);
                $rowData[] = $cellText;
            }

            // Filter out empty rows
            $filteredRow = array_filter($rowData, fn($cell) => $cell !== null && trim($cell) !== '');

            if (empty($filteredRow)) {
                continue;
            }

            if ($isFirstRow) {
                $headers = $rowData;
                $isFirstRow = false;
            } else {
                $data[] = $rowData;
            }
        }

        return [
            'headers' => $headers,
            'rows' => $data,
        ];
    }

    /**
     * Extract text content from a Word cell.
     *
     * @param Cell $cell
     * @return string
     */
    protected function extractCellText(Cell $cell): string
    {
        $text = '';

        foreach ($cell->getElements() as $element) {
            if ($element instanceof TextRun) {
                foreach ($element->getElements() as $textElement) {
                    if ($textElement instanceof Text) {
                        $text .= $textElement->getText();
                    }
                }
            } elseif ($element instanceof Text) {
                $text .= $element->getText();
            }
        }

        return trim($text);
    }

    /**
     * Get supported file extensions.
     *
     * @return array
     */
    public function getSupportedExtensions(): array
    {
        return $this->supportedExtensions;
    }

    /**
     * Validate that minimum required columns exist.
     *
     * @param array $parsedData
     * @return bool
     */
    public function validateMinimumColumns(array $parsedData): bool
    {
        return isset($parsedData['total_columns']) && $parsedData['total_columns'] >= 2;
    }

    /**
     * Validate that minimum required rows exist.
     *
     * @param array $parsedData
     * @return bool
     */
    public function validateMinimumRows(array $parsedData): bool
    {
        return isset($parsedData['total_rows']) && $parsedData['total_rows'] >= 1;
    }

    /**
     * Extract product references and quantities from parsed data.
     *
     * @param array $parsedData
     * @param int $referenceColumn Index of the column containing product references
     * @param int $quantityColumn Index of the column containing quantities
     * @param int|null $nameColumn Optional index of the column containing product names
     * @return Collection
     */
    public function extractProductData(
        array $parsedData,
        int $referenceColumn = 0,
        int $quantityColumn = 1,
        ?int $nameColumn = null
    ): Collection {
        $products = collect();

        foreach ($parsedData['rows'] as $row) {
            $reference = trim($row[$referenceColumn] ?? '');
            $quantity = $this->parseQuantity($row[$quantityColumn] ?? 1);
            $name = $nameColumn !== null ? trim($row[$nameColumn] ?? '') : '';

            if (empty($reference)) {
                continue;
            }

            $products->push([
                'reference' => $reference,
                'quantity' => $quantity,
                'name' => $name,
                'raw_row' => $row,
            ]);
        }

        return $products;
    }

    /**
     * Parse quantity value from string.
     *
     * @param mixed $value
     * @return float
     */
    protected function parseQuantity(mixed $value): float
    {
        if (is_numeric($value)) {
            return max(1, (float) $value);
        }

        // Try to extract number from string
        preg_match('/[\d.,]+/', (string) $value, $matches);

        if (!empty($matches[0])) {
            $number = str_replace(',', '', $matches[0]);
            return max(1, (float) $number);
        }

        return 1;
    }
}
