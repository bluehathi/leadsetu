<?php

namespace App\Policies;

use App\Models\TaxRate;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class TaxRatePolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->canAny(['view_tax_rates', 'manage_tax_rates', 'create_invoices', 'create_quotes', 'create_items']);
    }

    public function view(User $user, TaxRate $rate): bool
    {
        return $this->sameWorkspace($user, $rate) && $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('manage_tax_rates');
    }

    public function update(User $user, TaxRate $rate): bool
    {
        return $this->sameWorkspace($user, $rate) && $user->can('manage_tax_rates');
    }

    public function delete(User $user, TaxRate $rate): bool
    {
        return $this->update($user, $rate);
    }
}
