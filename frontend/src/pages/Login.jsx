import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { login } from '../api/auth';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const qc = useQueryClient();

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await login(form);
            await qc.invalidateQueries({ queryKey: ['me'] });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.errors?.email?.[0] ?? 'Login failed');
        }
    };

    return (
        <form onSubmit={submit} className="mx-auto mt-24 max-w-sm space-y-4 p-6">
            <h1 className="text-xl font-semibold">Sign in</h1>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <input className="w-full rounded border p-2" type="email" placeholder="Email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="w-full rounded border p-2" type="password" placeholder="Password"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button className="w-full rounded bg-blue-600 p-2 text-white">Sign in</button>
        </form>
    );
}
