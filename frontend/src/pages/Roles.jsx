import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { permissionsApi, rolesApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';

const EMPTY = { name: '', permissions: [] };

// "view_contacts" -> group "contacts"
const groupOf = (name) => name.replace(/^(view|create|edit|delete|manage|send)_/, '');

export default function Roles() {
    const { can } = useMe();
    const state = useResourceList('roles', rolesApi);
    const [editing, setEditing] = useState(null);
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });

    const permissions = useQuery({ queryKey: ['permissions'], queryFn: permissionsApi.list, enabled: !!editing && can('view_permissions') });
    const permError = Object.entries(error.fields).find(([k]) => k.startsWith('permissions'))?.[1];

    const grouped = Object.entries(
        (permissions.data?.data ?? []).reduce((acc, p) => ((acc[groupOf(p.name)] ??= []).push(p), acc), {}),
    );

    const open = (role) => {
        setValues(role ? { name: role.name, permissions: role.permissions.map((p) => p.id) } : EMPTY);
        setError({ fields: {} });
        setEditing(role ?? {});
    };

    const toggle = (id) =>
        setValues((v) => ({ ...v, permissions: v.permissions.includes(id) ? v.permissions.filter((p) => p !== id) : [...v.permissions, id] }));

    const submit = async (e) => {
        e.preventDefault();
        try {
            await state.save.mutateAsync({ id: editing.id, values });
            setEditing(null);
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const remove = async (role) => {
        if (!window.confirm(`Delete role ${role.name}?`)) return;
        try {
            await state.remove.mutateAsync(role.id);
        } catch (err) {
            const e = parseApiError(err);
            window.alert(e.fields.role ?? e.message);
        }
    };

    return (
        <>
            <ResourceTable title="Roles" state={state}
                columns={[
                    { label: 'Name', render: (r) => r.name },
                    { label: 'Type', render: (r) => (r.is_system ? 'System (read-only)' : 'Custom') },
                    { label: 'Permissions', render: (r) => r.permissions?.length },
                    { label: 'Users', render: (r) => r.users_count },
                ]}
                canCreate={can('create_roles')} canEdit={can('edit_roles')} canDelete={can('delete_roles')}
                rowEditable={(r) => !r.is_system} rowDeletable={(r) => !r.is_system}
                onCreate={() => open(null)} onEdit={open} onDelete={remove} />

            {editing && (
                <Modal title={editing.id ? 'Edit role' : 'New role'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="space-y-4">
                        {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                        <Field label="Name" error={error.fields.name}>
                            <input className={inputClass} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
                        </Field>
                        <Field group label="Permissions" error={permError}>
                            <div className="max-h-64 space-y-2 overflow-y-auto rounded border p-2">
                                {!can('view_permissions') && <p className="text-xs text-gray-500">You need the view_permissions permission to edit these.</p>}
                                {grouped.map(([group, items]) => (
                                    <div key={group}>
                                        <div className="text-xs font-semibold uppercase text-gray-500">{group.replace(/_/g, ' ')}</div>
                                        {items.map((p) => (
                                            <label key={p.id} className={`flex items-center gap-2 text-sm ${p.grantable ? '' : 'text-gray-400'}`}>
                                                <input type="checkbox" disabled={!p.grantable && !values.permissions.includes(p.id)}
                                                    checked={values.permissions.includes(p.id)} onChange={() => toggle(p.id)} />
                                                {p.name}
                                            </label>
                                        ))}
                                    </div>
                                ))}
                            </div>
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
