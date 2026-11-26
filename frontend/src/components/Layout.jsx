import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout, resendVerification } from '../api/auth';
import { useMe } from '../hooks/useMe';

// Small stroke icons (24x24 paths) keyed by name.
const ICONS = {
    home: 'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
    target: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-5a4 4 0 100-8 4 4 0 000 8z',
    doc: 'M7 3h7l5 5v13H7V3zm7 0v5h5M10 13h6M10 17h6',
    receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6m-6 4h6',
    box: 'M3 7l9-4 9 4v10l-9 4-9-4V7zm9 4v10M3 7l9 4 9-4',
    building: 'M4 21V5l8-2v18M12 9h8v12M4 21h16M8 8h1m-1 4h1m-1 4h1',
    user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    mail: 'M3 6h18v12H3V6zm0 0l9 7 9-7',
    spark: 'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z',
    users: 'M9 11a4 4 0 100-8 4 4 0 000 8zm-7 10a7 7 0 0114 0m1-10a3 3 0 100-6m3 16a6 6 0 00-4-5.6',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
    key: 'M15 7a4 4 0 11-3.9 4.9L4 19v2h3v-2h2v-2h2l1.9-1.9A4 4 0 0115 7z',
    clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0-14v5l3 2',
    cog: 'M12 15a3 3 0 100-6 3 3 0 000 6zm8-3l-2 .6a6.9 6.9 0 01-.6 1.5l1 1.8-1.8 1.8-1.8-1a7 7 0 01-1.5.6L12 20l-2-.6a6.9 6.9 0 01-1.5-.6l-1.8 1-1.8-1.8 1-1.8a7 7 0 01-.6-1.5L4 12l.6-2a6.9 6.9 0 01.6-1.5l-1-1.8L6 4.9l1.8 1a7 7 0 011.5-.6L12 4l2 .6a6.9 6.9 0 011.5.6l1.8-1 1.8 1.8-1 1.8a7 7 0 01.6 1.5L20 12z',
    briefcase: 'M4 8h16v11H4V8zm5 0V5h6v3M4 13h16',
    server: 'M4 5h16v6H4V5zm0 8h16v6H4v-6zm3-5h.01M7 16h.01',
};

const SECTIONS = [
    { title: 'Overview', items: [
        { to: '/dashboard', label: 'Dashboard', permission: 'view_dashboard', icon: 'home' },
    ] },
    { title: 'Sales', items: [
        { to: '/leads', label: 'Leads', permission: 'view_leads', icon: 'target' },
        { to: '/quotes', label: 'Quotes', permission: 'view_quotes', icon: 'doc' },
        { to: '/invoices', label: 'Invoices', permission: 'view_invoices', icon: 'receipt' },
        { to: '/items', label: 'Items', permission: 'view_items', icon: 'box' },
    ] },
    { title: 'Audience', items: [
        { to: '/companies', label: 'Customers', permission: 'view_companies', icon: 'building' },
        { to: '/contacts', label: 'Contacts', permission: 'view_contacts', icon: 'user' },
        { to: '/prospect-lists', label: 'Prospect lists', permission: 'view_prospect_lists', icon: 'list' },
    ] },
    { title: 'Marketing', items: [
        { to: '/campaigns', label: 'Campaigns', permission: 'view_campaigns', icon: 'mail' },
        { to: '/social', label: 'Growth Studio', permission: 'view_social_accounts', icon: 'spark' },
    ] },
    { title: 'Administration', items: [
        { to: '/users', label: 'Users', permission: 'view_users', icon: 'users' },
        { to: '/roles', label: 'Roles', permission: 'view_roles', icon: 'shield' },
        { to: '/permissions', label: 'Permissions', permission: 'view_permissions', icon: 'key' },
        { to: '/activity-logs', label: 'Activity log', permission: 'view_activity_logs', icon: 'clock' },
        { to: '/business', label: 'Business & taxes', permission: 'manage_business_profile', icon: 'briefcase' },
        { to: '/workspace', label: 'Workspace', permission: 'view_workspaces', icon: 'cog' },
        { to: '/settings/smtp', label: 'SMTP settings', permission: 'manage_smtp_settings', icon: 'server' },
    ] },
];

const Icon = ({ name }) => (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d={ICONS[name]} />
    </svg>
);

const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

export default function Layout() {
    const { me, can } = useMe();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [menuOpen, setMenuOpen] = useState(false);

    const [resent, setResent] = useState(false);
    const resend = async () => {
        try { await resendVerification(); setResent(true); } catch { /* throttled: keep the button */ }
    };

    const signOut = async () => {
        await logout();
        qc.clear();
        navigate('/login');
    };

    const sections = SECTIONS
        .map((s) => ({ ...s, items: s.items.filter((n) => can(n.permission)) }))
        .filter((s) => s.items.length > 0);

    return (
        <div className="flex min-h-screen">
            {menuOpen && <div className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden" onClick={() => setMenuOpen(false)} />}
            <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 shrink-0 flex-col overflow-y-auto bg-slate-900 p-4 text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Link to="/" className="mb-6 flex items-center gap-2.5 px-2 pt-1">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg font-bold text-white shadow-lg shadow-indigo-900/40">L</span>
                    <span className="text-lg font-bold tracking-tight text-white">LeadSetu</span>
                </Link>
                <nav className="flex-1 space-y-5">
                    {sections.map((s) => (
                        <div key={s.title}>
                            <div className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.title}</div>
                            <div className="space-y-0.5">
                                {s.items.map((n) => (
                                    <NavLink key={n.to} to={n.to} onClick={() => setMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${isActive
                                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 font-medium text-white shadow-md shadow-indigo-950/40'
                                                : 'hover:bg-slate-800 hover:text-white'}`}>
                                        <Icon name={n.icon} />{n.label}
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>
            <div className="min-w-0 flex-1">
                {me && !me.email_verified && (
                    <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">
                        Please verify your email address ({me.email}).{' '}
                        {resent ? 'Verification email sent.' : <button className="font-medium underline" onClick={resend}>Resend email</button>}
                    </div>
                )}
                <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-4 py-3 text-sm backdrop-blur lg:px-6">
                    <div className="flex items-center gap-3">
                        <button className="rounded-lg p-1.5 hover:bg-gray-100 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">{me?.workspace?.name}</span>
                    </div>
                    <span className="flex items-center gap-3">
                        <Link to="/profile" className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-gray-100">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">{initials(me?.name)}</span>
                            <span className="hidden font-medium sm:inline">{me?.name}</span>
                        </Link>
                        <button onClick={signOut} className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-50">Sign out</button>
                    </span>
                </header>
                <main className="mx-auto max-w-7xl p-4 lg:p-8"><Outlet /></main>
            </div>
        </div>
    );
}
