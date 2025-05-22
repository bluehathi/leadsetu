# LeadSetu

LeadSetu is a modern web application for managing sales leads and organizational data, built with Laravel (PHP) and React (Inertia.js). It provides a user-friendly interface for tracking, adding, and managing leads, users, organizations, and more, with authentication and role-based access.

## Features
- User authentication (login/logout)
- Dashboard with lead statistics
- Add, view, edit, and delete leads
- Lead fields: name, email, phone, company, website, notes, status, source
- Status and source options configurable
- Pagination and search for leads
- **Activity Logs**: Track user actions with filters for user, action, entity, and date
- **Organizations**: Manage organizations and their settings
- **Roles & Permissions**: Role-based access control using Spatie Laravel Permission
- User profile management (update info, change password)
- Responsive, modern UI (Tailwind CSS)
- Flash messages for actions (success/error)

## Tech Stack
- **Backend:** Laravel 12+ (PHP 8.2+), Spatie Laravel Permission, Inertia.js Laravel Adapter
- **Frontend:** React (with @inertiajs/react), Vite, Tailwind CSS
- **Icons:** Lucide React
- **Database:** MySQL, MariaDB, PostgreSQL, or SQLite (configurable)

## Getting Started

### Prerequisites
- PHP >= 8.2
- Composer
- Node.js & npm
- A supported database (MySQL, MariaDB, PostgreSQL, SQLite)

### Installation
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd leadsetu
   ```
2. **Install PHP dependencies:**
   ```sh
   composer install
   ```
3. **Install JS dependencies:**
   ```sh
   npm install
   ```
4. **Copy and configure environment:**
   ```sh
   cp .env.example .env
   # Edit .env for your DB and mail settings
   ```
5. **Generate app key:**
   ```sh
   php artisan key:generate
   ```
6. **Run migrations and seeders:**
   ```sh
   php artisan migrate --seed
   ```
7. **Build frontend assets:**
   ```sh
   npm run build
   # Or for development: npm run dev
   ```
8. **Start the server:**
   ```sh
   php artisan serve
   ```

Visit [http://localhost:8000](http://localhost:8000) in your browser.

## Usage
- Log in or register (if registration is enabled)
- Use the sidebar to navigate between Dashboard, Leads, Organizations, Users, Roles, Permissions, Activity Logs, and Profile
- Add, edit, or delete leads, users, organizations, roles, and permissions as needed
- Use search, filters, and pagination to manage large lists
- **Activity Logs:**
  - View a table of user/system actions
  - Filter logs by user, action, entity, or date
  - Inspect details of each log entry

## Database Structure
- `users`: Standard Laravel users table, with organization_id foreign key
- `leads`: Stores all lead information (see migration for fields)
- `organizations`: Organization info (name, description, timestamps)
- `activity_logs`: Tracks user actions (user_id, action, subject_type, subject_id, description, properties, timestamps)
- `roles`, `permissions`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`: For role-based access (Spatie)

## Development
- **Frontend:** Edit React components in `resources/js/`
  - Pages: `resources/js/Pages/`
  - Components: `resources/js/Components/`
  - Sidebar navigation: `resources/js/Components/parts/Sidebar.jsx`
  - Pagination: `resources/js/Components/Pagination.jsx`
  - Activity Logs: `resources/js/Pages/ActivityLogs/Index.jsx`
- **Backend:** Edit Laravel controllers/models in `app/`
  - Main controllers: `app/Http/Controllers/`
  - Activity logging: `app/Models/ActivityLog.php`, `app/Http/Controllers/UserController.php`
- **Migrations/Seeders:** See `database/migrations` and `database/seeders`
- **Routes:** See `routes/web.php` for main app routes

## License
MIT
