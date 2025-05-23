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

## Authentication & Registration
- Users can register via `/register` (modern React UI).
- Upon registration, a new workspace is automatically created for the user. The user is assigned as the owner and linked to the workspace via `workspace_id`.
- Registration form requires name, email, password, and password confirmation.
- After registration, the user is logged in and redirected to their dashboard.

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

## Company Management
- Companies are managed per workspace.
- Each company has: name, description, website, workspace_id.
- Companies can be created, edited, and deleted from the Companies section (admin only).
- Companies will be used for associating leads in the future.
- Includes model, migration, factory, seeder, controller, and React CRUD UI.

## Contacts & Companies Relationship
- Each contact can be linked to exactly one company (one-to-one).
- Each company can have at most one contact associated.
- The contact creation and edit forms allow selecting a company from the list.
- Backend enforces uniqueness of company_id in contacts.
- Companies are managed per workspace and can be created/edited from the Companies section.

## Contacts Management
- Create, view, edit, and delete contacts.
- Each contact can be assigned to a company (unique per company).
- UI and backend enforce the one-to-one company-contact relationship.

## Lead Creation: Inline Company & Contact
- The lead creation form supports both selecting an existing company/contact or adding a new one inline.
- If you choose "Add New Company" or "Add New Contact" in the lead form, the backend will automatically create the company/contact and associate them with the new lead.
- The backend logic ensures:
  - If `company_id` is not provided but `company_name` is, a new company is created and linked to the lead.
  - If `contact_id` is not provided but `contact_name` is, a new contact is created (and linked to the company if available) and associated with the lead.
  - All relationships are workspace-scoped.
- The lead form supports all main lead fields, and tags can be entered as a comma-separated list.

## Database Schema Updates
- The `leads` table now includes `company_id` and `contact_id` (nullable, foreign keys).
- These fields are used to associate leads with companies and contacts, whether selected or created inline.

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
