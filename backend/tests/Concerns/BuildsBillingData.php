<?php

namespace Tests\Concerns;

use App\Models\BusinessProfile;
use App\Models\Company;
use App\Models\Contact;
use App\Models\Item;
use App\Models\TaxRate;
use App\Models\User;
use App\Models\Workspace;
use App\Support\WorkspaceContext;

/** Fixtures for billing tests (models are created directly so no request/auth context is needed). */
trait BuildsBillingData
{
    private const BILLING_ALL = [
        'manage_business_profile', 'view_items', 'create_items', 'edit_items', 'delete_items', 'view_tax_rates', 'manage_tax_rates',
        'view_quotes', 'create_quotes', 'edit_quotes', 'delete_quotes',
        'view_invoices', 'create_invoices', 'edit_invoices', 'delete_invoices', 'issue_invoices', 'void_invoices', 'record_payments', 'void_payments',
    ];

    protected function billingUser(array $permissions = self::BILLING_ALL, ?Workspace $ws = null): User
    {
        return $this->tenantUser($permissions, $ws);
    }

    protected function profileFor(Workspace $ws, string $country = 'IN', array $over = []): BusinessProfile
    {
        return WorkspaceContext::run($ws->id, function () use ($ws, $country, $over) {
            $p = new BusinessProfile($over + [
            'legal_name' => 'Acme Traders', 'country' => $country, 'currency' => BusinessProfile::COUNTRIES[$country],
            'state_code' => $country === 'IN' ? '27' : 'CA',
            'tax_id' => $country === 'IN' ? '27AAPFU0939F1ZV' : '12-3456789',
            'fy_start_month' => $country === 'IN' ? 4 : 1, 'invoice_prefix' => 'INV', 'quote_prefix' => 'QT', 'default_due_days' => 15,
        ]);
            $p->workspace_id = $ws->id;
            $p->save();

            return $p;
        });
    }

    protected function customer(Workspace $ws, array $over = []): Company
    {
        return WorkspaceContext::run($ws->id, function () use ($ws, $over) {
            $c = new Company($over + ['name' => 'Globex ' . uniqid(), 'state_code' => '27']);
            $c->workspace_id = $ws->id;
            $c->save();

            return $c;
        });
    }

    protected function taxRate(Workspace $ws, string $name, float $rate): TaxRate
    {
        return WorkspaceContext::run($ws->id, function () use ($ws, $name, $rate) {
            $t = new TaxRate(['name' => $name, 'rate' => $rate, 'is_default' => false, 'active' => true]);
            $t->workspace_id = $ws->id;
            $t->save();

            return $t;
        });
    }

    protected function item(Workspace $ws, array $over = []): Item
    {
        return WorkspaceContext::run($ws->id, function () use ($ws, $over) {
            $i = new Item($over + ['type' => 'service', 'name' => 'Consulting', 'unit' => 'hr', 'price_minor' => 100000, 'sku' => 'S' . uniqid()]);
            $i->workspace_id = $ws->id;
            $i->save();

            return $i;
        });
    }

    /** A valid request body for a quote/invoice with one line. */
    protected function documentPayload(Company $company, array $line = [], array $over = []): array
    {
        return $over + [
            'company_id' => $company->id,
            'lines' => [$line + ['description' => 'Consulting', 'quantity' => 2, 'unit_price_minor' => 100000, 'tax_rate' => 18]],
        ];
    }
}
