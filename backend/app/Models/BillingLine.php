<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Shared by quote and invoice lines. */
abstract class BillingLine extends Model
{
    protected $guarded = [];

    protected $casts = [
        'quantity_milli' => 'integer', 'unit_price_minor' => 'integer', 'gross_minor' => 'integer',
        'discount_minor' => 'integer', 'taxable_minor' => 'integer', 'tax_minor' => 'integer', 'total_minor' => 'integer',
        'discount_percent' => 'float', 'tax_rate' => 'float',
    ];

    public function getQuantityAttribute(): float
    {
        return $this->quantity_milli / 1000;
    }
}
