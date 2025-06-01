# LeadSetu CRM

## Overview
LeadSetu is a modular, modern CRM platform with robust contact management, lead management, workspace support, email/SaaS integration, and a React-based UI. The codebase is structured for maintainability, extensibility, and security.

---

## Key Features

- **Contact & Lead Management**: Create, edit, search, and organize contacts and leads with a modern UI. Supports company associations, notes, and activity logs.
- **Workspace Support**: Multi-tenant architecture. Each workspace has isolated contacts, leads, users, and email/SaaS settings. Workspace owners can manage members and settings.
- **Modular React/JSX Contacts Pages**: Contacts Index, Create, and Edit pages are broken down into reusable partials:
  - `FlashMessages`, `ValidationErrors`, `Toolbar`, `SearchInput`, `ContactGridCard`, `ContactListCard`, `ContactList`, `ContactFormFields` (see `resources/js/Pages/Contacts/partials/`).
- **View Mode Persistence**: Contacts list/grid view preference is persisted per user using `localStorage`.
- **Robust Email Sending**:
  - SMTP settings are dynamically loaded per workspace and used for all outgoing emails.
  - `mail.default` is set per request for correct workspace context.
  - Custom Message-ID is generated, stored without angle brackets, and never used as an email address.
- **Brevo Webhook Handling**:
  - Webhook endpoint verifies a secret token for security.
  - Incoming message-ids are normalized (angle brackets stripped) before DB lookup for reliable event matching.
  - All major Brevo events are handled: delivered, opened, click, hard/soft bounce, blocked, spam, unsubscribed.
  - Unsubscribed events can optionally update the associated Contact model.
- **Error Handling & Flash Messages**: All forms/pages use modular, consistent error and flash message display.
- **Best Practices**: All code follows modern Laravel and React best practices, with clear separation of concerns and robust validation.

---

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-org/leadsetu.git
   cd leadsetu
   ```
2. **Install PHP dependencies:**
   ```sh
   composer install
   ```
3. **Install Node.js dependencies:**
   ```sh
   npm install
   ```
4. **Copy and configure environment:**
   ```sh
   cp .env.example .env
   # Edit .env and set database, mail, and Brevo webhook settings
   ```
5. **Generate application key:**
   ```sh
   php artisan key:generate
   ```
6. **Run migrations:**
   ```sh
   php artisan migrate
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

## Usage

- Access the app at [http://localhost:8000](http://localhost:8000)
- Log in or register a new user.
- Create or join a workspace. Each workspace has its own contacts, leads, users, and settings.
- Manage contacts, leads, companies, and activity logs within your workspace.
- Configure SMTP and Brevo webhook settings per workspace for email features.

---

## File Structure Highlights

- **React/JSX Components**:
  - `resources/js/Pages/Contacts/index.jsx` (ContactsIndex)
  - `resources/js/Pages/Contacts/Create.jsx`
  - `resources/js/Pages/Contacts/Edit.jsx`
  - `resources/js/Pages/Contacts/partials/` (all partials)
- **Email & Webhook Logic**:
  - `app/Services/EmailDispatchService.php`: Handles email sending, SMTP config, and Message-ID logic.
  - `app/Http/Controllers/Api/BrevoWebhookController.php`: Handles secure webhook processing, event handling, and message-id normalization.
- **Lead & Workspace Models**:
  - `app/Models/Lead.php`, `app/Models/Workspace.php`, `app/Models/WorkspaceOwner.php`, `app/Models/Contact.php`, `app/Models/Company.php`, etc.
  - `database/migrations/` for all schema definitions.

---

## Security & Best Practices

- **SMTP**: Each workspace can have its own SMTP config. The system ensures the correct config is loaded and used for every outgoing email.
- **Message-ID**: Always stored and compared without angle brackets. Never used as an email address. Only set as a header when needed.
- **Webhook Security**: All Brevo webhook requests must include a secret token (see `config/services.php` under `brevo.webhook_secret`). Unauthorized requests are logged and rejected.
- **Event Matching**: Webhook handler strips angle brackets from incoming message-ids before DB lookup, ensuring reliable event matching regardless of Brevo formatting.
- **Validation**: All incoming webhook data is validated and sanitized.
- **Logging**: Significant events are logged for audit and debugging.
- **UI**: All error and flash message handling is modular and consistent.

---

## Extending & Customizing

- **Add New Contact or Lead Views**: Create new partials in `resources/js/Pages/Contacts/partials/` and import them into the main pages.
- **Add New Email Providers**: Implement a new service in `app/Services/`, following the pattern in `EmailDispatchService.php`.
- **Custom Webhook Logic**: Extend `BrevoWebhookController` to handle additional events or update related models as needed.
- **Workspace Customization**: Extend `Workspace` and related models/controllers for advanced multi-tenant features.

---

## Upgrading

- If upgrading from a previous version, update your `.env` and `config/services.php` for the new `brevo.webhook_secret`.
- Review all new partials and modular components for best practices.

---

## Questions & Support

For questions, open an issue or contact the maintainers.
