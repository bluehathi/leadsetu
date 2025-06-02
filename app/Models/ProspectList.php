<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProspectList extends Model
{
    use HasFactory;

    protected $fillable = ['workspace_id', 'user_id', 'name', 'description'];

    /**
     * The contacts that belong to this list.
     */
    public function contacts(): BelongsToMany
    {
        return $this->belongsToMany(Contact::class, 'contact_prospect_list')
                    ->withPivot('subscribed_at');
    }

    /**
     * The email campaigns that belong to this list.
     */
    public function emailCampaigns()
    {
        return $this->belongsToMany(EmailCampaign::class, 'email_campaign_prospect_list');
    }
}