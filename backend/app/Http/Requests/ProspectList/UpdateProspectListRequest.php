<?php

namespace App\Http\Requests\ProspectList;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProspectListRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ];
    }
}
