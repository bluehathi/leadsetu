<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Lead; // Assuming you have a Lead model
use App\Models\EmailActivity; // Assuming you have a model to log activities

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
        // --- SECURITY FIRST: Verify the webhook is from Brevo ---
        // Brevo does not use a simple signature header.
        // It's recommended to use an unguessable URL or check the origin IP.
        // For enhanced security, you could append a secret token to your URL
        // e.g., /api/webhooks/brevo?token=YOUR_SECRET_TOKEN
        // and check for it here.

        // Let's get the payload
        $payload = $request->all();

        // It's a good practice to log every incoming payload for debugging
        Log::info('Brevo Webhook Received:', $payload);

        // Check if the event type exists
        if (!isset($payload['event'])) {
            // Not a valid Brevo event, or a simple test payload.
            return response()->json(['message' => 'Event type not found.'], 400);
        }

        // --- Process the Event ---
        $this->processEvent($payload);

        // Return a 200 OK response to Brevo to acknowledge receipt.
        // If you don't, Brevo will retry sending the webhook.
        return response()->json(['message' => 'Webhook processed successfully.']);
    }

    /**
     * Process a single event from the webhook payload.
     *
     * @param array $event
     */
    protected function processEvent(array $event)
    {
        // Find the lead associated with this email
        // Make sure your Lead model can be found by email.
        $lead = Lead::where('email', $event['email'])->first();

        if (!$lead) {
            Log::warning('Brevo Webhook: Lead not found for email: ' . $event['email']);
            return; // Exit if no corresponding lead is found
        }

        // Use a switch statement to handle different events
        switch ($event['event']) {
            case 'opened':
                // Update your database to reflect the email was opened
                EmailActivity::create([
                    'lead_id' => $lead->id,
                    'type' => 'opened',
                    'message_id' => $event['message-id'],
                    'occurred_at' => now(), // Or use $event['date']
                ]);
                Log::info("Email opened by lead: {$lead->email}");
                break;

            case 'click':
                // Update your database for a clicked link
                 EmailActivity::create([
                    'lead_id' => $lead->id,
                    'type' => 'clicked',
                    'url_clicked' => $event['link'],
                    'message_id' => $event['message-id'],
                    'occurred_at' => now(),
                ]);
                Log::info("Link {$event['link']} clicked by lead: {$lead->email}");
                break;

            case 'hard_bounce':
            case 'soft_bounce':
                 // Mark the lead's email as invalid or problematic
                $lead->email_status = 'bounced';
                $lead->save();
                Log::info("Email to lead {$lead->email} bounced.");
                break;

            case 'spam':
                // It's crucial to handle spam complaints.
                // You should stop sending emails to this lead immediately.
                $lead->email_status = 'spam_report';
                $lead->unsubscribed_at = now();
                $lead->save();
                Log::info("Lead {$lead->email} marked this email as spam.");
                break;

            case 'unsubscribed':
                 $lead->unsubscribed_at = now();
                 $lead->save();
                 Log::info("Lead {$lead->email} unsubscribed.");
                 break;

            // Add other cases as needed: 'delivered', 'blocked', etc.
        }
    }
}