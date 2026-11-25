export const money = (n) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n ?? 0);
export const when = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
export const humanize = (s) => (s ?? '').replace(/_/g, ' ');
