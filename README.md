# LeadSetu

Monorepo with two independent applications:

| Folder | What | Stack |
|---|---|---|
| `backend/` | JSON API (multi-tenant business/ERP logic, policies, queues) | Laravel |
| `frontend/` | Single-page app that consumes the API | React, Vite, React Router, TanStack Query |

## Local development

```bash
# API  (http://localhost:8000)
cd backend && composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --seed && php artisan serve

# SPA  (http://localhost:5173, proxies /api and /sanctum to the API)
cd frontend && cp .env.example .env && npm install && npm run dev
```

See `backend/README.md` for backend details.

## Configuration notes (backend `.env`)

| Variable | Purpose |
|---|---|
| `APP_URL`, `FRONTEND_URL` | Public URLs of the API and the SPA; used in unsubscribe, verification and password-reset links |
| `SANCTUM_STATEFUL_DOMAINS` | SPA origin(s) allowed to use cookie login |
| `REGISTRATION_ENABLED` | Open sign-up (each sign-up creates a workspace); set `false` for invite-only |
| `REQUIRE_VERIFIED_EMAIL` | Block the API until the email address is verified |
| `BREVO_WEBHOOK_SECRET` | Legacy shared webhook secret (optional; each workspace gets its own webhook URL) |
| `QUEUE_CONNECTION` | Campaigns send in the background: run `php artisan queue:work` |

Run `php artisan db:seed --class=PermissionSeeder` and `--class=RoleSeeder` on a fresh install: sign-up assigns the shared "WorkSpace Owner" role.

## Migration status

The legacy Inertia UI still lives in `backend/resources/js` and is being migrated module by
module to `frontend/`. New modules are API-first and SPA-only. Once every module is migrated,
Inertia, Ziggy, the Blade shell and `routes/web.php` are removed from the backend.
