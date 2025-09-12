<?php

namespace Tests\Feature\Api;

use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_contacts_index()
    {
        $response = $this->getJson('/api/contacts');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_contacts_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_contacts');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/contacts');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_contact()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_contacts');

        $contactData = [
            'name' => 'New Contact',
            'email' => 'contact@example.com',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/contacts', $contactData);

        $response->assertStatus(201)
            ->assertJsonFragment($contactData);
    }

    public function test_authenticated_user_can_view_contact()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_contacts');
        $contact = Contact::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/contacts/{$contact->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $contact->name]);
    }

    public function test_authenticated_user_can_update_contact()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_contacts');
        $contact = Contact::factory()->create();

        $updatedContactData = [
            'name' => 'Updated Contact',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/contacts/{$contact->id}", $updatedContactData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedContactData);
    }

    public function test_authenticated_user_can_delete_contact()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_contacts');
        $contact = Contact::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/contacts/{$contact->id}");

        $response->assertStatus(204);
    }
}
