# LeadSetu API (backend)

Laravel JSON API for the LeadSetu CRM / small-business platform. The browser app lives in `../frontend`.

## Architecture

```
Request -> FormRequest (validate + authorize via policy) -> Controller (thin) -> Service -> Model -> API Resource
```

- **Tenancy:** every tenant-owned model uses `BelongsToWorkspace` (global scope that fails closed; `workspace_id` is
  assigned from the session, never from input). Queue jobs run inside `WorkspaceContext::run($workspaceId, ...)`.
- **Authorization:** one policy per model (`app/Policies`), applied to every controller action through
  `AppliesResourcePolicy`; custom actions authorize explicitly. Roles/permissions use spatie/laravel-permission:
  permissions are application-defined and read-only for tenants; roles are shared system roles (read-only) or
  workspace-owned custom roles. Nobody can grant a permission they do not hold.
- **API:** `routes/api.php`, versioned under `/api/v1`, Sanctum cookie authentication for the SPA.
- **Web routes** (`routes/web.php`) only serve the signed unsubscribe link and redirect to the app.

## Setup

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan db:seed --class=PermissionSeeder && php artisan db:seed --class=RoleSeeder   # required: sign-up assigns the "WorkSpace Owner" role
php artisan serve            # http://localhost:8000
php artisan queue:work       # campaigns are sent in the background
```

See the root README for the environment variables (`APP_URL`, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`, ...).

## Tests

```bash
php artisan test
```

Every API resource has tests for: guests (401), missing permission (403), cross-workspace access (404), and
server-controlled fields being ignored. New resources should use `Tests\Concerns\InteractsWithTenants`
(`assertTenantIsolated`, `assertRequiresPermissions`).

## Adding a module

1. Migration with `workspace_id`; model uses `BelongsToWorkspace`.
2. Policy (use `ChecksWorkspace`), registered automatically by name.
3. `Store*Request`/`Update*Request` that authorize through the policy and scope foreign keys to the workspace.
4. Service for the logic, API Resource for the JSON, controller `implements HasMiddleware` using `resourcePolicy()`.
5. Routes in the `/api/v1` business group; tests as above.
