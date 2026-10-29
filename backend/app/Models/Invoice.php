<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends BillingDocument
{
    use HasFactory;

    public const STATUSES = ['draft', 'issued', 'partially_paid', 'paid', 'void'];

    protected $fillable = ['notes', 'terms'];

    protected function casts(): array
    {
        return parent::casts() + [
            'due_date' => 'date', 'issued_at' => 'datetime', 'voided_at' => 'datetime',
            'amount_paid_minor' => 'integer', 'balance_minor' => 'integer',
        ];
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class)->orderBy('position');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderBy('paid_at')->orderBy('id');
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /** Statuses in which money can still be received. */
    public function isOpen(): bool
    {
        return in_array($this->status, ['issued', 'partially_paid'], true);
    }

    public function isOverdue(): bool
    {
        return $this->isOpen() && $this->balance_minor > 0 && $this->due_date !== null && $this->due_date->isBefore(today());
    }
}
