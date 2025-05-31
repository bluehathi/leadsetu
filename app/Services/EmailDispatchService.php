<?php

namespace App\Services;

use App\Models\Contact; // Assuming you're emailing Contacts
use App\Models\Lead; // If you also email Leads
use App\Models\User;
use App\Models\MailConfiguration;
use App\Models\EmailLog;
use App\Models\ActivityLog; // Your custom ActivityLog model
use App\Mail\UserComposedEmail; // Your Mailable
use Illuminate\Support\Facades\Log;
use App\Helpers\SmtpConfigHelper;
use Throwable; // For catching all types of exceptions/errors
use Illuminate\Support\Facades\Mail;

class EmailDispatchService
{
    /**
     * Sends an email using workspace-specific SMTP settings and logs the action.
     *
     * @param User $initiatingUser The user performing the action.
     * @param Contact $recipientContact The contact to whom the email is being sent.
     * @param array $emailData Must contain 'subject' and 'body'.
     * @param MailConfiguration $workspaceConfig The mail configuration for the workspace.
     * @return EmailLog The created EmailLog record.
     * @throws \Exception If email sending fails fundamentally.
     */
    public function sendAndLog(
        User $initiatingUser,
        Contact $recipientContact,
        array $emailData,
        MailConfiguration $workspaceConfig
    ): EmailLog {
        $workspaceId =  $initiatingUser->workspace_id;


         // Fetch Workspace MailConfiguration
        $workspaceConfig = MailConfiguration::where('workspace_id', $workspaceId)->first();

      

      

        if (!$workspaceConfig || !$workspaceConfig->host) {
            // Log this critical failure
            Log::error("EmailDispatchService: SMTP settings missing or incomplete for workspace {$workspaceId}.");
            // Create a failed EmailLog entry
            return $this->createFailedEmailLog(
                $initiatingUser,
                $recipientContact,
                $emailData,
                $workspaceConfig, // Pass even if incomplete for context
                'SMTP settings missing or incomplete.'
            );
            // Optionally, re-throw a more specific exception if the controller shouldn't proceed
            // throw new \RuntimeException('SMTP settings are not configured for this workspace.');
        }

        $mailable = new UserComposedEmail(
            $emailData['subject'],
            $emailData['body'],
            $workspaceConfig->from_address,
            $workspaceConfig->from_name
        );


          SmtpConfigHelper::applyMailConfig($workspaceConfig);

        $espMessageId = null; // Placeholder for ESP message ID

        try {
         
            // Send the email
            $sentMessage = Mail::to($recipientContact->email)->send($mailable);
            
          
            if ($sentMessage && method_exists($sentMessage, 'getMessageId')) {
                $espMessageId = $sentMessage->getMessageId();
            }


            // 1. Create Detailed EmailLog for success
            $emailLog = EmailLog::create([
                'workspace_id' => $workspaceId,
                'user_id' => $initiatingUser->id,
                'contact_id' => $recipientContact->id,
                'mail_configuration_id' => $workspaceConfig->id,
                'recipient_email' => $recipientContact->email,
                'recipient_name' => $recipientContact->name,
                'from_address' => $workspaceConfig->from_address,
                'from_name' => $workspaceConfig->from_name,
                'subject' => $emailData['subject'],
                'body_html' => $emailData['body'], // Assuming 'body' is the HTML content
                'status' => 'sent', // Or 'queued' if your mailable uses ShouldQueue and queues are active
                'esp_message_id' => $espMessageId,
                'sent_at' => now(),
                'properties' => json_encode(['source' => 'one_to_one_contact_email']),
            ]);

            // 2. Create General ActivityLog for success
            if (class_exists(ActivityLog::class)) {
                ActivityLog::create([
                    'user_id' => $initiatingUser->id,
                    'workspace_id' => $workspaceId,
                    'action' => 'email_sent',
                    'subject_type' => Contact::class,
                    'subject_id' => $recipientContact->id,
                    'description' => "Email titled '{$emailData['subject']}' sent to contact {$recipientContact->name} ({$recipientContact->email}).",
                    'properties' => json_encode([
                        'email_log_id' => $emailLog->id,
                        'email_subject' => $emailData['subject'],
                    ]),
                ]);
            }

            return $emailLog;

        } catch (Throwable $e) { // Catching Throwable to be more comprehensive
            Log::error(
                "EmailDispatchService: Error sending email for workspace {$workspaceId} to contact {$recipientContact->id}: " . $e->getMessage(),
                ['trace' => $e->getTraceAsString()]
            );

            // Create a failed EmailLog entry
            $emailLog = $this->createFailedEmailLog(
                $initiatingUser,
                $recipientContact,
                $emailData,
                $workspaceConfig,
                $e->getMessage()
            );
            
            // Re-throw the exception so the controller can handle the HTTP response
            throw $e;
        }
    }

    /**
     * Helper method to create EmailLog and ActivityLog for failed email attempts.
     */
    protected function createFailedEmailLog(
        User $initiatingUser,
        Contact $recipientContact,
        array $emailData,
        ?MailConfiguration $workspaceConfig, // Can be null if config itself was the issue
        string $errorMessage
    ): EmailLog {
        $workspaceId = $initiatingUser->current_workspace_id ?? $initiatingUser->workspace_id;

        $emailLog = EmailLog::create([
            'workspace_id' => $workspaceId,
            'user_id' => $initiatingUser->id,
            'contact_id' => $recipientContact->id,
            'mail_configuration_id' => $workspaceConfig?->id,
            'recipient_email' => $recipientContact->email,
            'recipient_name' => $recipientContact->name,
            'from_address' => $workspaceConfig?->from_address ?? 'N/A',
            'from_name' => $workspaceConfig?->from_name ?? 'N/A',
            'subject' => $emailData['subject'] ?? 'N/A',
            'body_html' => $emailData['body'] ?? null,
            'status' => 'failed',
            'failed_at' => now(),
            'error_message' => $errorMessage,
            'properties' => json_encode(['source' => 'one_to_one_contact_email_failure']),
        ]);

        if (class_exists(ActivityLog::class)) {
            ActivityLog::create([
                'user_id' => $initiatingUser->id,
                'workspace_id' => $workspaceId,
                'action' => 'email_failed',
                'subject_type' => Contact::class,
                'subject_id' => $recipientContact->id,
                'description' => "Failed to send email titled '{$emailData['subject']}' to contact {$recipientContact->name} ({$recipientContact->email}). Error: " . substr($errorMessage, 0, 150) . "...",
                'properties' => json_encode([
                    'email_log_id' => $emailLog->id,
                    'email_subject' => $emailData['subject'],
                    'error' => $errorMessage,
                ]),
            ]);
        }
        return $emailLog;
    }
}
