import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { socialApi } from '../api/social';
import DriveFilePickerModal from './DriveFilePickerModal';

const STAGES = [
    { id: 'all', label: 'All' },
    { id: 'idea', label: 'Ideas' },
    { id: 'draft', label: 'Drafts' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'published', label: 'Published' },
];

const scoreBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};

const platformBadge = (platform) =>
    platform === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-pink-100 text-pink-700';

export default function ContentPlannerTab({
    accounts,
    contents,
    contentForm,
    setContentForm,
    emptyContent,
    canManage,
    onSaved,
}) {
    const [stageFilter, setStageFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [publishPrivacy, setPublishPrivacy] = useState({});
    const [drivePickerMode, setDrivePickerMode] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    // Auto-select first available channel if none is selected yet.
    const effectiveAccountId = contentForm.social_account_id || (accounts[0] ? String(accounts[0].id) : '');

    const splitList = (str) =>
        String(str || '')
            .split(/[,\s]+/)
            .map((s) => s.trim())
            .filter(Boolean);

    const createMut = useMutation({
        mutationFn: socialApi.createContent,
        onSuccess: () => {
            setErrorMsg('');
            setAiSuggestion(null);
            setContentForm({ ...emptyContent, social_account_id: effectiveAccountId });
            onSaved();
        },
        onError: (err) => setErrorMsg(err?.response?.data?.message || 'Failed to save content.'),
    });

    const updateMut = useMutation({
        mutationFn: ({ id, payload }) => socialApi.updateContent(id, payload),
        onSuccess: () => {
            setErrorMsg('');
            setEditingId(null);
            setAiSuggestion(null);
            setContentForm({ ...emptyContent, social_account_id: effectiveAccountId });
            onSaved();
        },
        onError: (err) => setErrorMsg(err?.response?.data?.message || 'Failed to update content.'),
    });

    const statusMut = useMutation({
        mutationFn: ({ id, status }) => socialApi.updateContent(id, { status }),
        onSuccess: onSaved,
    });

    const deleteMut = useMutation({
        mutationFn: socialApi.deleteContent,
        onSuccess: onSaved,
    });

    const optimizeMut = useMutation({
        mutationFn: socialApi.optimizeContent,
        onSuccess: (res) => setAiSuggestion(res),
    });

    const publishMut = useMutation({
        mutationFn: ({ id, privacy }) => socialApi.publishFromDrive(id, privacy),
        onSuccess: () => {
            setErrorMsg('');
            onSaved();
        },
        onError: (err) => setErrorMsg(err?.response?.data?.message || 'Failed to publish video to YouTube.'),
    });

    const stageCounts = useMemo(() => {
        const counts = { all: contents.length, idea: 0, draft: 0, scheduled: 0, published: 0 };
        contents.forEach((c) => {
            if (counts[c.status] !== undefined) counts[c.status]++;
        });
        return counts;
    }, [contents]);

    const filteredContents = useMemo(() => {
        const q = search.trim().toLowerCase();
        return contents.filter((item) => {
            if (stageFilter !== 'all' && item.status !== stageFilter) return false;
            if (q && !item.title.toLowerCase().includes(q) && !(item.target_keyword || '').toLowerCase().includes(q)) {
                return false;
            }
            return true;
        });
    }, [contents, stageFilter, search]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!effectiveAccountId) {
            setErrorMsg('Please connect a YouTube or Instagram channel first.');
            return;
        }
        const selectedAcc = accounts.find((a) => String(a.id) === String(effectiveAccountId));
        const payload = {
            social_account_id: Number(effectiveAccountId),
            platform: selectedAcc?.platform || contentForm.platform || 'youtube',
            content_type: contentForm.content_type,
            title: contentForm.title,
            target_keyword: contentForm.target_keyword || null,
            hook: contentForm.hook || null,
            description: contentForm.description || null,
            tags: splitList(contentForm.tagsText),
            hashtags: splitList(contentForm.hashtagsText),
            status: contentForm.status,
            scheduled_at: contentForm.scheduled_at || null,
            ...(contentForm.drive_file_id
                ? {
                      drive_file_id: contentForm.drive_file_id,
                      drive_file_name: contentForm.drive_file_name,
                      drive_file_url: contentForm.drive_file_url,
                      drive_mime_type: contentForm.drive_mime_type,
                  }
                : {}),
            ...(contentForm.drive_thumbnail_file_id ? { drive_thumbnail_file_id: contentForm.drive_thumbnail_file_id } : {}),
        };

        if (editingId) {
            updateMut.mutate({ id: editingId, payload });
        } else {
            createMut.mutate(payload);
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setAiSuggestion(null);
        setContentForm({
            social_account_id: String(item.social_account_id),
            platform: item.platform,
            content_type: item.content_type,
            title: item.title || '',
            target_keyword: item.target_keyword || '',
            hook: item.hook || '',
            description: item.description || '',
            tagsText: Array.isArray(item.tags) ? item.tags.join(', ') : '',
            hashtagsText: Array.isArray(item.hashtags) ? item.hashtags.join(' ') : '',
            status: item.status || 'draft',
            scheduled_at: item.scheduled_at ? item.scheduled_at.slice(0, 16) : '',
            drive_file_id: item.drive_file_id || null,
            drive_file_name: item.drive_file_name || null,
            drive_file_url: item.drive_file_url || null,
            drive_mime_type: item.drive_mime_type || null,
            drive_thumbnail_file_id: item.drive_thumbnail_file_id || null,
            drive_thumbnail_name: item.drive_thumbnail_file_id ? 'Attached Drive Thumbnail' : null,
        });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-12">
            {canManage && (
                <form
                    onSubmit={handleSubmit}
                    className="space-y-3.5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-5"
                >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                {editingId ? 'Edit Planned Content' : 'Plan New Content'}
                            </h2>
                            <p className="text-xs text-gray-500">Draft, optimize SEO, schedule, or publish from Drive</p>
                        </div>
                        <button
                            type="button"
                            onClick={() =>
                                optimizeMut.mutate({
                                    platform: contentForm.platform,
                                    topic: contentForm.title || contentForm.target_keyword || 'Creator Growth',
                                    title: contentForm.title || 'Untitled Video',
                                    target_keyword: contentForm.target_keyword || contentForm.title,
                                    description: contentForm.description,
                                    hook: contentForm.hook,
                                    tags: splitList(contentForm.tagsText),
                                })
                            }
                            disabled={optimizeMut.isPending}
                            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                        >
                            {optimizeMut.isPending ? 'Optimizing…' : '✨ AI Optimize'}
                        </button>
                    </div>

                    {errorMsg && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Channel</label>
                        <select
                            required
                            value={effectiveAccountId}
                            onChange={(e) => {
                                const acc = accounts.find((a) => String(a.id) === e.target.value);
                                setContentForm({
                                    ...contentForm,
                                    social_account_id: e.target.value,
                                    platform: acc?.platform || contentForm.platform,
                                    content_type: acc?.platform === 'instagram' ? 'reel' : 'video',
                                });
                            }}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        >
                            {accounts.length === 0 && <option value="">No channels connected</option>}
                            {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                    [{a.platform.toUpperCase()}] {a.account_name} ({a.handle})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Format</label>
                            <select
                                value={contentForm.content_type}
                                onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            >
                                <option value="video">YouTube Video</option>
                                <option value="short">YouTube Short</option>
                                <option value="reel">Instagram Reel</option>
                                <option value="carousel">IG Carousel</option>
                                <option value="post">IG Post</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Pipeline Stage</label>
                            <select
                                value={contentForm.status}
                                onChange={(e) => setContentForm({ ...contentForm, status: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            >
                                <option value="idea">Idea</option>
                                <option value="draft">Draft</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Target Keyword</label>
                            <input
                                placeholder="e.g. krishna motivation"
                                value={contentForm.target_keyword}
                                onChange={(e) => setContentForm({ ...contentForm, target_keyword: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Schedule Date (Optional)</label>
                            <input
                                type="datetime-local"
                                value={contentForm.scheduled_at || ''}
                                onChange={(e) => setContentForm({ ...contentForm, scheduled_at: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-1 flex justify-between text-xs">
                            <label className="font-medium text-gray-700">Video Title / Headline</label>
                            <span className={contentForm.title.length >= 35 && contentForm.title.length <= 70 ? 'text-green-600' : 'text-gray-400'}>
                                {contentForm.title.length} / 35–70 chars
                            </span>
                        </div>
                        <input
                            required
                            placeholder="Write a clickable title with your keyword…"
                            value={contentForm.title}
                            onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Opening Hook (first 3–15 sec)</label>
                        <input
                            placeholder="What grabs the viewer immediately?"
                            value={contentForm.hook}
                            onChange={(e) => setContentForm({ ...contentForm, hook: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <div className="mb-1 flex justify-between text-xs">
                            <label className="font-medium text-gray-700">Description / Caption</label>
                            <span className={contentForm.description.length >= 120 ? 'text-green-600' : 'text-gray-400'}>
                                {contentForm.description.length} chars (120+ ideal)
                            </span>
                        </div>
                        <textarea
                            rows={3}
                            placeholder="Video description, timestamps, links…"
                            value={contentForm.description}
                            onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Tags (comma-separated)</label>
                            <input
                                placeholder="tag1, tag2, tag3"
                                value={contentForm.tagsText}
                                onChange={(e) => setContentForm({ ...contentForm, tagsText: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Hashtags</label>
                            <input
                                placeholder="#shorts #motivation"
                                value={contentForm.hashtagsText}
                                onChange={(e) => setContentForm({ ...contentForm, hashtagsText: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {aiSuggestion && (
                        <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">AI SEO Score Preview: {aiSuggestion.seo_score}/100</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setContentForm((p) => ({
                                            ...p,
                                            title: aiSuggestion.suggested_titles?.[0] || p.title,
                                            description: aiSuggestion.suggested_description || p.description,
                                            tagsText: Array.isArray(aiSuggestion.suggested_tags)
                                                ? aiSuggestion.suggested_tags.join(', ')
                                                : p.tagsText,
                                            hashtagsText: Array.isArray(aiSuggestion.suggested_hashtags)
                                                ? aiSuggestion.suggested_hashtags.join(' ')
                                                : p.hashtagsText,
                                        }))
                                    }
                                    className="rounded bg-purple-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-purple-700"
                                >
                                    Apply All
                                </button>
                            </div>
                            {aiSuggestion.suggested_titles?.length > 0 && (
                                <ul className="list-disc space-y-0.5 pl-4">
                                    {aiSuggestion.suggested_titles.map((t, i) => (
                                        <li
                                            key={i}
                                            onClick={() => setContentForm((p) => ({ ...p, title: t }))}
                                            className="cursor-pointer hover:underline"
                                        >
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-medium text-gray-700">Google Drive Attachments</span>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setDrivePickerMode('video')}
                                    className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                                >
                                    🎬 {contentForm.drive_file_id ? 'Change Video' : 'Select Video'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDrivePickerMode('image')}
                                    className="rounded-lg border border-green-200 bg-white px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                                >
                                    🖼️ {contentForm.drive_thumbnail_file_id ? 'Change Thumbnail' : 'Select Thumbnail'}
                                </button>
                            </div>
                        </div>

                        {contentForm.drive_file_name && (
                            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-900">
                                <span className="truncate">🎬 Video: {contentForm.drive_file_name}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setContentForm((p) => ({
                                            ...p,
                                            drive_file_id: null,
                                            drive_file_name: null,
                                            drive_file_url: null,
                                            drive_mime_type: null,
                                        }))
                                    }
                                    className="ml-2 text-indigo-700 hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                        )}

                        {contentForm.drive_thumbnail_name && (
                            <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-900">
                                <span className="truncate">🖼️ Thumbnail: {contentForm.drive_thumbnail_name}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setContentForm((p) => ({
                                            ...p,
                                            drive_thumbnail_file_id: null,
                                            drive_thumbnail_name: null,
                                        }))
                                    }
                                    className="ml-2 text-green-700 hover:underline"
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-1">
                        <button
                            type="submit"
                            disabled={createMut.isPending || updateMut.isPending}
                            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {editingId
                                ? updateMut.isPending
                                    ? 'Updating…'
                                    : 'Update Content'
                                : createMut.isPending
                                ? 'Saving…'
                                : 'Save to Planner'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setContentForm({ ...emptyContent, social_account_id: effectiveAccountId });
                                }}
                                className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            )}

            <div className={`space-y-4 ${canManage ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap gap-1">
                        {STAGES.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => setStageFilter(s.id)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                                    stageFilter === s.id
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {s.label} ({stageCounts[s.id] ?? 0})
                            </button>
                        ))}
                    </div>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search planner…"
                        className="rounded-lg border px-3 py-1.5 text-xs"
                    />
                </div>

                {filteredContents.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                        No planned content in this stage yet. Use the planner on the left or import a video from the Google Drive tab!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredContents.map((item) => (
                            <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${platformBadge(item.platform)}`}>
                                                {item.platform} · {item.content_type}
                                            </span>
                                            {canManage ? (
                                                <select
                                                    value={item.status}
                                                    onChange={(e) => statusMut.mutate({ id: item.id, status: e.target.value })}
                                                    className="rounded border bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700"
                                                >
                                                    <option value="idea">Idea</option>
                                                    <option value="draft">Draft</option>
                                                    <option value="scheduled">Scheduled</option>
                                                    <option value="published">Published</option>
                                                </select>
                                            ) : (
                                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{item.status}</span>
                                            )}
                                            <span className="text-xs text-gray-500">{item.account?.handle}</span>
                                            {item.scheduled_at && (
                                                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                                                    📅 {new Date(item.scheduled_at).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="mt-1.5 text-base font-semibold text-gray-900">{item.title}</h3>
                                        {item.target_keyword && (
                                            <p className="mt-0.5 text-xs text-gray-500">Keyword: {item.target_keyword}</p>
                                        )}
                                        {item.hook && <p className="mt-1 text-xs text-gray-600">Hook: {item.hook}</p>}

                                        {item.drive_file_name && (
                                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-indigo-700">
                                                <span>🎬 Drive: {item.drive_file_name}</span>
                                                {item.drive_file_url && (
                                                    <a href={item.drive_file_url} target="_blank" rel="noreferrer" className="hover:underline">
                                                        Open ↗
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                        {item.youtube_video_id && (
                                            <div className="mt-1 text-xs text-green-700">
                                                ✅ Published on YouTube:{' '}
                                                <a
                                                    href={`https://www.youtube.com/watch?v=${item.youtube_video_id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-medium underline"
                                                >
                                                    Watch ↗
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${scoreBadge(item.seo_score)}`}>
                                            SEO {item.seo_score}/100
                                        </span>
                                        {canManage && item.drive_file_id && item.platform === 'youtube' && !item.youtube_video_id && (
                                            <div className="flex items-center gap-1">
                                                <select
                                                    value={publishPrivacy[item.id] || 'private'}
                                                    onChange={(e) => setPublishPrivacy((p) => ({ ...p, [item.id]: e.target.value }))}
                                                    className="rounded border px-1.5 py-1 text-xs"
                                                >
                                                    <option value="private">Private</option>
                                                    <option value="unlisted">Unlisted</option>
                                                    <option value="public">Public</option>
                                                </select>
                                                <button
                                                    onClick={() =>
                                                        publishMut.mutate({
                                                            id: item.id,
                                                            privacy: publishPrivacy[item.id] || 'private',
                                                        })
                                                    }
                                                    disabled={publishMut.isPending}
                                                    className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {publishMut.isPending ? 'Uploading…' : 'Publish to YT'}
                                                </button>
                                            </div>
                                        )}
                                        {canManage && (
                                            <>
                                                <button
                                                    onClick={() => startEdit(item)}
                                                    className="rounded-lg border px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteMut.mutate(item.id)}
                                                    className="text-xs text-red-600 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {Array.isArray(item.seo_breakdown) && item.seo_breakdown.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {item.seo_breakdown.map((chk) => (
                                            <span
                                                key={chk.key}
                                                className={`rounded px-2 py-0.5 text-[11px] ${
                                                    chk.passed ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {chk.passed ? '✓' : '○'} {chk.label} ({chk.points}/{chk.max})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {drivePickerMode && (
                <DriveFilePickerModal
                    mode={drivePickerMode}
                    onClose={() => setDrivePickerMode(null)}
                    onSelect={(file) => {
                        if (drivePickerMode === 'video') {
                            const cleanTitle = file.name.replace(/\.[^.]+$/, '');
                            setContentForm((p) => ({
                                ...p,
                                title: p.title || cleanTitle,
                                drive_file_id: file.id,
                                drive_file_name: file.name,
                                drive_file_url: file.web_view_url,
                                drive_mime_type: file.mime_type,
                            }));
                        } else {
                            setContentForm((p) => ({
                                ...p,
                                drive_thumbnail_file_id: file.id,
                                drive_thumbnail_name: file.name,
                            }));
                        }
                    }}
                />
            )}
        </div>
    );
}
