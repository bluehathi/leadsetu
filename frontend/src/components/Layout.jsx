import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { logout } from '../api/auth';
import { useMe } from '../hooks/useMe';

const NAV = [
    { to: '/companies', label: 'Companies', permission: 'view_companies' },
    { to: '/contacts', label: 'Contacts', permission: 'view_contacts' },
    { to: '/users', label: 'Users', permission: 'view_users' },
    { to: '/roles', label: 'Roles', permission: 'view_roles' },
    { to: '/permissions', label: 'Permissions', permission: 'view_permissions' },
    { to: '/workspace', label: 'Workspace', permission: 'view_workspaces' },
    { to: '/settings/smtp', label: 'SMTP settings', permission: 'manage_smtp_settings' },
];

export default function Layout() {
    const { me, can } = useMe();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const signOut = async () => {
        await logout();
        qc.clear();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen bg-gray-50 text-gray-900">
            <aside className="w-56 shrink-0 border-r bg-white p-4">
                <div className="mb-6 text-lg font-bold">LeadSetu</div>
                <nav className="space-y-1">
                    {NAV.filter((n) => can(n.permission)).map((n) => (
                        <NavLink key={n.to} to={n.to}
                            className={({ isActive }) =>
                                `block rounded px-3 py-2 text-sm ${isActive ? 'bg-blue-50 font-medium text-blue-700' : 'hover:bg-gray-100'}`}>
                            {n.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <div className="flex-1">
                <header className="flex items-center justify-between border-b bg-white px-6 py-3 text-sm">
                    <span>{me?.workspace?.name}</span>
                    <span className="flex items-center gap-4">
                        {me?.name}
                        <button onClick={signOut} className="text-blue-600 hover:underline">Sign out</button>
                    </span>
                </header>
                <main className="p-6"><Outlet /></main>
            </div>
        </div>
    );
}
