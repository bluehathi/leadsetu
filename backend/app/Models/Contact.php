<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;


class Contact extends Model
{
    use \App\Models\Concerns\BelongsToWorkspace;
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'workspace_id',
        'title',
        'notes',
        'company_id',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function prospectLists(): BelongsToMany
    {
        return $this->belongsToMany(ProspectList::class, 'contact_prospect_list')
                    ->withPivot('subscribed_at');
    }
}
