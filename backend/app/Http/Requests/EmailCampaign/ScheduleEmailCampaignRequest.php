<?php

namespace App\Http\Requests\EmailCampaign;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleEmailCampaignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('send', $this->route('email_campaign'));
    }

    public function rules(): array
    {
        return ['scheduled_at' => ['required', 'date', 'after:' . now()->addMinute()->toDateTimeString()]];
    }
}
