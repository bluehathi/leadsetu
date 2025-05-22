<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $fillable = [
        'name',
        'description',
        'contact_email',
        'contact_phone',
        'address',
        'logo',
    ];
    protected $table = 'organizations';
    protected $primaryKey = 'id';
}
