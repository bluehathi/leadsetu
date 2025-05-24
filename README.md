# LeadSetu SaaS Lead Management Platform

A modern SaaS lead management application built with Laravel (PHP) and React (Inertia.js).

## Features
- **Workspace-based Multi-Tenancy:**
  - All data is scoped to "workspaces" (formerly "organizations").
  - Users, leads, and permissions are managed per workspace.
- **Workspace Owner Functionality:**
  - New `workspace_owners` table links users to workspaces as owners.
  - Only users who are both listed as owners and have the `workspace_owner` permission can manage workspace settings.
  - All workspace settings routes and UI are protected accordingly.
- **Role & Permission Management:**
  - Uses Spatie Laravel Permission for roles/permissions.
  - UI and backend enforce access control everywhere.
- **Leads Management:**
  - Create, view, edit, and delete leads scoped to your workspace.
  - Lead fields: name, email, phone, company, website, notes, status, source, etc.
- **User Management:**
  - Invite, edit, and remove users from your workspace.
  - Assign roles and permissions per user.
- **Workspace Management:**
  - Create and manage workspaces.
  - Edit workspace name and description (no contact info fields).
- **Activity Logs:**
  - Track key actions (user created, lead created, etc.)
- **Modern React UI:**
  - Sidebar navigation with permission-aware links.
  - Responsive, dark mode support.
- **Authentication:**
  - Laravel Breeze/Jetstream style auth (login, register, password reset).

## Tech Stack
- **Backend:** Laravel 10+, Spatie Permission
- **Frontend:** React (via Inertia.js), Tailwind CSS
- **Database:** MySQL or PostgreSQL

## Setup & Development
1. Clone the repo and install dependencies:
   ```sh
   composer install
   npm install
   ```
2. Copy `.env.example` to `.env` and set your DB credentials.
3. Run migrations and seeders:
   ```sh
   php artisan migrate:fresh --seed
   ```
4. Start the dev servers:
   ```sh
   php artisan serve
   npm run dev
   ```
5. Access the app at `http://localhost:8000`.

## Workspace Model
- Only includes: `id`, `name`, `description`, timestamps.
- No contact info fields (email, phone, address, logo).

## Workspace Owners
- Table: `workspace_owners` (fields: `workspace_id`, `user_id`)
- Only users with an entry in this table and the `workspace_owner` permission can manage workspace settings.
- Seeder assigns a random user as owner for each workspace by default.

## Permissions & Roles
- All main entities (Leads, Users, Roles, Permissions, Workspaces) are protected by role/permission middleware.
- UI elements are shown/hidden based on user permissions.
- `workspace_owner` permission is required for workspace management.

## Testing
- **PHPUnit** is used for all feature and unit tests.
- Run all tests:
  ```bash
  ./vendor/bin/phpunit
  ```
- Dusk browser tests are available for end-to-end UI testing:
  ```bash
  php artisan dusk
  ```

## Troubleshooting
- If you see errors about missing factories, ensure your models use the `HasFactory` trait and you have the appropriate factory files in `database/factories/`.
- If you see validation errors in tests, make sure all required fields are provided in the test data.
- For Dusk, make sure ChromeDriver is installed and running.

## Contributing
PRs are welcome! Please follow PSR-12 and standard React best practices.

## License
MIT
