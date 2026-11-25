import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/resource';
import { humanize, money, when } from '../lib/format';
import { STATUSES, label } from '../lib/leads';
import { formatMoney } from '../lib/money';

const Card = ({ title, value, hint }) => (
    <div className="rounded border bg-white p-4">
        <div className="text-xs uppercase text-gray-500">{title}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
);

// Plain CSS bars: created vs won leads per month.
function MonthlyBars({ months }) {
    const max = Math.max(1, ...months.map((m) => m.created));
    return (
        <div className="flex h-40 items-end gap-3">
            {months.map((m) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1" title={`${m.created} created, ${m.won} won`}>
                    <div className="flex h-32 w-full items-end gap-1">
                        <div className="w-1/2 rounded-t bg-blue-400" style={{ height: `${(m.created / max) * 100}%` }} />
                        <div className="w-1/2 rounded-t bg-green-500" style={{ height: `${(m.won / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{m.label}</span>
                </div>
            ))}
        </div>
    );
}

export default function Dashboard() {
    const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });
    if (isLoading) return <p>Loading…</p>;
    if (isError) return <p className="text-sm text-red-600">Could not load the dashboard.</p>;
    const { leads, receivables, contacts, companies, campaigns, recent_activity: activity } = data;

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-semibold">Dashboard</h1>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {receivables && <Card title="Outstanding" value={formatMoney(receivables.outstanding_minor, receivables.currency ?? 'INR')} hint={`${receivables.draft_count} draft invoices`} />}
                {receivables && <Card title="Overdue" value={formatMoney(receivables.overdue_minor, receivables.currency ?? 'INR')} hint={`${receivables.overdue_count} invoices`} />}
                {receivables && <Card title="Collected this month" value={formatMoney(receivables.collected_this_month_minor, receivables.currency ?? 'INR')} />}
                {leads && <Card title="Leads" value={leads.total} hint={`${leads.new_this_month} new this month`} />}
                {leads && <Card title="Conversion rate" value={`${leads.conversion_rate}%`} hint={`${leads.won} won`} />}
                {leads && <Card title="Open pipeline" value={money(leads.open_pipeline_value)} hint="new, contacted, qualified" />}
                {leads && <Card title="Won value" value={money(leads.won_value)} />}
                {contacts && <Card title="Contacts" value={contacts.total} hint={`${contacts.unsubscribed} unsubscribed`} />}
                {companies && <Card title="Companies" value={companies.total} />}
                {campaigns && <Card title="Emails sent (30d)" value={campaigns.emails_sent_30d} hint={`${campaigns.open_rate_30d}% opened`} />}
                {campaigns && <Card title="Campaigns" value={campaigns.total} />}
            </div>

            {leads && (
                <div className="grid gap-4 lg:grid-cols-2">
                    <section className="rounded border bg-white p-4">
                        <h2 className="mb-3 font-medium">Leads per month <span className="ml-2 text-xs font-normal text-gray-500"><span className="text-blue-500">■</span> created <span className="text-green-600">■</span> won</span></h2>
                        <MonthlyBars months={leads.per_month} />
                    </section>
                    <section className="rounded border bg-white p-4">
                        <h2 className="mb-3 font-medium">Pipeline by status</h2>
                        <ul className="space-y-1 text-sm">
                            {STATUSES.map((s) => (
                                <li key={s.value} className="flex justify-between"><span>{label(STATUSES, s.value)}</span><span>{leads.by_status[s.value] ?? 0}</span></li>
                            ))}
                        </ul>
                        <Link to="/leads" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Open leads →</Link>
                    </section>
                </div>
            )}

            {activity && (
                <section className="rounded border bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-medium">Recent activity</h2>
                        <Link to="/activity-logs" className="text-sm text-blue-600 hover:underline">View all</Link>
                    </div>
                    {activity.length === 0 && <p className="text-sm text-gray-500">Nothing yet.</p>}
                    <ul className="divide-y text-sm">
                        {activity.map((a) => (
                            <li key={a.id} className="flex justify-between gap-4 py-2">
                                <span>{a.user?.name ?? 'System'} · {a.description || humanize(a.action)}</span>
                                <span className="shrink-0 text-gray-500">{when(a.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
