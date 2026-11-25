import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { campaignsApi } from '../api/resource';
import StatusBadge from '../components/StatusBadge';
import { Button, Field, Modal, Pagination, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { parseApiError } from '../lib/errors';
import { BodyPreview, CampaignForm } from './Campaigns';

const Stat = ({ label, value }) => (
    <div className="rounded border bg-white p-3 text-center">
        <div className="text-2xl font-semibold">{value ?? 0}</div>
        <div className="text-xs text-gray-500">{label}</div>
    </div>
);

export default function CampaignDetail() {
    const { id } = useParams();
    const { can } = useMe();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [scheduling, setScheduling] = useState(false);
    const [when, setWhen] = useState('');
    const [message, setMessage] = useState(null);
    const [page, setPage] = useState(1);

    // Poll while the campaign is going out.
    const campaign = useQuery({
        queryKey: ['email-campaigns', 'detail', id],
        queryFn: () => campaignsApi.get(id),
        refetchInterval: (q) => (['queued', 'sending', 'scheduled'].includes(q.state.data?.status) ? 4000 : false),
    });
    const deliveries = useQuery({
        queryKey: ['email-campaigns', 'deliveries', id, page],
        queryFn: () => campaignsApi.deliveries(id, { page }),
        refetchInterval: ['queued', 'sending'].includes(campaign.data?.status) ? 4000 : false,
    });

    const refresh = () => qc.invalidateQueries({ queryKey: ['email-campaigns'] });
    const run = (fn, ok) => useMutation({
        mutationFn: fn,
        onSuccess: () => { setMessage({ ok: true, text: ok }); refresh(); },
        onError: (err) => {
            const e = parseApiError(err);
            setMessage({ ok: false, text: Object.values(e.fields)[0] ?? e.message });
        },
    });
    const send = run(() => campaignsApi.send(id), 'Campaign queued for sending.');
    const schedule = run(() => campaignsApi.schedule(id, new Date(when).toISOString()), 'Campaign scheduled.');
    const cancel = run(() => campaignsApi.cancel(id), 'Schedule cancelled.');
    const del = useMutation({
        mutationFn: () => campaignsApi.remove(id),
        onSuccess: () => { refresh(); navigate('/campaigns'); },
        onError: (err) => setMessage({ ok: false, text: Object.values(parseApiError(err).fields)[0] ?? parseApiError(err).message }),
    });

    if (campaign.isLoading) return <p>Loading…</p>;
    if (campaign.isError) return <p className="text-red-600">Campaign not found.</p>;
    const c = campaign.data;
    const s = c.stats ?? {};

    return (
        <div className="space-y-6">
            <div>
                <Link to="/campaigns" className="text-sm text-blue-600 hover:underline">← Campaigns</Link>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                    <h1 className="text-xl font-semibold">{c.name}</h1>
                    <StatusBadge status={c.status} />
                    {c.scheduled_at && c.status === 'scheduled' && <span className="text-sm text-gray-600">for {new Date(c.scheduled_at).toLocaleString()}</span>}
                </div>
                <p className="text-sm text-gray-600">Subject: {c.subject} · Lists: {c.prospect_lists.map((l) => l.name).join(', ')}</p>
            </div>

            {message && <p className={`text-sm ${message.ok ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>}

            <div className="flex flex-wrap gap-2">
                {c.editable && can('edit_campaign') && <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>}
                {c.editable && can('send_campaign') && <Button disabled={send.isPending} onClick={() => window.confirm(`Send to ${s.recipients} recipients now?`) && send.mutate()}>Send now</Button>}
                {c.editable && can('send_campaign') && <Button variant="secondary" onClick={() => setScheduling(true)}>Schedule…</Button>}
                {c.status === 'scheduled' && can('send_campaign') && <Button variant="secondary" onClick={() => cancel.mutate()}>Cancel schedule</Button>}
                {can('delete_campaign') && !['queued', 'sending'].includes(c.status) && (
                    <Button variant="danger" onClick={() => window.confirm('Delete this campaign?') && del.mutate()}>Delete</Button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                <Stat label="Recipients" value={s.recipients} /><Stat label="Sent" value={s.sent} /><Stat label="Delivered" value={s.delivered} />
                <Stat label="Opened" value={s.opened} /><Stat label="Clicked" value={s.clicked} /><Stat label="Failed" value={s.failed} />
            </div>

            <div>
                <h2 className="mb-2 font-medium">Preview</h2>
                <BodyPreview html={c.body} />
            </div>

            <div>
                <h2 className="mb-2 font-medium">Deliveries</h2>
                <div className="overflow-x-auto rounded border bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-gray-50"><tr><th className="px-4 py-2">Recipient</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Sent</th><th className="px-4 py-2">Error</th></tr></thead>
                        <tbody>
                            {deliveries.data?.data?.map((d) => (
                                <tr key={d.id} className="border-b last:border-0">
                                    <td className="px-4 py-2">{d.recipient_name} <span className="text-gray-500">{d.recipient_email}</span></td>
                                    <td className="px-4 py-2 capitalize">{d.status}</td>
                                    <td className="px-4 py-2">{d.sent_at ? new Date(d.sent_at).toLocaleString() : '—'}</td>
                                    <td className="px-4 py-2 text-red-600">{d.error_message}</td>
                                </tr>
                            ))}
                            {deliveries.data?.data?.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No emails sent yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
                <Pagination meta={deliveries.data?.meta} onPage={setPage} />
            </div>

            {editing && <CampaignForm campaign={c} onClose={() => setEditing(false)} onSaved={() => { setEditing(false); refresh(); }} />}
            {scheduling && (
                <Modal title="Schedule campaign" onClose={() => setScheduling(false)}>
                    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); schedule.mutate(undefined, { onSuccess: () => setScheduling(false) }); }}>
                        <Field label="Send at (your local time)"><input className={inputClass} type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required /></Field>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="secondary" onClick={() => setScheduling(false)}>Cancel</Button>
                            <Button type="submit" disabled={schedule.isPending}>Schedule</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
