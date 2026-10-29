<?php

namespace Tests\Feature\Api\V1;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class CompanyApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const URL = '/api/v1/companies';
    private const ALL = ['view_companies', 'create_companies', 'edit_companies', 'delete_companies'];

    public function test_guests_are_rejected_on_every_endpoint(): void
    {
        $company = Company::factory()->create();

        $this->assertRequiresPermissions(self::URL, $company->id);
    }

    public function test_user_without_permissions_gets_403(): void
    {
        $user = $this->tenantUser([]);
        $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);

        $this->actingAs($user, 'sanctum');
        $this->getJson(self::URL)->assertForbidden();
        $this->getJson(self::URL . "/{$company->id}")->assertForbidden();
        $this->postJson(self::URL, ['name' => 'x'])->assertForbidden();
        $this->putJson(self::URL . "/{$company->id}", ['name' => 'x'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$company->id}")->assertForbidden();
    }

    public function test_index_is_scoped_and_searchable(): void
    {
        $user = $this->tenantUser(['view_companies']);
        Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Acme Ltd']);
        Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Globex']);
        Company::factory()->create(['name' => 'Acme Elsewhere']);

        $this->actingAs($user, 'sanctum')->getJson(self::URL . '?search=acme')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Acme Ltd');
    }

    public function test_other_workspace_records_are_invisible(): void
    {
        $foreign = Company::factory()->create();

        $this->assertTenantIsolated(self::URL, $foreign->id, self::ALL, ['name' => 'Hijacked']);
        $this->assertDatabaseHas('companies', ['id' => $foreign->id, 'name' => $foreign->name]);
    }

    public function test_create_uses_callers_workspace_not_input(): void
    {
        $user = $this->tenantUser(['create_companies']);
        $other = Workspace::factory()->create();

        $id = $this->actingAs($user, 'sanctum')->postJson(self::URL, [
            'name' => 'New Co', 'workspace_id' => $other->id,
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('companies', ['id' => $id, 'workspace_id' => $user->workspace_id]);
    }

    public function test_update_and_delete(): void
    {
        $user = $this->tenantUser(self::ALL);
        $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);

        $this->actingAs($user, 'sanctum');
        $this->putJson(self::URL . "/{$company->id}", ['name' => 'Renamed'])->assertOk()->assertJsonPath('data.name', 'Renamed');
        $this->deleteJson(self::URL . "/{$company->id}")->assertNoContent();
    }

    public function test_company_with_contacts_cannot_be_deleted(): void
    {
        $user = $this->tenantUser(self::ALL);
        $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);
        Contact::factory()->create(['workspace_id' => $user->workspace_id, 'company_id' => $company->id]);

        $this->actingAs($user, 'sanctum')->deleteJson(self::URL . "/{$company->id}")
            ->assertUnprocessable()->assertJsonValidationErrors('company');
        $this->assertDatabaseHas('companies', ['id' => $company->id]);
    }
}
