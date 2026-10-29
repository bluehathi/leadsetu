<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * The server connects to whatever host a tenant enters, so reject anything that
 * resolves to a private, loopback or link-local address (internal services,
 * cloud metadata endpoints).
 */
class PublicSmtpHost implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $host = trim((string) $value);
        $addresses = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);

        if ($addresses === []) {
            $fail('The SMTP host could not be resolved.');
            return;
        }

        foreach ($addresses as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                $fail('The SMTP host must be a public server.');
                return;
            }
        }
    }
}
