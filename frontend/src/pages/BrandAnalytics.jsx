import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { socialApi } from '../api/social';

function platformBadge(platform) {
    if (platform === 'youtube') return 'bg-red-100 text-red-700';
    if (platform === 'facebook') return 'bg-blue-100 text-blue-700';
    return 'bg-pink-100 text-pink-700';
}

export default function BrandAnalytics() {
    const { id } = useParams();
    const qc = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['social-brand-analytics', id],
        queryFn: () => socialApi.getBrandAnalytics(id, false),
        enabled: Boolean(id),
    });

    const refreshMut = useMutation({
        mutationFn: () => socialApi.getBrandAnalytics(id, true),
        onSuccess: (fresh) => qc.setQueryData(['social-brand-analytics', id], fresh),
    });

    if (isLoading) return <div className="p-6 text-sm text-gray-500">Loading brand analytics…</div>;

    if (isError || !data) {
        return (
            <div className="space-y-4">
                <Link to="/social" className="text-sm text-indigo-600 hover:underline">
                    ← Back to Growth Studio
                </Link>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error?.response?.data?.message || 'Unable to load brand analytics.'}
                </div>
            </div>
        );
    }

    const { brand, totals, channels, top_items: topItems, source } = data;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-gray-900">{brand.name}</h1>
                        <span className={`rounded px-2 py-0.5 text-xs ${source === 'live' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {source === 'live' ? 'Live API' : 'DB Cache'}
                        </span>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">
                        {brand.niche || 'Multi-Platform Social Brand'} · {totals.channels_count} connected channel(s)
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to="/social"
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        ← Growth Studio
                    </Link>
                    <button
                        onClick={() => refreshMut.mutate()}
                        disabled={refreshMut.isPending}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {refreshMut.isPending ? 'Refreshing All…' : 'Refresh All Channels'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Total Followers / Subs</div>
                    <div className="mt-1 text-2xl font-bold">{totals.followers_count.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Total Views</div>
                    <div className="mt-1 text-2xl font-bold">{totals.views_count.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Total Posts / Videos</div>
                    <div className="mt-1 text-2xl font-bold">{totals.posts_count.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Avg Engagement Rate</div>
                    <div className="mt-1 text-2xl font-bold">{totals.avg_engagement_rate}%</div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <h2 className="text-base font-semibold text-gray-900">Platform Breakdown</h2>
                <div className="grid gap-3 md:grid-cols-3">
                    {channels.map((ch) => (
                        <Link
                            key={ch.account.id}
                            to={`/social/accounts/${ch.account.id}/analytics`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/20"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${platformBadge(ch.account.platform)}`}>
                                    {ch.account.platform}
                                </span>
                                <span className="text-xs text-indigo-600">Details ↗</span>
                            </div>
                            <div className="mt-2 font-semibold text-gray-900">{ch.account.account_name}</div>
                            <div className="text-xs text-gray-500">{ch.account.handle}</div>
                            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-2 text-center text-xs">
                                <div>
                                    <div className="text-gray-500">Followers</div>
                                    <div className="font-bold">{(ch.summary?.followers_count ?? 0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Views</div>
                                    <div className="font-bold">{(ch.summary?.views_count ?? 0).toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Eng %</div>
                                    <div className="font-bold">{ch.summary?.engagement_rate ?? 0}%</div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {topItems.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                    <h2 className="text-base font-semibold text-gray-900">Top Content Across All Platforms</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {topItems.map((item) => (
                            <Link
                                key={`${item.account_id}-${item.id}`}
                                to={`/social/accounts/${item.account_id}/videos/${item.id}/analytics`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl border border-gray-100 p-3 hover:border-indigo-200 hover:bg-indigo-50/20"
                            >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${platformBadge(item.platform)}`}>
                                        {item.platform}
                                    </span>
                                    <span className="text-[11px] text-gray-400">{item.account_name}</span>
                                </div>
                                {item.thumbnail_url && (
                                    <img src={item.thumbnail_url} alt="" className="mb-2 aspect-video w-full rounded object-cover" />
                                )}
                                <div className="line-clamp-2 text-xs font-semibold text-gray-900">{item.title}</div>
                                <div className="mt-1 text-xs text-gray-500">
                                    {item.views > 0 ? `${item.views.toLocaleString()} views · ` : ''}
                                    {item.likes.toLocaleString()} likes · {item.engagement_rate}% eng
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
