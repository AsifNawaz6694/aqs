<?php

namespace App\Mail;

use App\Models\User;
use App\Models\TwoFactorCode;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TwoFactorCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public TwoFactorCode $twoFactorCode;
    public int $expiresInMinutes;

    public function __construct(User $user, TwoFactorCode $twoFactorCode)
    {
        $this->user = $user;
        $this->twoFactorCode = $twoFactorCode;
        $this->expiresInMinutes = (int) $twoFactorCode->expires_at->diffInMinutes(now());
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Login Verification Code - Rental Quotation System',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.two-factor-code',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
