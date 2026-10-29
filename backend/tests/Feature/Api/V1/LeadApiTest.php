<?php

namespace Tests\Feature\Api\V1;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Lead;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class LeadApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const URL = '/api/v1/leads';
    private const ALL = ['view_leads', 'create_leads', 'edit_leads', 'delete_leads'];

    private function leadIn(Workspace $workspace, array $attrs = []): Lead
    {
        $owner = User::factory()->create(['workspace_id' => $workspace->id]);

        return Lead::factory()->create($attrs + ['workspace_id' => $workspace->id, 'user_id' => $owner->id]);
    }

    public function test_guests_are_rejected_on_every_endpoint(): void
    {
        $lead = $this->leadIn(Workspace::factory()->create());

        $this->assertRequiresPermissions(self::URL, $lead->id);
        $this->patchJson(self::URL . "/{$lead->id}/status", ['status' => 'won'])->assertUnauthorized();
    }

    public function test_user_without_permissions_gets_403(): void
    {
        $user = $this->tenantUser([]);
        $lead = $this->leadIn($user->workspace);

        $this->actingAs($user, 'sanctum');
        $this->getJson(self::URL)->assertForbidden();
        $this->getJson(self::URL . "/{$lead->id}")->assertForbidden();
        $this->postJson(self::URL, ['name' => 'x'])->assertForbidden();
        $this->putJson(self::URL . "/{$lead->id}", ['name' => 'x'])->assertForbidden();
        $this->patchJson(self::URL . "/{$lead->id}/status", ['status' => 'won'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$lead->id}")->assertForbidden();
    }

    public function test_view_only_user_cannot_change_leads(): void
    {
        $user = $this->tenantUser(['view_leads']);
        $lead = $this->leadIn($user->workspace);

        $this->actingAs($user, 'sanctum');
        $this->getJson(self::URL . "/{$lead->id}")->assertOk();
        $this->patchJson(self::URL . "/{$lead->id}/status", ['status' => 'won'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$lead->id}")->assertForbidden();
    }

    public function test_index_is_scoped_filterable_and_sortable(): void
    {
        $user = $this->tenantUser(['view_leads']);
        $this->leadIn($user->workspace, ['name' => 'Alice Lead', 'status' => 'new', 'score' => 10]);
        $this->leadIn($user->workspace, ['name' => 'Bob Lead', 'status' => 'won', 'score' => 90]);
        $this->leadIn(Workspace::factory()->create(), ['name' => 'Other Tenant']);
        $this->actingAs($user, 'sanctum');

        $this->getJson(self::URL)->assertOk()->assertJsonCount(2, 'data');
        $this->getJson(self::URL . '?status=won')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Bob Lead');
        $this->getJson(self::URL . '?search=alice')->assertJsonCount(1, 'data');
        $this->getJson(self::URL . '?sort=-score')->assertJsonPath('data.0.name', 'Bob Lead');
        $this->getJson(self::URL . '?sort=password')->assertOk(); // unknown sort columns are ignored
    }

    public function test_mine_filter_limits_to_leads_created_by_the_caller(): void
    {
        $user = $this->tenantUser(['view_leads', 'create_leads']);
        $this->leadIn($user->workspace);
        $this->actingAs($user, 'sanctum')->postJson(self::URL, ['name' => 'Mine'])->assertCreated();

        $this->getJson(self::URL . '?mine=1')->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Mine');
    }

    public function test_other_workspace_leads_are_invisible(): void
    {
        $foreign = $this->leadIn(Workspace::factory()->create());

        $this->assertTenantIsolated(self::URL, $foreign->id, self::ALL, ['name' => 'Hijacked']);
        $intruder = $this->tenantUser(['edit_leads']);
        $this->actingAs($intruder, 'sanctum')->patchJson(self::URL . "/{$foreign->id}/status", ['status' => 'won'])->assertNotFound();
        $this->assertDatabaseHas('leads', ['id' => $foreign->id, 'name' => $foreign->name, 'status' => $foreign->status]);
    }

    public function test_create_sets_server_side_fields_and_computes_score(): void
    {
        $user = $this->tenantUser(['create_leads']);
        $other = Workspace::factory()->create();

        $data = $this->actingAs($user, 'sanctum')->postJson(self::URL, [
            'name' => 'Jane', 'email' => 'jane@example.com', 'phone' => '555', 'source' => 'referral',
            'tags' => ['vip', 'demo'], 'deal_value' => 5000,
            // None of these may be accepted from the client:
            'workspace_id' => $other->id, 'user_id' => 999, 'score' => 100, 'qualification' => 'Hot',
        ])->assertCreated()->json('data');

        $lead = Lead::find($data['id']);
        $this->assertSame($user->workspace_id, $lead->workspace_id);
        $this->assertSame($user->id, $lead->user_id);
        $this->assertSame(60, $lead->score); // email 20 + phone 20 + referral 20
        $this->assertSame('Warm', $lead->qualification);
        $this->assertSame('new', $lead->status);
        $this->assertSame(['vip', 'demo'], $data['tags']);
    }

    public function test_validation_rejects_bad_enums_and_cross_workspace_references(): void
    {
        $user = $this->tenantUser(['create_leads']);
        $foreignCompany = Company::factory()->create(['workspace_id' => Workspace::factory()->create()->id]);
        $foreignContact = Contact::factory()->create(['workspace_id' => $foreignCompany->workspace_id, 'company_id' => $foreignCompany->id]);
        $foreignUser = User::factory()->create(['workspace_id' => $foreignCompany->workspace_id]);

        $this->actingAs($user, 'sanctum')->postJson(self::URL, [
            'name' => 'X', 'status' => 'bogus', 'source' => 'nope', 'priority' => 'urgent',
            'company_id' => $foreignCompany->id, 'contact_id' => $foreignContact->id, 'lead_owner' => $foreignUser->id,
            'tags' => 'not-an-array',
        ])->assertUnprocessable()->assertJsonValidationErrors(
            ['status', 'source', 'priority', 'company_id', 'contact_id', 'lead_owner', 'tags']
        );
    }

    public function test_company_name_is_copied_from_linked_company(): void
    {
        $user = $this->tenantUser(['create_leads']);
        $company = Company::factory()->create(['workspace_id' => $user->workspace_id, 'name' => 'Acme Ltd']);

        $this->actingAs($user, 'sanctum')->postJson(self::URL, ['name' => 'L', 'company_id' => $company->id])
            ->assertCreated()
            ->assertJsonPath('data.company_name', 'Acme Ltd')
            ->assertJsonPath('data.linked_company.name', 'Acme Ltd');
    }

    public function test_update_is_partial_and_recomputes_score(): void
    {
        $user = $this->tenantUser(['edit_leads']);
        $lead = $this->leadIn($user->workspace, ['email' => null, 'phone' => null, 'notes' => '', 'source' => 'website', 'score' => 0]);

        $this->actingAs($user, 'sanctum')->putJson(self::URL . "/{$lead->id}", ['email' => 'a@example.com', 'workspace_id' => 999])
            ->assertOk()->assertJsonPath('data.name', $lead->name)->assertJsonPath('data.score', 20);

        $this->assertSame($user->workspace_id, $lead->fresh()->workspace_id);
    }

    public function test_status_endpoint_moves_a_lead_and_validates_the_status(): void
    {
        $user = $this->tenantUser(['edit_leads']);
        $lead = $this->leadIn($user->workspace, ['status' => 'new']);

        $this->actingAs($user, 'sanctum');
        $this->patchJson(self::URL . "/{$lead->id}/status", ['status' => 'bogus'])->assertUnprocessable();
        $this->patchJson(self::URL . "/{$lead->id}/status", ['status' => 'won'])
            ->assertOk()->assertJsonPath('data.status', 'won');
        $this->assertSame('won', $lead->fresh()->status);
    }

    public function test_delete(): void
    {
        $user = $this->tenantUser(['delete_leads']);
        $lead = $this->leadIn($user->workspace);

        $this->actingAs($user, 'sanctum')->deleteJson(self::URL . "/{$lead->id}")->assertNoContent();
        $this->assertDatabaseMissing('leads', ['id' => $lead->id]);
    }
}
