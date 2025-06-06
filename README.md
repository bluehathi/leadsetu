# LeadSetu

LeadSetu is a workspace-based CRM and outreach platform for managing contacts, companies, prospect lists, and email campaigns. It is built with Laravel, Inertia.js, and React, and supports multi-user workspaces, advanced filtering, and SMTP-based email sending.

## Features

- **Contacts & Companies**: Manage contacts and their associated companies. Import via CSV.
- **Prospect Lists**: Organize contacts into multiple lists for targeted outreach.
- **Email Campaigns**: Create, schedule, and send campaigns to prospect lists using workspace-specific SMTP settings.
- **One-to-One Email**: Send and log individual emails to contacts, with full tracking and activity logging.
- **Activity Logging**: All major actions are logged for audit and reporting.
- **Multi-Workspace**: Each user belongs to a workspace; all data is scoped accordingly.
- **Advanced Filtering & Sorting**: Powerful search and sort for contacts, companies, and campaigns.
- **Modern UI**: Built with React, Tailwind CSS, and Inertia.js for a fast, SPA-like experience.

## Tech Stack

- **Backend**: Laravel 10+
- **Frontend**: React (with Inertia.js)
- **Database**: MySQL (or compatible)
- **Queue**: Laravel Queue (for scheduled/sent emails)
- **Mail**: SMTP (per workspace)

## Setup

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

## Email & Queue
- Configure SMTP settings per workspace in the UI or via the database.
- For scheduled campaigns, ensure your queue worker is running:
  ```sh
  php artisan queue:work
  ```

## Testing
- Run backend tests:
  ```sh
  php artisan test
  ```
- Run frontend tests (if present):
  ```sh
  npm test
  ```

## Contributing
Pull requests are welcome! Please open issues for bugs or feature requests.

## License
MIT