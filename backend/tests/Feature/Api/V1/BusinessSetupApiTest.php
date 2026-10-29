<?php

namespace Tests\Feature\Api\V1;

use App\Models\BusinessProfile;
use App\Models\Item;
use App\Models\TaxRate;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\BuildsBillingData;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class BusinessSetupApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants, BuildsBillingData;

    private function in(array $over = []): array
    {
        return $over + [
            'legal_name' => 'Acme Traders', 'country' => 'IN', 'address_line1' => '1 MG Road', 'city' => 'Mumbai',
            'state_code' => '27', 'postal_code' => '400001', 'tax_id' => '27AAPFU0939F1ZV',
        ];
    }

    // ---- business profile ------------------------------------------------------------------

    public function test_business_profile_requires_authentication_and_permission(): void
    {
        $this->getJson('/api/v1/business')->assertUnauthorized();
        $this->putJson('/api/v1/business', $this->in())->assertUnauthorized();

        $this->actingAs($this->billingUser([]), 'sanctum');
        $this->getJson('/api/v1/business')->assertForbidden();
        $this->putJson('/api/v1/business', $this->in())->assertForbidden();

        // Reading is allowed for people who work with documents, but not changing.
        $reader = $this->billingUser(['view_invoices']);
        $this->actingAs($reader, 'sanctum')->getJson('/api/v1/business')->assertOk();
        $this->putJson('/api/v1/business', $this->in())->assertForbidden();
    }

    public function test_profile_is_null_until_set_up_and_indian_setup_creates_gst_slabs(): void
    {
        $user = $this->billingUser();
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/v1/business')->assertOk()->assertJsonPath('data', null);

        $this->putJson('/api/v1/business', $this->in(['currency' => 'USD']))->assertOk()
            ->assertJsonPath('data.currency', 'INR')        // currency follows the country
            ->assertJsonPath('data.fy_start_month', 4);

        $rates = TaxRate::orderBy('rate')->get();
        $this->assertSame([0.0, 5.0, 12.0, 18.0, 28.0], $rates->pluck('rate')->all());
        $this->assertSame('GST 18%', $rates->firstWhere('is_default', true)->name);

        // Saving again must not duplicate the slabs.
        $this->putJson('/api/v1/business', $this->in(['legal_name' => 'Renamed']))->assertOk();
        $this->assertSame(5, TaxRate::count());
    }

    public function test_us_setup_uses_usd_calendar_year_and_no_preset_rates(): void
    {
        $this->actingAs($this->billingUser(), 'sanctum')->putJson('/api/v1/business', [
            'legal_name' => 'Acme Inc', 'country' => 'US', 'state_code' => 'ca', 'tax_id' => '12-3456789',
        ])->assertOk()->assertJsonPath('data.currency', 'USD')->assertJsonPath('data.fy_start_month', 1)->assertJsonPath('data.state_code', 'CA');

        $this->assertSame(0, TaxRate::count());
    }

    public function test_business_profile_validation(): void
    {
        $this->actingAs($this->billingUser(), 'sanctum');

        $this->putJson('/api/v1/business', $this->in(['tax_id' => 'NOT-A-GSTIN']))->assertUnprocessable()->assertJsonValidationErrors('tax_id');
        $this->putJson('/api/v1/business', $this->in(['state_code' => '99']))->assertUnprocessable()->assertJsonValidationErrors('state_code');
        $this->putJson('/api/v1/business', $this->in(['country' => 'FR']))->assertUnprocessable()->assertJsonValidationErrors('country');
        $this->putJson('/api/v1/business', $this->in(['invoice_prefix' => 'IN/V']))->assertUnprocessable()->assertJsonValidationErrors('invoice_prefix');
        $this->putJson('/api/v1/business', ['country' => 'IN'])->assertUnprocessable()->assertJsonValidationErrors('legal_name');
        $this->putJson('/api/v1/business', $this->in(['country' => 'US', 'state_code' => '27']))->assertUnprocessable()->assertJsonValidationErrors('state_code');
    }

    public function test_each_workspace_has_its_own_profile(): void
    {
        $a = $this->billingUser();
        $b = $this->billingUser();
        $this->actingAs($a, 'sanctum')->putJson('/api/v1/business', $this->in())->assertOk();

        $this->actingAs($b, 'sanctum')->getJson('/api/v1/business')->assertOk()->assertJsonPath('data', null);
        $this->assertSame(1, BusinessProfile::withoutGlobalScopes()->count());
    }

    // ---- tax rates -------------------------------------------------------------------------

    public function test_tax_rates_are_tenant_isolated_and_permissioned(): void
    {
        $foreign = $this->taxRate(Workspace::factory()->create(), 'Theirs', 7);
        $this->getJson('/api/v1/tax-rates')->assertUnauthorized();
        $this->assertTenantIsolated('/api/v1/tax-rates', $foreign->id, self::BILLING_ALL, ['name' => 'Hijacked']);

        $viewer = $this->billingUser(['view_tax_rates']);
        $this->actingAs($viewer, 'sanctum')->getJson('/api/v1/tax-rates')->assertOk();
        $this->postJson('/api/v1/tax-rates', ['name' => 'X', 'rate' => 5])->assertForbidden();
    }

    public function test_tax_rate_crud_unique_names_and_single_default(): void
    {
        $user = $this->billingUser(['manage_tax_rates', 'view_tax_rates']);
        $this->actingAs($user, 'sanctum');
        $this->taxRate(Workspace::factory()->create(), 'Sales tax', 4); // another tenant's, must not clash

        $a = $this->postJson('/api/v1/tax-rates', ['name' => 'Sales tax', 'rate' => 8.875, 'is_default' => true])->assertCreated()->assertJsonPath('data.rate', 8.875)->json('data.id');
        $this->postJson('/api/v1/tax-rates', ['name' => 'Sales tax', 'rate' => 5])->assertUnprocessable()->assertJsonValidationErrors('name');
        $b = $this->postJson('/api/v1/tax-rates', ['name' => 'Reduced', 'rate' => 4, 'is_default' => true])->assertCreated()->json('data.id');

        $this->assertFalse(TaxRate::find($a)->is_default);
        $this->assertTrue(TaxRate::find($b)->is_default);
        $this->postJson('/api/v1/tax-rates', ['name' => 'Bad', 'rate' => 101])->assertUnprocessable();
        $this->postJson('/api/v1/tax-rates', ['name' => 'Bad', 'rate' => 1.2345])->assertUnprocessable();

        $this->putJson("/api/v1/tax-rates/$b", ['rate' => 4.5])->assertOk()->assertJsonPath('data.rate', 4.5);
        $this->deleteJson("/api/v1/tax-rates/$b")->assertNoContent();
    }

    // ---- items -----------------------------------------------------------------------------

    public function test_items_require_authentication_and_permissions(): void
    {
        $this->assertRequiresPermissions('/api/v1/items', $this->item(Workspace::factory()->create())->id);

        $user = $this->billingUser([]);
        $item = $this->item($user->workspace);
        $this->actingAs($user, 'sanctum');
        $this->getJson('/api/v1/items')->assertForbidden();
        $this->postJson('/api/v1/items', ['name' => 'x', 'type' => 'service', 'price_minor' => 1])->assertForbidden();
        $this->putJson("/api/v1/items/{$item->id}", ['name' => 'x'])->assertForbidden();
        $this->deleteJson("/api/v1/items/{$item->id}")->assertForbidden();
    }

    public function test_items_are_tenant_isolated(): void
    {
        $foreign = $this->item(Workspace::factory()->create());

        $this->assertTenantIsolated('/api/v1/items', $foreign->id, self::BILLING_ALL, ['name' => 'Hijacked']);
        $this->assertSame('Consulting', $foreign->fresh()->name);

        $user = $this->billingUser(['view_items']);
        $this->item($user->workspace, ['name' => 'Mine']);
        $this->actingAs($user, 'sanctum')->getJson('/api/v1/items')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_item_create_update_search_and_validation(): void
    {
        $user = $this->billingUser();
        $rate = $this->taxRate($user->workspace, 'GST 18%', 18);
        $foreignRate = $this->taxRate(Workspace::factory()->create(), 'Other', 5);
        $this->actingAs($user, 'sanctum');

        $id = $this->postJson('/api/v1/items', [
            'type' => 'product', 'name' => 'Widget', 'sku' => 'W-1', 'unit' => 'pcs', 'price_minor' => 249900,
            'tax_rate_id' => $rate->id, 'hsn_sac' => '8471', 'workspace_id' => 999,
        ])->assertCreated()->assertJsonPath('data.price_minor', 249900)->assertJsonPath('data.tax_rate.rate', 18)->json('data.id');
        $this->assertSame($user->workspace_id, Item::find($id)->workspace_id);

        $this->postJson('/api/v1/items', ['type' => 'product', 'name' => 'Dup', 'sku' => 'W-1', 'price_minor' => 1])->assertUnprocessable()->assertJsonValidationErrors('sku');
        $this->postJson('/api/v1/items', ['type' => 'product', 'name' => 'X', 'price_minor' => 12.5])->assertUnprocessable()->assertJsonValidationErrors('price_minor');
        $this->postJson('/api/v1/items', ['type' => 'gadget', 'name' => 'X', 'price_minor' => 1])->assertUnprocessable()->assertJsonValidationErrors('type');
        $this->postJson('/api/v1/items', ['type' => 'product', 'name' => 'X', 'price_minor' => 1, 'tax_rate_id' => $foreignRate->id])->assertUnprocessable()->assertJsonValidationErrors('tax_rate_id');
        $this->postJson('/api/v1/items', ['type' => 'product', 'name' => 'X', 'price_minor' => -5])->assertUnprocessable();

        $this->getJson('/api/v1/items?search=widg')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/items?type=service')->assertJsonCount(0, 'data');
        $this->putJson("/api/v1/items/$id", ['price_minor' => 300000])->assertOk()->assertJsonPath('data.price_minor', 300000)->assertJsonPath('data.name', 'Widget');
        $this->deleteJson("/api/v1/items/$id")->assertNoContent();
    }
}
