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
use App\Models\EmailCampaign;
use App\Models\ProspectList;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Queue;
use Carbon\Carbon;

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
        MailConfiguration $workspaceConfig = null // Now optional
    ): EmailLog {
        $workspaceId =  $initiatingUser->workspace_id;

        // Fetch Workspace MailConfiguration if not passed or to ensure it's fresh
        if (!$workspaceConfig) {
            $workspaceConfig = MailConfiguration::where('workspace_id', $workspaceId)->first();
        }

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
        $recipientDomain = substr($recipientContact->email, strpos($recipientContact->email, '@') + 1);
        $uniqueHash = md5(time() . $recipientContact->email);
        $ourMessageId = $uniqueHash . '@' . $recipientDomain;


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
            $mail = Mail::to($recipientContact->email)->send($mailable);

            $retrievedMessageId = $mail->getMessageId();



            // Step 5: If sending was successful, update the log's status.
            $emailLog->update([
                'status' => 'sent', // Or 'queued' if you use a queue
                'sent_at' => now(),
                'esp_message_id' => $retrievedMessageId
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

    /**
     * Dispatch all emails for a campaign immediately.
     */
    public static function dispatchCampaign(EmailCampaign $campaign)
    {
        $prospectList = $campaign->prospectList;
        if (!$prospectList) return false;
        $contacts = $prospectList->contacts()->get(); // Ensure this is a collection of Contact models
        $user = \App\Models\User::find($campaign->user_id); // Ensure this is a single User
        foreach ($contacts as $contact) {
            try {
                app(EmailDispatchService::class)->sendAndLog(
                    $user,
                    $contact,
                    [
                        'subject' => $campaign->subject,
                        'body' => $campaign->body,
                    ]
                );
            } catch (\Throwable $e) {
                Log::error('Failed to send campaign email to contact ' . $contact->id . ': ' . $e->getMessage());
            }
        }
        return true;
    }

    /**
     * Schedule campaign for future sending.
     */
    public static function scheduleCampaign(EmailCampaign $campaign)
    {
        $delay = Carbon::parse($campaign->scheduled_at)->diffInSeconds(now(), false);
        if ($delay > 0) $delay = 0;
        Queue::later(
            now()->addSeconds($delay),
            function () use ($campaign) {
                self::dispatchCampaign($campaign->fresh());
            }
        );
        return true;
    }
}
