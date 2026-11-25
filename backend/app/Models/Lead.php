<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class Lead extends Model
{
    use \App\Models\Concerns\BelongsToWorkspace;
    use HasFactory;

    public const STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'lost', 'won'];
    public const SOURCES = ['website', 'referral', 'cold_call', 'advertisement', 'other'];
    public const PRIORITIES = ['High', 'Medium', 'Low'];

    // score/qualification are computed, user_id/workspace_id come from the session: none are mass-assignable.
    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'website',
        'notes',
        'status',
        'source',
        'title',
        'positions',
        'tags',
        'company_id',
        'contact_id',
        'deal_value',
        'expected_close',
        'priority',
        'lead_owner',
    ];
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'tags' => 'array',
        'expected_close' => 'date',
        'attachments' => 'array',
    ];
    protected $table = 'leads';
    protected $primaryKey = 'id';

    

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function calculateScoreAndQualification()
    {
        $score = 0;
        if ($this->email) $score += 20;
        if ($this->phone) $score += 20;
        if ($this->status === 'converted') $score += 30;
        if ($this->notes) $score += 10;
        if (strtolower($this->source) === 'referral') $score += 20;

        $qualification = 'Cold';
        if ($score >= 70) {
            $qualification = 'Hot';
        } elseif ($score >= 40) {
            $qualification = 'Warm';
        }

        $this->score = $score;
        $this->qualification = $qualification;
        $this->save();
    }

    public function activityLogs()
    {
        return $this->hasMany(\App\Models\ActivityLog::class, 'subject_id')
            ->where('subject_type', self::class)
            ->orderByDesc('created_at');
    }
}
