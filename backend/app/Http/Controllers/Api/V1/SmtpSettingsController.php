<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SMTP\SaveSmtpSettingsRequest;
use App\Http\Resources\SmtpSettingsResource;
use App\Models\MailConfiguration;
use App\Services\ActivityLogService;
use App\Services\SmtpSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmtpSettingsController extends Controller
{
    public function __construct(protected SmtpSettingsService $smtp, protected ActivityLogService $audit)
    {
    }

    public function show(Request $request): JsonResponse
    {
        $this->authorize('manage', MailConfiguration::class);
        $config = $this->smtp->current();

        return response()->json(['data' => $config ? (new SmtpSettingsResource($config))->resolve() : null]);
    }

    public function update(SaveSmtpSettingsRequest $request): JsonResponse
    {
        $config = $this->smtp->save($request->validated());
        // Never log credentials.
        $this->audit->log('smtp_settings_updated', $config, 'SMTP settings updated', ['host' => $config->host]);

        // Always 200: this is an upsert of a singleton, not the creation of a new resource.
        return (new SmtpSettingsResource($config))->response()->setStatusCode(200);
    }

    public function test(Request $request): JsonResponse
    {
        $this->authorize('manage', MailConfiguration::class);

        $config = $this->smtp->current();
        if (! $config) {
            return response()->json(['message' => 'Save your SMTP settings first.'], 422);
        }

        $error = $this->smtp->sendTest($config, $request->user());

        return $error
            ? response()->json(['message' => "Could not send the test email: $error"], 422)
            : response()->json(['message' => "Test email sent to {$request->user()->email}."]);
    }
}
