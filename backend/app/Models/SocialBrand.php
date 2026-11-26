<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SocialBrand extends Model
{
    use BelongsToWorkspace;

    protected $fillable = [
        'name',
        'niche',
        'description',
    ];

    public function accounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class, 'social_brand_id');
    }
}
