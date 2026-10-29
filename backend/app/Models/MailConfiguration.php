<?php 
// app/Models/MailConfiguration.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;

class MailConfiguration extends Model
{
    protected $fillable = [
        'workspace_id', 'driver', 'host', 'port', 'username', 
        'password', 'encryption', 'from_address', 'from_name',
    ];

    // Use Laravel 10's modern, fluent cast definition
    protected function host(): Attribute {
        return Attribute::make(get: fn ($value) => decrypt($value), set: fn ($value) => encrypt($value));
    }
    protected function port(): Attribute {
        return Attribute::make(get: fn ($value) => decrypt($value), set: fn ($value) => encrypt($value));
    }
    protected function username(): Attribute {
        return Attribute::make(get: fn ($value) => decrypt($value), set: fn ($value) => encrypt($value));
    }
    protected function password(): Attribute {
        return Attribute::make(get: fn ($value) => decrypt($value), set: fn ($value) => encrypt($value));
    }
    // ... add casts for encryption, from_address, and from_name as well
}