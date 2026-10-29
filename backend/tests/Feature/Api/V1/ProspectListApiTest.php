<?php

namespace Tests\Feature\Api\V1;

use App\Models\Company;
use App\Models\Contact;
use App\Models\ProspectList;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithTenants;
use Tests\TestCase;

class ProspectListApiTest extends TestCase
{
    use RefreshDatabase, InteractsWithTenants;

    private const URL = '/api/v1/prospect-lists';
    private const ALL = ['view_prospect_lists', 'create_prospect_lists', 'edit_prospect_lists', 'delete_prospect_lists'];

    private function listIn(Workspace $ws, string $name = 'Newsletter'): ProspectList
    {
        $owner = User::factory()->create(['workspace_id' => $ws->id]);
        $list = new ProspectList(['name' => $name]);
        $list->workspace_id = $ws->id;
        $list->user_id = $owner->id;
        $list->save();

        return $list;
    }

    private function contactIn(Workspace $ws): Contact
    {
        $company = Company::factory()->create(['workspace_id' => $ws->id]);

        return Contact::factory()->create(['workspace_id' => $ws->id, 'company_id' => $company->id]);
    }

    public function test_guests_are_rejected_on_every_endpoint(): void
    {
        $list = $this->listIn(Workspace::factory()->create());

        $this->assertRequiresPermissions(self::URL, $list->id);
        $this->getJson(self::URL . "/{$list->id}/contacts")->assertUnauthorized();
        $this->postJson(self::URL . "/{$list->id}/contacts", [])->assertUnauthorized();
    }

    public function test_user_without_permissions_gets_403(): void
    {
        $user = $this->tenantUser([]);
        $list = $this->listIn($user->workspace);

        $this->actingAs($user, 'sanctum');
        $this->getJson(self::URL)->assertForbidden();
        $this->postJson(self::URL, ['name' => 'x'])->assertForbidden();
        $this->putJson(self::URL . "/{$list->id}", ['name' => 'x'])->assertForbidden();
        $this->deleteJson(self::URL . "/{$list->id}")->assertForbidden();
        $this->getJson(self::URL . "/{$list->id}/contacts")->assertForbidden();
        $this->postJson(self::URL . "/{$list->id}/contacts", ['contact_ids' => [1]])->assertForbidden();
    }

    public function test_index_is_scoped_and_has_member_counts(): void
    {
        $user = $this->tenantUser(['view_prospect_lists']);
        $mine = $this->listIn($user->workspace, 'Mine');
        $mine->contacts()->attach($this->contactIn($user->workspace)->id);
        $this->listIn(Workspace::factory()->create(), 'Theirs');

        $this->actingAs($user, 'sanctum')->getJson(self::URL)->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.contacts_count', 1);
    }

    public function test_other_workspace_lists_are_invisible(): void
    {
        $foreign = $this->listIn(Workspace::factory()->create());

        $this->assertTenantIsolated(self::URL, $foreign->id, self::ALL, ['name' => 'Hijacked']);

        $intruder = $this->tenantUser(self::ALL);
        $contact = $this->contactIn($intruder->workspace);
        $this->actingAs($intruder, 'sanctum');
        $this->getJson(self::URL . "/{$foreign->id}/contacts")->assertNotFound();
        $this->postJson(self::URL . "/{$foreign->id}/contacts", ['contact_ids' => [$contact->id]])->assertNotFound();
        $this->deleteJson(self::URL . "/{$foreign->id}/contacts", ['contact_ids' => [$contact->id]])->assertNotFound();
        $this->assertSame(0, $foreign->contacts()->withoutGlobalScopes()->count());
    }

    public function test_create_uses_callers_workspace_and_names_are_unique_per_workspace(): void
    {
        $user = $this->tenantUser(['create_prospect_lists']);
        $other = Workspace::factory()->create();
        $this->listIn($other, 'Shared Name');
        $this->actingAs($user, 'sanctum');

        $id = $this->postJson(self::URL, ['name' => 'Shared Name', 'workspace_id' => $other->id, 'user_id' => 999])
            ->assertCreated()->json('data.id');
        $list = ProspectList::find($id);
        $this->assertSame($user->workspace_id, $list->workspace_id);
        $this->assertSame($user->id, $list->user_id);

        $this->postJson(self::URL, ['name' => 'Shared Name'])->assertUnprocessable()->assertJsonValidationErrors('name');
    }

    public function test_add_list_and_remove_contacts(): void
    {
        $user = $this->tenantUser(self::ALL);
        $list = $this->listIn($user->workspace);
        $a = $this->contactIn($user->workspace);
        $b = $this->contactIn($user->workspace);
        $this->actingAs($user, 'sanctum');

        $this->postJson(self::URL . "/{$list->id}/contacts", ['contact_ids' => [$a->id, $b->id]])
            ->assertOk()->assertJsonPath('data.contacts_count', 2);
        $this->postJson(self::URL . "/{$list->id}/contacts", ['contact_ids' => [$a->id]])
            ->assertOk()->assertJsonPath('data.contacts_count', 2); // idempotent

        $this->getJson(self::URL . "/{$list->id}/contacts")->assertOk()->assertJsonCount(2, 'data');
        $this->getJson(self::URL . "/{$list->id}/contacts?search=" . urlencode($a->name))->assertJsonCount(1, 'data');

        $this->deleteJson(self::URL . "/{$list->id}/contacts", ['contact_ids' => [$a->id]])
            ->assertOk()->assertJsonPath('data.contacts_count', 1);
    }

    public function test_cannot_add_contacts_from_another_workspace(): void
    {
        $user = $this->tenantUser(self::ALL);
        $list = $this->listIn($user->workspace);
        $foreignContact = $this->contactIn(Workspace::factory()->create());

        $this->actingAs($user, 'sanctum')->postJson(self::URL . "/{$list->id}/contacts", ['contact_ids' => [$foreignContact->id]])
            ->assertUnprocessable()->assertJsonValidationErrors('contact_ids.0');
        $this->assertSame(0, $list->contacts()->count());
    }

    public function test_update_and_delete(): void
    {
        $user = $this->tenantUser(self::ALL);
        $list = $this->listIn($user->workspace);
        $this->actingAs($user, 'sanctum');

        $this->putJson(self::URL . "/{$list->id}", ['name' => 'Renamed'])->assertOk()->assertJsonPath('data.name', 'Renamed');
        $this->deleteJson(self::URL . "/{$list->id}")->assertNoContent();
    }
}
