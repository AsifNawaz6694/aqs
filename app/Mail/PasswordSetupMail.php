<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordSetupMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;
    public string $setupUrl;

    public function __construct(User $user)
    {
        $this->user = $user;
        $this->setupUrl = route('password.setup', ['token' => $user->password_setup_token]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Set Up Your Account Password - Rental Quotation System',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-setup',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
