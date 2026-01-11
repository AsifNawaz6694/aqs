<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class EkuepApiService
{
    /**
     * EKUEP API base URL for product search.
     */
    protected string $apiUrl = 'https://www.ekuep.com/api/get-products-for-aqs-search';

    /**
     * Cache duration in seconds (5 minutes).
     */
    protected int $cacheDuration = 300;

    /**
     * HTTP request timeout in seconds.
     */
    protected int $timeout = 15;

    /**
     * Search products from EKUEP API.
     *
     * @param string $query Search query
     * @param int $limit Maximum number of results
     * @return array
     */
    public function searchProducts(string $query, int $limit = 20): array
    {
        if (empty(trim($query))) {
            return [];
        }

        $cacheKey = 'ekuep_search_' . md5($query . '_' . $limit);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($query, $limit) {
            try {
                $response = Http::timeout($this->timeout)
                    ->get($this->apiUrl, [
                        'q' => $query,
                    ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $hits = $data['data']['hits'] ?? [];

                    // Limit results
                    $hits = array_slice($hits, 0, $limit);

                    return $this->transformProducts($hits);
                }

                Log::warning('EKUEP API search failed', [
                    'query' => $query,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return [];
            } catch (\Exception $e) {
                Log::error('EKUEP API search error', [
                    'query' => $query,
                    'error' => $e->getMessage(),
                ]);

                return [];
            }
        });
    }

    /**
     * Search products by reference codes.
     *
     * @param array $references Array of reference codes
     * @return array
     */
    public function searchByReferences(array $references): array
    {
        $results = [];

        foreach ($references as $reference) {
            $cacheKey = 'ekuep_ref_' . md5($reference);

            $product = Cache::remember($cacheKey, $this->cacheDuration, function () use ($reference) {
                try {
                    $response = Http::timeout($this->timeout)
                        ->get($this->apiUrl, [
                            'q' => $reference,
                        ]);

                    if ($response->successful()) {
                        $data = $response->json();
                        $hits = $data['data']['hits'] ?? [];

                        // Find exact match by reference
                        foreach ($hits as $hit) {
                            if (
                                (isset($hit['reference']) && strcasecmp($hit['reference'], $reference) === 0) ||
                                (isset($hit['sku']) && strcasecmp($hit['sku'], $reference) === 0)
                            ) {
                                return $this->transformProduct($hit);
                            }
                        }

                        // Return first result if no exact match
                        if (!empty($hits)) {
                            return $this->transformProduct($hits[0]);
                        }
                    }

                    return null;
                } catch (\Exception $e) {
                    Log::error('EKUEP API reference search error', [
                        'reference' => $reference,
                        'error' => $e->getMessage(),
                    ]);

                    return null;
                }
            });

            $results[$reference] = $product;
        }

        return $results;
    }

    /**
     * Transform API response products to internal format.
     *
     * @param array $hits API response hits
     * @return array
     */
    protected function transformProducts(array $hits): array
    {
        return array_map(fn($hit) => $this->transformProduct($hit), $hits);
    }

    /**
     * Transform a single product from API format to internal format.
     *
     * @param array $hit API product data
     * @return array
     */
    protected function transformProduct(array $hit): array
    {
        $specifications = $hit['product_specifications'] ?? [];

        // Extract electrical specifications
        $voltage = $specifications['voltage'] ?? null;
        $power = $specifications['power'] ?? null;
        $frequency = $specifications['frequency'] ?? null;
        $dimensions = $specifications['dimensions'] ?? null;
        $weight = $specifications['weight'] ?? null;

        // Calculate amperage if power and voltage are available
        $amperage = null;
        if ($power && $voltage) {
            $powerValue = $this->extractNumericValue($power);
            $voltageValue = $this->extractNumericValue($voltage);
            if ($powerValue > 0 && $voltageValue > 0) {
                $amperage = round($powerValue / $voltageValue, 2);
            }
        }

        // The price from EKUEP is VAT inclusive (15% for KSA)
        // Calculate base price (price before VAT) for quotation calculations
        $vatInclusivePrice = (float) ($hit['final_price'] ?? 0);
        $vatRate = 15; // 15% VAT for KSA
        $basePrice = round($vatInclusivePrice / (1 + ($vatRate / 100)), 2);

        return [
            'id' => $hit['id'] ?? null,
            'external_id' => $hit['id'] ?? null,
            'sku' => $hit['reference'] ?? null,
            'external_reference' => $hit['reference'] ?? null,
            'name' => $hit['name'] ?? '',
            'description' => $hit['description'] ?? null,
            'price' => $basePrice, // Base price (VAT exclusive)
            'price_vat_inclusive' => $vatInclusivePrice, // Original VAT inclusive price
            'unit' => $hit['unit'] ?? 'pc',
            'category' => $hit['category'] ?? null,
            'image_url' => $hit['image_url'] ?? null,
            'slug' => $hit['slug'] ?? null,
            'stock_quantity' => $hit['stock'] ?? 0,
            // Top-level electrical specs for frontend compatibility
            'voltage' => $voltage,
            'power' => $power,
            'frequency' => $frequency,
            'dimensions' => $dimensions,
            'weight' => $weight,
            'weight_unit' => $specifications['weight_unit'] ?? 'kg',
            // Nested specs object
            'product_specifications' => [
                'voltage' => $voltage,
                'power' => $power,
                'frequency' => $frequency,
                'dimensions' => $dimensions,
                'weight' => $weight,
                'spec_sheet_url' => $specifications['spec_sheet_url'] ?? null,
            ],
            'amperage' => $amperage,
            'formatted_dimensions' => $this->formatDimensions($dimensions),
            'power_requirement' => $this->formatPowerRequirement($power, $voltage, $amperage),
            'source' => 'ekuep', // Mark as external product
        ];
    }

    /**
     * Extract numeric value from a string (handles ranges like "1800-2000").
     *
     * @param mixed $value
     * @return float
     */
    protected function extractNumericValue(mixed $value): float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        if (!is_string($value) || empty($value)) {
            return 0;
        }

        // Handle ranges like "1800-2000" - use higher end for safety
        if (preg_match('/(\d+)\s*-\s*(\d+)/', $value, $matches)) {
            return max((float) $matches[1], (float) $matches[2]);
        }

        // Extract first number found
        if (preg_match('/(\d+(?:\.\d+)?)/', $value, $matches)) {
            return (float) $matches[1];
        }

        return 0;
    }

    /**
     * Format dimensions for display.
     *
     * @param mixed $dimensions
     * @return string|null
     */
    protected function formatDimensions(mixed $dimensions): ?string
    {
        if (!$dimensions) {
            return null;
        }

        if (is_string($dimensions)) {
            return $dimensions;
        }

        if (is_array($dimensions)) {
            $width = $dimensions['width'] ?? null;
            $length = $dimensions['length'] ?? null;
            $height = $dimensions['height'] ?? null;

            if ($width && $length && $height) {
                return "{$length} x {$width} x {$height}";
            }
        }

        return null;
    }

    /**
     * Format power requirement string.
     *
     * @param mixed $power
     * @param mixed $voltage
     * @param float|null $amperage
     * @return string|null
     */
    protected function formatPowerRequirement(mixed $power, mixed $voltage, ?float $amperage): ?string
    {
        if ($power && $voltage && $amperage) {
            return "{$power} / {$voltage} = {$amperage} A";
        }

        return null;
    }

    /**
     * Clear all EKUEP search cache.
     *
     * @return void
     */
    public function clearCache(): void
    {
        // Note: This is a simplified approach. In production, you might want to use
        // cache tags or a more sophisticated cache invalidation strategy.
        Cache::flush();
    }
}
