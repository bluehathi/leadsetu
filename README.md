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
php artisan migrate --seed && php artisan serve   # --seed adds DEMO users (e.g. admin@example.com / 123456789): development only

php artisan queue:work                                # in another terminal: campaigns send in the background

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

In production do NOT run the full seeder (it creates demo users). Run only `php artisan db:seed --class=PermissionSeeder` and `--class=RoleSeeder`: sign-up assigns the shared "WorkSpace Owner" role.

## Status

The Inertia UI has been removed: the backend is API-only and every screen lives in `frontend/`.
Covered: sign-up / sign-in / password reset / email verification, dashboard, leads (list + board), contacts
(CSV/XLSX import, one-to-one email), companies, prospect lists, email campaigns (scheduling, unsubscribe,
delivery stats), users, roles, permissions, workspace, SMTP settings, activity log.

Not built yet: lead-to-contact conversion and the ERP modules (see the roadmap discussion: money/numbering/
accounting foundations, then sales, purchasing, inventory).
