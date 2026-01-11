<?php

namespace App\Jobs;

use App\Mail\QuotationMail;
use App\Models\ActivityLog;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendQuotationEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public Quotation $quotation,
        public string $email,
        public ?string $subject,
        public ?string $message,
        public User $sender
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Generate PDF first if not exists
        if (!$this->quotation->pdf_path || !file_exists(storage_path('app/' . $this->quotation->pdf_path))) {
            GenerateQuotationPdf::dispatchSync($this->quotation, $this->sender);
            $this->quotation->refresh();
        }

        // Send email
        Mail::to($this->email)->send(new QuotationMail(
            $this->quotation,
            $this->subject,
            $this->message
        ));

        // Update quotation
        $this->quotation->sent_at = now();
        $this->quotation->sent_to_email = $this->email;
        $this->quotation->save();

        // Change status if approved
        if ($this->quotation->status === Quotation::STATUS_APPROVED) {
            $this->quotation->changeStatus(
                Quotation::STATUS_SENT,
                $this->sender->id,
                "Sent to {$this->email}"
            );
        }

        // Log activity
        ActivityLog::log(
            'sent',
            "Quotation {$this->quotation->quotation_number} sent to {$this->email}",
            $this->quotation,
            $this->sender,
            ['email' => $this->email],
            [],
            'quotations'
        );
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        ActivityLog::log(
            'email_failed',
            "Failed to send quotation {$this->quotation->quotation_number} to {$this->email}: {$exception->getMessage()}",
            $this->quotation,
            $this->sender,
            ['email' => $this->email, 'error' => $exception->getMessage()],
            [],
            'quotations'
        );
    }
}
