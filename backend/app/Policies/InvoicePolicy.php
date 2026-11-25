<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Policies\Concerns\ChecksWorkspace;

class InvoicePolicy
{
    use ChecksWorkspace;

    public function viewAny(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('view_invoices');
    }

    public function view(User $user, Invoice $invoice): bool
    {
        return $this->sameWorkspace($user, $invoice) && $user->can('view_invoices');
    }

    public function create(User $user): bool
    {
        return $user->workspace_id !== null && $user->can('create_invoices');
    }

    public function update(User $user, Invoice $invoice): bool
    {
        return $this->sameWorkspace($user, $invoice) && $user->can('edit_invoices');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $this->sameWorkspace($user, $invoice) && $user->can('delete_invoices');
    }

    /** Issuing assigns a legal invoice number, so it has its own permission. */
    public function issue(User $user, Invoice $invoice): bool
    {
        return $this->sameWorkspace($user, $invoice) && $user->can('issue_invoices');
    }

    public function void(User $user, Invoice $invoice): bool
    {
        return $this->sameWorkspace($user, $invoice) && $user->can('void_invoices');
    }

    public function recordPayment(User $user, Invoice $invoice): bool
    {
        return $this->sameWorkspace($user, $invoice) && $user->can('record_payments');
    }

    public function voidPayment(User $user, Payment $payment): bool
    {
        return $this->sameWorkspace($user, $payment) && $user->can('void_payments');
    }
}
