<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentSequence extends Model
{
    use Concerns\BelongsToWorkspace;

    protected $fillable = ['type', 'period', 'last_number'];
}
