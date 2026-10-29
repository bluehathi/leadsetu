<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quote extends BillingDocument
{
    use HasFactory;

    public const STATUSES = ['draft', 'sent', 'accepted', 'declined', 'invoiced'];

    protected $fillable = ['notes', 'terms'];

    protected function casts(): array
    {
        return parent::casts() + ['valid_until' => 'date'];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(QuoteLine::class)->orderBy('position');
    }

    /** Editable until the customer has answered or it has been invoiced. */
    public function isEditable(): bool
    {
        return in_array($this->status, ['draft', 'sent'], true);
    }

    public function isExpired(): bool
    {
        return $this->valid_until !== null && $this->valid_until->isPast() && in_array($this->status, ['draft', 'sent'], true);
    }
}
