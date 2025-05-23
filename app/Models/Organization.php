<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Organization extends Model
{
    use HasFactory;

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
