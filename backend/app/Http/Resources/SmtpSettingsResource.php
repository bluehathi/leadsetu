<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\MailConfiguration */
class SmtpSettingsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'host' => $this->host,
            'port' => (int) $this->port,
            'username' => $this->username,
            'has_password' => filled($this->getRawOriginal('password')),
            'encryption' => $this->encryption,
            'from_address' => $this->from_address,
            'from_name' => $this->from_name,
            // Per-workspace URL to paste into Brevo; contains this workspace's secret only.
            'webhook_url' => url('/api/webhooks/brevo?token=' . $this->ensureWebhookToken()),
        ];
    }
}
