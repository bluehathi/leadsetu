import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessApi, companiesApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';
import { statesFor } from '../lib/india';

const EMPTY = {
    name: '', website: '', description: '', billing_email: '', address_line1: '', address_line2: '', city: '', state_code: '',
    postal_code: '', tax_id: '', tax_exempt: false,
};

export default function Companies() {
    const { can } = useMe();
    const business = useQuery({ queryKey: ['business'], queryFn: businessApi.get, enabled: can('view_invoices') || can('view_quotes') || can('manage_business_profile') });
    const country = business.data?.country ?? 'IN';
    const state = useResourceList('companies', companiesApi);
    const [editing, setEditing] = useState(null); // null | {} (new) | company
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });

    const open = (company) => {
        setValues(company ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, company[k] ?? EMPTY[k]])) : EMPTY);
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
            <ResourceTable title="Customers (companies)" state={state}
                columns={[
                    { label: 'Name', render: (c) => c.name },
                    { label: 'Website', render: (c) => c.website },
                    { label: 'Contacts', render: (c) => c.contacts_count },
                ]}
                canCreate={can('create_companies')} canEdit={can('edit_companies')} canDelete={can('delete_companies')}
                onCreate={() => open(null)} onEdit={open} onDelete={remove} />

            {editing && (
                <Modal title={editing.id ? 'Edit customer' : 'New customer'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
                        {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                        <Field label="Name" error={error.fields.name}>
                            <input className={inputClass} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
                        </Field>
                        <Field label="Website" error={error.fields.website}>
                            <input className={inputClass} value={values.website} onChange={(e) => setValues({ ...values, website: e.target.value })} />
                        </Field>
                        <Field label="Billing email" error={error.fields.billing_email}><input className={inputClass} value={values.billing_email} onChange={(e) => setValues({ ...values, billing_email: e.target.value })} /></Field>
                        <Field label="Address line 1" error={error.fields.address_line1}><input className={inputClass} value={values.address_line1} onChange={(e) => setValues({ ...values, address_line1: e.target.value })} /></Field>
                        <Field label="Address line 2" error={error.fields.address_line2}><input className={inputClass} value={values.address_line2} onChange={(e) => setValues({ ...values, address_line2: e.target.value })} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="City" error={error.fields.city}><input className={inputClass} value={values.city} onChange={(e) => setValues({ ...values, city: e.target.value })} /></Field>
                            <Field label={country === 'IN' ? 'State (place of supply)' : 'State'} error={error.fields.state_code}>
                                <select className={inputClass} value={values.state_code} onChange={(e) => setValues({ ...values, state_code: e.target.value })}>
                                    <option value="">Select…</option>{statesFor(country).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={country === 'IN' ? 'PIN code' : 'ZIP code'} error={error.fields.postal_code}><input className={inputClass} value={values.postal_code} onChange={(e) => setValues({ ...values, postal_code: e.target.value })} /></Field>
                            <Field label={country === 'IN' ? 'Customer GSTIN' : 'Tax ID'} error={error.fields.tax_id}><input className={inputClass} value={values.tax_id} onChange={(e) => setValues({ ...values, tax_id: e.target.value.toUpperCase() })} /></Field>
                        </div>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!values.tax_exempt} onChange={(e) => setValues({ ...values, tax_exempt: e.target.checked })} /> Tax exempt (no tax charged on invoices)</label>
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
