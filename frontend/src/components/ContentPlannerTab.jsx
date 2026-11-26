import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { socialApi } from '../api/social';
import ContentCalendarView from './ContentCalendarView';
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
    platform === 'youtube'
        ? 'bg-red-100 text-red-700'
        : platform === 'facebook'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-pink-100 text-pink-700';

export default function ContentPlannerTab({
    accounts,
    brands = [],
    brandFilter = '',
    setBrandFilter = null,
    contents,
    contentForm,
    setContentForm,
    emptyContent,
    canManage,
    onSaved,
}) {
    const [stageFilter, setStageFilter] = useState(() => localStorage.getItem('leadsetu_planner_stage') || 'all');
    const [platformFilter, setPlatformFilter] = useState(() => localStorage.getItem('leadsetu_planner_platform') || 'all');
    const [failedOnly, setFailedOnly] = useState(() => localStorage.getItem('leadsetu_planner_failed') === '1');
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('leadsetu_planner_view') || 'list');
    const [formTab, setFormTab] = useState('basics');
    const [showCrossPost, setShowCrossPost] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [expandedSeoId, setExpandedSeoId] = useState(null);
    const [search, setSearch] = useState(() => localStorage.getItem('leadsetu_planner_search') || '');

    useEffect(() => {
        try {
            localStorage.setItem('leadsetu_planner_stage', stageFilter);
            localStorage.setItem('leadsetu_planner_platform', platformFilter);
            localStorage.setItem('leadsetu_planner_failed', failedOnly ? '1' : '0');
            localStorage.setItem('leadsetu_planner_view', viewMode);
            localStorage.setItem('leadsetu_planner_search', search);
        } catch {
            // ignore storage errors
        }
    }, [stageFilter, platformFilter, failedOnly, viewMode, search]);
    const [editingId, setEditingId] = useState(null);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [publishPrivacy, setPublishPrivacy] = useState({});
    const [drivePickerMode, setDrivePickerMode] = useState(null);
    const [extraAccountIds, setExtraAccountIds] = useState([]);
    const [shareItem, setShareItem] = useState(null);
    const [shareTargets, setShareTargets] = useState([]);
    const [sharePublishNow, setSharePublishNow] = useState(false);
    const [shareYtPrivacy, setShareYtPrivacy] = useState('private');
    const [shareResult, setShareResult] = useState(null);
    const [commentItem, setCommentItem] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [commentError, setCommentError] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Auto-select first available channel (within active brand filter if set).
    const effectiveAccountId =
        contentForm.social_account_id && accounts.some((a) => String(a.id) === String(contentForm.social_account_id))
            ? contentForm.social_account_id
            : accounts[0]
            ? String(accounts[0].id)
            : '';

    const splitList = (str) =>
        String(str || '')
            .split(/[,\s]+/)
            .map((s) => s.trim())
            .filter(Boolean);

    const createMut = useMutation({
        mutationFn: async ({ payload, alsoShareIds }) => {
            const created = await socialApi.createContent(payload);
            if (alsoShareIds.length > 0) {
                await socialApi.shareContent(created.id, { target_account_ids: alsoShareIds });
            }
            return created;
        },
        onSuccess: () => {
            setErrorMsg('');
            setAiSuggestion(null);
            setExtraAccountIds([]);
            setDrawerOpen(false);
            setContentForm({ ...emptyContent, social_account_id: effectiveAccountId });
            onSaved();
        },
        onError: (err) => setErrorMsg(err?.response?.data?.message || 'Failed to save content.'),
    });

    const shareMut = useMutation({
        mutationFn: ({ id, payload }) => socialApi.shareContent(id, payload),
        onSuccess: (res) => {
            setShareResult(res);
            onSaved();
        },
        onError: (err) => {
            setShareResult({ created: [], errors: [err?.response?.data?.message || 'Failed to share content.'] });
        },
    });

    const commentMut = useMutation({
        mutationFn: ({ id, payload }) => socialApi.updateFirstComment(id, payload),
        onSuccess: () => {
            setCommentError('');
            setCommentItem(null);
            onSaved();
        },
        onError: (err) => {
            setCommentError(err?.response?.data?.message || 'Failed to post/update comment.');
        },
    });

    const updateMut = useMutation({
        mutationFn: ({ id, payload }) => socialApi.updateContent(id, payload),
        onSuccess: () => {
            setErrorMsg('');
            setEditingId(null);
            setDrawerOpen(false);
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
        onError: (err) => {
            setErrorMsg(err?.response?.data?.message || 'Failed to publish content.');
            onSaved();
        },
    });

    const syncYtMut = useMutation({
        mutationFn: (id) => socialApi.syncContentToYouTube(id),
        onSuccess: () => {
            setErrorMsg('');
            onSaved();
        },
        onError: (err) => setErrorMsg(err?.response?.data?.message || 'Failed to sync updates to YouTube.'),
    });

    const syncFbMut = useMutation({
        mutationFn: (id) => socialApi.syncContentToFacebook(id),
        onSuccess: () => {
            setErrorMsg('');
            onSaved();
        },
        onError: (err) => setErrorMsg(err?.response?.data?.message || 'Failed to sync updates to Facebook.'),
    });

    const importYtMut = useMutation({
        mutationFn: async () => {
            const ytAccounts = accounts.filter((a) => a.platform === 'youtube');
            for (const acc of ytAccounts) {
                await socialApi.syncYouTubeToPlanner(acc.id, 200);
            }
        },
        onSuccess: () => {
            setErrorMsg('');
            onSaved();
        },
        onError: (err) => setErrorMsg(err?.response?.data?.message || 'Failed to import YouTube videos.'),
    });

    const brandScopedContents = useMemo(() => {
        if (!brandFilter) return contents;
        const selectedBrand = brands.find((b) => String(b.id) === String(brandFilter));
        const allowedIds = new Set(
            (selectedBrand?.accounts || accounts).map((a) => Number(a.id))
        );
        return contents.filter((c) => allowedIds.has(Number(c.social_account_id)));
    }, [contents, brands, accounts, brandFilter]);

    const stageCounts = useMemo(() => {
        const counts = { all: brandScopedContents.length, idea: 0, draft: 0, scheduled: 0, published: 0 };
        brandScopedContents.forEach((c) => {
            if (counts[c.status] !== undefined) counts[c.status]++;
        });
        return counts;
    }, [brandScopedContents]);

    const failedCount = useMemo(() => brandScopedContents.filter((c) => Boolean(c.publish_error)).length, [brandScopedContents]);

    const filteredContents = useMemo(() => {
        const q = search.trim().toLowerCase();
        return brandScopedContents.filter((item) => {
            if (stageFilter !== 'all' && item.status !== stageFilter) return false;
            if (platformFilter !== 'all' && item.platform !== platformFilter) return false;
            if (failedOnly && !item.publish_error) return false;
            if (q && !item.title.toLowerCase().includes(q) && !(item.target_keyword || '').toLowerCase().includes(q)) {
                return false;
            }
            return true;
        });
    }, [brandScopedContents, stageFilter, platformFilter, failedOnly, search]);

    useEffect(() => {
        if (!editingId && (contentForm.drive_file_id || contentForm.drive_thumbnail_file_id)) {
            setDrawerOpen(true);
        }
    }, [contentForm.drive_file_id, contentForm.drive_thumbnail_file_id, editingId]);

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
            first_comment: contentForm.first_comment || null,
            pin_first_comment: contentForm.pin_first_comment ?? true,
            tags: splitList(contentForm.tagsText),
            hashtags: splitList(contentForm.hashtagsText),
            status: contentForm.status,
            scheduled_at: contentForm.scheduled_at || null,
            drive_folder_id: contentForm.drive_folder_id || null,
            drive_folder_name: contentForm.drive_folder_name || null,
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
            const alsoShareIds = extraAccountIds.filter((aid) => String(aid) !== String(effectiveAccountId));
            createMut.mutate({ payload, alsoShareIds });
        }
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setAiSuggestion(null);
        setFormTab('basics');
        setDrawerOpen(true);
        setContentForm({
            social_account_id: String(item.social_account_id),
            platform: item.platform,
            content_type: item.content_type,
            title: item.title || '',
            target_keyword: item.target_keyword || '',
            hook: item.hook || '',
            description: item.description || '',
            first_comment: item.first_comment || '',
            pin_first_comment: item.pin_first_comment ?? true,
            tagsText: Array.isArray(item.tags) ? item.tags.join(', ') : '',
            hashtagsText: Array.isArray(item.hashtags) ? item.hashtags.join(' ') : '',
            status: item.status || 'draft',
            scheduled_at: item.scheduled_at ? item.scheduled_at.slice(0, 16) : '',
            drive_folder_id: item.drive_folder_id || null,
            drive_folder_name: item.drive_folder_name || null,
            drive_file_id: item.drive_file_id || null,
            drive_file_name: item.drive_file_name || null,
            drive_file_url: item.drive_file_url || null,
            drive_mime_type: item.drive_mime_type || null,
            drive_thumbnail_file_id: item.drive_thumbnail_file_id || null,
            drive_thumbnail_name: item.drive_thumbnail_file_id ? 'Attached Drive Thumbnail' : null,
        });
    };

    return (
        <div className="space-y-4">
            {canManage && drawerOpen && (
                <div className="fixed inset-0 z-40 flex justify-end bg-black/40 backdrop-blur-[1px]">
                    <form
                        onSubmit={handleSubmit}
                        className="flex h-full w-full max-w-xl flex-col justify-between overflow-y-auto bg-white p-6 shadow-2xl"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">
                                        {editingId ? 'Edit Planned Content' : 'Plan New Content'}
                                    </h2>
                                    <p className="text-xs text-gray-500">Draft, optimize SEO, schedule, or link Drive</p>
                                </div>
                                <div className="flex items-center gap-2">
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
                                        className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {optimizeMut.isPending ? 'Optimizing…' : '✨ AI Optimize'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDrawerOpen(false)}
                                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>

                    {errorMsg && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            {errorMsg}
                        </div>
                    )}

                    {aiSuggestion && (
                        <div className="space-y-2 rounded-xl border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">AI SEO Score Preview: {aiSuggestion.seo_score}/100</span>
                                <div className="flex items-center gap-2">
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
                                        className="rounded-lg bg-purple-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-purple-700"
                                    >
                                        Apply All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAiSuggestion(null)}
                                        className="text-purple-600 hover:underline"
                                    >
                                        ×
                                    </button>
                                </div>
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

                    {/* Composer Section Tabs */}
                    <div className="grid grid-cols-3 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setFormTab('basics')}
                            className={`rounded-lg py-1.5 transition ${formTab === 'basics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            1. Basics
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormTab('seo')}
                            className={`rounded-lg py-1.5 transition ${formTab === 'seo' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            2. SEO &amp; Copy
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormTab('media')}
                            className={`rounded-lg py-1.5 transition ${formTab === 'media' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            3. Media &amp; Comment
                            {(contentForm.drive_file_id || contentForm.drive_folder_id || contentForm.first_comment) && (
                                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-indigo-600 align-middle" />
                            )}
                        </button>
                    </div>

                    {formTab === 'basics' && (
                        <div className="space-y-3">
                            <div>
                                <div className="mb-1 flex items-center justify-between">
                                    <label className="text-xs font-medium text-gray-700">Channel</label>
                                    {!editingId && accounts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCrossPost((v) => !v)}
                                            className="text-[11px] font-medium text-indigo-600 hover:underline"
                                        >
                                            {showCrossPost
                                                ? 'Hide cross-post'
                                                : extraAccountIds.length > 0
                                                    ? `+${extraAccountIds.length} cross-post(s)`
                                                    : '+ Cross-post'}
                                        </button>
                                    )}
                                </div>
                                <select
                                    required
                                    value={effectiveAccountId}
                                    onChange={(e) => {
                                        const acc = accounts.find((a) => String(a.id) === e.target.value);
                                        setExtraAccountIds((prev) => prev.filter((id) => String(id) !== e.target.value));
                                        setContentForm({
                                            ...contentForm,
                                            social_account_id: e.target.value,
                                            platform: acc?.platform || contentForm.platform,
                                            content_type: acc?.platform === 'instagram' ? 'reel' : acc?.platform === 'facebook' ? 'post' : 'video',
                                        });
                                    }}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    {accounts.length === 0 && <option value="">No channels connected</option>}
                                    {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            [{a.platform.toUpperCase()}] {a.account_name} ({a.handle})
                                        </option>
                                    ))}
                                </select>
                                {!editingId && showCrossPost && accounts.length > 1 && (
                                    <div className="mt-2 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                                        {brands.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {brands.map((b) => (
                                                    <button
                                                        key={b.id}
                                                        type="button"
                                                        onClick={() => {
                                                            const ids = (b.accounts || [])
                                                                .map((a) => a.id)
                                                                .filter((id) => String(id) !== String(effectiveAccountId));
                                                            setExtraAccountIds((prev) => Array.from(new Set([...prev, ...ids])));
                                                        }}
                                                        className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
                                                    >
                                                        + Brand: {b.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-1.5">
                                            {accounts
                                                .filter((a) => String(a.id) !== String(effectiveAccountId))
                                                .map((a) => {
                                                    const checked = extraAccountIds.includes(a.id);
                                                    return (
                                                        <label key={a.id} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs">
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={(e) =>
                                                                    setExtraAccountIds((prev) =>
                                                                        e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                                                                    )
                                                                }
                                                            />
                                                            <span className={`rounded px-1 text-[10px] font-semibold uppercase ${platformBadge(a.platform)}`}>
                                                                {a.platform.slice(0, 2)}
                                                            </span>
                                                            <span className="max-w-[120px] truncate">{a.account_name}</span>
                                                        </label>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-1 flex justify-between text-xs">
                                    <label className="font-medium text-gray-700">Title / Headline</label>
                                    <span className={contentForm.title.length >= 35 && contentForm.title.length <= 70 ? 'text-green-600' : 'text-gray-400'}>
                                        {contentForm.title.length} / 35–70 chars
                                    </span>
                                </div>
                                <input
                                    required
                                    placeholder="Write a clickable title with your keyword…"
                                    value={contentForm.title}
                                    onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700">Format</label>
                                    <select
                                        value={contentForm.content_type}
                                        onChange={(e) => setContentForm({ ...contentForm, content_type: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                    >
                                        <option value="video">YouTube Video</option>
                                        <option value="short">YouTube Short</option>
                                        <option value="reel">Instagram Reel</option>
                                        <option value="carousel">IG Carousel</option>
                                        <option value="post">Post</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700">Stage</label>
                                    <select
                                        value={contentForm.status}
                                        onChange={(e) => setContentForm({ ...contentForm, status: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
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
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700">Schedule Date</label>
                                    <input
                                        type="datetime-local"
                                        value={contentForm.scheduled_at || ''}
                                        onChange={(e) => setContentForm({ ...contentForm, scheduled_at: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {formTab === 'seo' && (
                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Opening Hook (first 3–15 sec)</label>
                                <input
                                    placeholder="What grabs the viewer immediately?"
                                    value={contentForm.hook}
                                    onChange={(e) => setContentForm({ ...contentForm, hook: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
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
                                    rows={4}
                                    placeholder="Video description, timestamps, links…"
                                    value={contentForm.description}
                                    onChange={(e) => setContentForm({ ...contentForm, description: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700">Tags (comma-separated)</label>
                                    <input
                                        placeholder="tag1, tag2, tag3"
                                        value={contentForm.tagsText}
                                        onChange={(e) => setContentForm({ ...contentForm, tagsText: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-700">Hashtags</label>
                                    <input
                                        placeholder="#shorts #motivation"
                                        value={contentForm.hashtagsText}
                                        onChange={(e) => setContentForm({ ...contentForm, hashtagsText: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {formTab === 'media' && (
                        <div className="space-y-3">
                            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="text-xs font-medium text-gray-700">Google Drive</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setDrivePickerMode('folder')}
                                            className="rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                                        >
                                            📁 {contentForm.drive_folder_id ? 'Change Folder' : 'Link Folder'}
                                        </button>
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
                                            🖼️ {contentForm.drive_thumbnail_file_id ? 'Change Thumb' : 'Select Thumb'}
                                        </button>
                                    </div>
                                </div>

                                {contentForm.drive_folder_id && (
                                    <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
                                        <span className="truncate">
                                            📁 {contentForm.drive_folder_name || contentForm.drive_folder_id}
                                        </span>
                                        <div className="ml-2 flex items-center gap-2 flex-shrink-0">
                                            <a
                                                href={`https://drive.google.com/drive/folders/${contentForm.drive_folder_id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-amber-800 underline"
                                            >
                                                Open ↗
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setContentForm((p) => ({
                                                        ...p,
                                                        drive_folder_id: null,
                                                        drive_folder_name: null,
                                                    }))
                                                }
                                                className="text-amber-700 hover:underline"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {contentForm.drive_file_name && (
                                    <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-900">
                                        <span className="truncate">🎬 {contentForm.drive_file_name}</span>
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
                                        <span className="truncate">🖼️ {contentForm.drive_thumbnail_name}</span>
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

                            <div className="space-y-1.5 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-gray-700">First Comment (Auto-posted)</label>
                                    <label className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                        <input
                                            type="checkbox"
                                            checked={contentForm.pin_first_comment ?? true}
                                            onChange={(e) => setContentForm({ ...contentForm, pin_first_comment: e.target.checked })}
                                        />
                                        Pin intent
                                    </label>
                                </div>
                                <textarea
                                    rows={3}
                                    placeholder="Write the first comment to post automatically after publishing…"
                                    value={contentForm.first_comment || ''}
                                    onChange={(e) => setContentForm({ ...contentForm, first_comment: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                        </div>

                        <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                            <button
                                type="submit"
                                disabled={createMut.isPending || updateMut.isPending}
                                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {editingId
                                    ? updateMut.isPending
                                        ? 'Updating…'
                                        : 'Update Content'
                                    : createMut.isPending
                                        ? 'Saving…'
                                        : 'Save to Planner'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setDrawerOpen(false);
                                    setContentForm({ ...emptyContent, social_account_id: effectiveAccountId });
                                }}
                                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                            {STAGES.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStageFilter(s.id)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${stageFilter === s.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {s.label} ({stageCounts[s.id] ?? 0})
                                </button>
                            ))}
                            {failedCount > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setFailedOnly((v) => !v)}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${failedOnly
                                        ? 'bg-red-600 text-white shadow-sm'
                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                        }`}
                                >
                                    ⚠ Failed ({failedCount})
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {canManage && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setAiSuggestion(null);
                                        setFormTab('basics');
                                        setContentForm({ ...emptyContent, social_account_id: effectiveAccountId });
                                        setDrawerOpen(true);
                                    }}
                                    className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                                >
                                    + Plan Content
                                </button>
                            )}
                            {canManage && accounts.some((a) => a.platform === 'youtube') && (
                                <button
                                    type="button"
                                    disabled={importYtMut.isPending}
                                    onClick={() => importYtMut.mutate()}
                                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                                >
                                    {importYtMut.isPending ? 'Syncing YT…' : '↻ Sync YT Videos'}
                                </button>
                            )}
                            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('list')}
                                    className={`rounded-md px-2.5 py-1 font-medium ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                                >
                                    List
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('calendar')}
                                    className={`rounded-md px-2.5 py-1 font-medium ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
                                >
                                    Calendar
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
                        <div className="flex flex-wrap gap-1 text-[11px]">
                            {[
                                { id: 'all', label: 'All Platforms' },
                                { id: 'youtube', label: 'YouTube' },
                                { id: 'instagram', label: 'Instagram' },
                                { id: 'facebook', label: 'Facebook' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setPlatformFilter(p.id)}
                                    className={`rounded-md px-2 py-1 font-medium transition ${platformFilter === p.id
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {brands.length > 0 && setBrandFilter && (
                                <select
                                    value={brandFilter}
                                    onChange={(e) => setBrandFilter(e.target.value)}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                        brandFilter
                                            ? 'border-indigo-300 bg-indigo-50 text-indigo-800'
                                            : 'border-gray-200 bg-white text-gray-700'
                                    }`}
                                >
                                    <option value="">All Brands</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={String(b.id)}>
                                            🏷️ {b.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title or keyword…"
                                className="w-48 rounded-lg border border-gray-200 px-3 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {viewMode === 'calendar' ? (
                    <ContentCalendarView
                        contents={filteredContents}
                        canManage={canManage}
                        isRetrying={publishMut.isPending}
                        onSelectItem={(item) => {
                            if (canManage) startEdit(item);
                        }}
                        onRetryItem={(item) =>
                            publishMut.mutate({
                                id: item.id,
                                privacy: item.platform === 'youtube' ? (publishPrivacy[item.id] || 'public') : 'public',
                            })
                        }
                    />
                ) : filteredContents.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
                        No planned content in this stage yet. Use the planner on the left or import a video from the Google Drive tab!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredContents.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    {item.thumbnail_url && (
                                        <img
                                            src={item.thumbnail_url}
                                            alt=""
                                            className="hidden h-20 w-36 flex-shrink-0 rounded-xl border border-gray-100 object-cover sm:block"
                                        />
                                    )}
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
                                        {item.drive_folder_id && (
                                            <div className="mt-1 text-xs text-amber-700">
                                                📁 Drive Folder:{' '}
                                                <a
                                                    href={`https://drive.google.com/drive/folders/${item.drive_folder_id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-medium underline"
                                                >
                                                    {item.drive_folder_name || item.drive_folder_id} ↗
                                                </a>
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
                                        {item.instagram_media_id && (
                                            <div className="mt-1 text-xs text-pink-700">
                                                ✅ Published on Instagram
                                                {item.published_url && (
                                                    <>
                                                        :{' '}
                                                        <a
                                                            href={item.published_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-medium underline"
                                                        >
                                                            View ↗
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        {item.platform === 'facebook' && item.published_url && (
                                            <div className="mt-1 text-xs text-blue-700">
                                                ✅ Published on Facebook:{' '}
                                                <a
                                                    href={item.published_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-medium underline"
                                                >
                                                    View ↗
                                                </a>
                                            </div>
                                        )}
                                        {item.publish_error && (
                                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 rounded bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                                                <span>⚠ Publish failed: {item.publish_error}</span>
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        disabled={publishMut.isPending}
                                                        onClick={() =>
                                                            publishMut.mutate({
                                                                id: item.id,
                                                                privacy: item.platform === 'youtube' ? (publishPrivacy[item.id] || 'public') : 'public',
                                                            })
                                                        }
                                                        className="rounded bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        {publishMut.isPending ? 'Retrying…' : 'Retry Publish'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {item.first_comment && (
                                            <div className="mt-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-700">
                                                <span className="font-medium">💬 First Comment:</span> {item.first_comment}
                                                {item.first_comment_id && <span className="ml-2 text-green-700 font-medium">✓ Posted</span>}
                                            </div>
                                        )}
                                        {item.first_comment_error && (
                                            <div className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                                                ⚠ Comment error: {item.first_comment_error}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedSeoId((id) => (id === item.id ? null : item.id))}
                                            title="Click to toggle SEO breakdown"
                                            className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${scoreBadge(item.seo_score)}`}
                                        >
                                            SEO {item.seo_score}/100 {expandedSeoId === item.id ? '▴' : '▾'}
                                        </button>
                                        {canManage && item.drive_file_id && item.platform === 'youtube' && !item.youtube_video_id && (
                                            <div className="flex items-center gap-1">
                                                <select
                                                    value={publishPrivacy[item.id] || 'public'}
                                                    onChange={(e) => setPublishPrivacy((p) => ({ ...p, [item.id]: e.target.value }))}
                                                    className="rounded border px-1.5 py-1 text-xs"
                                                >
                                                    <option value="public">Public</option>
                                                    <option value="unlisted">Unlisted</option>
                                                    <option value="private">Private</option>
                                                </select>
                                                <button
                                                    onClick={() =>
                                                        publishMut.mutate({
                                                            id: item.id,
                                                            privacy: publishPrivacy[item.id] || 'public',
                                                        })
                                                    }
                                                    disabled={publishMut.isPending}
                                                    className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {publishMut.isPending ? 'Uploading…' : 'Publish to YT'}
                                                </button>
                                            </div>
                                        )}
                                        {canManage && (item.drive_file_id || item.drive_thumbnail_file_id) && item.platform === 'instagram' && !item.instagram_media_id && (
                                            <button
                                                onClick={() => publishMut.mutate({ id: item.id, privacy: 'public' })}
                                                disabled={publishMut.isPending}
                                                className="rounded-lg bg-pink-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-pink-700 disabled:opacity-50"
                                            >
                                                {publishMut.isPending ? 'Publishing…' : 'Publish to IG'}
                                            </button>
                                        )}
                                        {canManage && item.platform === 'facebook' && !item.published_url && (
                                            <button
                                                onClick={() => publishMut.mutate({ id: item.id, privacy: 'public' })}
                                                disabled={publishMut.isPending}
                                                className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {publishMut.isPending ? 'Publishing…' : 'Publish to FB'}
                                            </button>
                                        )}
                                        {canManage && (
                                            <>
                                                {item.status === 'published' && item.platform === 'youtube' && item.youtube_video_id && (
                                                    <button
                                                        type="button"
                                                        disabled={syncYtMut.isPending}
                                                        onClick={() => syncYtMut.mutate(item.id)}
                                                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                    >
                                                        {syncYtMut.isPending ? 'Syncing…' : '↻ Sync to YT'}
                                                    </button>
                                                )}
                                                {item.status === 'published' && item.platform === 'facebook' && item.published_url && (
                                                    <button
                                                        type="button"
                                                        disabled={syncFbMut.isPending}
                                                        onClick={() => syncFbMut.mutate(item.id)}
                                                        className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                                    >
                                                        {syncFbMut.isPending ? 'Syncing…' : '↻ Sync to FB'}
                                                    </button>
                                                )}
                                                {item.status === 'published' && (
                                                    <button
                                                        onClick={() => {
                                                            setCommentItem(item);
                                                            setCommentText(item.first_comment || '');
                                                            setCommentError('');
                                                        }}
                                                        className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                    >
                                                        {item.first_comment_id ? 'Edit Comment' : 'Post Comment'}
                                                    </button>
                                                )}
                                                {accounts.length > 1 && (
                                                    <button
                                                        onClick={() => {
                                                            setShareItem(item);
                                                            setShareTargets([]);
                                                            setSharePublishNow(false);
                                                            setShareResult(null);
                                                        }}
                                                        className="rounded-lg border border-indigo-200 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                                                    >
                                                        ↗ Share
                                                    </button>
                                                )}
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

                                {expandedSeoId === item.id && Array.isArray(item.seo_breakdown) && item.seo_breakdown.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
                                        {item.seo_breakdown.map((chk) => (
                                            <span
                                                key={chk.key}
                                                className={`rounded px-2 py-0.5 text-[11px] ${chk.passed ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
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
                    initialFolderId={drivePickerMode !== 'folder' ? contentForm.drive_folder_id : null}
                    initialFolderName={drivePickerMode !== 'folder' ? contentForm.drive_folder_name : null}
                    onClose={() => setDrivePickerMode(null)}
                    onSelect={(file) => {
                        if (drivePickerMode === 'folder') {
                            setContentForm((p) => ({
                                ...p,
                                drive_folder_id: file.id,
                                drive_folder_name: file.name,
                            }));
                        } else if (drivePickerMode === 'video') {
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

            {shareItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Share to Other Platforms</h3>
                                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{shareItem.title}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShareItem(null)}
                                className="rounded-lg border px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>

                        {brands.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] text-gray-500">Quick select brand:</span>
                                {brands.map((b) => (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => {
                                            const ids = (b.accounts || [])
                                                .map((a) => a.id)
                                                .filter((id) => id !== shareItem.social_account_id);
                                            setShareTargets((prev) => Array.from(new Set([...prev, ...ids])));
                                        }}
                                        className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100"
                                    >
                                        + {b.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="max-h-56 space-y-1.5 overflow-y-auto">
                            {accounts
                                .filter((a) => a.id !== shareItem.social_account_id)
                                .map((acc) => {
                                    const checked = shareTargets.includes(acc.id);
                                    return (
                                        <label
                                            key={acc.id}
                                            className={`flex cursor-pointer items-center justify-between rounded-xl border p-2.5 text-xs ${checked ? 'border-indigo-400 bg-indigo-50/50' : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) =>
                                                        setShareTargets((prev) =>
                                                            e.target.checked ? [...prev, acc.id] : prev.filter((id) => id !== acc.id)
                                                        )
                                                    }
                                                />
                                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${platformBadge(acc.platform)}`}>
                                                    {acc.platform}
                                                </span>
                                                <span className="truncate font-medium text-gray-900">{acc.account_name}</span>
                                            </div>
                                            <span className="text-gray-400">{acc.handle}</span>
                                        </label>
                                    );
                                })}
                        </div>

                        <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
                            <label className="flex items-center gap-2 font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={sharePublishNow}
                                    onChange={(e) => setSharePublishNow(e.target.checked)}
                                />
                                Publish immediately to selected channels
                            </label>
                            {sharePublishNow && shareTargets.some((id) => accounts.find((a) => a.id === id)?.platform === 'youtube') && (
                                <div className="flex items-center gap-2 pl-5">
                                    <span className="text-gray-600">YouTube privacy:</span>
                                    <select
                                        value={shareYtPrivacy}
                                        onChange={(e) => setShareYtPrivacy(e.target.value)}
                                        className="rounded border bg-white px-2 py-0.5 text-xs"
                                    >
                                        <option value="private">Private</option>
                                        <option value="unlisted">Unlisted</option>
                                        <option value="public">Public</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {shareResult && (
                            <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                                {shareResult.created?.length > 0 && (
                                    <div className="font-medium text-green-700">
                                        ✓ Shared to {shareResult.created.length} channel(s).
                                    </div>
                                )}
                                {shareResult.errors?.map((err, i) => (
                                    <div key={i} className="text-red-600">
                                        ✕ {err}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShareItem(null)}
                                className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={shareTargets.length === 0 || shareMut.isPending}
                                onClick={() =>
                                    shareMut.mutate({
                                        id: shareItem.id,
                                        payload: {
                                            target_account_ids: shareTargets,
                                            publish_now: sharePublishNow,
                                            youtube_privacy: shareYtPrivacy,
                                        },
                                    })
                                }
                                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {shareMut.isPending ? 'Sharing…' : `Share (${shareTargets.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {commentItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            commentMut.mutate({
                                id: commentItem.id,
                                payload: { first_comment: commentText },
                            });
                        }}
                        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4"
                    >
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                {commentItem.first_comment_id ? 'Edit Posted Comment' : 'Post First Comment'}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                                {commentItem.platform.toUpperCase()} · {commentItem.title}
                            </p>
                        </div>

                        {commentError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                {commentError}
                            </div>
                        )}

                        <textarea
                            rows={3}
                            required
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write your comment…"
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        />

                        <p className="text-[11px] text-gray-500">
                            Note: YouTube/Facebook/Instagram APIs do not support programmatic pinning — click Pin in the platform app if needed.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setCommentItem(null)}
                                className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={commentMut.isPending}
                                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {commentMut.isPending ? 'Saving…' : commentItem.first_comment_id ? 'Update Comment' : 'Post Comment'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
