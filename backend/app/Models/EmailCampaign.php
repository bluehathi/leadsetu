<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class EmailCampaign extends Model
{
    use \App\Models\Concerns\BelongsToWorkspace;
    use HasFactory;

    public const EDITABLE = ['draft', 'scheduled'];

    // workspace_id/user_id come from the session and status moves only through the service.
    protected $fillable = ['name', 'subject', 'body'];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    public function isEditable(): bool
    {
        return in_array($this->status, self::EDITABLE, true);
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
        return $this->hasMany(EmailLog::class, 'campaign_id');
    }

    public function prospectLists()
    {
        return $this->belongsToMany(ProspectList::class, 'email_campaign_prospect_list');
    }
}
