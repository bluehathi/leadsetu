<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialIdea extends Model
{
    use BelongsToWorkspace, HasFactory;

    public const PLATFORMS = ['youtube', 'instagram', 'facebook'];
    public const STATUSES = ['new', 'saved', 'dismissed', 'converted'];

    protected $fillable = [
        'social_account_id',
        'platform',
        'title',
        'hook',
        'angle',
        'predicted_score',
        'status',
    ];

    protected $casts = [
        'predicted_score' => 'integer',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(SocialAccount::class, 'social_account_id');
    }
}
