<?php

namespace App\Mail;

use App\Models\EmailLog; // <-- Import your EmailLog model
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Headers; // <-- Import the Headers class
use Illuminate\Queue\SerializesModels;

// Implementing ShouldQueue is good practice for responsiveness
class UserComposedEmail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    // --- DELETED old properties ---
    // The EmailLog model now holds all the data we need.

    /**
     * Create a new message instance.
     *
     * @param \App\Models\EmailLog $emailLog The pre-created email log record.
     */
    public function __construct(
        public EmailLog $emailLog // <-- CHANGE: We now accept the entire EmailLog model.
    ) {
        // The body of the constructor is now empty thanks to PHP 8's constructor property promotion.
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        // CHANGE: All data is now pulled from the $emailLog object.
        return new Envelope(
            from: new Address($this->emailLog->from_address, $this->emailLog->from_name),
            subject: $this->emailLog->subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // CHANGE: The body HTML is now pulled from the $emailLog object.
        return new Content(
            view: 'emails.user_composed', // Your Blade view remains the same
            with: [
                'htmlContent' => $this->emailLog->body_html,
            ],
        );
    }

    /**
     * Get the message headers.
     *
     * THIS IS THE MOST IMPORTANT ADDITION.
     * It attaches your custom ID to the email, which Brevo will include in webhooks.
     */
    public function headers(): Headers
    {
        return new Headers(
            messageId: $this->emailLog->esp_message_id,
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}