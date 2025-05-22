# LeadSetu

LeadSetu is a modern web application for managing sales leads, built with Laravel (PHP) and React (Inertia.js). It provides a user-friendly interface for tracking, adding, and managing leads, with authentication and role-based access.

## Features
- User authentication (login/logout)
- Dashboard with lead statistics
- Add, view, edit, and delete leads
- Lead fields: name, email, phone, company, website, notes, status, source
- Status and source options configurable
- Pagination and search for leads
- Responsive, modern UI (Tailwind CSS)
- Flash messages for actions (success/error)

## Tech Stack
- **Backend:** Laravel (PHP)
- **Frontend:** React (Inertia.js)
- **Styling:** Tailwind CSS
- **Database:** MySQL, MariaDB, PostgreSQL, or SQLite (configurable)

## Getting Started

### Prerequisites
- PHP >= 8.1
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
- Use the sidebar to navigate between Dashboard and Leads
- Add, edit, or delete leads as needed
- Use search and pagination to manage large lead lists

## Database Structure
- `users`: Standard Laravel users table
- `leads`: Stores all lead information (see migration for fields)

## Development
- **Frontend:** Edit React components in `resources/js/`
- **Backend:** Edit Laravel controllers/models in `app/`
- **Migrations/Seeders:** See `database/migrations` and `database/seeders`

## License
MIT
