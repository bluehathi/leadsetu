# LeadSetu SaaS Lead Management Platform

LeadSetu is a modern, multi-tenant SaaS platform for managing leads, companies, contacts, users, roles, and permissions. Built with Laravel, Inertia.js, and React, it features a beautiful, responsive UI, workspace-based multi-tenancy, robust role/permission management, and comprehensive activity logging.

## Key Features
- **Workspace-based Multi-Tenancy:**
  - All data (leads, users, companies, contacts, permissions) is scoped to workspaces.
  - Workspace owners have special management privileges.
- **Leads Management:**
  - Create, view, edit, and delete leads scoped to your workspace.
  - Kanban and list views for leads.
  - Inline company/contact creation in lead forms (with AJAX, duplicate prevention, and activity logging).
  - Lead Owner field: dropdown of all workspace users, defaults to current user.
  - Dynamic contact dropdown: only shows contacts for the selected company.
  - Read-only fields in lead edit for company, contact, email, and phone.
- **Company & Contact Management:**
  - Manage companies and contacts per workspace.
  - Associate leads and contacts with companies.
  - Inline creation and validation for companies/contacts.
  - **Excel Import:** Bulk import companies and contacts from Excel (.xls/.xlsx) with support for name, company, websiteUrl, email, mobile, notes, and more. Each import always creates new records.
- **User Management:**
  - Invite, edit, and remove users from your workspace.
  - Assign roles and permissions per user.
  - **User Search/Filter:** Search users by name, email, or role from the Users page.
- **Role & Permission Management:**
  - Uses Spatie Laravel Permission for roles/permissions.
  - UI and backend enforce access control everywhere.
  - Permissions are typically code-defined, but custom permissions can be added.
- **Activity Logs:**
  - Track all key actions (user created, lead created, contact created, company created, etc.)
  - All activity logs are workspace-scoped and include workspace_id.
  - Activity logs are created for all main entity actions and seeders.
- **Authentication:**
  - Modern registration, login, and password reset flows.
- **Modern UI/UX:**
  - Responsive layouts, sidebar, and header using Tailwind CSS and Lucide icons.
  - All main pages use a unified AuthenticatedLayout.

## Tech Stack
- **Backend:** Laravel 10+, Spatie Permission, maatwebsite/excel
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
- `resources/js/Pages/Companies/` — Company management (with search, website links)
- `resources/js/Pages/Contacts/` — Contact management (with company website, Excel import)
- `resources/js/Pages/Users/` — User management (with search/filter)
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
