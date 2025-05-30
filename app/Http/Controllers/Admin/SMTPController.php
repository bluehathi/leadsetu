<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

use Illuminate\Http\Request;
use App\Models\MailConfiguration;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class SMTPController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $workspaceId = $user->workspace_id;
        $smtpConfig = \App\Models\MailConfiguration::where('workspace_id', $workspaceId)->first();
        return Inertia::render('Settings/SmtpSettings', [
            'smtpConfig' => $smtpConfig,
            'auth' => [ 'user' => $user ]
        ]);
    }

    public function save(Request $request)
    {
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
        $config = \App\Models\MailConfiguration::where('workspace_id', $workspaceId)->first();
        if (!$config) {
            return response()->json(['error' => 'No SMTP configuration found.'], 422);
        }

        // Dynamically override mail config for this request
        $mailConfig = [
            'transport' => 'smtp',
            'host' => $config->host,
            'port' => $config->port,
            'encryption' => $config->encryption === 'none' ? null : $config->encryption,
            'username' => $config->username,
            'password' => $config->password,
            'timeout' => null,
            'auth_mode' => null,
        ];

        // config(['mail.mailers.smtp' => $mailConfig]);
        // config(['mail.from.address' => $config->from_address]);
        // config(['mail.from.name' => $config->from_name]);

        
            Mail::raw('This is a test email from LeadSetu SMTP settings.', function ($message) use ($validated, $config) {
                $message->to($validated['to']);
                $message->subject('SMTP Test Email');
                $message->from($config->from_address, $config->from_name);
            });
            return response()->json(['success' => 'Test email sent (if SMTP config is valid). If you do not receive it, check your SMTP credentials and logs.']);
        // } catch (\Exception $e) {
        //     return response()->json(['error' => 'Failed to send test email: ' . $e->getMessage()], 422);
        // }
    }
}
