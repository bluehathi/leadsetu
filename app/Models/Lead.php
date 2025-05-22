<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lead extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'company',
        'website',
        'notes',
        'status',
        'source',
        'user_id',
        'organization_id', // Add organization_id
    ];
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    protected $table = 'leads';
    protected $primaryKey = 'id';

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }
}
