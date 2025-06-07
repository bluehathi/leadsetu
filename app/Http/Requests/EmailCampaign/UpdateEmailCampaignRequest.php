<?php

namespace App\Http\Requests\EmailCampaign;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmailCampaignRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'prospect_list_ids' => 'required|array|min:1',
            'prospect_list_ids.*' => [
                'required',
                'integer',
            ],
            'scheduled_at' => 'nullable|date|after_or_equal:now',
        ];
    }
}
