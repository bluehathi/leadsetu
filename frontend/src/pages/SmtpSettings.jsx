import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { smtpApi } from '../api/resource';
import { Button, Field, inputClass } from '../components/ui';
import { parseApiError } from '../lib/errors';

const EMPTY = { host: '', port: 587, username: '', password: '', encryption: 'tls', from_address: '', from_name: '' };

export default function SmtpSettings() {
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['smtp'], queryFn: smtpApi.get });
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });
    const [notice, setNotice] = useState(null); // { ok, text }

    useEffect(() => {
        if (data) setValues({ ...EMPTY, ...data, password: '' });
    }, [data]);

    const save = useMutation({ mutationFn: smtpApi.update, onSuccess: () => qc.invalidateQueries({ queryKey: ['smtp'] }) });
    const test = useMutation({ mutationFn: smtpApi.test });
    const set = (k) => (e) => setValues({ ...values, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setNotice(null);
        try {
            await save.mutateAsync({ ...values, port: Number(values.port) });
            setError({ fields: {} });
            setNotice({ ok: true, text: 'SMTP settings saved.' });
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const sendTest = async () => {
        setNotice(null);
        try {
            const res = await test.mutateAsync();
            setNotice({ ok: true, text: res.message });
        } catch (err) {
            setNotice({ ok: false, text: err.response?.data?.message ?? parseApiError(err).message });
        }
    };

    if (isLoading) return <p>Loading…</p>;

    return (
        <div className="max-w-lg space-y-6">
            <form onSubmit={submit} className="space-y-4">
                <h1 className="text-xl font-semibold">SMTP settings</h1>
                {notice && <p className={`text-sm ${notice.ok ? 'text-green-700' : 'text-red-600'}`}>{notice.text}</p>}
                {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                <Field label="Host" error={error.fields.host}>
                    <input className={inputClass} value={values.host} onChange={set('host')} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Port" error={error.fields.port}>
                        <select className={inputClass} value={values.port} onChange={set('port')}>
                            {[25, 465, 587, 2525].map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </Field>
                    <Field label="Encryption" error={error.fields.encryption}>
                        <select className={inputClass} value={values.encryption} onChange={set('encryption')}>
                            <option value="tls">TLS</option>
                            <option value="ssl">SSL</option>
                            <option value="none">None</option>
                        </select>
                    </Field>
                </div>
                <Field label="Username" error={error.fields.username}>
                    <input className={inputClass} value={values.username} onChange={set('username')} autoComplete="off" />
                </Field>
                <Field label={data?.has_password ? 'Password (leave blank to keep current)' : 'Password'} error={error.fields.password}>
                    <input className={inputClass} type="password" value={values.password} onChange={set('password')} autoComplete="new-password" />
                </Field>
                <Field label="From address" error={error.fields.from_address}>
                    <input className={inputClass} value={values.from_address} onChange={set('from_address')} />
                </Field>
                <Field label="From name" error={error.fields.from_name}>
                    <input className={inputClass} value={values.from_name} onChange={set('from_name')} />
                </Field>
                <div className="flex gap-2">
                    <Button type="submit" disabled={save.isPending}>Save</Button>
                    <Button type="button" variant="secondary" disabled={!data || test.isPending} onClick={sendTest}>Send test email to me</Button>
                </div>
            </form>

            {data?.webhook_url && (
                <div className="space-y-1 text-sm">
                    <div className="font-medium">Brevo webhook URL</div>
                    <p className="text-gray-600">Paste this into Brevo to track delivery, opens and bounces. It is unique to your workspace; keep it private.</p>
                    <input readOnly className={`${inputClass} font-mono text-xs`} value={data.webhook_url} onFocus={(e) => e.target.select()} />
                </div>
            )}
        </div>
    );
}
