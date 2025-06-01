<?php

namespace App\Services;

// --- Add the Str import ---
use Illuminate\Support\Str;

use App\Models\Contact;
use App\Models\User;
use App\Models\MailConfiguration;
use App\Models\EmailLog;
use App\Models\ActivityLog;
use App\Mail\UserComposedEmail; // Your updated Mailable
use Illuminate\Support\Facades\Log;
use App\Helpers\SmtpConfigHelper;
use Throwable;
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
        MailConfiguration $workspaceConfig // You can remove this argument if you fetch it inside anyway
    ): EmailLog {
        $workspaceId =  $initiatingUser->workspace_id;

        // Fetch Workspace MailConfiguration if not passed or to ensure it's fresh
        $workspaceConfig = MailConfiguration::where('workspace_id', $workspaceId)->first();

        if (!$workspaceConfig || !$workspaceConfig->host) {
            Log::error("EmailDispatchService: SMTP settings missing or incomplete for workspace {$workspaceId}.");
            return $this->createFailedEmailLog(
                $initiatingUser,
                $recipientContact,
                $emailData,
                null, // Config is null or invalid
                'SMTP settings missing or incomplete.'
            );
        }

        // --- REFACTORED LOGIC STARTS HERE ---

        // Step 1: Generate our OWN unique ID for this transaction.
        $ourMessageId = (string) Str::uuid();

        // Step 2: Create the EmailLog entry BEFORE sending the email.
        // We save our generated ID into the 'esp_message_id' column immediately.
        $emailLog = EmailLog::create([
            'workspace_id' => $workspaceId,
            'user_id' => $initiatingUser->id,
            'contact_id' => $recipientContact->id,
            'mail_configuration_id' => $workspaceConfig->id,
            'esp_message_id' => $ourMessageId, // <-- Save our generated ID right away
            'recipient_email' => $recipientContact->email,
            'recipient_name' => $recipientContact->name,
            'from_address' => $workspaceConfig->from_address,
            'from_name' => $workspaceConfig->from_name,
            'subject' => $emailData['subject'],
            'body_html' => $emailData['body'],
            'status' => 'processing', // Initial status
            'properties' => ['source' => 'one_to_one_contact_email'],
        ]);

        try {
            // Apply the dynamic SMTP configuration for this sending operation
            SmtpConfigHelper::applyMailConfig($workspaceConfig);

            // Step 3: Instantiate our updated Mailable, passing the entire log object to it.
            $mailable = new UserComposedEmail($emailLog);

            // Step 4: Send the email. We no longer need to capture the return value.
            Mail::to($recipientContact->email)->send($mailable);

            // Step 5: If sending was successful, update the log's status.
            $emailLog->update([
                'status' => 'sent', // Or 'queued' if you use a queue
                'sent_at' => now(),
            ]);

            // Create the general success activity log
            if (class_exists(ActivityLog::class)) {
                 ActivityLog::create([
                    'user_id' => $initiatingUser->id,
                    'workspace_id' => $workspaceId,
                    'action' => 'email_sent',
                    'subject_type' => Contact::class,
                    'subject_id' => $recipientContact->id,
                    'description' => "Email titled '{$emailData['subject']}' sent to contact {$recipientContact->name}.",
                    'properties' => ['email_log_id' => $emailLog->id],
                ]);
            }

        } catch (Throwable $e) {
            // Step 6: If sending fails, update the existing log entry with the error.
            $emailLog->update([
                'status' => 'failed',
                'failed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            Log::error(
                "EmailDispatchService: Error sending email for EmailLog ID {$emailLog->id}: " . $e->getMessage(),
                ['trace' => substr($e->getTraceAsString(), 0, 2000)]
            );
            
            // Create the failure activity log
            if (class_exists(ActivityLog::class)) {
                ActivityLog::create([
                    'user_id' => $initiatingUser->id,
                    'workspace_id' => $workspaceId,
                    'action' => 'email_failed',
                    'subject_type' => Contact::class,
                    'subject_id' => $recipientContact->id,
                    'description' => "Failed to send email to contact {$recipientContact->name}.",
                    'properties' => ['email_log_id' => $emailLog->id, 'error' => $e->getMessage()],
                ]);
            }
            
            // Re-throw the exception so the calling controller knows about the failure.
            throw $e;
        }

        return $emailLog;
    }

    /**
     * Helper method to create EmailLog for pre-flight failures (e.g., bad config).
     * This method is now only used for failures that happen before we even attempt to send.
     */
    protected function createFailedEmailLog(
        User $initiatingUser,
        Contact $recipientContact,
        array $emailData,
        ?MailConfiguration $workspaceConfig,
        string $errorMessage
    ): EmailLog {
        // This helper's implementation is fine as is, but it's now only for edge cases.
        $workspaceId = $initiatingUser->workspace_id;

        return EmailLog::create([
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
            'properties' => ['source' => 'pre_flight_failure'],
        ]);
    }
}