<?php
namespace App\Helpers;

use App\Models\MailConfiguration;
use Illuminate\Support\Facades\Auth;

class SmtpConfigHelper
{
    public static function getCurrentWorkspaceConfig($workspaceId = null)
    {
        $workspaceId = $workspaceId ?? Auth::user()->workspace_id;
        return MailConfiguration::where('workspace_id', $workspaceId)->first();
    }

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