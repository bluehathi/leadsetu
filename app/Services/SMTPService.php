<?php

namespace App\Services;

use App\Models\MailConfiguration;

class SMTPService
{
    public function createSMTP(array $data): MailConfiguration
    {
        return MailConfiguration::create($data);
    }

    public function updateSMTP(MailConfiguration $smtp, array $data): MailConfiguration
    {
        $smtp->update($data);
        return $smtp;
    }

    public function deleteSMTP(MailConfiguration $smtp): void
    {
        $smtp->delete();
    }
}
