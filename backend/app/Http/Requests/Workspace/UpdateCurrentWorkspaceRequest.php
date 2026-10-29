<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCurrentWorkspaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->workspace && $this->user()->can('update', $this->user()->workspace);
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:180',
            'description' => 'nullable|string|max:2000',
        ];
    }
}
