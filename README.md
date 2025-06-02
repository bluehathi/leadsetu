# LeadSetu

LeadSetu is a modern Laravel + Inertia.js (React) CRM platform for managing leads, contacts, companies, and prospect lists within workspaces.

## Features
- User authentication & workspace management
- Leads, Contacts, Companies CRUD
- Prospect Lists with bulk add/remove contacts
- Activity logs
- Role & permission management
- Responsive UI with Tailwind CSS
- Inertia.js SPA experience (React frontend)

## Setup

### Requirements
- PHP 8.1+
- Composer
- Node.js & npm
- MySQL or compatible database

### Installation
1. **Clone the repository:**
   ```sh
   git clone <your-repo-url> leadsetu
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
   ```
8. **Start the development server:**
   ```sh
   php artisan serve
   ```

## Development
- For hot reload: `npm run dev`
- For running tests: `php artisan test`

## Folder Structure
- `app/` - Laravel backend (models, controllers, services)
- `resources/js/` - React (Inertia) frontend pages/components
- `routes/web.php` - Web routes
- `database/migrations/` - DB schema

## Customization
- Add new features by creating new controllers and Inertia pages.
- Use policies for authorization.
- Tailwind CSS for UI customization.

## Contributing
Pull requests are welcome! Please open issues for bugs or feature requests.

## License
MIT
