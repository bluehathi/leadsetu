import { Link } from 'react-router-dom';

// Centered card used by the public account screens.
export default function AuthShell({ title, children, footer }) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm space-y-4 rounded border bg-white p-6">
                <Link to="/" className="block text-lg font-bold">LeadSetu</Link>
                <h1 className="text-xl font-semibold">{title}</h1>
                {children}
                {footer && <div className="border-t pt-3 text-sm text-gray-600">{footer}</div>}
            </div>
        </div>
    );
}
