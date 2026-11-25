<?php

namespace Tests\Feature\Api\V1;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class ContactApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const URL = '/api/v1/contacts';
    private const ALL = ['view_contacts', 'create_contacts', 'edit_contacts', 'delete_contacts'];

    private function contactIn(Workspace $workspace, array $attrs = []): Contact
    {
        $company = Company::factory()->create(['workspace_id' => $workspace->id]);

        return Contact::factory()->create($attrs + ['workspace_id' => $workspace->id, 'company_id' => $company->id]);
    }

    public function test_guests_are_rejected_on_every_endpoint(): void
    {
        $contact = $this->contactIn(Workspace::factory()->create());

        $this->assertRequiresPermissions(self::URL, $contact->id);
    }

    public function test_user_without_permissions_gets_403(): void
    {
        $user = $this->tenantUser([]);
        $contact = $this->contactIn($user->workspace);

        $this->actingAs($user, 'sanctum');
        $this->getJson(self::URL)->assertForbidden();
        $this->getJson(self::URL . "/{$contact->id}")->assertForbidden();
        $this->postJson(self::URL, [])->assertForbidden();
        $this->putJson(self::URL . "/{$contact->id}", ['name' => 'x'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$contact->id}")->assertForbidden();
    }

    public function test_permissions_are_checked_per_action(): void
    {
        $user = $this->tenantUser(['view_contacts']);
        $contact = $this->contactIn($user->workspace);

        $this->actingAs($user, 'sanctum');
        $this->getJson(self::URL . "/{$contact->id}")->assertOk();
        $this->deleteJson(self::URL . "/{$contact->id}")->assertForbidden();
    }

    public function test_index_only_lists_own_workspace_contacts(): void
    {
        $user = $this->tenantUser(['view_contacts']);
        $mine = $this->contactIn($user->workspace);
        $this->contactIn(Workspace::factory()->create());

        $this->actingAs($user, 'sanctum')->getJson(self::URL)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
    }

    public function test_search_and_pagination(): void
    {
        $user = $this->tenantUser(['view_contacts']);
        $this->contactIn($user->workspace, ['name' => 'Alice Alpha']);
        $this->contactIn($user->workspace, ['name' => 'Bob Beta']);

        $this->actingAs($user, 'sanctum')->getJson(self::URL . '?search=alice&per_page=5')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.per_page', 5);
    }

    public function test_other_workspace_records_are_invisible(): void
    {
        $foreign = $this->contactIn(Workspace::factory()->create());

        $this->assertTenantIsolated(self::URL, $foreign->id, self::ALL, ['name' => 'Hijacked']);
        $this->assertDatabaseHas('contacts', ['id' => $foreign->id, 'name' => $foreign->name]);
    }

    public function test_create_ignores_workspace_id_from_input_and_uses_callers_workspace(): void
    {
        $user = $this->tenantUser(['create_contacts']);
        $other = Workspace::factory()->create();
        $company = Company::factory()->create(['workspace_id' => $user->workspace_id]);

        $response = $this->actingAs($user, 'sanctum')->postJson(self::URL, [
            'name' => 'New Contact',
            'email' => 'new@example.com',
            'company_id' => $company->id,
            'workspace_id' => $other->id,
        ])->assertCreated()->assertJsonPath('data.name', 'New Contact');

        $this->assertDatabaseHas('contacts', ['id' => $response->json('data.id'), 'workspace_id' => $user->workspace_id]);
    }

    public function test_cannot_attach_a_company_from_another_workspace(): void
    {
        $user = $this->tenantUser(['create_contacts']);
        $foreignCompany = Company::factory()->create(['workspace_id' => Workspace::factory()->create()->id]);

        $this->actingAs($user, 'sanctum')->postJson(self::URL, [
            'name' => 'X', 'company_id' => $foreignCompany->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('company_id');
    }

    public function test_user_can_update_and_delete_own_contact(): void
    {
        $user = $this->tenantUser(self::ALL);
        $contact = $this->contactIn($user->workspace);

        $this->actingAs($user, 'sanctum');
        $this->putJson(self::URL . "/{$contact->id}", ['name' => 'Renamed'])
            ->assertOk()->assertJsonPath('data.name', 'Renamed');
        $this->deleteJson(self::URL . "/{$contact->id}")->assertNoContent();
        $this->assertDatabaseMissing('contacts', ['id' => $contact->id]);
    }

    public function test_user_without_workspace_sees_nothing(): void
    {
        $this->contactIn(Workspace::factory()->create());
        $user = $this->tenantUser(['view_contacts']);
        $user->forceFill(['workspace_id' => null])->save();

        $this->actingAs($user->fresh(), 'sanctum')->getJson(self::URL)->assertForbidden();
        $this->assertSame(0, Contact::query()->count());
    }
}
