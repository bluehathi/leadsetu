<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'email_logs'; // Explicitly defining table name is good practice

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'workspace_id',
        'user_id', // The user who initiated the email send
        'contact_id', // The contact this email was sent to
        // 'lead_id', // Uncomment if you also associate emails with Leads
        'mail_configuration_id', // The SMTP/mail configuration used
        'recipient_email',
        'recipient_name',
        'from_address',
        'from_name',
        'subject',
        'body_html', // The actual HTML content of the email (can be large)
        'status', // e.g., 'queued', 'sent', 'failed', 'delivered', 'opened', 'clicked', 'bounced', 'spam'
        'esp_message_id', // Unique message ID from the Email Service Provider (e.g., Brevo)
        'sent_at',
        'delivered_at',
        'opened_at', // Timestamp of the first open
        'clicked_at', // Timestamp of the first click
        'failed_at',
        'error_message', // If sending failed
        'opens_count',
        'clicks_count',
        'properties', // For any extra metadata (e.g., campaign_id, source)
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'sent_at' => 'datetime',
        'delivered_at' => 'datetime',
        'opened_at' => 'datetime',
        'clicked_at' => 'datetime',
        'failed_at' => 'datetime',
        'properties' => 'array', // Automatically encodes/decodes JSON to/from array
    ];

    /**
     * Get the workspace that the email log belongs to.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class); // Assuming you have a Workspace model
    }

    /**
     * Get the user who initiated the email send (if applicable).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class); // Assuming you have a User model
    }

    /**
     * Get the contact to whom the email was sent (if applicable).
     */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class); // Assuming you have a Contact model
    }

    /**
     * Get the lead to whom the email was sent (if applicable).
     * Uncomment if you have a Lead model and link emails to leads.
     */
    // public function lead(): BelongsTo
    // {
    //     return $this->belongsTo(Lead::class);
    // }

    /**
     * Get the mail configuration used for sending this email.
     */
    public function mailConfiguration(): BelongsTo
    {
        return $this->belongsTo(MailConfiguration::class);
    }

    // You can add scopes here if needed, for example:
    // public function scopeSent($query)
    // {
    //     return $query->where('status', 'sent');
    // }
    // public function scopeFailed($query)
    // {
    //     return $query->where('status', 'failed');
    // }
}
