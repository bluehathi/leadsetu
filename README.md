# LeadSetu CRM

A modern SaaS CRM built with Laravel (PHP) and React (Inertia.js).

## Features
- Leads management with advanced filtering, sorting, and user preferences
- User authentication, roles, and permissions
- Organization management (Add Organization button currently commented out)
- Dashboard with stats and charts
- User settings persisted in the database
- Modern UI/UX with Inertia.js and Tailwind CSS

## Setup

1. **Clone the repository**
2. **Install PHP dependencies**
   ```bash
   composer install
   ```
3. **Install JS dependencies**
   ```bash
   npm install
   ```
4. **Copy and configure your .env**
   ```bash
   cp .env.example .env
   # Edit .env for your DB and mail settings
   ```
5. **Generate app key**
   ```bash
   php artisan key:generate
   ```
6. **Run migrations and seeders**
   ```bash
   php artisan migrate:fresh --seed
   ```
7. **Start the dev servers**
   ```bash
   php artisan serve
   npm run dev
   ```

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
- Pest is **not** used due to version conflicts with current dependencies.

## Notes
- The "Add Organization" button is currently commented out in the UI for temporary reasons. To re-enable, uncomment it in `resources/js/Pages/Organizations/Index.jsx`.
- If you add new required fields to leads or organizations, update the factories and tests accordingly.
- User settings (such as visible columns) are persisted in the database and loaded on login.

## Troubleshooting
- If you see errors about missing factories, ensure your models use the `HasFactory` trait and you have the appropriate factory files in `database/factories/`.
- If you see validation errors in tests, make sure all required fields are provided in the test data.
- For Dusk, make sure ChromeDriver is installed and running.

## License
MIT
