import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsApi, prospectListsApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import { Button, Field, Modal, Pagination, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';

function Members({ list, canEdit, onClose }) {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [picked, setPicked] = useState([]);
    const members = useQuery({ queryKey: ['prospect-lists', list.id, 'members', page], queryFn: () => prospectListsApi.members(list.id, { page }) });
    const candidates = useQuery({
        queryKey: ['contacts', 'picker', search],
        queryFn: () => contactsApi.list({ search: search || undefined, per_page: 10 }),
        enabled: canEdit,
    });
    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['prospect-lists'] });
        setPicked([]);
    };
    const add = useMutation({ mutationFn: () => prospectListsApi.addContacts(list.id, picked), onSuccess: refresh });
    const remove = useMutation({ mutationFn: (id) => prospectListsApi.removeContacts(list.id, [id]), onSuccess: refresh });

    const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

    return (
        <Modal title={`Members of ${list.name}`} onClose={onClose}>
            <div className="max-h-[70vh] space-y-4 overflow-y-auto">
                <div className="rounded border">
                    {members.data?.data?.map((c) => (
                        <div key={c.id} className="flex items-center justify-between border-b px-3 py-2 text-sm last:border-0">
                            <span>{c.name} <span className="text-gray-500">{c.email}</span>{c.unsubscribed && <span className="ml-2 text-xs text-red-600">unsubscribed</span>}</span>
                            {canEdit && <Button variant="danger" onClick={() => remove.mutate(c.id)}>Remove</Button>}
                        </div>
                    ))}
                    {members.data?.data?.length === 0 && <p className="p-3 text-sm text-gray-500">No contacts yet.</p>}
                </div>
                <Pagination meta={members.data?.meta} onPage={setPage} />
                {canEdit && (
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Add contacts</div>
                        <input className={inputClass} placeholder="Search contacts…" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <div className="max-h-40 overflow-y-auto rounded border">
                            {candidates.data?.data?.map((c) => (
                                <label key={c.id} className="flex items-center gap-2 px-3 py-1 text-sm">
                                    <input type="checkbox" checked={picked.includes(c.id)} onChange={() => toggle(c.id)} />{c.name} <span className="text-gray-500">{c.email}</span>
                                </label>
                            ))}
                        </div>
                        <Button disabled={!picked.length || add.isPending} onClick={() => add.mutate()}>Add {picked.length || ''} selected</Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default function ProspectLists() {
    const { can } = useMe();
    const state = useResourceList('prospect-lists', prospectListsApi);
    const [editing, setEditing] = useState(null);
    const [values, setValues] = useState({ name: '', description: '' });
    const [error, setError] = useState({ fields: {} });
    const [viewing, setViewing] = useState(null);

    const open = (l) => {
        setValues(l ? { name: l.name, description: l.description ?? '' } : { name: '', description: '' });
        setError({ fields: {} });
        setEditing(l ?? {});
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

    const remove = async (l) => {
        if (!window.confirm(`Delete list ${l.name}? Contacts are kept.`)) return;
        try {
            await state.remove.mutateAsync(l.id);
        } catch (err) {
            window.alert(parseApiError(err).message);
        }
    };

    return (
        <>
            <ResourceTable title="Prospect lists" state={state}
                columns={[
                    { label: 'Name', render: (l) => <button className="text-blue-700 hover:underline" onClick={() => setViewing(l)}>{l.name}</button> },
                    { label: 'Description', render: (l) => l.description },
                    { label: 'Contacts', render: (l) => l.contacts_count },
                ]}
                canCreate={can('create_prospect_lists')} canEdit={can('edit_prospect_lists')} canDelete={can('delete_prospect_lists')}
                onCreate={() => open(null)} onEdit={open} onDelete={remove} />

            {editing && (
                <Modal title={editing.id ? 'Edit list' : 'New list'} onClose={() => setEditing(null)}>
                    <form onSubmit={submit} className="space-y-4">
                        {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                        <Field label="Name" error={error.fields.name}><input className={inputClass} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></Field>
                        <Field label="Description" error={error.fields.description}><textarea className={inputClass} rows={3} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} /></Field>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
                            <Button type="submit" disabled={state.save.isPending}>Save</Button>
                        </div>
                    </form>
                </Modal>
            )}
            {viewing && <Members list={viewing} canEdit={can('edit_prospect_lists')} onClose={() => setViewing(null)} />}
        </>
    );
}
