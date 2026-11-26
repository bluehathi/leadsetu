import { Link } from 'react-router-dom';

const POINTS = ['Leads, quotes and invoices in one place', 'Email campaigns with open tracking', 'YouTube & Instagram growth studio'];

// Split-screen layout used by the public account screens.
export default function AuthShell({ title, children, footer }) {
    return (
        <div className="flex min-h-screen">
            <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-600 p-12 text-white lg:flex">
                <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
                <Link to="/" className="relative text-2xl font-bold tracking-tight">LeadSetu</Link>
                <div className="relative space-y-6">
                    <h2 className="text-4xl font-bold leading-tight">The bridge between<br />your leads and revenue.</h2>
                    <ul className="space-y-3 text-indigo-100">
                        {POINTS.map((p) => (
                            <li key={p} className="flex items-center gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>{p}
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-sm text-indigo-200">© {new Date().getFullYear()} LeadSetu</p>
            </div>
            <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-indigo-100/50">
                    <Link to="/" className="block text-lg font-bold text-indigo-700 lg:hidden">LeadSetu</Link>
                    <h1 className="text-2xl font-semibold">{title}</h1>
                    {children}
                    {footer && <div className="border-t pt-4 text-sm text-gray-600">{footer}</div>}
                </div>
            </div>
        </div>
    );
}
