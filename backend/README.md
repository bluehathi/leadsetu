# LeadSetu

LeadSetu is a modern, workspace-based CRM and outreach platform for managing contacts, companies, prospect lists, and email campaigns. Built with Laravel, Inertia.js, and React, it is designed for multi-user teams, advanced filtering, and robust permission management. The architecture emphasizes clean code, reusability, and scalability for both web and API interfaces.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Authorization & Permissions](#authorization--permissions)
- [Validation & Form Requests](#validation--form-requests)
- [Domain Service Layer](#domain-service-layer)
- [Email & Queue](#email--queue)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **Contacts & Companies**: Manage contacts and their associated companies. Import via CSV.
- **Prospect Lists**: Organize contacts into multiple lists for targeted outreach.
- **Email Campaigns**: Create, schedule, and send campaigns to prospect lists using workspace-specific SMTP settings.
- **One-to-One Email**: Send and log individual emails to contacts, with full tracking and activity logging.
- **Activity Logging**: All major actions are logged for audit and reporting.
- **Multi-Workspace**: Each user belongs to a workspace; all data is scoped accordingly.
- **Advanced Filtering & Sorting**: Powerful search and sort for contacts, companies, and campaigns.
- **Modern UI**: Built with React, Tailwind CSS, and Inertia.js for a fast, SPA-like experience.
- **Role & Permission Management**: Fine-grained access control using roles and permissions.
- **Policy-Based Authorization**: All major models and controllers enforce Laravel policies for security.
- **Domain-Organized Form Requests**: All validation logic is handled by Form Request classes, organized by domain for clarity and maintainability.
- **Domain Service Layer**: All business logic is encapsulated in domain-based service classes, keeping controllers clean and enabling easy reuse for API controllers.

---

## Tech Stack
- **Backend**: Laravel 10+
- **Frontend**: React (with Inertia.js)
- **Database**: MySQL (or compatible)
- **Queue**: Laravel Queue (for scheduled/sent emails)
- **Mail**: SMTP (per workspace)

---

## Project Structure

```
app/
  Http/
    Controllers/         # Web and API controllers (thin, delegate to services)
    Requests/            # Form Requests, organized by domain (e.g., Company/StoreCompanyRequest.php)
  Models/                # Eloquent models
  Policies/              # Laravel policies for all major models
  Services/              # Domain-based service classes (business logic, reusable)
  ...
resources/
  js/                    # React components
  views/                 # Blade templates (if any)
routes/
  web.php                # Web routes
  api.php                # API routes
...
```

---

## Setup & Installation

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd leadsetu
   ```
2. **Install PHP dependencies**
   ```sh
   composer install
   ```
3. **Install JS dependencies**
   ```sh
   npm install
   ```
4. **Copy and edit environment files**
   ```sh
   cp .env.example .env
   # Edit .env for your DB, mail, etc.
   ```
5. **Generate app key**
   ```sh
   php artisan key:generate
   ```
6. **Run migrations and seeders**
   ```sh
   php artisan migrate --seed
   ```
7. **Build frontend assets**
   ```sh
   npm run build
   ```
8. **Start the development server**
   ```sh
   php artisan serve
   ```

---

## Authorization & Permissions
- **Policies**: All major models (ProspectList, Contact, Company, Lead, EmailCampaign, Workspace, ActivityLog, MailConfiguration, Role, Permission, Dashboard, Settings) have Laravel policies registered and enforced in their controllers via `$this->authorize()` calls.
- **Controller Enforcement**: All resource and custom controller actions use explicit policy-based authorization.
- **Permission Seeder**: Permissions are seeded and mapped to roles. Update `database/seeders/PermissionSeeder.php` to add or change permissions.
- **UI Enforcement**: The frontend uses the user's permissions (shared via Inertia) to show/hide actions and navigation.
- **Routes**: All admin routes are protected by both middleware and policy checks for defense-in-depth.

---

## Validation & Form Requests
- **Form Requests**: All validation logic is handled by Laravel Form Request classes.
- **Organization**: Form Requests are organized into domain-specific subfolders under `app/Http/Requests/` (e.g., `Company/StoreCompanyRequest.php`, `User/UpdateUserRequest.php`).
- **Controller Usage**: Controllers type-hint the appropriate Form Request for each action, ensuring consistent validation and authorization.
- **Cleanup**: Obsolete Form Request files outside their subfolders have been removed for clarity.

---

## Domain Service Layer
- **Service Classes**: All business logic for major domains (Company, Contact, Lead, ProspectList, EmailCampaign, Workspace, Role, Permission, SMTP, User, ActivityLog) is encapsulated in service classes under `app/Services/`.
- **Controller Simplicity**: Controllers delegate business logic and activity logging to these services, making them clean and focused on request/response.
- **API Ready**: This structure enables easy reuse of business logic for future API controllers and other entry points.
- **Activity Logging**: Use `ActivityLogService` for consistent, reusable activity logging across the application.

---

## Email & Queue
- Configure SMTP settings per workspace in the UI or via the database.
- For scheduled campaigns, ensure your queue worker is running:
  ```sh
  php artisan queue:work
  ```

---

## Testing
- Run backend tests:
  ```sh
  php artisan test
  ```
- Run frontend tests (if present):
  ```sh
  npm test
  ```

---

## Contributing
Pull requests are welcome! Please open issues for bugs or feature requests.

---

## License
MIT