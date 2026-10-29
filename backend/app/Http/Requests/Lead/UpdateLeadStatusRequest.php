<?php

namespace App\Http\Requests\Lead;

use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('lead'));
    }

    public function rules(): array
    {
        return ['status' => ['required', Rule::in(Lead::STATUSES)]];
    }
}
