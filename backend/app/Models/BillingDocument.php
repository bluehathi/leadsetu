<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Columns and relations shared by quotes and invoices. */
abstract class BillingDocument extends Model
{
    use Concerns\BelongsToWorkspace;

    protected $casts = [
        'issue_date' => 'date', 'tax_breakup' => 'array', 'seller_snapshot' => 'array', 'buyer_snapshot' => 'array',
        'subtotal_minor' => 'integer', 'discount_minor' => 'integer', 'tax_minor' => 'integer', 'total_minor' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
