<?php

namespace App\Http\Requests\User;

use App\Models\User;
use App\Rules\AssignableRoles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => ['required', 'string', Password::min(8)],
            'roles' => 'array',
            'roles.*' => ['integer', new AssignableRoles()],
        ];
    }
}
