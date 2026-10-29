const STYLES = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    queued: 'bg-yellow-100 text-yellow-700',
    sending: 'bg-yellow-100 text-yellow-700',
    sent: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
    return <span className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STYLES[status] ?? STYLES.draft}`}>{status}</span>;
}
