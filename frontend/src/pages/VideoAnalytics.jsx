import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { socialApi } from '../api/social';
import YouTubeDeepAnalytics from '../components/YouTubeDeepAnalytics';

function formatDuration(seconds) {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export default function VideoAnalytics() {
    const { id, videoId } = useParams();
    const qc = useQueryClient();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['social-video-analytics', id, videoId],
        queryFn: () => socialApi.getVideoAnalytics(id, videoId, false),
        enabled: Boolean(id && videoId),
    });

    const refreshMut = useMutation({
        mutationFn: () => socialApi.getVideoAnalytics(id, videoId, true),
        onSuccess: (fresh) => {
            qc.setQueryData(['social-video-analytics', id, videoId], fresh);
        },
    });

    if (isLoading) {
        return <div className="p-6 text-sm text-gray-500">Loading video analytics…</div>;
    }

    if (isError || !data) {
        return (
            <div className="space-y-4">
                <Link to={`/social/accounts/${id}/analytics`} className="text-sm text-indigo-600 hover:underline">
                    ← Back to Channel Analytics
                </Link>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error?.response?.data?.message || 'Unable to load video analytics.'}
                </div>
            </div>
        );
    }

    const { account, video, metrics, seo, source, synced_at: syncedAt, deep_analytics: deepAnalytics, recent_comments: comments } = data;
    const isIg = account.platform === 'instagram';

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-wrap items-start gap-4">
                    {video.thumbnail_url && (
                        <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="h-24 w-44 rounded-lg border object-cover flex-shrink-0"
                        />
                    )}
                    <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${isIg ? 'bg-pink-100 text-pink-700' : 'bg-red-100 text-red-700'}`}>
                                {video.type}
                            </span>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-700">
                                {video.definition}
                            </span>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-700">
                                {video.privacy_status}
                            </span>
                            {video.has_captions && (
                                <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">CC</span>
                            )}
                            <span className={`rounded px-2 py-0.5 text-xs ${source === 'live' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {source === 'live' ? 'Live API' : 'DB Cache'}
                            </span>
                        </div>
                        <h1 className="mt-1.5 text-xl font-bold text-gray-900">{video.title}</h1>
                        <p className="mt-1 text-xs text-gray-500">
                            {account.account_name} ({account.handle}) · Duration: {formatDuration(video.duration_seconds)}
                            {video.published_at ? ` · Published ${new Date(video.published_at).toLocaleString()}` : ''}
                            {` (${metrics.days_since_published}d ago)`}
                            {syncedAt ? ` · Synced ${new Date(syncedAt).toLocaleString()}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/social/accounts/${id}/analytics`}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        ← Channel Analytics
                    </Link>
                    {video.url && (
                        <a
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {isIg ? 'View on Instagram ↗' : 'Watch on YouTube ↗'}
                        </a>
                    )}
                    <button
                        onClick={() => refreshMut.mutate()}
                        disabled={refreshMut.isPending}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {refreshMut.isPending ? `Refreshing from ${isIg ? 'IG' : 'YT'}…` : `Refresh from ${isIg ? 'IG' : 'YT'}`}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">{isIg ? (metrics.plays > 0 ? 'Plays' : 'Reach') : 'Views'}</div>
                    <div className="mt-1 text-2xl font-bold">{metrics.views.toLocaleString()}</div>
                    {isIg && metrics.reach > 0 && metrics.plays > 0 && (
                        <div className="text-xs text-gray-400">Reach: {metrics.reach.toLocaleString()}</div>
                    )}
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Likes</div>
                    <div className="mt-1 text-2xl font-bold">{metrics.likes.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">{metrics.like_rate}%</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Comments</div>
                    <div className="mt-1 text-2xl font-bold">{metrics.comments.toLocaleString()}</div>
                    <div className="text-xs text-gray-400">{metrics.comment_rate}%</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">Engagement Rate</div>
                    <div className="mt-1 text-2xl font-bold">{metrics.engagement_rate}%</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">{isIg ? 'Saves / Shares' : 'Views / Day'}</div>
                    <div className="mt-1 text-2xl font-bold">
                        {isIg ? `${(metrics.saved || 0).toLocaleString()} / ${(metrics.shares || 0).toLocaleString()}` : metrics.views_per_day.toLocaleString()}
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="text-xs text-gray-500">SEO / Metadata Score</div>
                    <div className={`mt-1 text-2xl font-bold ${seo.score >= 75 ? 'text-green-600' : seo.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {seo.score}/100
                    </div>
                </div>
            </div>

            <YouTubeDeepAnalytics deep={deepAnalytics} />

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                    <h2 className="text-base font-semibold text-gray-900">SEO & Metadata Audit</h2>
                    <div className="divide-y divide-gray-100">
                        {seo.checks.map((c) => (
                            <div key={c.label} className="flex items-center justify-between py-2 text-sm">
                                <span className="flex items-center gap-2">
                                    <span className={c.passed ? 'text-green-600' : 'text-red-500'}>
                                        {c.passed ? '✓' : '✕'}
                                    </span>
                                    <span className="text-gray-700">{c.label}</span>
                                </span>
                                <span className="text-xs font-medium text-gray-500">{c.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                    <h2 className="text-base font-semibold text-gray-900">Tags ({video.tags.length})</h2>
                    {video.tags.length === 0 ? (
                        <p className="text-sm text-gray-500">No tags set on this video.</p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {video.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="pt-2">
                        <h3 className="text-sm font-semibold text-gray-800">Description</h3>
                        <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-line rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                            {video.description || 'No description.'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <h2 className="text-base font-semibold text-gray-900">Top Comments ({comments.length})</h2>
                {comments.length === 0 ? (
                    <p className="text-sm text-gray-500">No comments available.</p>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {comments.map((c) => (
                            <div key={c.id} className="flex gap-3 py-3">
                                {c.author_avatar && (
                                    <img src={c.author_avatar} alt="" className="h-8 w-8 rounded-full flex-shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-semibold text-gray-900">{c.author}</span>
                                        {c.published_at && (
                                            <span className="text-gray-400">
                                                {new Date(c.published_at).toLocaleDateString()}
                                            </span>
                                        )}
                                        {c.likes > 0 && <span className="text-gray-500">👍 {c.likes}</span>}
                                    </div>
                                    <p className="mt-1 whitespace-pre-line text-sm text-gray-700 break-words">
                                        {c.text}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
