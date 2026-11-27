import { useMemo, useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const platformBadge = (platform) =>
    platform === 'youtube'
        ? 'bg-red-100 text-red-700'
        : platform === 'facebook'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-pink-100 text-pink-700';

export default function ContentCalendarView({ contents, bestTimes = null, onSelectItem, onRetryItem, canManage = false, isRetrying = false }) {
    const [cursor, setCursor] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const itemsByDate = useMemo(() => {
        const map = {};
        contents.forEach((item) => {
            const rawDate = item.scheduled_at || item.published_at;
            if (!rawDate) return;
            const d = new Date(rawDate);
            if (Number.isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });
        return map;
    }, [contents]);

    const todayKey = (() => {
        const t = new Date();
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    })();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);

    const monthLabel = cursor.toLocaleString('default', { month: 'long', year: 'numeric' });
    const unscheduledCount = contents.filter((c) => !c.scheduled_at && !c.published_at).length;
    const topDays = useMemo(() => {
        const list = bestTimes?.by_day || [];
        return new Set(list.slice(0, 2).map((d) => d.day_index));
    }, [bestTimes]);
    const topSlots = bestTimes?.top_slots || [];

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
            {topSlots.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-amber-900">
                            🔥 Best Posting Slots {bestTimes?.sample_size > 0 ? `(from ${bestTimes.sample_size} posts)` : '(Strategy Defaults)'}:
                        </span>
                        {topSlots.slice(0, 4).map((slot, i) => (
                            <span
                                key={`${slot.label}-${i}`}
                                className="rounded-lg border border-amber-200 bg-white px-2 py-0.5 font-medium text-amber-900"
                            >
                                {slot.label}
                                {slot.avg_views > 0 && ` · ${slot.avg_views.toLocaleString()} avg views`}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h3 className="text-base font-semibold text-gray-900">{monthLabel}</h3>
                    {unscheduledCount > 0 && (
                        <p className="text-xs text-gray-500">
                            {unscheduledCount} unscheduled idea/draft(s) — set a Schedule Date to place them on the calendar.
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setCursor(new Date(year, month - 1, 1))}
                        className="rounded-lg border px-2.5 py-1 text-xs hover:bg-gray-50"
                    >
                        ← Prev
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const d = new Date();
                            setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
                        }}
                        className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-gray-50"
                    >
                        Today
                    </button>
                    <button
                        type="button"
                        onClick={() => setCursor(new Date(year, month + 1, 1))}
                        className="rounded-lg border px-2.5 py-1 text-xs hover:bg-gray-50"
                    >
                        Next →
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-500">
                {DAYS.map((d, idx) => (
                    <div key={d} className="py-1 flex items-center justify-center gap-1">
                        <span>{d}</span>
                        {topDays.has(idx) && <span className="text-[10px] text-amber-600" title="Top performing day">★</span>}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                    if (!day) {
                        return <div key={`empty-${idx}`} className="min-h-24 rounded-lg bg-gray-50/60" />;
                    }
                    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayItems = itemsByDate[key] || [];
                    const isToday = key === todayKey;

                    return (
                        <div
                            key={key}
                            className={`min-h-24 rounded-lg border p-1.5 ${
                                isToday ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-100 bg-white'
                            }`}
                        >
                            <div className={`mb-1 text-right text-[11px] font-semibold ${isToday ? 'text-indigo-700' : 'text-gray-500'}`}>
                                {day}
                            </div>
                            <div className="space-y-1">
                                {dayItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex w-full items-center gap-1 rounded border px-1.5 py-0.5 text-[11px] ${
                                            item.publish_error
                                                ? 'border-red-300 bg-red-50'
                                                : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => onSelectItem(item)}
                                            title={item.publish_error ? `${item.title} (Failed: ${item.publish_error})` : `${item.title} (${item.status})`}
                                            className="flex min-w-0 flex-1 items-center gap-1 text-left"
                                        >
                                            <span className={`rounded px-1 text-[9px] font-bold uppercase flex-shrink-0 ${platformBadge(item.platform)}`}>
                                                {item.platform.slice(0, 2)}
                                            </span>
                                            {item.publish_error && <span className="text-red-600 flex-shrink-0">⚠</span>}
                                            {!item.publish_error && item.status === 'published' && (
                                                <span className="text-green-600 flex-shrink-0">✓</span>
                                            )}
                                            <span className="truncate text-gray-800">{item.title}</span>
                                        </button>
                                        {item.publish_error && canManage && onRetryItem && (
                                            <button
                                                type="button"
                                                disabled={isRetrying}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRetryItem(item);
                                                }}
                                                title="Retry publish now"
                                                className="flex-shrink-0 rounded bg-red-600 px-1 py-0.5 text-[9px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                            >
                                                Retry
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
