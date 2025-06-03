
# LeadSetu

LeadSetu is a modern, full-featured CRM (Customer Relationship Management) platform built with Laravel (PHP) for the backend and Inertia.js + React for the frontend. It is designed for teams and organizations to manage leads, contacts, companies, and prospect lists efficiently within workspaces. The platform is highly extensible, supports role-based access control, and provides a beautiful, responsive UI using Tailwind CSS.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Configuration](#environment-configuration)
- [Database Migrations & Seeding](#database-migrations--seeding)
- [Running the Application](#running-the-application)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Customization & Extending](#customization--extending)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **User Authentication:** Secure login, registration, password reset, and email verification.
- **Workspace Management:** Multi-tenant support; users can belong to one or more workspaces.
- **Leads Management:** Create, view, update, delete, and filter leads. Assign owners, set status, and track progress.
- **Contacts Management:** Manage contacts, associate them with companies and prospect lists.
- **Companies Management:** CRUD for companies, with contact and lead associations.
- **Prospect Lists:** Create lists, bulk add/remove contacts, and manage list membership with ease.
- **Activity Logs:** Track user actions and changes for auditing and transparency.
- **Role & Permission Management:** Fine-grained access control using roles and permissions (spatie/laravel-permission).
- **Responsive UI:** Modern, mobile-friendly design using Tailwind CSS.
- **SPA Experience:** Inertia.js + React for fast, seamless navigation and interactivity.
- **Import/Export:** (Planned) Import contacts/companies from CSV/Excel; export data for reporting.
- **Email Integration:** (Planned) Send and log emails to leads/contacts directly from the platform.

---

## Tech Stack
- **Backend:** Laravel 10+ (PHP 8.1+)
- **Frontend:** React 18+ (with Inertia.js)
- **Styling:** Tailwind CSS
- **Database:** MySQL (or compatible)
- **Authorization:** spatie/laravel-permission
- **Build Tools:** Vite, npm
- **Testing:** PHPUnit, Laravel Dusk (for browser tests)

---

## Project Structure
```
leadsetu/
├── app/                # Laravel backend (models, controllers, services, policies)
├── bootstrap/          # Laravel bootstrap files
├── config/             # Application configuration
├── database/           # Migrations, seeders, factories
├── public/             # Public assets and entry point
├── resources/
│   ├── css/            # Tailwind and custom CSS
│   ├── js/             # React (Inertia) pages and components
│   └── views/          # Blade templates (minimal, mostly for Inertia root)
├── routes/             # Route definitions (web.php, api.php)
├── storage/            # Logs, cache, file uploads
├── tests/              # Unit and feature tests
├── vite.config.js      # Vite build config
├── tailwind.config.js  # Tailwind CSS config
├── package.json        # JS dependencies
├── composer.json       # PHP dependencies
└── README.md           # Project documentation
```

---

## Setup & Installation

### Prerequisites
- PHP 8.1 or higher
- Composer
- Node.js (18+) and npm
- MySQL or compatible database
- (Optional) Mail server for email features

### Installation Steps
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url> leadsetu
   cd leadsetu
   ```
2. **Install PHP dependencies:**
   ```sh
   composer install
   ```
3. **Install JavaScript dependencies:**
   ```sh
   npm install
   ```
4. **Copy and configure environment:**
   ```sh
   cp .env.example .env
   # Edit .env for your DB, mail, and app settings
   ```
5. **Generate application key:**
   ```sh
   php artisan key:generate
   ```
6. **Run database migrations and seeders:**
   ```sh
   php artisan migrate --seed
   ```
7. **Build frontend assets:**
   ```sh
   npm run build
   ```
8. **Start the development server:**
   ```sh
   php artisan serve
   ```

---

## Environment Configuration
- **Database:** Set `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` in `.env`.
- **Mail:** Configure `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` for email features.
- **App URL:** Set `APP_URL` to your local or production URL.
- **Other:** See `.env.example` for all options.

---

## Database Migrations & Seeding
- Migrations are in `database/migrations/` and define all tables (users, workspaces, leads, contacts, companies, prospect lists, etc).
- Seeders in `database/seeders/` provide demo data for development/testing.
- Factories in `database/factories/` help generate fake data for tests.

---

## Running the Application
- **Development:**
  - Start backend: `php artisan serve`
  - Start frontend (hot reload): `npm run dev`
- **Production:**
  - Build assets: `npm run build`
  - Use a web server (Nginx/Apache) pointing to `public/`

---

## Development Workflow
- **Frontend:** Edit React pages/components in `resources/js/Pages` and `resources/js/Components`.
- **Backend:** Edit controllers, models, and services in `app/`.
- **Routes:** Define web routes in `routes/web.php` (Inertia pages) and API routes in `routes/api.php`.
- **Policies:** Use Laravel policies for resource authorization.
- **Testing:**
  - Run all tests: `php artisan test`
  - Feature tests: `tests/Feature/`
  - Unit tests: `tests/Unit/`

---

## Customization & Extending
- **Add a new resource:**
  1. Create a model, migration, and controller in `app/`.
  2. Add routes in `routes/web.php`.
  3. Create Inertia React pages in `resources/js/Pages/`.
  4. Add policies for authorization if needed.
- **UI Customization:**
  - Edit Tailwind config in `tailwind.config.js`.
  - Add/modify components in `resources/js/Components/`.
- **Permissions:**
  - Use spatie/laravel-permission for roles and permissions.
  - Assign permissions to roles and users via the UI or tinker.

---

## Deployment
- Set `APP_ENV=production` and `APP_DEBUG=false` in `.env`.
- Use a production web server (Nginx/Apache) and point to `public/`.
- Set up a queue worker for queued jobs (emails, etc):
  ```sh
  php artisan queue:work
  ```
- Use a process manager (Supervisor, systemd) for queue workers.
- Set up SSL for secure access.

---

## Troubleshooting
- **Blank page or 500 error:** Check `storage/logs/laravel.log` for details.
- **Database errors:** Ensure `.env` DB settings are correct and migrations have run.
- **Asset issues:** Run `npm run build` or `npm run dev` and clear browser cache.
- **Permission errors:** Check roles/permissions in the UI or via tinker.
- **Mail not sending:** Verify mail settings in `.env` and check mail server logs.

---

## Contributing
- Fork the repository and create a feature branch.
- Write clear, descriptive commit messages.
- Add tests for new features or bug fixes.
- Submit a pull request with a detailed description.
- For major changes, open an issue first to discuss your proposal.

---

## License
MIT