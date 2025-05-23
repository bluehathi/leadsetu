<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'website',
        'notes',
        'status',
        'source',
        'score',
        'qualification',
        'user_id',
        'organization_id', // Add organization_id
        'title',
        'positions',
        'tags',
    ];
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'tags' => 'array',
    ];
    protected $table = 'leads';
    protected $primaryKey = 'id';

    public function organization()
    {
        return $this->belongsTo(Organization::class);
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
