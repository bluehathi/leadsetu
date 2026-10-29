import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companiesApi, contactsApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';

const EMPTY = { name: '', email: '', phone: '', title: '', company_id: '', notes: '' };

export default function Contacts() {
    const { can } = useMe();
    const state = useResourceList('contacts', contactsApi);
    const [editing, setEditing] = useState(null);
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
                ]}
                canCreate={can('create_contacts')} canEdit={can('edit_contacts')} canDelete={can('delete_contacts')}
                onCreate={() => open(null)} onEdit={open} onDelete={remove} />

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
