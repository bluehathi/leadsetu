import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rolesApi, usersApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';

const EMPTY = { name: '', email: '', password: '', roles: [] };

export default function Users() {
    const { me, can } = useMe();
    const state = useResourceList('users', usersApi);
    const [editing, setEditing] = useState(null);
    const [values, setValues] = useState(EMPTY);
    const [error, setError] = useState({ fields: {} });

    const roles = useQuery({ queryKey: ['roles', 'options'], queryFn: () => rolesApi.list(), enabled: !!editing && can('view_roles') });
    const roleError = Object.entries(error.fields).find(([k]) => k.startsWith('roles'))?.[1];

    const open = (u) => {
        setValues(u ? { name: u.name, email: u.email, password: '', roles: u.roles.map((r) => r.id) } : EMPTY);
        setError({ fields: {} });
        setEditing(u ?? {});
    };

    const toggleRole = (id) =>
        setValues((v) => ({ ...v, roles: v.roles.includes(id) ? v.roles.filter((r) => r !== id) : [...v.roles, id] }));

    const submit = async (e) => {
        e.preventDefault();
        const payload = { ...values };
        if (editing.id) {
            if (!payload.password) delete payload.password;
            if (editing.id === me.id) delete payload.roles; // you cannot change your own roles
        }
        try {
            await state.save.mutateAsync({ id: editing.id, values: payload });
            setEditing(null);
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    const remove = async (u) => {
        if (!window.confirm(`Delete ${u.name}?`)) return;
        try {
            await state.remove.mutateAsync(u.id);
        } catch (err) {
            window.alert(parseApiError(err).message);
        }
    };

    const isSelf = editing?.id === me?.id;

    return (
        <>
            <ResourceTable title="Users" state={state}
                columns={[
                    { label: 'Name', render: (u) => u.name },
                    { label: 'Email', render: (u) => u.email },
                    { label: 'Roles', render: (u) => u.roles?.map((r) => r.name).join(', ') },
                ]}
                canCreate={can('create_users')} canEdit={can('edit_users')} canDelete={can('delete_users')}
                rowDeletable={(u) => u.id !== me?.id}
                onCreate={() => open(null)} onEdit={open} onDelete={remove} />

            {editing && (
                <Modal title={editing.id ? 'Edit user' : 'New user'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="space-y-4">
                        {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                        <Field label="Name" error={error.fields.name}>
                            <input className={inputClass} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
                        </Field>
                        <Field label="Email" error={error.fields.email}>
                            <input className={inputClass} type="email" value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
                        </Field>
                        <Field label={editing.id ? 'New password (leave blank to keep)' : 'Password'} error={error.fields.password}>
                            <input className={inputClass} type="password" value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} />
                        </Field>
                        {!isSelf && can('view_roles') && (
                            <Field group label="Roles" error={roleError}>
                                <div className="space-y-1 rounded border p-2">
                                    {roles.data?.data?.map((r) => (
                                        <label key={r.id} className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" checked={values.roles.includes(r.id)} onChange={() => toggleRole(r.id)} />
                                            {r.name} {r.is_system && <span className="text-xs text-gray-500">(system)</span>}
                                        </label>
                                    ))}
                                </div>
                            </Field>
                        )}
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
