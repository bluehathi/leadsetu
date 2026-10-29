<?php

namespace App\Http\Requests\EmailCampaign;

use App\Models\EmailCampaign;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEmailCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', EmailCampaign::class);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:200000',
            'prospect_list_ids' => 'required|array|min:1|max:50',
            // Only the caller's own lists can be targeted.
            'prospect_list_ids.*' => ['integer', Rule::exists('prospect_lists', 'id')->where('workspace_id', $this->user()->workspace_id)],
        ];
    }
}
