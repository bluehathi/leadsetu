<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessProfile extends Model
{
    use Concerns\BelongsToWorkspace;

    public const COUNTRIES = ['IN' => 'INR', 'US' => 'USD'];

    protected $fillable = [
        'legal_name', 'country', 'currency', 'address_line1', 'address_line2', 'city', 'state_code', 'postal_code',
        'tax_id', 'email', 'phone', 'fy_start_month', 'invoice_prefix', 'quote_prefix', 'default_due_days', 'default_terms',
    ];

    /** Regime defaults: India's financial year starts in April, the US one in January. */
    public static function defaultsFor(string $country): array
    {
        return ['currency' => self::COUNTRIES[$country], 'fy_start_month' => $country === 'IN' ? 4 : 1];
    }

    /** What an invoice shows about the seller (frozen onto issued documents). */
    public function snapshot(): array
    {
        return $this->only(['legal_name', 'address_line1', 'address_line2', 'city', 'state_code', 'postal_code', 'country', 'tax_id', 'email', 'phone']);
    }
}
