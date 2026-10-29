<?php

namespace App\Http\Requests\EmailCampaign;

class UpdateEmailCampaignRequest extends StoreEmailCampaignRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('email_campaign'));
    }

    public function rules(): array
    {
        $rules = parent::rules();
        foreach ($rules as $field => $rule) {
            if (is_string($rule) && str_starts_with($rule, 'required')) {
                $rules[$field] = 'sometimes|' . $rule;
            }
        }

        return $rules;
    }
}
