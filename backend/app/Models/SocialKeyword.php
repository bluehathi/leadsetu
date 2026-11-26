<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialKeyword extends Model
{
    use BelongsToWorkspace, HasFactory;

    public const PLATFORMS = ['youtube', 'instagram', 'both'];
    public const TRENDS = ['rising', 'steady', 'declining'];

    protected $fillable = [
        'social_account_id',
        'platform',
        'keyword',
        'search_volume',
        'competition_score',
        'overall_score',
        'trend',
        'related_tags',
    ];

    protected $casts = [
        'related_tags' => 'array',
        'search_volume' => 'integer',
        'competition_score' => 'integer',
        'overall_score' => 'integer',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class, 'social_account_id');
    }
}
