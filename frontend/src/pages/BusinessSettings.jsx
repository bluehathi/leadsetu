import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { businessApi, taxRatesApi } from '../api/resource';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { statesFor } from '../lib/india';
import { parseApiError } from '../lib/errors';

const EMPTY = {
    legal_name: '', country: 'IN', address_line1: '', address_line2: '', city: '', state_code: '', postal_code: '', tax_id: '',
    email: '', phone: '', fy_start_month: '', invoice_prefix: 'INV', quote_prefix: 'QT', default_due_days: 15, default_terms: '',
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function TaxRates({ canManage }) {
    const qc = useQueryClient();
    const rates = useQuery({ queryKey: ['tax-rates'], queryFn: () => taxRatesApi.list() });
    const [editing, setEditing] = useState(null);
    const [values, setValues] = useState({ name: '', rate: '' });
    const [error, setError] = useState({ fields: {} });
    const save = useMutation({
        mutationFn: ({ id, v }) => (id ? taxRatesApi.update(id, v) : taxRatesApi.create(v)),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['tax-rates'] }),
    });
    const remove = useMutation({ mutationFn: taxRatesApi.remove, onSuccess: () => qc.invalidateQueries({ queryKey: ['tax-rates'] }) });

    const open = (r) => { setValues(r ? { name: r.name, rate: String(r.rate), is_default: r.is_default } : { name: '', rate: '' }); setError({ fields: {} }); setEditing(r ?? {}); };
    const submit = async (e) => {
        e.preventDefault();
        try { await save.mutateAsync({ id: editing.id, v: { ...values, rate: Number(values.rate) } }); setEditing(null); } catch (err) { setError(parseApiError(err)); }
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Tax rates</h2>{canManage && <Button onClick={() => open(null)}>Add rate</Button>}</div>
            <div className="rounded border bg-white">
                {rates.data?.data?.map((r) => (
                    <div key={r.id} className="flex items-center justify-between border-b px-4 py-2 text-sm last:border-0">
                        <span>{r.name} <span className="text-gray-500">({r.rate}%)</span>{r.is_default && <span className="ml-2 rounded bg-blue-100 px-1.5 text-xs text-blue-700">default</span>}</span>
                        {canManage && <span className="space-x-3"><button className="text-blue-600 hover:underline" onClick={() => open(r)}>Edit</button>
                            <Button variant="danger" onClick={() => window.confirm(`Delete ${r.name}?`) && remove.mutate(r.id)}>Delete</Button></span>}
                    </div>
                ))}
                {rates.data?.data?.length === 0 && <p className="p-4 text-sm text-gray-500">No tax rates yet.</p>}
            </div>
            {editing && (
                <Modal title={editing.id ? 'Edit tax rate' : 'New tax rate'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="space-y-4">
                        <Field label="Name" error={error.fields.name}><input className={inputClass} placeholder="e.g. Sales tax (CA)" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></Field>
                        <Field label="Rate (%)" error={error.fields.rate}><input className={inputClass} inputMode="decimal" value={values.rate} onChange={(e) => setValues({ ...values, rate: e.target.value })} /></Field>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!values.is_default} onChange={(e) => setValues({ ...values, is_default: e.target.checked })} /> Default rate</label>
                        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save</Button></div>
                    </form>
                </Modal>
            )}
        </section>
    );
}

export default function BusinessSettings() {
    const { can } = useMe();
    const qc = useQueryClient();
    const profile = useQuery({ queryKey: ['business'], queryFn: businessApi.get });
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });
    const [saved, setSaved] = useState(false);
    const editable = can('manage_business_profile');

    useEffect(() => {
        if (profile.data) setValues({ ...EMPTY, ...Object.fromEntries(Object.entries(profile.data).map(([k, v]) => [k, v ?? ''])) });
    }, [profile.data]);

    const save = useMutation({ mutationFn: businessApi.update, onSuccess: () => qc.invalidateQueries({ queryKey: ['business'] }) });
    const set = (k) => (e) => setValues({ ...values, [k]: e.target.value });
    const india = values.country === 'IN';

    const submit = async (e) => {
        e.preventDefault();
        setSaved(false);
        const payload = { ...values, fy_start_month: values.fy_start_month || undefined, default_due_days: Number(values.default_due_days) };
        try { await save.mutateAsync(payload); setError({ fields: {} }); setSaved(true); await qc.invalidateQueries({ queryKey: ['tax-rates'] }); } catch (err) { setError(parseApiError(err)); }
    };

    if (profile.isLoading) return <p>Loading…</p>;

    return (
        <div className="max-w-2xl space-y-10">
            <form onSubmit={submit} className="space-y-4">
                <h1 className="text-xl font-semibold">Business profile</h1>
                {!profile.data && <p className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">Set up your business to start creating quotes and invoices.</p>}
                {saved && <p className="text-sm text-green-700">Saved.</p>}
                {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Legal / trade name" error={error.fields.legal_name}><input className={inputClass} disabled={!editable} value={values.legal_name} onChange={set('legal_name')} /></Field>
                    <Field label="Country" error={error.fields.country}>
                        <select className={inputClass} disabled={!editable} value={values.country} onChange={(e) => setValues({ ...values, country: e.target.value, state_code: '', tax_id: '' })}>
                            <option value="IN">India (GST, INR)</option><option value="US">United States (sales tax, USD)</option>
                        </select>
                    </Field>
                    <Field label="Address line 1" error={error.fields.address_line1}><input className={inputClass} disabled={!editable} value={values.address_line1} onChange={set('address_line1')} /></Field>
                    <Field label="Address line 2" error={error.fields.address_line2}><input className={inputClass} disabled={!editable} value={values.address_line2} onChange={set('address_line2')} /></Field>
                    <Field label="City" error={error.fields.city}><input className={inputClass} disabled={!editable} value={values.city} onChange={set('city')} /></Field>
                    <Field label={india ? 'State' : 'State'} error={error.fields.state_code}>
                        <select className={inputClass} disabled={!editable} value={values.state_code} onChange={set('state_code')}>
                            <option value="">Select…</option>{statesFor(values.country).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </Field>
                    <Field label={india ? 'Postal (PIN) code' : 'ZIP code'} error={error.fields.postal_code}><input className={inputClass} disabled={!editable} value={values.postal_code} onChange={set('postal_code')} /></Field>
                    <Field label={india ? 'GSTIN' : 'Tax ID (EIN / permit)'} error={error.fields.tax_id}><input className={inputClass} disabled={!editable} value={values.tax_id} onChange={set('tax_id')} placeholder={india ? '27AAPFU0939F1ZV' : ''} /></Field>
                    <Field label="Email" error={error.fields.email}><input className={inputClass} disabled={!editable} value={values.email} onChange={set('email')} /></Field>
                    <Field label="Phone" error={error.fields.phone}><input className={inputClass} disabled={!editable} value={values.phone} onChange={set('phone')} /></Field>
                </div>
                <h2 className="pt-2 text-lg font-semibold">Numbering & terms</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Invoice prefix" error={error.fields.invoice_prefix}><input className={inputClass} disabled={!editable} value={values.invoice_prefix} onChange={set('invoice_prefix')} /></Field>
                    <Field label="Quote prefix" error={error.fields.quote_prefix}><input className={inputClass} disabled={!editable} value={values.quote_prefix} onChange={set('quote_prefix')} /></Field>
                    <Field label="Financial year starts in" error={error.fields.fy_start_month}>
                        <select className={inputClass} disabled={!editable} value={values.fy_start_month} onChange={set('fy_start_month')}>
                            <option value="">{india ? 'April (default)' : 'January (default)'}</option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                    </Field>
                    <Field label="Default payment terms (days)" error={error.fields.default_due_days}><input className={inputClass} type="number" min="0" disabled={!editable} value={values.default_due_days} onChange={set('default_due_days')} /></Field>
                </div>
                <Field label="Default terms printed on documents" error={error.fields.default_terms}><textarea className={inputClass} rows={3} disabled={!editable} value={values.default_terms} onChange={set('default_terms')} /></Field>
                {error.fields.country && <p className="text-sm text-red-600">{error.fields.country}</p>}
                {editable && <Button type="submit" disabled={save.isPending}>Save business profile</Button>}
            </form>
            {profile.data && <TaxRates canManage={can('manage_tax_rates')} />}
        </div>
    );
}
