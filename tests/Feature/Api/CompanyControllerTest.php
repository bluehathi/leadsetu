<?php

namespace Tests\Feature\Api;

use App\Models\Company;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_access_companies_index()
    {
        $response = $this->getJson('/api/companies');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_access_companies_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_companies');

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/companies');

        $response->assertStatus(200);
    }

    public function test_authenticated_user_can_create_company()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('create_companies');

        $companyData = [
            'name' => 'New Company',
        ];

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/companies', $companyData);

        $response->assertStatus(201)
            ->assertJsonFragment($companyData);
    }

    public function test_authenticated_user_can_view_company()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('view_companies');
        $company = Company::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->getJson("/api/companies/{$company->id}");

        $response->assertStatus(200)
            ->assertJsonFragment(['name' => $company->name]);
    }

    public function test_authenticated_user_can_update_company()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('edit_companies');
        $company = Company::factory()->create();

        $updatedCompanyData = [
            'name' => 'Updated Company',
        ];

        $response = $this->actingAs($user, 'sanctum')->putJson("/api/companies/{$company->id}", $updatedCompanyData);

        $response->assertStatus(200)
            ->assertJsonFragment($updatedCompanyData);
    }

    public function test_authenticated_user_can_delete_company()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('delete_companies');
        $company = Company::factory()->create();

        $response = $this->actingAs($user, 'sanctum')->deleteJson("/api/companies/{$company->id}");

        $response->assertStatus(204);
    }
}
