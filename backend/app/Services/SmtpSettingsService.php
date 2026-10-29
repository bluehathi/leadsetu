<?php

namespace App\Services;

use App\Helpers\SmtpConfigHelper;
use App\Models\MailConfiguration;
use App\Models\User;
use Throwable;

class SmtpSettingsService
{
    /** The (single) SMTP configuration of the current workspace, if any. */
    public function current(): ?MailConfiguration
    {
        return MailConfiguration::query()->where('driver', 'smtp')->first();
    }

    /** workspace_id comes from the authenticated user (BelongsToWorkspace), never from input. */
    public function save(array $data): MailConfiguration
    {
        $config = $this->current() ?? new MailConfiguration(['driver' => 'smtp']);

        if (blank($data['password'] ?? null)) {
            unset($data['password']);
        }

        $config->fill($data)->save();
        $config->ensureWebhookToken();

        return $config;
    }

    /**
     * Sends a test message to the caller's own address only, so the endpoint cannot be
     * used to mail arbitrary recipients. Returns null on success or the error text.
     */
    public function sendTest(MailConfiguration $config, User $to): ?string
    {
        try {
            SmtpConfigHelper::mailer($config)->raw(
                'This is a test email from your LeadSetu SMTP settings.',
                fn ($m) => $m->to($to->email)->subject('SMTP test email'),
            );

            return null;
        } catch (Throwable $e) {
            return mb_substr($e->getMessage(), 0, 300);
        }
    }
}
