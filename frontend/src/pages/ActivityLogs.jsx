import { Fragment, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { activityLogsApi } from '../api/resource';
import { Pagination, inputClass } from '../components/ui';
import { humanize, when } from '../lib/format';

export default function ActivityLogs() {
    const [filters, setFilters] = useState({ user_id: '', action: '', entity: '', from: '', to: '' });
    const [page, setPage] = useState(1);
    const [open, setOpen] = useState(null);

    const options = useQuery({ queryKey: ['activity-logs', 'filters'], queryFn: activityLogsApi.filters });
    const logs = useQuery({
        queryKey: ['activity-logs', filters, page],
        queryFn: () => activityLogsApi.list({ page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }),
        placeholderData: keepPreviousData,
    });

    const set = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };
    const rows = logs.data?.data ?? [];

    return (
        <div>
            <h1 className="mb-4 text-xl font-semibold">Activity log</h1>
            <div className="mb-4 flex flex-wrap gap-3 text-sm">
                <select className={`${inputClass} w-auto`} value={filters.user_id} onChange={set('user_id')}>
                    <option value="">All users</option>
                    {options.data?.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select className={`${inputClass} w-auto`} value={filters.action} onChange={set('action')}>
                    <option value="">All actions</option>
                    {options.data?.actions.map((a) => <option key={a} value={a}>{humanize(a)}</option>)}
                </select>
                <select className={`${inputClass} w-auto`} value={filters.entity} onChange={set('entity')}>
                    <option value="">All records</option>
                    {options.data?.entities.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <input className={`${inputClass} w-auto`} type="date" aria-label="From" value={filters.from} onChange={set('from')} />
                <input className={`${inputClass} w-auto`} type="date" aria-label="To" value={filters.to} onChange={set('to')} />
            </div>
            {logs.isError && <p className="text-sm text-red-600">Could not load the activity log.</p>}
            <div className="overflow-x-auto rounded border bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50">
                        <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">User</th><th className="px-4 py-2">Action</th><th className="px-4 py-2">Record</th><th className="px-4 py-2" /></tr>
                    </thead>
                    <tbody>
                        {rows.map((l) => (
                            <Fragment key={l.id}>
                                <tr className="border-b">
                                    <td className="whitespace-nowrap px-4 py-2">{when(l.created_at)}</td>
                                    <td className="px-4 py-2">{l.user?.name ?? 'System'}</td>
                                    <td className="px-4 py-2">{l.description || humanize(l.action)}</td>
                                    <td className="px-4 py-2">{l.entity ? `${l.entity}${l.entity_id ? ` #${l.entity_id}` : ''}` : '—'}</td>
                                    <td className="px-4 py-2 text-right">
                                        {Object.keys(l.properties ?? {}).length > 0 && (
                                            <button className="text-blue-600 hover:underline" onClick={() => setOpen(open === l.id ? null : l.id)}>{open === l.id ? 'Hide' : 'Details'}</button>
                                        )}
                                    </td>
                                </tr>
                                {open === l.id && (
                                    <tr className="border-b bg-gray-50"><td colSpan={5} className="px-4 py-2"><pre className="overflow-x-auto text-xs">{JSON.stringify(l.properties, null, 2)}</pre></td></tr>
                                )}
                            </Fragment>
                        ))}
                        {!logs.isLoading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No activity found.</td></tr>}
                    </tbody>
                </table>
            </div>
            <Pagination meta={logs.data?.meta} onPage={setPage} />
        </div>
    );
}
