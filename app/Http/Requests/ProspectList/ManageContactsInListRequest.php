<?php

namespace App\Http\Requests\ProspectList;

use Illuminate\Foundation\Http\FormRequest;

class ManageContactsInListRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'contact_ids' => 'required|array|min:1',
            'contact_ids.*' => 'integer|exists:contacts,id',
        ];
    }
}
