<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

use Illuminate\Http\Request;
use App\Models\MailConfiguration;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Helpers\SmtpConfigHelper;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class SMTPController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $this->authorize('view', MailConfiguration::class);

        $user = Auth::user();
        $workspaceId = $user->workspace_id;
        $smtpConfig = \App\Models\MailConfiguration::where('workspace_id', $workspaceId)->first();
        return Inertia::render('Settings/SmtpSettings', [
            'smtpConfig' => $smtpConfig,
            'auth' => ['user' => $user],
            'webhookUrl' => url('/api/webhooks/brevo?token='.config('services.brevo.webhook_secret'))
        ]);
    }

    public function save(Request $request)
    {
        $this->authorize('update', MailConfiguration::class);

        $user = Auth::user();
        $workspaceId = $user->workspace_id;
        $validated = $request->validate([
            'driver' => 'required|string',
            'host' => 'required|string',
            'port' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
            'encryption' => 'nullable|string',
            'from_address' => 'required|email',
            'from_name' => 'required|string',
        ]);

        $config = MailConfiguration::where('workspace_id', $workspaceId)->first();
        if (!$config) {
            $config = new MailConfiguration();
            $config->workspace_id = $workspaceId;
        }
        $config->driver = $validated['driver'];
        $config->host = $validated['host'];
        $config->port = $validated['port'];
        $config->username = $validated['username'];
        if (!empty($validated['password'])) {
            $config->password = $validated['password'];
        }
        $config->encryption = $validated['encryption'] ?? null;
        $config->from_address = $validated['from_address'];
        $config->from_name = $validated['from_name'];
        $config->save();

        return redirect()->back()->with('success', 'SMTP settings updated successfully.');
    }

    public function test(Request $request)
    {
        $user = Auth::user();
        $workspaceId = $user->workspace_id;
        $validated = $request->validate([
            'to' => 'required|email',
        ]);

        // Mail::to($validated['to'])
        // ->send(new TestMail());

        // return response()->json(['success' => 'Test email sent (if SMTP config is valid). If you do not receive it, check your SMTP credentials and logs.']);

        $config = SmtpConfigHelper::getCurrentWorkspaceConfig();
        if (!$config) {
            return response()->json(['error' => 'No SMTP configuration found.'], 422);
        }
        SmtpConfigHelper::applyMailConfig($config);

     try {

        Mail::raw('This is a test email from LeadSetu SMTP settings.', function ($message) use ($validated, $config) {
            $message->to($validated['to']);
            $message->subject('SMTP Test Email');
            $message->from($config->from_address, $config->from_name);
        });


        return response()->json(['success' => 'Test email sent (if SMTP config is valid). If you do not receive it, check your SMTP credentials and logs.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to send test email: ' . $e->getMessage()], 422);
        }
    }
}
