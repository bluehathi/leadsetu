<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue; // For background sending
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Address; // For the 'From' address object
use Illuminate\Queue\SerializesModels;

class UserComposedEmail extends Mailable  // Implementing ShouldQueue is good practice
{
    use Queueable, SerializesModels;

    public string $emailSubject;
    public string $htmlBodyContent; // The HTML content from the rich text editor or textarea
    public string $fromAddress;
    public string $fromName;

    /**
     * Create a new message instance.
     *
     * @param string $emailSubject The subject of the email.
     * @param string $htmlBodyContent The HTML body content of the email.
     * @param string $fromAddress The 'From' email address for this email.
     * @param string $fromName The 'From' name for this email.
     */
    public function __construct(
        string $emailSubject,
        string $htmlBodyContent,
        string $fromAddress,
        string $fromName
    ) {
        $this->emailSubject = $emailSubject;
        $this->htmlBodyContent = $htmlBodyContent;
        $this->fromAddress = $fromAddress;
        $this->fromName = $fromName;
    }

    /**
     * Get the message envelope.
     *
     * @return \Illuminate\Mail\Mailables\Envelope
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName),
            subject: $this->emailSubject,
            // You can also add replyTo, cc, bcc here if needed
            // replyTo: [new Address('reply@example.com', 'Reply Name')],
        );
    }

    /**
     * Get the message content definition.
     *
     * @return \Illuminate\Mail\Mailables\Content
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.user_composed', // The Blade view for the email
            with: [
                'htmlContent' => $this->htmlBodyContent, // Pass the HTML content to the view
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return []; // Add logic here if you need to support attachments later
    }
}