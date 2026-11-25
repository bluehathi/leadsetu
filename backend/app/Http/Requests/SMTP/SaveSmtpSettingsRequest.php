<?php

namespace App\Http\Requests\SMTP;

use App\Models\MailConfiguration;
use App\Rules\PublicSmtpHost;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveSmtpSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('manage', MailConfiguration::class);
    }

    public function rules(): array
    {
        $exists = MailConfiguration::query()->where('driver', 'smtp')->exists();

        return [
            'host' => ['required', 'string', 'max:255', new PublicSmtpHost()],
            'port' => ['required', 'integer', Rule::in([25, 465, 587, 2525])],
            'username' => 'required|string|max:255',
            // Blank keeps the stored password; it is required the first time.
            'password' => [$exists ? 'nullable' : 'required', 'string', 'max:255'],
            'encryption' => ['required', Rule::in(['tls', 'ssl', 'none'])],
            'from_address' => 'required|email|max:255',
            'from_name' => 'required|string|max:255',
        ];
    }
}
