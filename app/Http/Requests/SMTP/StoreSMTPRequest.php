<?php

namespace App\Http\Requests\SMTP;

use Illuminate\Foundation\Http\FormRequest;

class StoreSMTPRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'driver' => 'required|string',
            'host' => 'required|string',
            'port' => 'required|string',
            'username' => 'required|string',
            'password' => 'nullable|string',
            'encryption' => 'nullable|string',
            'from_address' => 'required|email',
            'from_name' => 'required|string',
        ];
    }
}
