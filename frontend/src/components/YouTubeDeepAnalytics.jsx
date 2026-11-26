import { useState } from 'react';
import { socialApi } from '../api/social';

function formatAvgDuration(seconds) {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function YouTubeDeepAnalytics({ deep, showSubscribers = false }) {
    const [reconnecting, setReconnecting] = useState(false);

    if (!deep) return null;

    const handleReconnect = async () => {
        setReconnecting(true);
        try {
            const { url } = await socialApi.getOAuthUrl('youtube');
            window.location.href = url;
        } finally {
            setReconnecting(false);
        }
    };

    if (!deep.enabled) {
        return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3 text-sm text-indigo-900">
                <span>{deep.reason || 'Reconnect your YouTube channel to enable Watch Time, Daily Trends & Traffic Sources.'}</span>
                <button
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {reconnecting ? 'Redirecting…' : 'Reconnect YouTube'}
                </button>
            </div>
        );
    }

    const { totals, daily = [], traffic_sources: traffic = [] } = deep;
    const maxViews = Math.max(1, ...daily.map((d) => d.views));
    const maxTrafficViews = Math.max(1, ...traffic.map((t) => t.views));

    return (
        <div className="space-y-4">
            {totals && (
                <div className={`grid grid-cols-2 gap-3 ${showSubscribers ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-gray-500">Views (Last 28d)</div>
                        <div className="mt-1 text-xl font-bold">{totals.views.toLocaleString()}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-gray-500">Watch Time (Last 28d)</div>
                        <div className="mt-1 text-xl font-bold">{totals.watch_hours.toLocaleString()} hrs</div>
                        <div className="text-xs text-gray-400">{totals.watch_minutes.toLocaleString()} mins</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-gray-500">Avg View Duration</div>
                        <div className="mt-1 text-xl font-bold">{formatAvgDuration(totals.avg_view_duration_seconds)}</div>
                    </div>
                    {showSubscribers && (
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="text-xs text-gray-500">Net Subscribers (28d)</div>
                            <div className={`mt-1 text-xl font-bold ${totals.net_subscribers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {totals.net_subscribers >= 0 ? `+${totals.net_subscribers.toLocaleString()}` : totals.net_subscribers.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-400">
                                +{totals.subscribers_gained} / -{totals.subscribers_lost}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Daily Views Trend (Last 28 Days)</h3>
                        <span className="text-xs text-gray-400">Hover bars for daily details</span>
                    </div>
                    {daily.length === 0 ? (
                        <p className="text-xs text-gray-500">No daily data available for this period.</p>
                    ) : (
                        <div className="flex h-36 items-end gap-1 pt-2">
                            {daily.map((d) => {
                                const heightPct = Math.max(4, Math.round((d.views / maxViews) * 100));
                                return (
                                    <div
                                        key={d.date}
                                        title={`${d.date}: ${d.views.toLocaleString()} views · ${d.watch_minutes.toLocaleString()} watch mins`}
                                        className="group relative flex flex-1 flex-col items-center justify-end h-full"
                                    >
                                        <div
                                            style={{ height: `${heightPct}%` }}
                                            className="w-full rounded-t bg-indigo-500 transition-colors group-hover:bg-indigo-700"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {daily.length > 0 && (
                        <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
                            <span>{daily[0].date}</span>
                            <span>{daily[daily.length - 1].date}</span>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">Traffic Sources (28d)</h3>
                    {traffic.length === 0 ? (
                        <p className="text-xs text-gray-500">No traffic source breakdown yet.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {traffic.map((t) => {
                                const widthPct = Math.max(4, Math.round((t.views / maxTrafficViews) * 100));
                                return (
                                    <div key={t.source} className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="capitalize text-gray-700">{t.source}</span>
                                            <span className="font-medium text-gray-900">{t.views.toLocaleString()}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                                            <div
                                                style={{ width: `${widthPct}%` }}
                                                className="h-1.5 rounded-full bg-violet-500"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
