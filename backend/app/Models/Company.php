<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Scopes\WorkSpaceScope;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'website',
        'workspace_id',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new WorkSpaceScope());
    }

    public function workspace()
    {
        return $this->belongsTo(Workspace::class);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function contact()
    {
        return $this->hasMany(Contact::class);
    }
}
