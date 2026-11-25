import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companiesApi, contactsApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';

function ImportModal({ onClose, onDone }) {
    const input = useRef();
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const upload = async () => {
        const file = input.current.files[0];
        if (!file) return;
        setBusy(true);
        setError(null);
        try {
            setResult(await contactsApi.import(file));
            onDone();
        } catch (err) {
            setError(parseApiError(err).fields.file ?? parseApiError(err).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal title="Import contacts" onClose={onClose}>
            <div className="space-y-3 text-sm">
                <p className="text-gray-600">Upload a CSV or Excel file with a header row. Columns: <b>name</b> (required), email, phone, title, notes, company, website. Contacts whose email already exists are skipped.</p>
                <input ref={input} type="file" accept=".csv,.xls,.xlsx,text/csv" />
                {error && <p className="text-red-600">{error}</p>}
                {result && (
                    <div className="rounded border bg-gray-50 p-3">
                        <p>{result.created} created, {result.skipped} skipped (already exist), {result.errors.length} rejected.</p>
                        {result.errors.length > 0 && (
                            <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-red-600">
                                {result.errors.map((e, i) => <li key={i}>{e.row ? `Row ${e.row}: ` : ''}{e.message}</li>)}
                            </ul>
                        )}
                    </div>
                )}
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
                    <Button type="button" disabled={busy} onClick={upload}>Upload</Button>
                </div>
            </div>
        </Modal>
    );
}

function EmailModal({ contact, onClose }) {
    const [values, setValues] = useState({ subject: '', body: '' });
    const [error, setError] = useState({ fields: {} });
    const [sent, setSent] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        try {
            await contactsApi.sendEmail(contact.id, values);
            setSent(true);
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    return (
        <Modal title={`Email ${contact.name}`} onClose={onClose}>
            {sent ? (
                <div className="space-y-4"><p className="text-sm text-green-700">Email sent to {contact.email}.</p><Button onClick={onClose}>Close</Button></div>
            ) : (
                <form onSubmit={submit} className="space-y-3">
                    {error.fields.contact && <p className="text-sm text-red-600">{error.fields.contact}</p>}
                    {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                    <p className="text-sm text-gray-600">To: {contact.email}</p>
                    <Field label="Subject" error={error.fields.subject}><input className={inputClass} value={values.subject} onChange={(e) => setValues({ ...values, subject: e.target.value })} /></Field>
                    <Field label="Message (HTML allowed)" error={error.fields.body}><textarea className={inputClass} rows={6} value={values.body} onChange={(e) => setValues({ ...values, body: e.target.value })} /></Field>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit">Send</Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}

const EMPTY = { name: '', email: '', phone: '', title: '', company_id: '', notes: '' };

export default function Contacts() {
    const { can } = useMe();
    const qc = useQueryClient();
    const state = useResourceList('contacts', contactsApi);
    const [editing, setEditing] = useState(null);
    const [importing, setImporting] = useState(false);
    const [emailing, setEmailing] = useState(null);
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });

    const companies = useQuery({
        queryKey: ['companies', 'options'],
        queryFn: () => companiesApi.list({ per_page: 100 }),
        enabled: !!editing,
    });

    const open = (c) => {
        setValues(c ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? ''])) : EMPTY);
        setError({ fields: {} });
        setEditing(c ?? {});
    };

    const set = (k) => (e) => setValues({ ...values, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        try {
            await state.save.mutateAsync({ id: editing.id, values });
            setEditing(null);
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const remove = async (c) => {
        if (!window.confirm(`Delete ${c.name}?`)) return;
        try {
            await state.remove.mutateAsync(c.id);
        } catch (err) {
            window.alert(parseApiError(err).message);
        }
    };

    return (
        <>
            <ResourceTable title="Contacts" state={state}
                columns={[
                    { label: 'Name', render: (c) => c.name },
                    { label: 'Email', render: (c) => c.email },
                    { label: 'Phone', render: (c) => c.phone },
                    { label: 'Company', render: (c) => c.company?.name },
                    { label: 'Status', render: (c) => (c.unsubscribed ? 'Unsubscribed' : null) },
                ]}
                canCreate={can('create_contacts')} canEdit={can('edit_contacts')} canDelete={can('delete_contacts')}
                headerActions={can('create_contacts') && <Button variant="secondary" onClick={() => setImporting(true)}>Import</Button>}
                rowActions={(c) => can('send_campaign') && c.email && !c.unsubscribed && (
                    <button className="text-blue-600 hover:underline" onClick={() => setEmailing(c)}>Email</button>
                )}
                onCreate={() => open(null)} onEdit={open} onDelete={remove} />
            {importing && <ImportModal onClose={() => setImporting(false)} onDone={() => qc.invalidateQueries({ queryKey: ['contacts'] })} />}
            {emailing && <EmailModal contact={emailing} onClose={() => setEmailing(null)} />}

            {editing && (
                <Modal title={editing.id ? 'Edit contact' : 'New contact'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="space-y-4">
                        {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                        <Field label="Name" error={error.fields.name}>
                            <input className={inputClass} value={values.name} onChange={set('name')} />
                        </Field>
                        <Field label="Company" error={error.fields.company_id}>
                            <select className={inputClass} value={values.company_id} onChange={set('company_id')}>
                                <option value="">Select…</option>
                                {companies.data?.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </Field>
                        <Field label="Email" error={error.fields.email}>
                            <input className={inputClass} value={values.email} onChange={set('email')} />
                        </Field>
                        <Field label="Phone" error={error.fields.phone}>
                            <input className={inputClass} value={values.phone} onChange={set('phone')} />
                        </Field>
                        <Field label="Title" error={error.fields.title}>
                            <input className={inputClass} value={values.title} onChange={set('title')} />
                        </Field>
                        <Field label="Notes" error={error.fields.notes}>
                            <textarea className={inputClass} rows={3} value={values.notes} onChange={set('notes')} />
                        </Field>
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
