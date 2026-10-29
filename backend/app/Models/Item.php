<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    use Concerns\BelongsToWorkspace, HasFactory;

    public const TYPES = ['product', 'service'];

    protected $fillable = ['type', 'name', 'sku', 'description', 'unit', 'price_minor', 'tax_rate_id', 'hsn_sac', 'active'];

    protected $casts = ['price_minor' => 'integer', 'active' => 'boolean'];

    public function taxRate(): BelongsTo
    {
        return $this->belongsTo(TaxRate::class);
    }
}
