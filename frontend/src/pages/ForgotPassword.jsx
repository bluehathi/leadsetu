import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import AuthShell from '../components/AuthShell';
import { Button, Field, inputClass } from '../components/ui';
import { parseApiError } from '../lib/errors';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [done, setDone] = useState(null);
    const [error, setError] = useState({ fields: {} });

    const submit = async (e) => {
        e.preventDefault();
        try {
            setDone((await forgotPassword(email)).message);
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    return (
        <AuthShell title="Reset your password" footer={<Link className="text-blue-600 hover:underline" to="/login">Back to sign in</Link>}>
            {done ? <p className="text-sm text-green-700">{done}</p> : (
                <form onSubmit={submit} className="space-y-4">
                    {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                    <Field label="Email" error={error.fields.email}><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                    <Button className="w-full">Send reset link</Button>
                </form>
            )}
        </AuthShell>
    );
}
