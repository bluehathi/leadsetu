import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { register } from '../api/auth';
import AuthShell from '../components/AuthShell';
import { Button, Field, inputClass } from '../components/ui';
import { parseApiError } from '../lib/errors';

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [error, setError] = useState({ fields: {} });
    const navigate = useNavigate();
    const qc = useQueryClient();
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        try {
            const me = await register(form);
            qc.setQueryData(['me'], me);
            navigate('/');
        } catch (err) {
            setError(err.response?.status === 403 ? { fields: {}, message: 'Sign-up is currently closed.' } : parseApiError(err));
        }
    };

    return (
        <AuthShell title="Create your workspace" footer={<>Already registered? <Link className="text-blue-600 hover:underline" to="/login">Sign in</Link></>}>
            <form onSubmit={submit} className="space-y-4">
                {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                <Field label="Your name" error={error.fields.name}><input className={inputClass} value={form.name} onChange={set('name')} /></Field>
                <Field label="Email" error={error.fields.email}><input className={inputClass} type="email" autoComplete="username" value={form.email} onChange={set('email')} /></Field>
                <Field label="Password" error={error.fields.password}><input className={inputClass} type="password" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
                <p className="-mt-2 text-xs text-gray-500">At least 8 characters, with letters and numbers.</p>
                <Field label="Confirm password"><input className={inputClass} type="password" autoComplete="new-password" value={form.password_confirmation} onChange={set('password_confirmation')} /></Field>
                <Button className="w-full">Create account</Button>
            </form>
        </AuthShell>
    );
}
