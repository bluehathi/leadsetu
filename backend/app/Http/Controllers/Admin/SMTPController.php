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
use App\Http\Requests\SMTP\StoreSMTPRequest;
use App\Http\Requests\SMTP\UpdateSMTPRequest;

class SMTPController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        $user = Auth::user();
        
        $this->authorize('view', $user, MailConfiguration::class);

        $user = Auth::user();
        $workspaceId = $user->workspace_id;
        $smtpConfig = \App\Models\MailConfiguration::where('workspace_id', $workspaceId)->first();
        return Inertia::render('Settings/SmtpSettings', [
            'smtpConfig' => $smtpConfig,
            'auth' => ['user' => $user],
            'webhookUrl' => url('/api/webhooks/brevo?token='.config('services.brevo.webhook_secret'))
        ]);
    }

    public function store(StoreSMTPRequest $request)
    {
        $this->authorize('create', MailConfiguration::class);
        $data = $request->validated();
        $smtp = MailConfiguration::create($data);

        return redirect()->back()->with('success', 'SMTP settings saved successfully.');
    }

    public function update(UpdateSMTPRequest $request, MailConfiguration $smtp)
    {
        $this->authorize('update', $smtp);
        $data = $request->validated();
        $smtp->update($data);

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
