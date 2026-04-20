<?php

namespace App\Jobs;

use App\Models\ActivityLog;
use App\Models\Quotation;
use App\Models\SystemSetting;
use App\Models\User;
use Barryvdh\DomPDF\PDF;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateQuotationPdf implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Quotation $quotation,
        public ?User $user = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(PDF $pdf): void
    {
        Log::info('Generating quotation PDF', [
            'quotation_number' => $this->quotation->quotation_number,
            'user_id' => $this->user?->id,
        ]);

        $this->quotation->load([
            'client',
            'user:id,name,email',
            'items',
        ]);

        // Get company settings
        $companySettings = [
            'name' => SystemSetting::getValue('company_name', 'Ekuep.com'),
            'address' => SystemSetting::getValue('company_address', 'Wosol For Communication & Information Technology'),
            'phone' => SystemSetting::getValue('company_phone', '920035110'),
            'email' => SystemSetting::getValue('company_email', 'ekuep@ekuep.com'),
            'vat_number' => SystemSetting::getValue('company_vat_number', '300774863200003'),
            'logo_url' => SystemSetting::getValue('company_logo_url', ''),
        ];

        // Generate PDF
        $pdfInstance = $pdf->loadView('pdf.quotation', [
            'quotation' => $this->quotation,
            'company' => $companySettings,
        ]);

        $pdfInstance->setPaper('A4', 'portrait');

        // Store PDF
        $filename = "quotations/{$this->quotation->quotation_number}.pdf";
        Storage::put($filename, $pdfInstance->output());

        // Update quotation
        $this->quotation->pdf_path = $filename;
        $this->quotation->pdf_generated_at = now();
        $this->quotation->save();

        // Record history
        $this->quotation->statusHistory()->create([
            'user_id' => $this->user?->id,
            'from_status' => $this->quotation->status,
            'to_status' => $this->quotation->status,
            'action' => 'pdf_generated',
            'notes' => 'PDF document generated',
        ]);

        // Log activity
        if ($this->user) {
            ActivityLog::log(
                'pdf_generated',
                "Generated PDF for quotation {$this->quotation->quotation_number}",
                $this->quotation,
                $this->user,
                [],
                [],
                'quotations'
            );
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Quotation PDF generation failed', [
            'quotation_number' => $this->quotation->quotation_number,
            'error' => $exception->getMessage(),
        ]);

        if ($this->user) {
            ActivityLog::log(
                'pdf_failed',
                "Failed to generate PDF for quotation {$this->quotation->quotation_number}: {$exception->getMessage()}",
                $this->quotation,
                $this->user,
                ['error' => $exception->getMessage()],
                [],
                'quotations'
            );
        }
    }
}
