<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use \App\Models\Concerns\BelongsToWorkspace;
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'website',
        'workspace_id',
        'billing_email', 'address_line1', 'address_line2', 'city', 'state_code', 'postal_code', 'country', 'tax_id', 'tax_exempt',
    ];

    protected $casts = ['tax_exempt' => 'boolean'];

    /** What an invoice shows about the buyer (frozen onto issued documents). */
    public function billingSnapshot(): array
    {
        return $this->only(['name', 'billing_email', 'address_line1', 'address_line2', 'city', 'state_code', 'postal_code', 'country', 'tax_id', 'tax_exempt']);
    }

    public function leads()
    {
        return $this->hasMany(Lead::class);
    }

    public function contact()
    {
        return $this->hasMany(Contact::class);
    }
}
