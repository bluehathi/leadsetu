<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailLog; // <-- Using your EmailLog model
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BrevoWebhookController extends Controller
{
    /**
     * Handle incoming webhooks from Brevo.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\Response
     */
    public function handle(Request $request)
    {
        // Modern Security for Laravel 12: Verify the webhook is from Brevo
        // This checks for a secret token in the webhook URL.
        $secretToken = $request->get('token');
        if ($secretToken !== config('services.brevo.webhook_secret')) {
            Log::warning('Unauthorized webhook attempt to Brevo endpoint.', [
                'ip' => $request->ip(),
                'path' => $request->path()
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payload = $request->all();

        // Brevo can send a single event or an array of events.
        // We'll normalize it to always handle an array.
        $events = isset($payload['event']) ? [$payload] : $payload;

        foreach ($events as $event) {
            // Log every event for debugging purposes
            Log::info('Brevo Webhook Event Received:', $event);

            if (!isset($event['event']) || !isset($event['message-id'])) {
                Log::warning('Brevo Webhook: Skipping invalid event payload.', $event);
                continue; // Skip to the next event if key fields are missing
            }

            // Process each event
            $this->processEvent($event);
        }

        // Acknowledge receipt to Brevo
        return response()->json(['message' => 'Webhooks processed successfully.']);
    }

    /**
     * Find the corresponding EmailLog and update it based on the event.
     *
     * @param array $event
     */
    protected function processEvent(array $event)
    {
        // Find the original email record using the unique message ID from Brevo.
        $emailLog = EmailLog::where('esp_message_id', trim($event['message-id'], '<>'))->first();

        if (!$emailLog) {
            Log::warning('Brevo Webhook: EmailLog not found for message-id: ' . $event['message-id']);
            return; // Exit if no corresponding email log is found
        }

        // Use a switch statement to handle different events
        switch ($event['event']) {
            case 'delivered':
                $emailLog->status = 'delivered';
                $emailLog->delivered_at = $event['date']; // Use Brevo's timestamp
                break;

            case 'opened':
            case 'unique_opened':
                $emailLog->status = 'opened';
                // Only set the first opened_at timestamp
                if (is_null($emailLog->opened_at)) {
                    $emailLog->opened_at = $event['date'];
                }
                // Increment the opens_count atomically to prevent race conditions
                $emailLog->increment('opens_count');
                break;

            case 'click':
                $emailLog->status = 'clicked';
                // Only set the first clicked_at timestamp
                if (is_null($emailLog->clicked_at)) {
                    $emailLog->clicked_at = $event['date'];
                }
                // Increment the clicks_count atomically
                $emailLog->increment('clicks_count');
                break;

            case 'hard_bounce':
                $emailLog->status = 'bounced';
                $emailLog->failed_at = $event['date'];
                $emailLog->error_message = 'Hard Bounce: ' . ($event['reason'] ?? 'No reason provided');
                break;

    	    case 'soft_bounce':
                // You might handle soft bounces differently, but for now, we'll mark as failed.
                $emailLog->status = 'failed';
                $emailLog->failed_at = $event['date'];
                $emailLog->error_message = 'Soft Bounce: ' . ($event['reason'] ?? 'No reason provided');
                break;

            case 'blocked':
                $emailLog->status = 'failed';
                $emailLog->failed_at = $event['date'];
                $emailLog->error_message = 'Blocked by recipient server.';
                break;

            case 'spam':
                $emailLog->status = 'spam';
                $emailLog->failed_at = $event['date']; // The date of the spam complaint
                break;

            case 'unsubscribed':
                 // While this event fires on the email, you'll likely want to update
                 // the associated Contact model to mark them as unsubscribed globally.
                 $emailLog->status = 'unsubscribed'; // Mark it on the log as well
                 // Optional: Also update the contact
                 // if ($emailLog->contact) {
                 //     $emailLog->contact->update(['unsubscribed' => true]);
                 // }
                break;

            // default:
            //     Log::info('Unhandled Brevo event type: ' . $event['event']);
        }

        // Persist the changes to the database
        $emailLog->save();

        Log::info("EmailLog ID {$emailLog->id} updated with status '{$emailLog->status}'.");
    }
}