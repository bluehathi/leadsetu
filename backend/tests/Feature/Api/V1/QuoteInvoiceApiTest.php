<?php

namespace Tests\Feature\Api\V1;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Quote;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Concerns\BuildsBillingData;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class QuoteInvoiceApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants, BuildsBillingData;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function inUser(array $perms = self::BILLING_ALL, array $profile = []): \App\Models\User
    {
        $user = $this->billingUser($perms);
        $this->profileFor($user->workspace, 'IN', $profile);

        return $user;
    }

    private function draftInvoice(\App\Models\User $user, array $company = [], array $line = []): int
    {
        $customer = $this->customer($user->workspace, $company);

        return $this->actingAs($user, 'sanctum')->postJson('/api/v1/invoices', $this->documentPayload($customer, $line))
            ->assertCreated()->json('data.id');
    }

    // ---- guards ----------------------------------------------------------------------------

    public function test_documents_require_authentication_and_permissions(): void
    {
        $owner = $this->inUser();
        $invoice = Invoice::query()->withoutGlobalScopes()->get()->first()
            ?? tap(new Invoice(['notes' => null]), function ($i) use ($owner) {
                $i->workspace_id = $owner->workspace_id; $i->user_id = $owner->id;
                $i->company_id = $this->customer($owner->workspace)->id; $i->currency = 'INR'; $i->country = 'IN'; $i->status = 'draft'; $i->save();
            });
        $quote = tap(new Quote(), function ($q) use ($owner, $invoice) {
            $q->workspace_id = $owner->workspace_id; $q->user_id = $owner->id; $q->company_id = $invoice->company_id;
            $q->currency = 'INR'; $q->country = 'IN'; $q->status = 'draft'; $q->save();
        });

        $this->assertRequiresPermissions('/api/v1/invoices', $invoice->id);
        $this->assertRequiresPermissions('/api/v1/quotes', $quote->id);
        foreach (["invoices/{$invoice->id}/issue", "invoices/{$invoice->id}/void", "invoices/{$invoice->id}/payments", "quotes/{$quote->id}/convert", "quotes/{$quote->id}/status", 'payments/1/void'] as $path) {
            $this->postJson("/api/v1/$path")->assertUnauthorized();
        }

        $nobody = $this->billingUser([]);
        $mine = $this->draftInvoice($this->inUser(), [], []);
        $this->actingAs($nobody, 'sanctum');
        $this->getJson('/api/v1/invoices')->assertForbidden();
        $this->getJson('/api/v1/quotes')->assertForbidden();
        $this->postJson('/api/v1/invoices', [])->assertForbidden();
        $this->postJson('/api/v1/quotes', [])->assertForbidden();
    }

    public function test_cross_workspace_documents_are_invisible_and_untouchable(): void
    {
        $owner = $this->inUser();
        $id = $this->draftInvoice($owner);
        $quoteId = $this->actingAs($owner, 'sanctum')->postJson('/api/v1/quotes', $this->documentPayload($this->customer($owner->workspace)))->assertCreated()->json('data.id');

        $this->assertTenantIsolated('/api/v1/invoices', $id, self::BILLING_ALL, ['notes' => 'Hijacked']);
        $this->assertTenantIsolated('/api/v1/quotes', $quoteId, self::BILLING_ALL, ['notes' => 'Hijacked']);

        $intruder = $this->inUser();
        $this->actingAs($intruder, 'sanctum');
        foreach (['issue', 'void'] as $action) {
            $this->postJson("/api/v1/invoices/$id/$action", ['reason' => 'x'])->assertNotFound();
        }
        $this->postJson("/api/v1/invoices/$id/payments", ['amount_minor' => 1, 'paid_at' => today()->toDateString(), 'method' => 'cash'])->assertNotFound();
        $this->postJson("/api/v1/quotes/$quoteId/convert")->assertNotFound();
        $this->assertSame('draft', Invoice::withoutGlobalScopes()->find($id)->status);
    }

    // ---- pricing & validation --------------------------------------------------------------

    public function test_draft_invoice_prices_gst_for_same_state_customers(): void
    {
        $user = $this->inUser();
        $customer = $this->customer($user->workspace, ['state_code' => '27']);

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/v1/invoices', $this->documentPayload($customer, ['discount_percent' => 10]))
            ->assertCreated()->assertJsonPath('data.status', 'draft')->assertJsonPath('data.number', null)->assertJsonPath('data.currency', 'INR');

        $res->assertJsonPath('data.subtotal_minor', 200000)->assertJsonPath('data.discount_minor', 20000)
            ->assertJsonPath('data.tax_minor', 32400)->assertJsonPath('data.total_minor', 212400)
            ->assertJsonPath('data.balance_minor', 212400)->assertJsonPath('data.lines.0.quantity', 2)
            ->assertJsonPath('data.tax_breakup.0.code', 'CGST')->assertJsonPath('data.tax_breakup.1.code', 'SGST');
    }

    public function test_inter_state_customers_get_igst_and_exempt_customers_no_tax(): void
    {
        $user = $this->inUser();
        $this->actingAs($user, 'sanctum');

        $inter = $this->postJson('/api/v1/invoices', $this->documentPayload($this->customer($user->workspace, ['state_code' => '29'])))->assertCreated();
        $inter->assertJsonPath('data.tax_breakup.0.code', 'IGST')->assertJsonPath('data.tax_minor', 36000)->assertJsonPath('data.place_of_supply', '29');

        $exempt = $this->postJson('/api/v1/invoices', $this->documentPayload($this->customer($user->workspace, ['tax_exempt' => true])))->assertCreated();
        $exempt->assertJsonPath('data.tax_minor', 0)->assertJsonPath('data.total_minor', 200000)->assertJsonPath('data.tax_breakup', []);
    }

    public function test_us_invoices_use_sales_tax_and_usd(): void
    {
        $user = $this->billingUser();
        $this->profileFor($user->workspace, 'US');
        $customer = $this->customer($user->workspace, ['state_code' => 'NY']);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/invoices', $this->documentPayload($customer, ['tax_rate' => 8.875, 'quantity' => 1, 'unit_price_minor' => 10000]))
            ->assertCreated()->assertJsonPath('data.currency', 'USD')->assertJsonPath('data.tax_minor', 888)
            ->assertJsonPath('data.total_minor', 10888)->assertJsonPath('data.tax_breakup.0.code', 'SALES_TAX');
    }

    public function test_catalog_items_fill_in_price_and_tax(): void
    {
        $user = $this->inUser();
        $rate = $this->taxRate($user->workspace, 'GST 5%', 5);
        $item = $this->item($user->workspace, ['name' => 'Widget', 'price_minor' => 25000, 'tax_rate_id' => $rate->id, 'hsn_sac' => '8471', 'unit' => 'pcs']);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/invoices', [
            'company_id' => $this->customer($user->workspace)->id,
            'lines' => [['item_id' => $item->id, 'quantity' => 4]],
        ])->assertCreated()
            ->assertJsonPath('data.lines.0.description', 'Widget')->assertJsonPath('data.lines.0.unit_price_minor', 25000)
            ->assertJsonPath('data.lines.0.hsn_sac', '8471')->assertJsonPath('data.lines.0.tax_rate', 5)
            ->assertJsonPath('data.subtotal_minor', 100000)->assertJsonPath('data.tax_minor', 5000);
    }

    public function test_payload_validation(): void
    {
        $user = $this->inUser();
        $customer = $this->customer($user->workspace);
        $foreignCustomer = $this->customer(Workspace::factory()->create());
        $foreignItem = $this->item(Workspace::factory()->create());
        $this->actingAs($user, 'sanctum');
        $post = fn (array $p) => $this->postJson('/api/v1/invoices', $p);

        $post([])->assertUnprocessable()->assertJsonValidationErrors(['company_id', 'lines']);
        $post(['company_id' => $foreignCustomer->id, 'lines' => [['description' => 'x', 'quantity' => 1, 'unit_price_minor' => 1]]])->assertUnprocessable()->assertJsonValidationErrors('company_id');
        $post(['company_id' => $customer->id, 'lines' => []])->assertUnprocessable()->assertJsonValidationErrors('lines');
        $post($this->documentPayload($customer, ['quantity' => 0]))->assertUnprocessable()->assertJsonValidationErrors('lines.0.quantity');
        $post($this->documentPayload($customer, ['quantity' => 1.2345]))->assertUnprocessable()->assertJsonValidationErrors('lines.0.quantity');
        $post($this->documentPayload($customer, ['unit_price_minor' => 10.5]))->assertUnprocessable()->assertJsonValidationErrors('lines.0.unit_price_minor');
        $post($this->documentPayload($customer, ['unit_price_minor' => -1]))->assertUnprocessable()->assertJsonValidationErrors('lines.0.unit_price_minor');
        $post($this->documentPayload($customer, ['discount_percent' => 101]))->assertUnprocessable()->assertJsonValidationErrors('lines.0.discount_percent');
        $post($this->documentPayload($customer, ['tax_rate' => 120]))->assertUnprocessable()->assertJsonValidationErrors('lines.0.tax_rate');
        $post($this->documentPayload($customer, ['item_id' => $foreignItem->id]))->assertUnprocessable()->assertJsonValidationErrors('lines.0.item_id');
        $post($this->documentPayload($customer, ['description' => null]))->assertUnprocessable()->assertJsonValidationErrors('lines.0.description');
        $post($this->documentPayload($customer, [], ['contact_id' => 99999]))->assertUnprocessable()->assertJsonValidationErrors('contact_id');
        $this->assertSame(0, Invoice::count());
    }

    public function test_documents_need_a_business_profile_first(): void
    {
        $user = $this->billingUser();
        $customer = $this->customer($user->workspace);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/invoices', $this->documentPayload($customer))
            ->assertUnprocessable()->assertJsonValidationErrors('business');
        $this->postJson('/api/v1/quotes', $this->documentPayload($customer))->assertUnprocessable()->assertJsonValidationErrors('business');
    }

    // ---- invoice lifecycle -----------------------------------------------------------------

    public function test_drafts_can_be_edited_and_deleted_and_have_no_number(): void
    {
        $user = $this->inUser();
        $id = $this->draftInvoice($user);

        $this->putJson("/api/v1/invoices/$id", ['notes' => 'Thanks', 'lines' => [['description' => 'Other', 'quantity' => 1, 'unit_price_minor' => 5000, 'tax_rate' => 0]]])
            ->assertOk()->assertJsonPath('data.notes', 'Thanks')->assertJsonPath('data.total_minor', 5000)->assertJsonCount(1, 'data.lines');
        $this->deleteJson("/api/v1/invoices/$id")->assertNoContent();
        $this->assertSame(0, Invoice::count());
    }

    public function test_issuing_numbers_freezes_and_snapshots_the_invoice(): void
    {
        Carbon::setTestNow('2025-08-10 10:00:00');
        $user = $this->inUser();
        $id = $this->draftInvoice($user, ['name' => 'Globex Pvt Ltd', 'tax_id' => '29ABCDE1234F1Z5', 'state_code' => '27']);

        $res = $this->postJson("/api/v1/invoices/$id/issue")->assertOk();
        $res->assertJsonPath('data.status', 'issued')->assertJsonPath('data.number', 'INV/25-26/0001')
            ->assertJsonPath('data.issue_date', '2025-08-10')->assertJsonPath('data.due_date', '2025-08-25')
            ->assertJsonPath('data.seller.tax_id', '27AAPFU0939F1ZV')->assertJsonPath('data.buyer.name', 'Globex Pvt Ltd')
            ->assertJsonPath('data.balance_minor', 236000)->assertJsonPath('data.editable', false);

        // Immutable from now on.
        $this->putJson("/api/v1/invoices/$id", ['notes' => 'x'])->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->deleteJson("/api/v1/invoices/$id")->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->postJson("/api/v1/invoices/$id/issue")->assertUnprocessable()->assertJsonValidationErrors('status');

        // Later changes to the customer do not rewrite history.
        \App\Models\Company::withoutGlobalScopes()->where('name', 'Globex Pvt Ltd')->update(['name' => 'Renamed Co']);
        $this->getJson("/api/v1/invoices/$id")->assertJsonPath('data.buyer.name', 'Globex Pvt Ltd');
    }

    public function test_numbers_are_sequential_per_financial_year_and_workspace(): void
    {
        $a = $this->inUser();
        $b = $this->inUser();

        Carbon::setTestNow('2026-03-31 09:00:00'); // last day of FY 25-26
        $first = $this->draftInvoice($a);
        $second = $this->draftInvoice($a);
        $this->postJson("/api/v1/invoices/$first/issue")->assertJsonPath('data.number', 'INV/25-26/0001');
        $this->postJson("/api/v1/invoices/$second/issue")->assertJsonPath('data.number', 'INV/25-26/0002');

        Carbon::setTestNow('2026-04-01 09:00:00'); // new FY restarts the series
        $third = $this->draftInvoice($a);
        $this->postJson("/api/v1/invoices/$third/issue")->assertJsonPath('data.number', 'INV/26-27/0001');

        $other = $this->draftInvoice($b); // another tenant has its own series
        $this->postJson("/api/v1/invoices/$other/issue")->assertJsonPath('data.number', 'INV/26-27/0001');

        $this->assertSame(3, Invoice::withoutGlobalScopes()->where('workspace_id', $a->workspace_id)->whereNotNull('number')->distinct('number')->count('number'));
    }

    public function test_a_failed_issue_does_not_consume_a_number(): void
    {
        $user = $this->inUser([...self::BILLING_ALL], ['tax_id' => null]);
        $bad = $this->draftInvoice($user); // taxable, but the seller has no GSTIN

        $this->postJson("/api/v1/invoices/$bad/issue")->assertUnprocessable()->assertJsonValidationErrors('business');
        $this->assertNull(Invoice::find($bad)->number);

        \App\Models\BusinessProfile::query()->update(['tax_id' => '27AAPFU0939F1ZV']);
        $this->postJson("/api/v1/invoices/$bad/issue")->assertOk()->assertJsonPath('data.number', fn ($n) => str_ends_with($n, '/0001'));
    }

    public function test_gst_invoices_need_the_customers_state(): void
    {
        $user = $this->inUser();
        $id = $this->draftInvoice($user, ['state_code' => null]);

        $this->postJson("/api/v1/invoices/$id/issue")->assertUnprocessable()->assertJsonValidationErrors('company');

        \App\Models\Company::query()->update(['state_code' => '27']);
        $this->postJson("/api/v1/invoices/$id/issue")->assertOk();
    }

    public function test_zero_tax_invoices_do_not_need_gst_details_and_empty_totals_are_refused(): void
    {
        $user = $this->inUser([...self::BILLING_ALL], ['tax_id' => null, 'state_code' => null]);
        $customer = $this->customer($user->workspace, ['state_code' => null]);
        $this->actingAs($user, 'sanctum');

        $ok = $this->postJson('/api/v1/invoices', $this->documentPayload($customer, ['tax_rate' => 0]))->assertCreated()->json('data.id');
        $this->postJson("/api/v1/invoices/$ok/issue")->assertOk();

        $zero = $this->postJson('/api/v1/invoices', $this->documentPayload($customer, ['tax_rate' => 0, 'unit_price_minor' => 0]))->assertCreated()->json('data.id');
        $this->postJson("/api/v1/invoices/$zero/issue")->assertUnprocessable()->assertJsonValidationErrors('total');
    }

    public function test_issuing_needs_its_own_permission(): void
    {
        $writer = $this->inUser(['view_invoices', 'create_invoices', 'edit_invoices']);
        $id = $this->draftInvoice($writer);

        $this->postJson("/api/v1/invoices/$id/issue")->assertForbidden();
        $this->assertNull(Invoice::find($id)->number);
    }

    // ---- payments --------------------------------------------------------------------------

    private function issued(\App\Models\User $user): int
    {
        $id = $this->draftInvoice($user);
        $this->postJson("/api/v1/invoices/$id/issue")->assertOk();

        return $id;
    }

    private function pay(int $invoice, int|float $amount, array $over = [])
    {
        return $this->postJson("/api/v1/invoices/$invoice/payments", $over + ['amount_minor' => $amount, 'paid_at' => today()->toDateString(), 'method' => 'upi', 'reference' => 'UTR123']);
    }

    public function test_partial_and_full_payments_update_status_and_balance(): void
    {
        $user = $this->inUser();
        $id = $this->issued($user); // total 2,36,000 paise

        $this->pay($id, 100000)->assertCreated()->assertJsonPath('data.status', 'partially_paid')
            ->assertJsonPath('data.amount_paid_minor', 100000)->assertJsonPath('data.balance_minor', 136000)->assertJsonCount(1, 'data.payments');
        $this->pay($id, 136001)->assertUnprocessable()->assertJsonValidationErrors('amount_minor'); // overpayment
        $this->pay($id, 136000)->assertCreated()->assertJsonPath('data.status', 'paid')->assertJsonPath('data.balance_minor', 0);
        $this->pay($id, 1)->assertUnprocessable()->assertJsonValidationErrors('invoice');            // already paid
    }

    public function test_payment_validation_and_draft_invoices_cannot_be_paid(): void
    {
        $user = $this->inUser();
        $draft = $this->draftInvoice($user);
        $this->pay($draft, 1000)->assertUnprocessable()->assertJsonValidationErrors('invoice');

        $id = $this->issued($user);
        $this->pay($id, 0)->assertUnprocessable()->assertJsonValidationErrors('amount_minor');
        $this->pay($id, 100.5)->assertUnprocessable()->assertJsonValidationErrors('amount_minor');
        $this->pay($id, 1000, ['method' => 'bitcoin'])->assertUnprocessable()->assertJsonValidationErrors('method');
        $this->pay($id, 1000, ['paid_at' => today()->addDay()->toDateString()])->assertUnprocessable()->assertJsonValidationErrors('paid_at');
        $this->assertSame(0, Payment::count());
    }

    public function test_recording_and_voiding_payments_need_separate_permissions(): void
    {
        $owner = $this->inUser();
        $id = $this->issued($owner);

        $clerk = $this->billingUser(['view_invoices', 'record_payments'], $owner->workspace);
        $this->actingAs($clerk, 'sanctum');
        $paymentId = $this->pay($id, 1000)->assertCreated()->json('data.payments.0.id');
        $this->postJson("/api/v1/payments/$paymentId/void", ['reason' => 'typo'])->assertForbidden();

        $viewer = $this->billingUser(['view_invoices'], $owner->workspace);
        $this->actingAs($viewer, 'sanctum');
        $this->pay($id, 1000)->assertForbidden();
    }

    public function test_voiding_a_payment_restores_the_balance_and_status(): void
    {
        $user = $this->inUser();
        $id = $this->issued($user);
        $this->pay($id, 236000)->assertJsonPath('data.status', 'paid');
        $paymentId = Payment::first()->id;

        $this->postJson("/api/v1/payments/$paymentId/void", [])->assertUnprocessable()->assertJsonValidationErrors('reason');
        $this->postJson("/api/v1/payments/$paymentId/void", ['reason' => 'Cheque bounced'])
            ->assertOk()->assertJsonPath('data.status', 'issued')->assertJsonPath('data.balance_minor', 236000)
            ->assertJsonPath('data.payments.0.voided', true)->assertJsonPath('data.amount_paid_minor', 0);
        $this->postJson("/api/v1/payments/$paymentId/void", ['reason' => 'again'])->assertUnprocessable();

        $this->pay($id, 36000)->assertJsonPath('data.status', 'partially_paid');
    }

    public function test_voiding_an_invoice_requires_a_reason_and_no_active_payments(): void
    {
        $user = $this->inUser();
        $paid = $this->issued($user);
        $this->pay($paid, 1000);
        $this->postJson("/api/v1/invoices/$paid/void", ['reason' => 'Mistake'])->assertUnprocessable()->assertJsonValidationErrors('status');

        $clean = $this->issued($user);
        $this->postJson("/api/v1/invoices/$clean/void", [])->assertUnprocessable()->assertJsonValidationErrors('reason');
        $number = $this->postJson("/api/v1/invoices/$clean/void", ['reason' => 'Wrong customer'])
            ->assertOk()->assertJsonPath('data.status', 'void')->assertJsonPath('data.balance_minor', 0)->json('data.number');

        $this->assertNotNull($number);                                                     // the number is kept, never reused
        $this->pay($clean, 1)->assertUnprocessable();                                      // cannot be paid
        $this->postJson("/api/v1/invoices/$clean/void", ['reason' => 'again'])->assertUnprocessable();
        $next = $this->draftInvoice($user);
        $this->postJson("/api/v1/invoices/$next/issue")->assertJsonPath('data.number', fn ($n) => $n !== $number);
    }

    public function test_overdue_flag_and_filter(): void
    {
        Carbon::setTestNow('2025-08-01 09:00:00');
        $user = $this->inUser();
        $late = $this->issued($user);                    // due 2025-08-16
        Carbon::setTestNow('2025-08-20 09:00:00');
        $current = $this->issued($user);                 // due 2025-09-04

        $this->getJson("/api/v1/invoices/$late")->assertJsonPath('data.is_overdue', true);
        $this->getJson("/api/v1/invoices/$current")->assertJsonPath('data.is_overdue', false);
        $this->getJson('/api/v1/invoices?status=overdue')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $late);

        $this->pay($late, 236000);
        $this->getJson('/api/v1/invoices?status=overdue')->assertJsonCount(0, 'data');
    }

    public function test_listing_filters_search_and_sorting(): void
    {
        $user = $this->inUser();
        $this->actingAs($user, 'sanctum');
        $acme = $this->customer($user->workspace, ['name' => 'Acme Corp']);
        $this->postJson('/api/v1/invoices', $this->documentPayload($acme))->assertCreated();
        $this->postJson('/api/v1/invoices', $this->documentPayload($this->customer($user->workspace, ['name' => 'Zeta Ltd']), ['unit_price_minor' => 500]))->assertCreated();

        $this->getJson('/api/v1/invoices')->assertJsonCount(2, 'data');
        $this->getJson('/api/v1/invoices?search=acme')->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/invoices?company_id={$acme->id}")->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/invoices?sort=total_minor')->assertJsonPath('data.0.company.name', 'Zeta Ltd');
        $this->getJson('/api/v1/invoices?status=paid')->assertJsonCount(0, 'data');
    }

    // ---- quotes ----------------------------------------------------------------------------

    public function test_quotes_are_numbered_priced_and_follow_a_status_flow(): void
    {
        Carbon::setTestNow('2025-08-10');
        $user = $this->inUser();
        $customer = $this->customer($user->workspace);
        $this->actingAs($user, 'sanctum');

        $id = $this->postJson('/api/v1/quotes', $this->documentPayload($customer))->assertCreated()
            ->assertJsonPath('data.number', 'QT/25-26/0001')->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.valid_until', '2025-09-09')->assertJsonPath('data.total_minor', 236000)->json('data.id');

        $this->postJson('/api/v1/quotes', $this->documentPayload($customer))->assertJsonPath('data.number', 'QT/25-26/0002');

        $this->postJson("/api/v1/quotes/$id/status", ['status' => 'accepted'])->assertUnprocessable();   // must be sent first
        $this->postJson("/api/v1/quotes/$id/status", ['status' => 'sent'])->assertOk()->assertJsonPath('data.status', 'sent');
        $this->putJson("/api/v1/quotes/$id", ['notes' => 'Revised', 'lines' => [['description' => 'Cheaper', 'quantity' => 1, 'unit_price_minor' => 1000, 'tax_rate' => 0]]])
            ->assertOk()->assertJsonPath('data.total_minor', 1000);
        $this->postJson("/api/v1/quotes/$id/status", ['status' => 'accepted'])->assertOk();
        $this->putJson("/api/v1/quotes/$id", ['notes' => 'x'])->assertUnprocessable()->assertJsonValidationErrors('status'); // answered quotes are frozen
        $this->postJson("/api/v1/quotes/$id/status", ['status' => 'invoiced'])->assertUnprocessable();                       // only convert() does that
    }

    public function test_converting_a_quote_creates_one_draft_invoice(): void
    {
        $user = $this->inUser();
        $customer = $this->customer($user->workspace);
        $this->actingAs($user, 'sanctum');
        $id = $this->postJson('/api/v1/quotes', $this->documentPayload($customer, [], ['notes' => 'Thanks']))->json('data.id');

        $invoice = $this->postJson("/api/v1/quotes/$id/convert")->assertCreated()
            ->assertJsonPath('data.status', 'draft')->assertJsonPath('data.number', null)->assertJsonPath('data.notes', 'Thanks')
            ->assertJsonPath('data.total_minor', 236000)->assertJsonPath('data.quote_id', $id)->json('data');

        $this->getJson("/api/v1/quotes/$id")->assertJsonPath('data.status', 'invoiced')->assertJsonPath('data.invoice_id', $invoice['id']);
        $this->postJson("/api/v1/quotes/$id/convert")->assertUnprocessable()->assertJsonValidationErrors('status');
        $this->deleteJson("/api/v1/quotes/$id")->assertUnprocessable();
        $this->assertSame(1, Invoice::count());
    }

    public function test_converting_needs_permission_to_create_invoices_and_declined_quotes_cannot_convert(): void
    {
        $owner = $this->inUser();
        $customer = $this->customer($owner->workspace);
        $id = $this->actingAs($owner, 'sanctum')->postJson('/api/v1/quotes', $this->documentPayload($customer))->json('data.id');

        $salesperson = $this->billingUser(['view_quotes', 'edit_quotes'], $owner->workspace);
        $this->actingAs($salesperson, 'sanctum')->postJson("/api/v1/quotes/$id/convert")->assertForbidden();
        $this->assertSame(0, Invoice::count());

        $this->actingAs($owner, 'sanctum');
        $this->postJson("/api/v1/quotes/$id/status", ['status' => 'sent']);
        $this->postJson("/api/v1/quotes/$id/status", ['status' => 'declined'])->assertOk();
        $this->postJson("/api/v1/quotes/$id/convert")->assertUnprocessable();
    }

    public function test_quote_expiry_is_reported(): void
    {
        $user = $this->inUser();
        $customer = $this->customer($user->workspace);
        $this->actingAs($user, 'sanctum');
        $id = $this->postJson('/api/v1/quotes', $this->documentPayload($customer, [], ['valid_until' => today()->addDays(3)->toDateString()]))->json('data.id');
        $this->getJson("/api/v1/quotes/$id")->assertJsonPath('data.is_expired', false);

        Carbon::setTestNow(today()->addDays(10));
        $this->getJson("/api/v1/quotes/$id")->assertJsonPath('data.is_expired', true);
    }

    public function test_dashboard_receivables_count_only_open_invoices_of_this_workspace(): void
    {
        Carbon::setTestNow('2025-08-01 09:00:00');
        $user = $this->inUser([...self::BILLING_ALL, 'view_dashboard']);
        $late = $this->issued($user);                        // due 08-16, 236000
        $this->pay($late, 36000);                            // balance 200000
        Carbon::setTestNow('2025-08-20 09:00:00');
        $current = $this->issued($user);                     // due 09-04, 236000
        $this->draftInvoice($user);                          // drafts are not receivables
        $void = $this->issued($user);
        $this->postJson("/api/v1/invoices/$void/void", ['reason' => 'x']);

        $other = $this->inUser();
        $this->actingAs($other, 'sanctum');
        $this->issued($other);                               // another tenant's invoice must not count

        $r = $this->actingAs($user, 'sanctum')->getJson('/api/v1/dashboard')->assertOk()->json('data.receivables');

        $this->assertSame('INR', $r['currency']);
        $this->assertSame(200000 + 236000, $r['outstanding_minor']);
        $this->assertSame(200000, $r['overdue_minor']);
        $this->assertSame(1, $r['overdue_count']);
        $this->assertSame(36000, $r['collected_this_month_minor']);   // paid on Aug 1, viewed on Aug 20
        $this->assertSame(1, $r['draft_count']);
        $this->assertNull($this->actingAs($this->billingUser(['view_dashboard']), 'sanctum')->getJson('/api/v1/dashboard')->json('data.receivables'));
    }
}
