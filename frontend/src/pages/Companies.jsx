import { useState } from 'react';
import { companiesApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';

const EMPTY = { name: '', website: '', description: '' };

export default function Companies() {
    const { can } = useMe();
    const state = useResourceList('companies', companiesApi);
    const [editing, setEditing] = useState(null); // null | {} (new) | company
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });

    const open = (company) => {
        setValues(company ? { name: company.name, website: company.website ?? '', description: company.description ?? '' } : EMPTY);
        setError({ fields: {} });
        setEditing(company ?? {});
    };

    const submit = async (e) => {
        e.preventDefault();
        try {
            await state.save.mutateAsync({ id: editing.id, values });
            setEditing(null);
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const remove = async (company) => {
        if (!window.confirm(`Delete ${company.name}?`)) return;
        try {
            await state.remove.mutateAsync(company.id);
        } catch (err) {
            window.alert(parseApiError(err).fields.company ?? parseApiError(err).message);
        }
    };

    return (
        <>
            <ResourceTable title="Companies" state={state}
                columns={[
                    { label: 'Name', render: (c) => c.name },
                    { label: 'Website', render: (c) => c.website },
                    { label: 'Contacts', render: (c) => c.contacts_count },
                ]}
                canCreate={can('create_companies')} canEdit={can('edit_companies')} canDelete={can('delete_companies')}
                onCreate={() => open(null)} onEdit={open} onDelete={remove} />

            {editing && (
                <Modal title={editing.id ? 'Edit company' : 'New company'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="space-y-4">
                        {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                        <Field label="Name" error={error.fields.name}>
                            <input className={inputClass} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
                        </Field>
                        <Field label="Website" error={error.fields.website}>
                            <input className={inputClass} value={values.website} onChange={(e) => setValues({ ...values, website: e.target.value })} />
                        </Field>
                        <Field label="Description" error={error.fields.description}>
                            <textarea className={inputClass} rows={3} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
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
