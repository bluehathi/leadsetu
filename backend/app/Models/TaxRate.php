<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TaxRate extends Model
{
    use Concerns\BelongsToWorkspace;

    protected $fillable = ['name', 'rate', 'is_default', 'active'];

    protected $casts = ['rate' => 'float', 'is_default' => 'boolean', 'active' => 'boolean'];

    /** Common GST slabs offered when an Indian business sets up. */
    public const GST_SLABS = [0, 5, 12, 18, 28];
}
