import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import AuthShell from '../components/AuthShell';
import { Button, Field, inputClass } from '../components/ui';
import { parseApiError } from '../lib/errors';

export default function ResetPassword() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ password: '', password_confirmation: '' });
    const [error, setError] = useState({ fields: {} });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await resetPassword({ ...form, token: params.get('token'), email: params.get('email') });
            navigate('/login?reset=1');
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    if (!params.get('token')) {
        return <AuthShell title="Reset your password"><p className="text-sm text-red-600">This reset link is incomplete. <Link className="underline" to="/forgot-password">Request a new one.</Link></p></AuthShell>;
    }

    return (
        <AuthShell title="Choose a new password">
            <form onSubmit={submit} className="space-y-4">
                {error.fields.email && <p className="text-sm text-red-600">{error.fields.email} <Link className="underline" to="/forgot-password">Request a new link.</Link></p>}
                <Field label="New password" error={error.fields.password}><input className={inputClass} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
                <Field label="Confirm password"><input className={inputClass} type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} /></Field>
                <Button className="w-full">Reset password</Button>
            </form>
        </AuthShell>
    );
}
