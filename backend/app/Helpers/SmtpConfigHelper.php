<?php
namespace App\Helpers;

use App\Models\MailConfiguration;
use Illuminate\Mail\Mailer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class SmtpConfigHelper
{
    public static function getCurrentWorkspaceConfig($workspaceId = null)
    {
        $workspaceId = $workspaceId ?? Auth::user()->workspace_id;
        return MailConfiguration::where('workspace_id', $workspaceId)->first();
    }

    /**
     * A mailer bound to this workspace's SMTP settings only. Unlike applyMailConfig() it does
     * not touch global config, so credentials cannot leak into the next send in a long-lived worker.
     */
    /** @var (\Closure(MailConfiguration): Mailer)|null Test seam so suites never open SMTP connections. */
    public static ?\Closure $mailerOverride = null;

    public static function mailer(MailConfiguration $config): Mailer
    {
        if (static::$mailerOverride) {
            return (static::$mailerOverride)($config);
        }

        return Mail::build([
            'transport' => 'smtp',
            'host' => $config->host,
            'port' => $config->port,
            'encryption' => $config->encryption === 'none' ? null : $config->encryption,
            'username' => $config->username,
            'password' => $config->password,
            'timeout' => 15,
            'from' => ['address' => $config->from_address, 'name' => $config->from_name],
        ]);
    }

    /** @deprecated Mutates global config; use mailer(). */
    public static function applyMailConfig($config)
    {
        config(['mail.mailers.smtp' => [
            'transport' => 'smtp',
            'host' => $config->host,
            'port' => $config->port,
            'encryption' => $config->encryption === 'none' ? null : $config->encryption,
            'username' => $config->username,
            'password' => $config->password,
            'timeout' => null,
            'auth_mode' => null,
        ]]);
        config(['mail.from.address' => $config->from_address]);
        config(['mail.from.name' => $config->from_name]);
        config(['mail.default' => $config->driver]);
    }
}
