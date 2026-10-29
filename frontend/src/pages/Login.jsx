import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { login } from '../api/auth';
import AuthShell from '../components/AuthShell';
import { Button, Field, inputClass } from '../components/ui';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await login(form);
            // Seed the cache so the route guard doesn't see a stale logged-out value.
            qc.setQueryData(['me'], res.data.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.errors?.email?.[0] ?? err.response?.data?.message ?? 'Login failed');
        }
    };

    return (
        <AuthShell title="Sign in" footer={<>No account? <Link className="text-blue-600 hover:underline" to="/register">Create one</Link></>}>
            {params.get('reset') && <p className="text-sm text-green-700">Password updated. Sign in with your new password.</p>}
            <form onSubmit={submit} className="space-y-4">
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Field label="Email"><input className={inputClass} type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Password"><input className={inputClass} type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
                <Button className="w-full">Sign in</Button>
                <Link className="block text-center text-sm text-blue-600 hover:underline" to="/forgot-password">Forgot your password?</Link>
            </form>
        </AuthShell>
    );
}
