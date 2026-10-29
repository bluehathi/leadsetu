import { useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi, leadsApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';
import { PRIORITIES, SOURCES, STATUSES, label } from '../lib/leads';

const EMPTY = {
    name: '', email: '', phone: '', company_id: '', company: '', title: '', status: 'new', source: 'website',
    priority: 'Medium', deal_value: '', expected_close: '', tags: '', notes: '',
};

const toForm = (l) => ({
    ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, l[k] ?? EMPTY[k]])),
    company: l.company_name ?? '', tags: (l.tags ?? []).join(', '),
});

const toPayload = (v) => ({
    ...v,
    company_id: v.company_id || null,
    deal_value: v.deal_value === '' ? null : Number(v.deal_value),
    expected_close: v.expected_close || null,
    tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean),
});

function Board({ search, mine, canEdit, onEdit }) {
    const qc = useQueryClient();
    const columns = useQueries({
        queries: STATUSES.map((s) => ({
            queryKey: ['leads', 'board', s.value, search, mine],
            queryFn: () => leadsApi.list({ status: s.value, search: search || undefined, mine: mine || undefined, per_page: 50, sort: '-score' }),
        })),
    });
    const move = useMutation({
        mutationFn: ({ id, status }) => leadsApi.setStatus(id, status),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    });

    return (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {STATUSES.map((s, i) => {
                const col = columns[i].data;
                return (
                    <div key={s.value} className="rounded border bg-gray-100 p-2">
                        <div className="mb-2 flex justify-between text-sm font-semibold">
                            {s.label}<span className="text-gray-500">{col?.meta?.total ?? 0}</span>
                        </div>
                        <div className="space-y-2">
                            {col?.data?.map((l) => (
                                <div key={l.id} className="rounded border bg-white p-2 text-sm shadow-sm">
                                    <button className="text-left font-medium text-blue-700 hover:underline" onClick={() => onEdit(l)}>{l.name}</button>
                                    <div className="text-xs text-gray-500">{l.company_name || '—'} · {l.qualification ?? ''}</div>
                                    {canEdit && (
                                        <select className="mt-1 w-full rounded border p-1 text-xs" value={l.status}
                                            onChange={(e) => move.mutate({ id: l.id, status: e.target.value })}>
                                            {STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function Leads() {
    const { can } = useMe();
    const [view, setView] = useState('list');
    const [status, setStatus] = useState('');
    const [mine, setMine] = useState(false);
    const state = useResourceList('leads', leadsApi, { filters: { status: status || undefined, mine: mine || undefined } });
    const [editing, setEditing] = useState(null);
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });

    const companies = useQuery({
        queryKey: ['companies', 'options'],
        queryFn: () => companiesApi.list({ per_page: 100 }),
        enabled: !!editing && can('view_companies'),
    });

    const open = (lead) => {
        setValues(lead ? toForm(lead) : EMPTY);
        setError({ fields: {} });
        setEditing(lead ?? {});
    };
    const set = (k) => (e) => setValues({ ...values, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await state.save.mutateAsync({ id: editing.id, values: toPayload(values) });
            setEditing(null);
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const remove = async (l) => {
        if (!window.confirm(`Delete lead ${l.name}?`)) return;
        try {
            await state.remove.mutateAsync(l.id);
        } catch (err) {
            window.alert(parseApiError(err).message);
        }
    };

    const tableProps = {
        canCreate: can('create_leads'), canEdit: can('edit_leads'), canDelete: can('delete_leads'),
        onCreate: () => open(null), onEdit: open, onDelete: remove,
    };

    const filters = (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <select className="rounded border p-2" value={status} onChange={(e) => { setStatus(e.target.value); state.setPage(1); }}>
                <option value="">All statuses</option>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <label className="flex items-center gap-1"><input type="checkbox" checked={mine} onChange={(e) => { setMine(e.target.checked); state.setPage(1); }} /> Created by me</label>
            <span className="ml-auto flex overflow-hidden rounded border">
                {['list', 'board'].map((v) => (
                    <button key={v} onClick={() => setView(v)} className={`px-3 py-1 capitalize ${view === v ? 'bg-blue-600 text-white' : 'bg-white'}`}>{v}</button>
                ))}
            </span>
        </div>
    );

    return (
        <>
            {view === 'list' ? (
                <>
                    <ResourceTable title="Leads" state={state} {...tableProps}
                        columns={[
                            { label: 'Name', render: (l) => l.name },
                            { label: 'Company', render: (l) => l.company_name },
                            { label: 'Status', render: (l) => label(STATUSES, l.status) },
                            { label: 'Score', render: (l) => (l.score != null ? `${l.score} (${l.qualification})` : null) },
                            { label: 'Deal value', render: (l) => l.deal_value },
                        ]}
                        toolbar={filters} />
                </>
            ) : (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <h1 className="text-xl font-semibold">Leads</h1>
                        {tableProps.canCreate && <Button onClick={() => open(null)}>New</Button>}
                    </div>
                    <input className={`${inputClass} mb-4 max-w-xs`} placeholder="Search…" value={state.search} onChange={(e) => state.setSearch(e.target.value)} />
                    {filters}
                    <Board search={state.search} mine={mine} canEdit={tableProps.canEdit} onEdit={open} />
                </div>
            )}

            {editing && (
                <Modal title={editing.id ? 'Edit lead' : 'New lead'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
                        {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                        <Field label="Name" error={error.fields.name}><input className={inputClass} value={values.name} onChange={set('name')} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Email" error={error.fields.email}><input className={inputClass} value={values.email} onChange={set('email')} /></Field>
                            <Field label="Phone" error={error.fields.phone}><input className={inputClass} value={values.phone} onChange={set('phone')} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Linked company" error={error.fields.company_id}>
                                <select className={inputClass} value={values.company_id} onChange={set('company_id')}>
                                    <option value="">None</option>
                                    {companies.data?.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Company name" error={error.fields.company}><input className={inputClass} value={values.company} onChange={set('company')} /></Field>
                        </div>
                        <Field label="Job title" error={error.fields.title}><input className={inputClass} value={values.title} onChange={set('title')} /></Field>
                        <div className="grid grid-cols-3 gap-3">
                            <Field label="Status" error={error.fields.status}>
                                <select className={inputClass} value={values.status} onChange={set('status')}>{STATUSES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                            </Field>
                            <Field label="Source" error={error.fields.source}>
                                <select className={inputClass} value={values.source} onChange={set('source')}>{SOURCES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                            </Field>
                            <Field label="Priority" error={error.fields.priority}>
                                <select className={inputClass} value={values.priority} onChange={set('priority')}>{PRIORITIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Deal value" error={error.fields.deal_value}><input className={inputClass} type="number" min="0" value={values.deal_value} onChange={set('deal_value')} /></Field>
                            <Field label="Expected close" error={error.fields.expected_close}><input className={inputClass} type="date" value={values.expected_close} onChange={set('expected_close')} /></Field>
                        </div>
                        <Field label="Tags (comma separated)" error={error.fields.tags ?? error.fields['tags.0']}><input className={inputClass} value={values.tags} onChange={set('tags')} /></Field>
                        <Field label="Notes" error={error.fields.notes}><textarea className={inputClass} rows={3} value={values.notes} onChange={set('notes')} /></Field>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="submit" disabled={state.save.isPending}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}
