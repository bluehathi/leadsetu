# LeadSetu

A modern SaaS application for managing organizations, leads, and sales activities. Built with **Laravel** (PHP) and **React** (Inertia.js), LeadSetu offers a beautiful, user-friendly interface and powerful features for sales teams and organizations.

---

## 🚀 Features

- **Modern Dashboard** with real statistics and charts
- **Organizations** management
- **Leads**
  - Add, edit, and view leads with full-width, visually consistent forms
  - Lead scoring and automatic qualification (Hot/Warm/Cold)
  - Enhanced lead detail page with activity timeline (all actions, color-coded, icons)
  - Sort, filter, and search leads by score, qualification, and more
- **Activity Logs**
  - System-wide and per-lead activity feed
  - Modern filters and timeline UI
- **Roles & Permissions** for access control
- **User Management**
- **Settings**
  - Organization, billing, team, integrations, user preferences, security
- **Responsive, modern UI**
  - Sidebar with logical grouping, collapsible, and logo switching
  - Consistent design across all forms and pages

---

## 🛠️ Setup & Installation

1. **Clone the repository**
2. **Install dependencies**
   - Backend: `composer install`
   - Frontend: `npm install`
3. **Copy and configure your environment**
   - `cp .env.example .env`
   - Set up your database and other environment variables
4. **Run migrations and seeders**
   - `php artisan migrate --seed`
   - This will seed demo users, organizations, leads, and activity logs
5. **Build assets**
   - `npm run dev` (for development)
   - `npm run build` (for production)
6. **Start the server**
   - `php artisan serve`

---

## 📝 Usage Notes

- **Leads**: Add and edit leads with a modern, full-width form. All fields are validated. Lead scoring and qualification are automatic.
- **Lead Detail**: View all lead info and a chronological, color-coded activity timeline with icons for each action.
- **Add/Edit Lead**: Both forms are visually consistent, use Lucide icons, and are easy to use on all devices.
- **Activity Logs**: Filter by user, action, entity, and date. See all actions in a modern timeline.
- **Settings**: Manage your organization, team, billing, integrations, and more.

---

## 💡 Customization & Extensibility

- Add more lead fields (job title, tags, value, etc.) as needed
- Integrate with external CRMs, email, or analytics tools
- Extend activity logging for more granular tracking
- Add custom roles, permissions, or notification systems

---

## 🤝 Contributing

Pull requests and suggestions are welcome! Please open an issue or PR for any improvements or bug fixes.

---

## 📄 License

MIT
