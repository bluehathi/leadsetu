<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use Concerns\BelongsToWorkspace;

    public const METHODS = ['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'other'];

    protected $fillable = ['amount_minor', 'paid_at', 'method', 'reference', 'notes'];

    protected $casts = ['amount_minor' => 'integer', 'paid_at' => 'date', 'voided_at' => 'datetime'];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
