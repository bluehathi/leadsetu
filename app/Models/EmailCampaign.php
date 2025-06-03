<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EmailCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'user_id',
        'name',
        'subject',
        'body',
        'status', // draft, scheduled, sending, sent, failed
        'scheduled_at',
        'sent_at',
        'failed_at',
        'prospect_list_id',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    

    public function contacts(): BelongsToMany
    {
        return $this->belongsToMany(Contact::class, 'email_campaign_contact');
    }

    public function emailLogs()
    {
        // Email logs for this campaign (using properties->campaign_id)
        return $this->hasMany(EmailLog::class, 'properties->campaign_id');
    }

    public function prospectLists()
    {
        return $this->belongsToMany(ProspectList::class, 'email_campaign_prospect_list');
    }
}
