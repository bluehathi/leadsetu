<?php

namespace App\Http\Requests\Role;

use App\Rules\GrantablePermissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('role'));
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes', 'required', 'string', 'max:125',
                Rule::unique('roles', 'name')->ignore($this->route('role'))->where(fn ($q) => $q->where('guard_name', 'web')
                    ->where(fn ($q) => $q->whereNull('workspace_id')->orWhere('workspace_id', $this->user()->workspace_id))),
            ],
            'permissions' => 'sometimes|array',
            'permissions.*' => ['integer', new GrantablePermissions()],
        ];
    }
}
