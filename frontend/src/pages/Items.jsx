import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { businessApi, itemsApi, taxRatesApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';
import { formatMoney, fromMinor, toMinor } from '../lib/money';

const EMPTY = { type: 'service', name: '', sku: '', unit: 'nos', price: '0.00', tax_rate_id: '', hsn_sac: '', description: '', active: true };

export default function Items() {
    const { can } = useMe();
    const state = useResourceList('items', itemsApi);
    const business = useQuery({ queryKey: ['business'], queryFn: businessApi.get });
    const rates = useQuery({ queryKey: ['tax-rates'], queryFn: () => taxRatesApi.list() });
    const [editing, setEditing] = useState(null);
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });
    const currency = business.data?.currency ?? 'INR';
    const india = business.data?.country === 'IN';

    const open = (item) => {
        setValues(item ? { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, item[k] ?? EMPTY[k]])), price: fromMinor(item.price_minor), tax_rate_id: item.tax_rate_id ?? '' } : EMPTY);
        setError({ fields: {} });
        setEditing(item ?? {});
    };
    const set = (k) => (e) => setValues({ ...values, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        const minor = toMinor(values.price);
        if (minor === null) { setError({ fields: { price_minor: 'Enter an amount like 1250.50' } }); return; }
        const { price, ...rest } = values;
        try {
            await state.save.mutateAsync({ id: editing.id, values: { ...rest, price_minor: minor, tax_rate_id: values.tax_rate_id || null } });
            setEditing(null);
        } catch (err) { setError(parseApiError(err)); }
    };

    const remove = async (item) => { if (window.confirm(`Delete ${item.name}? Existing quotes and invoices keep their lines.`)) await state.remove.mutateAsync(item.id); };

    return (
        <>
            <ResourceTable title="Items" state={state}
                columns={[
                    { label: 'Name', render: (i) => i.name },
                    { label: 'Type', render: (i) => i.type },
                    { label: 'SKU', render: (i) => i.sku },
                    { label: 'Price', render: (i) => formatMoney(i.price_minor, currency) },
                    { label: 'Tax', render: (i) => (i.tax_rate ? `${i.tax_rate.rate}%` : null) },
                    ...(india ? [{ label: 'HSN/SAC', render: (i) => i.hsn_sac }] : []),
                ]}
                canCreate={can('create_items')} canEdit={can('edit_items')} canDelete={can('delete_items')}
                onCreate={() => open(null)} onEdit={open} onDelete={remove} />
            {editing && (
                <Modal title={editing.id ? 'Edit item' : 'New item'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
                        {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Type" error={error.fields.type}><select className={inputClass} value={values.type} onChange={set('type')}><option value="service">Service</option><option value="product">Product</option></select></Field>
                            <Field label="SKU" error={error.fields.sku}><input className={inputClass} value={values.sku} onChange={set('sku')} /></Field>
                        </div>
                        <Field label="Name" error={error.fields.name}><input className={inputClass} value={values.name} onChange={set('name')} /></Field>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label={`Price (${currency}, excl. tax)`} error={error.fields.price_minor}><input className={inputClass} inputMode="decimal" value={values.price} onChange={set('price')} /></Field>
                            <Field label="Unit" error={error.fields.unit}><input className={inputClass} value={values.unit} onChange={set('unit')} placeholder="nos, hr, kg…" /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Tax rate" error={error.fields.tax_rate_id}>
                                <select className={inputClass} value={values.tax_rate_id} onChange={set('tax_rate_id')}><option value="">No tax</option>
                                    {rates.data?.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                            </Field>
                            {india && <Field label="HSN / SAC code" error={error.fields.hsn_sac}><input className={inputClass} value={values.hsn_sac} onChange={set('hsn_sac')} /></Field>}
                        </div>
                        <Field label="Description" error={error.fields.description}><textarea className={inputClass} rows={2} value={values.description} onChange={set('description')} /></Field>
                        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit">Save</Button></div>
                    </form>
                </Modal>
            )}
        </>
    );
}
