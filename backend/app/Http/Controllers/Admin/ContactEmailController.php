<?php

namespace App\Http\Controllers\Admin; // Assuming Admin namespace from previous context

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\MailConfiguration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use App\Services\EmailDispatchService;

class ContactEmailController extends Controller
{
    protected EmailDispatchService $emailDispatchService;

    public function __construct(EmailDispatchService $emailDispatchService)
    {
        $this->emailDispatchService = $emailDispatchService;
    }
    public function sendComposedEmail(Request $request, Contact $contact)
    {
        $user = Auth::user();

        $workspaceId = $user->workspace_id;
        if (!$workspaceId) {
            return Redirect::back()->with('error', 'Workspace context is missing.');
        }

        if ($contact->workspace_id !== $workspaceId) {
            return Redirect::back()->with('error', 'Unauthorized action. Contact does not belong to your workspace.');
        }

        // Validation
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
        ]);

        // Fetch Workspace MailConfiguration
        $workspaceConfig = MailConfiguration::where('workspace_id', $workspaceId)->first();

        if (!$workspaceConfig || !$workspaceConfig->host) {

            return Redirect::back()->with('error', 'SMTP settings are not configured for this workspace. Please configure them to send emails.');
        }

        try {



            $this->emailDispatchService->sendAndLog(
                $user,
                $contact,
                $validated, // Contains 'subject' and 'body'
                $workspaceConfig
            );


            return Redirect::back()->with('success', 'Email sent successfully to ' . $contact->name . '!');
        } catch (\Exception $e) {
            Log::error("Error sending one-to-one email for workspace {$workspaceId} to contact {$contact->id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);


            return Redirect::back()->with('error', 'Failed to send email. Please check server logs or SMTP settings. Error: ' . $e->getMessage());
        }
    }
}
