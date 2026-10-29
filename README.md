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

## Migration status

The legacy Inertia UI still lives in `backend/resources/js` and is being migrated module by
module to `frontend/`. New modules are API-first and SPA-only. Once every module is migrated,
Inertia, Ziggy, the Blade shell and `routes/web.php` are removed from the backend.
