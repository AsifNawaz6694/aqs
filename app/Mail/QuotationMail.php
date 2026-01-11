<?php

namespace App\Mail;

use App\Models\Quotation;
use App\Models\SystemSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuotationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Quotation $quotation,
        public ?string $customSubject = null,
        public ?string $customMessage = null
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $companyName = SystemSetting::getValue('company_name', 'Ekuep Trading Company');
        $subject = $this->customSubject ?? "Quotation {$this->quotation->quotation_number} from {$companyName}";

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.quotation',
            with: [
                'quotation' => $this->quotation,
                'customMessage' => $this->customMessage,
                'companyName' => SystemSetting::getValue('company_name', 'Ekuep Trading Company'),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        $attachments = [];

        if ($this->quotation->pdf_path && file_exists(storage_path('app/' . $this->quotation->pdf_path))) {
            $attachments[] = Attachment::fromPath(storage_path('app/' . $this->quotation->pdf_path))
                ->as("Quotation-{$this->quotation->quotation_number}.pdf")
                ->withMime('application/pdf');
        }

        return $attachments;
    }
}
