<?php

namespace App\Http\Requests\Role;

use App\Models\Role;
use App\Rules\GrantablePermissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Role::class);
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:125',
                Rule::unique('roles', 'name')->where(fn ($q) => $q->where('guard_name', 'web')
                    ->where(fn ($q) => $q->whereNull('workspace_id')->orWhere('workspace_id', $this->user()->workspace_id))),
            ],
            'permissions' => 'array',
            'permissions.*' => ['integer', new GrantablePermissions()],
        ];
    }
}
