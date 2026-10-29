import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { campaignsApi, prospectListsApi } from '../api/resource';
import ResourceTable from '../components/ResourceTable';
import StatusBadge from '../components/StatusBadge';
import { Button, Field, Modal, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { useResourceList } from '../hooks/useResourceList';
import { parseApiError } from '../lib/errors';

export const EMPTY = { name: '', subject: '', body: '<p>Hello,</p>', prospect_list_ids: [] };

// Body is HTML; the server sanitizes it. The preview runs in a sandboxed iframe (no scripts).
export const BodyPreview = ({ html }) => (
    <iframe title="Preview" sandbox="" srcDoc={html} className="h-48 w-full rounded border bg-white" />
);

export function CampaignForm({ campaign, onClose, onSaved }) {
    const [values, setValues] = useState(campaign
        ? { name: campaign.name, subject: campaign.subject, body: campaign.body, prospect_list_ids: campaign.prospect_lists.map((l) => l.id) }
        : EMPTY);
    const [error, setError] = useState({ fields: {} });
    const [saving, setSaving] = useState(false);
    const lists = useQuery({ queryKey: ['prospect-lists', 'options'], queryFn: () => prospectListsApi.list({ per_page: 100 }) });
    const listError = Object.entries(error.fields).find(([k]) => k.startsWith('prospect_list_ids'))?.[1];

    const toggle = (id) => setValues((v) => ({
        ...v, prospect_list_ids: v.prospect_list_ids.includes(id) ? v.prospect_list_ids.filter((x) => x !== id) : [...v.prospect_list_ids, id],
    }));

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const saved = campaign ? await campaignsApi.update(campaign.id, values) : await campaignsApi.create(values);
            onSaved(saved);
        } catch (err) {
            setError(parseApiError(err));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal title={campaign ? 'Edit campaign' : 'New campaign'} onClose={onClose}>
            <form onSubmit={submit} className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
                {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
                {error.fields.status && <p className="text-sm text-red-600">{error.fields.status}</p>}
                <Field label="Name" error={error.fields.name}><input className={inputClass} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} /></Field>
                <Field label="Subject" error={error.fields.subject}><input className={inputClass} value={values.subject} onChange={(e) => setValues({ ...values, subject: e.target.value })} /></Field>
                <Field group label="Send to lists" error={listError}>
                    <div className="max-h-32 overflow-y-auto rounded border p-2">
                        {lists.data?.data?.map((l) => (
                            <label key={l.id} className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={values.prospect_list_ids.includes(l.id)} onChange={() => toggle(l.id)} />
                                {l.name} <span className="text-gray-500">({l.contacts_count})</span>
                            </label>
                        ))}
                    </div>
                </Field>
                <Field label="Body (HTML)" error={error.fields.body}>
                    <textarea className={`${inputClass} font-mono text-xs`} rows={8} value={values.body} onChange={(e) => setValues({ ...values, body: e.target.value })} />
                </Field>
                <BodyPreview html={values.body} />
                <p className="text-xs text-gray-500">An unsubscribe link is added to every email automatically. Unsafe HTML (scripts, event handlers) is removed on save.</p>
                <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={saving}>Save</Button>
                </div>
            </form>
        </Modal>
    );
}

export default function Campaigns() {
    const { can } = useMe();
    const navigate = useNavigate();
    const [status, setStatus] = useState('');
    const state = useResourceList('email-campaigns', campaignsApi, { filters: { status: status || undefined } });
    const [creating, setCreating] = useState(false);

    const remove = async (c) => {
        if (!window.confirm(`Delete campaign ${c.name}?`)) return;
        try {
            await state.remove.mutateAsync(c.id);
        } catch (err) {
            const e = parseApiError(err);
            window.alert(e.fields.status ?? e.message);
        }
    };

    return (
        <>
            <ResourceTable title="Campaigns" state={state}
                columns={[
                    { label: 'Name', render: (c) => <button className="text-blue-700 hover:underline" onClick={() => navigate(`/campaigns/${c.id}`)}>{c.name}</button> },
                    { label: 'Subject', render: (c) => c.subject },
                    { label: 'Status', render: (c) => <StatusBadge status={c.status} /> },
                    { label: 'Lists', render: (c) => c.prospect_lists?.map((l) => l.name).join(', ') },
                ]}
                canCreate={can('create_campaign')} canDelete={can('delete_campaign')} canEdit={false}
                onCreate={() => setCreating(true)} onDelete={remove}
                toolbar={
                    <select className="mb-4 rounded border p-2 text-sm" value={status} onChange={(e) => { setStatus(e.target.value); state.setPage(1); }}>
                        <option value="">All statuses</option>
                        {['draft', 'scheduled', 'queued', 'sending', 'sent', 'failed'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                } />
            {creating && <CampaignForm onClose={() => setCreating(false)} onSaved={(c) => navigate(`/campaigns/${c.id}`)} />}
        </>
    );
}
