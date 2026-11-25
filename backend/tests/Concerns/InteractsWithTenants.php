<?php

namespace Tests\Concerns;

use App\Models\User;
use App\Models\Workspace;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * Helpers for multi-tenant API tests. Use assertTenantIsolated() and
 * assertRequiresPermissions() for every new API resource so a missing
 * policy or scope is caught immediately.
 */
trait InteractsWithTenants
{
    protected function tenantUser(array $permissions = [], ?Workspace $workspace = null): User
    {
        $workspace ??= Workspace::factory()->create();
        $user = User::factory()->create(['workspace_id' => $workspace->id]);

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $user->givePermissionTo($permissions);

        return $user;
    }

    /**
     * A user from ANOTHER workspace holding every given permission must get 404
     * (not 403/200) for a record owned by a different tenant.
     */
    protected function assertTenantIsolated(string $baseUrl, int $foreignId, array $permissions, array $updatePayload = []): void
    {
        $intruder = $this->tenantUser($permissions);

        $this->actingAs($intruder, 'sanctum')->getJson("$baseUrl/$foreignId")->assertNotFound();
        $this->actingAs($intruder, 'sanctum')->putJson("$baseUrl/$foreignId", $updatePayload)->assertNotFound();
        $this->actingAs($intruder, 'sanctum')->deleteJson("$baseUrl/$foreignId")->assertNotFound();
    }

    /** Every endpoint: 401 when guest, 403 when authenticated without the permission. */
    protected function assertRequiresPermissions(string $baseUrl, int $recordId, array $payload = []): void
    {
        $this->getJson($baseUrl)->assertUnauthorized();
        $this->getJson("$baseUrl/$recordId")->assertUnauthorized();
        $this->postJson($baseUrl, $payload)->assertUnauthorized();
        $this->putJson("$baseUrl/$recordId", $payload)->assertUnauthorized();
        $this->deleteJson("$baseUrl/$recordId")->assertUnauthorized();
    }
}
