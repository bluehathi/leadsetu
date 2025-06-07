<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoleRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|unique:roles,name,' . $this->route('role'),
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id',
        ];
    }
}
