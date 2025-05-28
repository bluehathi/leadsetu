# LeadSetu SaaS Lead Management Platform

LeadSetu is a modern, multi-tenant SaaS platform for managing leads, companies, contacts, users, roles, and permissions. Built with Laravel, Inertia.js, and React, it features a beautiful, responsive UI, workspace-based multi-tenancy, and robust role/permission management with full activity logging.

## Recent Improvements
- **Modern UI/UX:** The entire application UI has been redesigned for a cleaner, more modern, and responsive experience. The sidebar, layouts, and all main pages use Tailwind CSS and Lucide icons for a consistent, professional look.
- **Comprehensive Activity Logs:** All major CRUD operations (create, update, delete) for Leads, Companies, Contacts, Users, Roles, Permissions, and Workspaces are now tracked in the Activity Logs section. Seeder actions are also logged.

## Features
- **Workspace-based Multi-Tenancy:**
  - All data is scoped to workspaces (formerly organizations).
  - Users, leads, contacts, companies, and permissions are managed per workspace.
- **Leads Management:**
  - Create, view, edit, and delete leads scoped to your workspace.
  - Kanban and list views for leads.
  - Lead fields: name, email, phone, company, website, notes, status, source, tags, etc.
- **Company Management:**
  - Manage companies per workspace.
  - Associate leads and contacts with companies.
- **Contact Management:**
  - Manage contacts per workspace.
  - Associate contacts with companies and leads.
- **User Management:**
  - Invite, edit, and remove users from your workspace.
  - Assign roles and permissions per user.
- **Role & Permission Management:**
  - Uses Spatie Laravel Permission for roles/permissions.
  - UI and backend enforce access control everywhere.
- **Workspace Owner Functionality:**
  - Only users who are workspace owners and have the `workspace_owner` permission can manage workspace settings.
- **Activity Logs:**
  - Track all key actions (user created, lead created, contact created, company created, etc.)
  - All activity logs are workspace-scoped and include workspace_id.
  - Activity logs are created for all main entity actions and seeders.
- **Authentication:**
  - Modern registration, login, and password reset flows.

## Tech Stack
- **Backend:** Laravel 10+, Spatie Permission
- **Frontend:** React (via Inertia.js), Tailwind CSS, Lucide React Icons
- **Database:** MySQL or PostgreSQL

## Getting Started

### Prerequisites
- PHP 8.1+
- Composer
- Node.js 18+
- MySQL or PostgreSQL

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/your-org/leadsetu.git
   cd leadsetu
   ```
2. Install PHP dependencies:
   ```sh
   composer install
   ```
3. Install JS dependencies:
   ```sh
   npm install
   ```
4. Copy and configure your environment:
   ```sh
   cp .env.example .env
   # Edit .env for your DB and mail settings
   php artisan key:generate
   ```
5. Run migrations and seeders:
   ```sh
   php artisan migrate --seed
   ```
6. Build frontend assets:
   ```sh
   npm run build
   ```
7. Start the development servers:
   ```sh
   php artisan serve
   npm run dev
   ```

### Default Login
- The seeder creates a default admin user. Check the database or seeder for credentials.

## Project Structure
- `resources/js/Layouts/AuthenticatedLayout.jsx` — Main app layout (sidebar, header, dropdown)
- `resources/js/Pages/Leads/` — Lead management (Kanban, List, Create, Edit, Show)
- `resources/js/Pages/Companies/` — Company management
- `resources/js/Pages/Contacts/` — Contact management
- `resources/js/Pages/Users/` — User management
- `resources/js/Pages/Roles/` — Role management
- `resources/js/Pages/Permissions/` — Permission management
- `resources/js/Pages/ActivityLogs/` — Activity log viewing and filtering
- `resources/js/Components/parts/Sidebar.jsx` — Sidebar navigation

## Customization
- Update branding, colors, and logo in `AuthenticatedLayout.jsx` and Tailwind config.
- Add or modify fields in migrations, models, and forms as needed.

## Testing
- **PHPUnit** for backend tests:
  ```sh
  ./vendor/bin/phpunit
  ```
- **Dusk** for browser tests:
  ```sh
  php artisan dusk
  ```

## Contributing
PRs are welcome! Please follow PSR-12 and standard React best practices.

## License
MIT
