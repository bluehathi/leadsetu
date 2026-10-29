import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { businessApi, companiesApi, invoicesApi, itemsApi, quotesApi, taxRatesApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import StatusBadge from '../components/StatusBadge';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';
import { formatMoney, fromMinor, toMinor } from '../lib/money';

// One implementation for both billing documents; `kind` picks the API, labels and permissions.
const KINDS = {
    quote: {
        api: quotesApi, key: 'quotes', path: '/quotes', title: 'Quotes', one: 'Quote',
        view: 'view_quotes', create: 'create_quotes', edit: 'edit_quotes', del: 'delete_quotes',
        statuses: ['draft', 'sent', 'accepted', 'declined', 'invoiced'], dateLabel: 'Valid until', dateField: 'valid_until',
    },
    invoice: {
        api: invoicesApi, key: 'invoices', path: '/invoices', title: 'Invoices', one: 'Invoice',
        view: 'view_invoices', create: 'create_invoices', edit: 'edit_invoices', del: 'delete_invoices',
        statuses: ['draft', 'issued', 'partially_paid', 'paid', 'overdue', 'void'], dateLabel: 'Due date', dateField: 'due_date',
    },
};

const useBusiness = () => useQuery({ queryKey: ['business'], queryFn: businessApi.get });

function NeedsBusiness() {
    return (
        <p className="rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            Set up your <Link className="underline" to="/business">business profile</Link> before creating documents.
        </p>
    );
}

// ---------------------------------------------------------------------------------------------- list

export function DocumentList({ kind }) {
    const k = KINDS[kind];
    const { can } = useMe();
    const navigate = useNavigate();
    const business = useBusiness();
    const [status, setStatus] = useState('');
    const state = useResourceList(k.key, k.api, { filters: { status: status || undefined } });
    const currency = business.data?.currency ?? 'INR';

    return (
        <>
            {business.isSuccess && !business.data && <NeedsBusiness />}
            <ResourceTable title={k.title} state={state}
                columns={[
                    { label: 'Number', render: (d) => <Link className="text-blue-700 hover:underline" to={`${k.path}/${d.id}`}>{d.number ?? 'Draft'}</Link> },
                    { label: 'Customer', render: (d) => d.company?.name },
                    { label: 'Date', render: (d) => d.issue_date },
                    { label: k.dateLabel, render: (d) => d[k.dateField] },
                    { label: 'Total', render: (d) => formatMoney(d.total_minor, d.currency ?? currency) },
                    ...(kind === 'invoice' ? [{ label: 'Balance', render: (d) => (d.status === 'draft' || d.status === 'void' ? null : formatMoney(d.balance_minor, d.currency)) }] : []),
                    { label: 'Status', render: (d) => <StatusBadge status={d.is_overdue ? 'overdue' : d.status} /> },
                ]}
                canCreate={can(k.create)} canEdit={false} canDelete={false}
                onCreate={() => navigate(`${k.path}/new`)}
                toolbar={
                    <select className="mb-4 rounded border p-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); state.setPage(1); }}>
                        <option value="">All statuses</option>
                        {k.statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                } />
        </>
    );
}

// -------------------------------------------------------------------------------------------- editor

const blankLine = (rate = '') => ({ item_id: '', description: '', quantity: '1', price: '0.00', discount_percent: '0', tax_rate: rate });

export function DocumentEditor({ kind }) {
    const k = KINDS[kind];
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const business = useBusiness();
    const companies = useQuery({ queryKey: ['companies', 'options'], queryFn: () => companiesApi.list({ per_page: 100 }) });
    const items = useQuery({ queryKey: ['items', 'options'], queryFn: () => itemsApi.list({ per_page: 100, active_only: 1 }) });
    const rates = useQuery({ queryKey: ['tax-rates'], queryFn: () => taxRatesApi.list() });
    const existing = useQuery({ queryKey: [k.key, 'detail', id], queryFn: () => k.api.get(id), enabled: !!id });
    const [form, setForm] = useState(null);
    const [error, setError] = useState({ fields: {} });
    const [saving, setSaving] = useState(false);

    const defaultRate = rates.data?.data?.find((r) => r.is_default)?.rate ?? '';
    const current = useMemo(() => {
        if (form) return form;
        if (id && existing.data) {
            const d = existing.data;
            return {
                company_id: d.company_id, notes: d.notes ?? '', terms: d.terms ?? '', issue_date: d.issue_date ?? '', [k.dateField]: d[k.dateField] ?? '',
                lines: d.lines.map((l) => ({ item_id: l.item_id ?? '', description: l.description, quantity: String(l.quantity), price: fromMinor(l.unit_price_minor), discount_percent: String(l.discount_percent), tax_rate: String(l.tax_rate) })),
            };
        }
        if (!id) return { company_id: '', notes: '', terms: '', issue_date: '', [k.dateField]: '', lines: [blankLine(String(defaultRate))] };
        return null;
    }, [form, id, existing.data, defaultRate]); // eslint-disable-line react-hooks/exhaustive-deps

    if (business.isSuccess && !business.data) return <NeedsBusiness />;
    if (!current) return <p>Loading…</p>;
    if (id && existing.data && !existing.data.editable) return <p className="text-sm text-red-600">This {k.one.toLowerCase()} can no longer be edited.</p>;

    const update = (patch) => setForm({ ...current, ...patch });
    const setLine = (i, patch) => update({ lines: current.lines.map((l, n) => (n === i ? { ...l, ...patch } : l)) });
    const pickItem = (i, itemId) => {
        const item = items.data?.data?.find((x) => String(x.id) === String(itemId));
        setLine(i, item
            ? { item_id: item.id, description: item.name, price: fromMinor(item.price_minor), tax_rate: item.tax_rate ? String(item.tax_rate.rate) : '0' }
            : { item_id: '' });
    };

    const submit = async (e) => {
        e.preventDefault();
        const lines = [];
        for (const [i, l] of current.lines.entries()) {
            const minor = toMinor(l.price);
            if (minor === null) { setError({ fields: { [`lines.${i}.unit_price_minor`]: 'Enter an amount like 1250.50' } }); return; }
            lines.push({
                item_id: l.item_id || null, description: l.description, quantity: Number(l.quantity), unit_price_minor: minor,
                discount_percent: Number(l.discount_percent || 0), tax_rate: l.tax_rate === '' ? 0 : Number(l.tax_rate),
            });
        }
        const payload = { company_id: current.company_id, notes: current.notes || null, terms: current.terms || null, lines, issue_date: current.issue_date || null, [k.dateField]: current[k.dateField] || null };
        setSaving(true);
        try {
            const saved = id ? await k.api.update(id, payload) : await k.api.create(payload);
            qc.invalidateQueries({ queryKey: [k.key] });
            navigate(`${k.path}/${saved.id}`);
        } catch (err) {
            setError(parseApiError(err));
        } finally { setSaving(false); }
    };

    const lineError = (i, f) => error.fields[`lines.${i}.${f}`];

    return (
        <form onSubmit={submit} className="max-w-5xl space-y-5">
            <h1 className="text-xl font-semibold">{id ? `Edit ${k.one.toLowerCase()}` : `New ${k.one.toLowerCase()}`}</h1>
            {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
            {error.fields.business && <p className="text-sm text-red-600">{error.fields.business}</p>}
            <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Customer" error={error.fields.company_id}>
                    <select className={inputClass} value={current.company_id} onChange={(e) => update({ company_id: e.target.value })}>
                        <option value="">Select…</option>{companies.data?.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </Field>
                <Field label="Date" error={error.fields.issue_date}><input className={inputClass} type="date" value={current.issue_date} onChange={(e) => update({ issue_date: e.target.value })} /></Field>
                <Field label={`${k.dateLabel} (optional)`} error={error.fields[k.dateField]}><input className={inputClass} type="date" value={current[k.dateField]} onChange={(e) => update({ [k.dateField]: e.target.value })} /></Field>
            </div>

            <div className="overflow-x-auto rounded border bg-white">
                <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50 text-left"><tr>
                        <th className="px-2 py-2">Item</th><th className="px-2 py-2">Description</th><th className="px-2 py-2">Qty</th>
                        <th className="px-2 py-2">Price ({business.data?.currency})</th><th className="px-2 py-2">Disc %</th><th className="px-2 py-2">Tax %</th><th />
                    </tr></thead>
                    <tbody>
                        {current.lines.map((l, i) => (
                            <tr key={i} className="border-b align-top last:border-0">
                                <td className="px-2 py-2"><select className={`${inputClass} min-w-32`} value={l.item_id} onChange={(e) => pickItem(i, e.target.value)}>
                                    <option value="">Custom</option>{items.data?.data?.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></td>
                                <td className="px-2 py-2"><input className={`${inputClass} min-w-40`} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
                                    {lineError(i, 'description') && <span className="text-xs text-red-600">{lineError(i, 'description')}</span>}</td>
                                <td className="px-2 py-2"><input className={`${inputClass} w-20`} inputMode="decimal" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
                                    {lineError(i, 'quantity') && <span className="block text-xs text-red-600">{lineError(i, 'quantity')}</span>}</td>
                                <td className="px-2 py-2"><input className={`${inputClass} w-28`} inputMode="decimal" value={l.price} onChange={(e) => setLine(i, { price: e.target.value })} />
                                    {lineError(i, 'unit_price_minor') && <span className="block text-xs text-red-600">{lineError(i, 'unit_price_minor')}</span>}</td>
                                <td className="px-2 py-2"><input className={`${inputClass} w-16`} inputMode="decimal" value={l.discount_percent} onChange={(e) => setLine(i, { discount_percent: e.target.value })} /></td>
                                <td className="px-2 py-2"><input className={`${inputClass} w-20`} inputMode="decimal" list="tax-rates" value={l.tax_rate} onChange={(e) => setLine(i, { tax_rate: e.target.value })} />
                                    {lineError(i, 'tax_rate') && <span className="block text-xs text-red-600">{lineError(i, 'tax_rate')}</span>}</td>
                                <td className="px-2 py-2">{current.lines.length > 1 && <button type="button" className="text-red-600" onClick={() => update({ lines: current.lines.filter((_, n) => n !== i) })}>✕</button>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <datalist id="tax-rates">{[...new Set(rates.data?.data?.map((r) => r.rate))].map((r) => <option key={r} value={r} />)}</datalist>
            </div>
            {error.fields.lines && <p className="text-sm text-red-600">{error.fields.lines}</p>}
            <Button type="button" variant="secondary" onClick={() => update({ lines: [...current.lines, blankLine(String(defaultRate))] })}>Add line</Button>
            <p className="text-xs text-gray-500">Prices exclude tax. Tax, discounts and totals are calculated when you save.</p>

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Notes" error={error.fields.notes}><textarea className={inputClass} rows={3} value={current.notes} onChange={(e) => update({ notes: e.target.value })} /></Field>
                <Field label="Terms (defaults from your business profile)" error={error.fields.terms}><textarea className={inputClass} rows={3} value={current.terms} onChange={(e) => update({ terms: e.target.value })} /></Field>
            </div>
            <div className="flex gap-2"><Button type="submit" disabled={saving}>Save {kind === 'invoice' ? 'draft' : kind}</Button><Button type="button" variant="secondary" onClick={() => navigate(id ? `${k.path}/${id}` : k.path)}>Cancel</Button></div>
        </form>
    );
}

// ------------------------------------------------------------------------------------------- detail

const Address = ({ p, title }) => (
    <div className="text-sm">
        <div className="text-xs uppercase text-gray-500">{title}</div>
        <div className="font-medium">{p?.legal_name ?? p?.name}</div>
        {[p?.address_line1, p?.address_line2, [p?.city, p?.state_code, p?.postal_code].filter(Boolean).join(', ')].filter(Boolean).map((l, i) => <div key={i}>{l}</div>)}
        {p?.tax_id && <div>Tax ID: {p.tax_id}</div>}
    </div>
);

export function DocumentDetail({ kind }) {
    const k = KINDS[kind];
    const { id } = useParams();
    const { can } = useMe();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [message, setMessage] = useState(null);
    const [dialog, setDialog] = useState(null); // 'pay' | 'void' | { voidPayment: id }
    const doc = useQuery({ queryKey: [k.key, 'detail', id], queryFn: () => k.api.get(id) });
    const business = useBusiness();

    const refresh = () => qc.invalidateQueries({ queryKey: [k.key] });
    const act = useMutation({
        mutationFn: ({ fn }) => fn(),
        onSuccess: (_d, v) => { setMessage({ ok: true, text: v.ok }); setDialog(null); refresh(); },
        onError: (err) => { const e = parseApiError(err); setMessage({ ok: false, text: Object.values(e.fields)[0] ?? e.message }); },
    });

    if (doc.isLoading) return <p>Loading…</p>;
    if (doc.isError) return <p className="text-red-600">{k.one} not found.</p>;
    const d = doc.data;
    const money = (n) => formatMoney(n, d.currency);
    const seller = d.seller ?? business.data;
    const buyer = d.buyer ?? { name: d.company?.name };
    const isInvoice = kind === 'invoice';
    const open = isInvoice && ['issued', 'partially_paid'].includes(d.status);

    return (
        <div className="max-w-4xl space-y-6">
            <div className="no-print">
                <Link to={k.path} className="text-sm text-blue-600 hover:underline">← {k.title}</Link>
                {message && <p className={`mt-2 text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                    {d.editable && can(k.edit) && <Button variant="secondary" onClick={() => navigate(`${k.path}/${d.id}/edit`)}>Edit</Button>}
                    {isInvoice && d.status === 'draft' && can('issue_invoices') && <Button disabled={act.isPending} onClick={() => window.confirm('Issue this invoice? It gets a number and can no longer be edited.') && act.mutate({ fn: () => invoicesApi.issue(d.id), ok: 'Invoice issued.' })}>Issue invoice</Button>}
                    {open && can('record_payments') && <Button onClick={() => setDialog('pay')}>Record payment</Button>}
                    {open && d.amount_paid_minor === 0 && can('void_invoices') && <Button variant="secondary" onClick={() => setDialog('void')}>Void</Button>}
                    {isInvoice && d.status === 'draft' && can(k.del) && <Button variant="danger" onClick={() => window.confirm('Delete this draft?') && invoicesApi.remove(d.id).then(() => { refresh(); navigate(k.path); })}>Delete</Button>}
                    {!isInvoice && d.status === 'draft' && can(k.edit) && <Button variant="secondary" onClick={() => act.mutate({ fn: () => quotesApi.setStatus(d.id, 'sent'), ok: 'Marked as sent.' })}>Mark as sent</Button>}
                    {!isInvoice && d.status === 'sent' && can(k.edit) && <>
                        <Button variant="secondary" onClick={() => act.mutate({ fn: () => quotesApi.setStatus(d.id, 'accepted'), ok: 'Quote accepted.' })}>Mark accepted</Button>
                        <Button variant="secondary" onClick={() => act.mutate({ fn: () => quotesApi.setStatus(d.id, 'declined'), ok: 'Quote declined.' })}>Mark declined</Button></>}
                    {!isInvoice && ['draft', 'sent', 'accepted'].includes(d.status) && can(k.edit) && can('create_invoices') &&
                        <Button disabled={act.isPending} onClick={() => quotesApi.convert(d.id).then((inv) => { refresh(); qc.invalidateQueries({ queryKey: ['invoices'] }); navigate(`/invoices/${inv.id}`); }).catch((err) => setMessage({ ok: false, text: Object.values(parseApiError(err).fields)[0] ?? parseApiError(err).message }))}>Create invoice</Button>}
                    {!isInvoice && d.invoice_id && <Link className="self-center text-sm text-blue-600 hover:underline" to={`/invoices/${d.invoice_id}`}>View invoice →</Link>}
                    {isInvoice && d.quote_id && <Link className="self-center text-sm text-blue-600 hover:underline" to={`/quotes/${d.quote_id}`}>From quote →</Link>}
                    {d.status !== 'draft' && <Button variant="secondary" onClick={() => window.print()}>Print / PDF</Button>}
                </div>
            </div>

            <div className="rounded border bg-white p-6 print:border-0 print:p-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><h1 className="text-2xl font-semibold">{isInvoice ? (seller?.country === 'IN' && d.tax_minor > 0 ? 'Tax Invoice' : 'Invoice') : 'Quote'}</h1>
                        <div className="text-sm">{d.number ?? 'DRAFT'}</div></div>
                    <div className="text-right text-sm"><StatusBadge status={d.is_overdue ? 'overdue' : d.status} />
                        <div className="mt-1">Date: {d.issue_date ?? '—'}</div>
                        <div>{k.dateLabel}: {d[k.dateField] ?? '—'}</div>
                        {d.place_of_supply && d.country === 'IN' && <div>Place of supply: {d.place_of_supply}</div>}</div>
                </div>
                <div className="mt-6 grid gap-6 sm:grid-cols-2"><Address p={seller} title="From" /><Address p={buyer} title="Bill to" /></div>

                <table className="mt-6 w-full text-sm">
                    <thead className="border-b text-left"><tr><th className="py-2">Description</th>{d.country === 'IN' && <th>HSN/SAC</th>}<th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Disc</th><th className="text-right">Tax</th><th className="text-right">Amount</th></tr></thead>
                    <tbody>{d.lines.map((l) => (
                        <tr key={l.id} className="border-b last:border-0">
                            <td className="py-2">{l.description}</td>{d.country === 'IN' && <td>{l.hsn_sac}</td>}
                            <td className="text-right">{l.quantity}{l.unit ? ` ${l.unit}` : ''}</td><td className="text-right">{money(l.unit_price_minor)}</td>
                            <td className="text-right">{l.discount_percent ? `${l.discount_percent}%` : ''}</td><td className="text-right">{l.tax_rate ? `${l.tax_rate}%` : ''}</td>
                            <td className="text-right">{money(l.taxable_minor)}</td></tr>))}</tbody>
                </table>
                <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
                    <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(d.subtotal_minor)}</dd></div>
                    {d.discount_minor > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>-{money(d.discount_minor)}</dd></div>}
                    {d.tax_breakup.map((t) => <div key={`${t.code}${t.rate}`} className="flex justify-between"><dt>{t.label} {t.rate}%</dt><dd>{money(t.amount_minor)}</dd></div>)}
                    <div className="flex justify-between border-t pt-1 text-base font-semibold"><dt>Total</dt><dd>{money(d.total_minor)}</dd></div>
                    {isInvoice && d.status !== 'draft' && d.status !== 'void' && <>
                        <div className="flex justify-between"><dt>Paid</dt><dd>{money(d.amount_paid_minor)}</dd></div>
                        <div className="flex justify-between font-medium"><dt>Balance due</dt><dd>{money(d.balance_minor)}</dd></div></>}
                </dl>
                {d.status === 'void' && <p className="mt-4 text-sm text-red-700">Void: {d.void_reason}</p>}
                {d.notes && <p className="mt-6 whitespace-pre-line text-sm">{d.notes}</p>}
                {d.terms && <p className="mt-4 whitespace-pre-line text-xs text-gray-600">{d.terms}</p>}
            </div>

            {isInvoice && d.payments?.length > 0 && (
                <section className="no-print">
                    <h2 className="mb-2 font-medium">Payments</h2>
                    <div className="rounded border bg-white">{d.payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between border-b px-4 py-2 text-sm last:border-0">
                            <span className={p.voided ? 'text-gray-400 line-through' : ''}>{p.paid_at} · {p.method.replace('_', ' ')} · {money(p.amount_minor)}{p.reference ? ` · ${p.reference}` : ''}</span>
                            {p.voided ? <span className="text-xs text-gray-500">voided: {p.void_reason}</span>
                                : can('void_payments') && <Button variant="danger" onClick={() => setDialog({ voidPayment: p.id })}>Void</Button>}
                        </div>))}</div>
                </section>
            )}

            {dialog === 'pay' && <PaymentModal invoice={d} onClose={() => setDialog(null)} onDone={() => { setDialog(null); setMessage({ ok: true, text: 'Payment recorded.' }); refresh(); }} />}
            {dialog === 'void' && <ReasonModal title="Void invoice" onClose={() => setDialog(null)} onSubmit={(reason) => act.mutateAsync({ fn: () => invoicesApi.void(d.id, reason), ok: 'Invoice voided.' })} />}
            {dialog?.voidPayment && <ReasonModal title="Void payment" onClose={() => setDialog(null)} onSubmit={(reason) => act.mutateAsync({ fn: () => invoicesApi.voidPayment(dialog.voidPayment, reason), ok: 'Payment voided.' })} />}
        </div>
    );
}

function ReasonModal({ title, onClose, onSubmit }) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState(null);
    const submit = async (e) => { e.preventDefault(); try { await onSubmit(reason); } catch (err) { setError(parseApiError(err).fields.reason ?? parseApiError(err).message); } };
    return (
        <Modal title={title} onClose={onClose}>
            <form onSubmit={submit} className="space-y-4">
                <Field label="Reason" error={error}><input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Confirm</Button></div>
            </form>
        </Modal>
    );
}

function PaymentModal({ invoice, onClose, onDone }) {
    const [v, setV] = useState({ amount: fromMinor(invoice.balance_minor), paid_at: new Date().toISOString().slice(0, 10), method: 'bank_transfer', reference: '' });
    const [error, setError] = useState({ fields: {} });
    const submit = async (e) => {
        e.preventDefault();
        const minor = toMinor(v.amount);
        if (minor === null) { setError({ fields: { amount_minor: 'Enter an amount like 1250.50' } }); return; }
        try { await invoicesApi.pay(invoice.id, { amount_minor: minor, paid_at: v.paid_at, method: v.method, reference: v.reference || null }); onDone(); } catch (err) { setError(parseApiError(err)); }
    };
    return (
        <Modal title={`Record payment · balance ${formatMoney(invoice.balance_minor, invoice.currency)}`} onClose={onClose}>
            <form onSubmit={submit} className="space-y-3">
                {error.fields.invoice && <p className="text-sm text-red-600">{error.fields.invoice}</p>}
                <Field label="Amount" error={error.fields.amount_minor}><input className={inputClass} inputMode="decimal" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Date" error={error.fields.paid_at}><input className={inputClass} type="date" value={v.paid_at} onChange={(e) => setV({ ...v, paid_at: e.target.value })} /></Field>
                    <Field label="Method" error={error.fields.method}><select className={inputClass} value={v.method} onChange={(e) => setV({ ...v, method: e.target.value })}>
                        {['bank_transfer', 'upi', 'cash', 'card', 'cheque', 'other'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}</select></Field>
                </div>
                <Field label="Reference (UTR / cheque no.)" error={error.fields.reference}><input className={inputClass} value={v.reference} onChange={(e) => setV({ ...v, reference: e.target.value })} /></Field>
                <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit">Record</Button></div>
            </form>
        </Modal>
    );
}
