import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { socialApi } from '../api/social';
import YouTubeDeepAnalytics from '../components/YouTubeDeepAnalytics';

function platformBadge(platform) {
    return platform === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-pink-100 text-pink-700';
}

function formatDuration(seconds) {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function ChannelAnalytics() {
    const { id } = useParams();
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['social-account-analytics', id],
        queryFn: () => socialApi.getAccountAnalytics(id, false),
        enabled: Boolean(id),
    });

    const refreshMut = useMutation({
        mutationFn: () => socialApi.getAccountAnalytics(id, true),
        onSuccess: (fresh) => {
            qc.setQueryData(['social-account-analytics', id], fresh);
        },
    });

    const recentItems = data?.recent_items ?? [];

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = recentItems.filter((item) => {
            if (typeFilter !== 'all' && item.type !== typeFilter) return false;
            if (q && !item.title.toLowerCase().includes(q)) return false;
            return true;
        });

        const sorted = [...list];
        if (sortBy === 'views') sorted.sort((a, b) => b.views - a.views);
        else if (sortBy === 'likes') sorted.sort((a, b) => b.likes - a.likes);
        else if (sortBy === 'engagement') sorted.sort((a, b) => b.engagement_rate - a.engagement_rate);
        else sorted.sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

        return sorted;
    }, [recentItems, search, typeFilter, sortBy]);

    if (isLoading) {
        return <div className="p-6 text-sm text-gray-500">Loading channel analytics…</div>;
    }

    if (isError || !data) {
        return (
            <div className="space-y-4">
                <Link to="/social" className="text-sm text-indigo-600 hover:underline">
                    ← Back to Growth Studio
                </Link>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error?.response?.data?.message || 'Unable to load channel analytics.'}
                </div>
            </div>
        );
    }

    const { account, summary, studio, source, synced_at: syncedAt, channel_meta: meta, top_items: topItems, deep_analytics: deepAnalytics, warning } = data;

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    {account.avatar_url && (
                        <img
                            src={account.avatar_url}
                            alt={account.account_name}
                            className="h-14 w-14 rounded-full border object-cover"
                        />
                    )}
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">{account.account_name}</h1>
                            <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${platformBadge(account.platform)}`}>
                                {account.platform}
                            </span>
                            <span className={`rounded px-2 py-0.5 text-xs ${source === 'live' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {source === 'live' ? 'Live API' : 'DB Cache'}
                            </span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {account.handle}
                            {account.niche ? ` · ${account.niche}` : ''}
                            {meta?.country ? ` · ${meta.country}` : ''}
                            {meta?.published_at ? ` · Joined ${new Date(meta.published_at).toLocaleDateString()}` : ''}
                            {syncedAt ? ` · Synced ${new Date(syncedAt).toLocaleString()}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to="/social"
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        ← Growth Studio
                    </Link>
                    {meta?.channel_url && (
                        <a
                            href={meta.channel_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Open Channel ↗
                        </a>
                    )}
                    <button
                        onClick={() => refreshMut.mutate()}
                        disabled={refreshMut.isPending}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {refreshMut.isPending ? 'Refreshing from YT…' : 'Refresh from YT'}
                    </button>
                </div>
            </div>

            {warning && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    {warning}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Subscribers / Followers</div>
                    <div className="mt-1 text-2xl font-bold">{summary.followers_count.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Total Channel Views</div>
                    <div className="mt-1 text-2xl font-bold">{summary.views_count.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Total Videos / Posts</div>
                    <div className="mt-1 text-2xl font-bold">{summary.posts_count.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Avg Views (Last {summary.recent_videos_count})</div>
                    <div className="mt-1 text-2xl font-bold">{summary.avg_views_per_video.toLocaleString()}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Engagement Rate</div>
                    <div className="mt-1 text-2xl font-bold">{summary.engagement_rate}%</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Shorts / Long-form</div>
                    <div className="mt-1 text-2xl font-bold">
                        {summary.shorts_count} / {summary.long_form_count}
                    </div>
                </div>
            </div>

            {account.platform === 'youtube' && (
                <YouTubeDeepAnalytics deep={deepAnalytics} showSubscribers />
            )}

            {studio && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-gray-500">Studio Planned Content</div>
                        <div className="mt-1 text-xl font-semibold">{studio.planned_contents}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-gray-500">Studio Published</div>
                        <div className="mt-1 text-xl font-semibold">{studio.published_contents}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="text-xs text-gray-500">Avg Studio SEO Score</div>
                        <div className="mt-1 text-xl font-semibold">{studio.avg_seo_score}/100</div>
                    </div>
                </div>
            )}

            {topItems.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-gray-900">Top Performing Uploads</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {topItems.map((item) => (
                            <Link
                                key={item.id}
                                to={`/social/accounts/${id}/videos/${item.id}/analytics`}
                                target="_blank"
                                rel="noreferrer"
                                className="group rounded-lg border border-gray-100 p-2.5 hover:border-indigo-200 hover:bg-indigo-50/30"
                            >
                                {item.thumbnail_url && (
                                    <img
                                        src={item.thumbnail_url}
                                        alt=""
                                        className="mb-2 aspect-video w-full rounded object-cover"
                                    />
                                )}
                                <div className="line-clamp-2 text-xs font-semibold text-gray-900 group-hover:text-indigo-600">
                                    {item.title}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                    {item.views.toLocaleString()} views · {item.engagement_rate}% eng
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {recentItems.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-gray-900">
                            Uploads Performance ({filteredItems.length} of {recentItems.length})
                        </h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search videos…"
                                className="rounded-lg border px-3 py-1.5 text-xs"
                            />
                            <select
                                value={typeFilter}
                                onChange={(e) => {
                                    setTypeFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg border px-2.5 py-1.5 text-xs"
                            >
                                <option value="all">All Types</option>
                                <option value="video">Videos Only</option>
                                <option value="short">Shorts Only</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg border px-2.5 py-1.5 text-xs"
                            >
                                <option value="newest">Newest First</option>
                                <option value="views">Most Viewed</option>
                                <option value="likes">Most Liked</option>
                                <option value="engagement">Highest Engagement</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <table className="min-w-full divide-y divide-gray-100 text-sm">
                            <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">Video / Post</th>
                                    <th className="px-3 py-2">Type</th>
                                    <th className="px-3 py-2">Duration</th>
                                    <th className="px-3 py-2">Published</th>
                                    <th className="px-3 py-2 text-right">Views</th>
                                    <th className="px-3 py-2 text-right">Likes</th>
                                    <th className="px-3 py-2 text-right">Comments</th>
                                    <th className="px-3 py-2 text-right">Eng %</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {pagedItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2.5">
                                                {item.thumbnail_url && (
                                                    <img
                                                        src={item.thumbnail_url}
                                                        alt=""
                                                        className="h-9 w-16 flex-shrink-0 rounded object-cover"
                                                    />
                                                )}
                                                <Link
                                                    to={`/social/accounts/${id}/videos/${item.id}/analytics`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="line-clamp-2 font-medium text-indigo-700 hover:underline"
                                                    title="Open video analytics in a new tab"
                                                >
                                                    {item.title}
                                                </Link>
                                                {item.url && (
                                                    <a
                                                        href={item.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="ml-1 flex-shrink-0 text-xs text-gray-400 hover:text-gray-600"
                                                        title="Watch on YouTube"
                                                    >
                                                        ↗
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-700">
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                                            {formatDuration(item.duration_seconds)}
                                        </td>
                                        <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                                            {item.published_at ? new Date(item.published_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right font-medium">{item.views.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right">{item.likes.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right">{item.comments.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right">{item.engagement_rate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="rounded border px-2.5 py-1 hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="rounded border px-2.5 py-1 hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
