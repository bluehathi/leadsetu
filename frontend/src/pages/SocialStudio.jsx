import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../api/social';
import ContentPlannerTab from '../components/ContentPlannerTab';
import GoogleDriveTab from '../components/GoogleDriveTab';
import { useMe } from '../hooks/useMe';

const TABS = [
    { id: 'accounts', label: 'Connected Channels' },
    { id: 'content', label: 'Content Planner' },
    { id: 'drive', label: 'Google Drive' },
    { id: 'keywords', label: 'Keyword Research' },
    { id: 'competitors', label: 'Competitors' },
    { id: 'ideas', label: 'Daily Ideas' },
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

const EMPTY_ACCOUNT = {
    platform: 'youtube',
    account_name: '',
    handle: '',
    niche: '',
    followers_count: 0,
    views_count: 0,
    posts_count: 0,
    engagement_rate: 0,
};

const EMPTY_CONTENT = {
    social_account_id: '',
    platform: 'youtube',
    content_type: 'video',
    title: '',
    target_keyword: '',
    hook: '',
    description: '',
    first_comment: '',
    pin_first_comment: true,
    tagsText: '',
    hashtagsText: '',
    status: 'draft',
};

export default function SocialStudio() {
    const { can } = useMe();
    const qc = useQueryClient();
    const [searchParams] = useSearchParams();
    const [tab, setTab] = useState(searchParams.get('tab') || 'accounts');
    const [connectMenuOpen, setConnectMenuOpen] = useState(false);
    const [brandFilter, setBrandFilter] = useState('');
    const [brandModalOpen, setBrandModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [brandForm, setBrandForm] = useState({ name: '', niche: '', account_ids: [] });
    const [publishPrivacy, setPublishPrivacy] = useState({});
    const [publishError, setPublishError] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [oauthError, setOauthError] = useState(searchParams.get('oauth_error') || '');
    const connectedNotice = searchParams.get('connected');

    // Form states
    const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT);
    const [contentForm, setContentForm] = useState(EMPTY_CONTENT);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [kwInput, setKwInput] = useState({ keyword: '', platform: 'youtube' });
    const [compForm, setCompForm] = useState({
        platform: 'youtube',
        channel_name: '',
        handle: '',
        followers_count: 0,
        avg_views: 0,
        engagement_rate: 0,
        top_video_title: '',
    });

    const invalidateAll = () => {
        qc.invalidateQueries({ queryKey: ['social-overview'] });
        qc.invalidateQueries({ queryKey: ['social-brands'] });
        qc.invalidateQueries({ queryKey: ['social-accounts'] });
        qc.invalidateQueries({ queryKey: ['social-contents'] });
        qc.invalidateQueries({ queryKey: ['social-keywords'] });
        qc.invalidateQueries({ queryKey: ['social-competitors'] });
        qc.invalidateQueries({ queryKey: ['social-ideas'] });
    };

    const { data: overview } = useQuery({
        queryKey: ['social-overview', platformFilter],
        queryFn: () => socialApi.overview(platformFilter || undefined),
    });

    const { data: brands = [] } = useQuery({
        queryKey: ['social-brands'],
        queryFn: socialApi.listBrands,
    });

    const { data: accounts = [] } = useQuery({
        queryKey: ['social-accounts', platformFilter, brandFilter],
        queryFn: () =>
            socialApi.listAccounts({
                ...(platformFilter ? { platform: platformFilter } : {}),
                ...(brandFilter ? { social_brand_id: brandFilter } : {}),
            }),
    });

    const saveBrandMut = useMutation({
        mutationFn: ({ id, payload }) => (id ? socialApi.updateBrand(id, payload) : socialApi.createBrand(payload)),
        onSuccess: () => {
            setBrandModalOpen(false);
            setEditingBrand(null);
            setBrandForm({ name: '', niche: '', account_ids: [] });
            invalidateAll();
        },
    });

    const deleteBrandMut = useMutation({
        mutationFn: socialApi.deleteBrand,
        onSuccess: () => {
            setBrandFilter('');
            invalidateAll();
        },
    });

    const assignAccountBrandMut = useMutation({
        mutationFn: ({ id, social_brand_id }) => socialApi.updateAccount(id, { social_brand_id: social_brand_id || null }),
        onSuccess: invalidateAll,
    });

    const [analyticsAccountId, setAnalyticsAccountId] = useState(null);
    const {
        data: channelAnalytics,
        isLoading: analyticsLoading,
        isFetching: analyticsFetching,
        refetch: refetchAnalytics,
    } = useQuery({
        queryKey: ['social-account-analytics', analyticsAccountId],
        queryFn: () => socialApi.getAccountAnalytics(analyticsAccountId),
        enabled: Boolean(analyticsAccountId),
    });

    const { data: contents = [] } = useQuery({
        queryKey: ['social-contents', platformFilter, selectedAccountId],
        queryFn: () =>
            socialApi.listContents({
                ...(platformFilter ? { platform: platformFilter } : {}),
                ...(selectedAccountId ? { social_account_id: selectedAccountId } : {}),
            }),
    });

    const { data: keywords = [] } = useQuery({
        queryKey: ['social-keywords', platformFilter],
        queryFn: () => socialApi.listKeywords(platformFilter ? { platform: platformFilter } : {}),
    });

    const { data: competitors = [] } = useQuery({
        queryKey: ['social-competitors', platformFilter],
        queryFn: () => socialApi.listCompetitors(platformFilter ? { platform: platformFilter } : {}),
    });

    const { data: ideas = [] } = useQuery({
        queryKey: ['social-ideas', platformFilter],
        queryFn: () => socialApi.listIdeas(platformFilter ? { platform: platformFilter } : {}),
    });

    const createAccountMut = useMutation({
        mutationFn: socialApi.createAccount,
        onSuccess: () => {
            setAccountForm(EMPTY_ACCOUNT);
            invalidateAll();
        },
    });

    const syncAccountMut = useMutation({
        mutationFn: socialApi.syncAccount,
        onSuccess: invalidateAll,
    });

    const syncAllMut = useMutation({
        mutationFn: socialApi.syncAllAccounts,
        onSuccess: invalidateAll,
    });

    const startOAuth = async (platform) => {
        setOauthError('');
        try {
            const { url } = await socialApi.getOAuthUrl(platform);
            window.location.href = url;
        } catch (err) {
            setOauthError(err?.response?.data?.message || `Unable to start ${platform} OAuth.`);
        }
    };

    const deleteAccountMut = useMutation({
        mutationFn: socialApi.deleteAccount,
        onSuccess: invalidateAll,
    });

    const createContentMut = useMutation({
        mutationFn: socialApi.createContent,
        onSuccess: () => {
            setContentForm(EMPTY_CONTENT);
            setAiSuggestion(null);
            invalidateAll();
        },
    });

    const optimizeMut = useMutation({
        mutationFn: socialApi.optimizeContent,
        onSuccess: (res) => {
            setAiSuggestion(res);
            setContentForm((prev) => ({
                ...prev,
                title: res.recommended_title || prev.title,
                hook: res.hook || prev.hook,
                description: res.description || prev.description,
                tagsText: (res.tags || []).join(', '),
                hashtagsText: (res.hashtags || []).join(' '),
            }));
        },
    });

    const deleteContentMut = useMutation({
        mutationFn: socialApi.deleteContent,
        onSuccess: invalidateAll,
    });

    const publishFromDriveMut = useMutation({
        mutationFn: ({ id, privacy }) => socialApi.publishFromDrive(id, privacy),
        onSuccess: () => {
            setPublishError('');
            invalidateAll();
        },
        onError: (err) => {
            setPublishError(err?.response?.data?.message || 'Failed to publish video to YouTube.');
        },
    });

    const analyzeKwMut = useMutation({
        mutationFn: socialApi.analyzeKeyword,
        onSuccess: () => {
            setKwInput((prev) => ({ ...prev, keyword: '' }));
            invalidateAll();
        },
    });

    const deleteKwMut = useMutation({
        mutationFn: socialApi.deleteKeyword,
        onSuccess: invalidateAll,
    });

    const createCompMut = useMutation({
        mutationFn: socialApi.createCompetitor,
        onSuccess: () => {
            setCompForm({
                platform: 'youtube',
                channel_name: '',
                handle: '',
                followers_count: 0,
                avg_views: 0,
                engagement_rate: 0,
                top_video_title: '',
            });
            invalidateAll();
        },
    });

    const deleteCompMut = useMutation({
        mutationFn: socialApi.deleteCompetitor,
        onSuccess: invalidateAll,
    });

    const generateIdeasMut = useMutation({
        mutationFn: socialApi.generateIdeas,
        onSuccess: invalidateAll,
    });

    const updateIdeaMut = useMutation({
        mutationFn: ({ id, status }) => socialApi.updateIdeaStatus(id, status),
        onSuccess: invalidateAll,
    });

    const convertIdeaMut = useMutation({
        mutationFn: ({ id, accountId }) => socialApi.convertIdea(id, accountId),
        onSuccess: () => {
            invalidateAll();
            setTab('content');
        },
    });

    const totals = overview?.totals || {};
    const splitList = (str) =>
        str
            .split(/[,\s]+/)
            .map((s) => s.trim())
            .filter(Boolean);

    const handleContentSubmit = (e) => {
        e.preventDefault();
        if (!contentForm.social_account_id) return;
        createContentMut.mutate({
            social_account_id: Number(contentForm.social_account_id),
            platform: contentForm.platform,
            content_type: contentForm.content_type,
            title: contentForm.title,
            target_keyword: contentForm.target_keyword || null,
            hook: contentForm.hook || null,
            description: contentForm.description || null,
            tags: splitList(contentForm.tagsText),
            hashtags: splitList(contentForm.hashtagsText),
            status: contentForm.status,
            ...(contentForm.drive_file_id
                ? {
                      drive_file_id: contentForm.drive_file_id,
                      drive_file_name: contentForm.drive_file_name,
                      drive_file_url: contentForm.drive_file_url,
                      drive_mime_type: contentForm.drive_mime_type,
                  }
                : {}),
            ...(contentForm.drive_thumbnail_file_id ? { drive_thumbnail_file_id: contentForm.drive_thumbnail_file_id } : {}),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Growth Studio</h1>
                    <p className="mt-0.5 text-sm text-gray-500">
                        YouTube, Instagram & Facebook Pages · Analytics, Content Planner, Google Drive & AI Growth Tools
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-0.5 text-xs">
                        {[
                            { id: '', label: 'All' },
                            { id: 'youtube', label: 'YouTube' },
                            { id: 'instagram', label: 'Instagram' },
                            { id: 'facebook', label: 'Facebook' },
                        ].map((p) => (
                            <button
                                key={p.id || 'all'}
                                onClick={() => setPlatformFilter(p.id)}
                                className={`rounded-lg px-2.5 py-1.5 font-medium transition ${
                                    platformFilter === p.id
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => syncAllMut.mutate()}
                        disabled={syncAllMut.isPending}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                        {syncAllMut.isPending ? 'Syncing…' : '↻ Sync All'}
                    </button>

                    {can('manage_social_accounts') && (
                        <div className="relative">
                            <button
                                onClick={() => setConnectMenuOpen((o) => !o)}
                                className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                            >
                                + Connect Channel ▾
                            </button>
                            {connectMenuOpen && (
                                <div className="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                                    <button
                                        onClick={() => {
                                            setConnectMenuOpen(false);
                                            startOAuth('youtube');
                                        }}
                                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-red-600" />
                                        YouTube Channel
                                    </button>
                                    <button
                                        onClick={() => {
                                            setConnectMenuOpen(false);
                                            startOAuth('instagram');
                                        }}
                                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-700"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-pink-600" />
                                        Instagram Business
                                    </button>
                                    <button
                                        onClick={() => {
                                            setConnectMenuOpen(false);
                                            startOAuth('facebook');
                                        }}
                                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-blue-600" />
                                        Facebook Page
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {connectedNotice && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
                    Successfully connected {connectedNotice} account(s) for auto-sync.
                </div>
            )}
            {oauthError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {oauthError}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Connected Accounts</div>
                    <div className="mt-1 text-2xl font-bold">{totals.accounts ?? 0}</div>
                    <div className="mt-1 text-xs text-gray-500">
                        YT: {totals.youtube_accounts ?? 0} · IG: {totals.instagram_accounts ?? 0} · FB: {totals.facebook_accounts ?? 0}
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Followers / Subs</div>
                    <div className="mt-1 text-2xl font-bold">{(totals.followers ?? 0).toLocaleString()}</div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 to-cyan-500" />
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Views</div>
                    <div className="mt-1 text-2xl font-bold">{(totals.views ?? 0).toLocaleString()}</div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg SEO Score</div>
                    <div className="mt-1 text-2xl font-bold">{totals.avg_seo_score ?? 0}/100</div>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Open Daily Ideas</div>
                    <div className="mt-1 text-2xl font-bold">{totals.open_ideas_count ?? 0}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                            tab === t.id ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: ACCOUNTS */}
            {tab === 'accounts' && (
                <div className="space-y-5">
                    {/* Social Brands Section */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Social Brands (Group YT + IG + FB)</h2>
                                <p className="text-xs text-gray-500">Group multiple platform channels under one brand (e.g. Krishna Motivation).</p>
                            </div>
                            {can('manage_social_accounts') && (
                                <button
                                    onClick={() => {
                                        setEditingBrand(null);
                                        setBrandForm({ name: '', niche: '', account_ids: [] });
                                        setBrandModalOpen(true);
                                    }}
                                    className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                    + New Brand
                                </button>
                            )}
                        </div>

                        {brands.length > 0 && (
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {brands.map((b) => {
                                    const active = String(brandFilter) === String(b.id);
                                    return (
                                        <div
                                            key={b.id}
                                            className={`rounded-xl border p-3 transition ${
                                                active ? 'border-indigo-500 bg-indigo-50/40' : 'border-gray-200 hover:border-indigo-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <button
                                                    onClick={() => setBrandFilter(active ? '' : String(b.id))}
                                                    className="text-left"
                                                >
                                                    <div className="font-semibold text-sm text-gray-900">{b.name}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {b.niche || 'General'} · {b.channels_count} channel(s) · {(b.total_followers || 0).toLocaleString()} followers
                                                    </div>
                                                </button>
                                                {can('manage_social_accounts') && (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Link
                                                            to={`/social/brands/${b.id}/analytics`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="font-medium text-indigo-700 hover:underline"
                                                        >
                                                            Analytics ↗
                                                        </Link>
                                                        <button
                                                            onClick={() => {
                                                                setEditingBrand(b);
                                                                setBrandForm({
                                                                    name: b.name,
                                                                    niche: b.niche || '',
                                                                    account_ids: (b.accounts || []).map((a) => a.id),
                                                                });
                                                                setBrandModalOpen(true);
                                                            }}
                                                            className="text-indigo-600 hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteBrandMut.mutate(b.id)}
                                                            className="text-red-500 hover:underline"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            {(b.accounts || []).length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {b.accounts.map((a) => (
                                                        <span
                                                            key={a.id}
                                                            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${platformBadge(a.platform)}`}
                                                        >
                                                            {a.platform.slice(0, 2)}: {a.account_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {brandFilter && (
                        <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                            <span>Filtering channels by selected brand.</span>
                            <button onClick={() => setBrandFilter('')} className="font-medium underline">
                                Show All Channels
                            </button>
                        </div>
                    )}
                    {accounts.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm space-y-2">
                            <p className="text-sm font-medium text-gray-700">No channels connected yet</p>
                            <p className="text-xs text-gray-500">
                                Use <strong>+ Connect Channel</strong> in the top-right to connect your YouTube, Instagram, or Facebook Pages.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {accounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                {acc.avatar_url ? (
                                                    <img
                                                        src={acc.avatar_url}
                                                        alt={acc.account_name}
                                                        className="h-11 w-11 flex-shrink-0 rounded-full border object-cover"
                                                    />
                                                ) : (
                                                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase ${platformBadge(acc.platform)}`}>
                                                        {acc.platform.slice(0, 2)}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/social/accounts/${acc.id}/analytics`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block truncate text-sm font-semibold text-gray-900 hover:text-indigo-600"
                                                        title="Open channel analytics in a new tab"
                                                    >
                                                        {acc.account_name} ↗
                                                    </Link>
                                                    <div className="truncate text-xs text-gray-500">{acc.handle}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase ${platformBadge(acc.platform)}`}>
                                                    {acc.platform}
                                                </span>
                                                <span
                                                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                                        acc.status === 'connected'
                                                            ? 'bg-green-50 text-green-700'
                                                            : 'bg-yellow-50 text-yellow-700'
                                                    }`}
                                                >
                                                    {acc.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-2.5 text-center">
                                            <div>
                                                <div className="text-[11px] text-gray-500">Followers</div>
                                                <div className="text-sm font-bold text-gray-900">{acc.followers_count.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] text-gray-500">Views</div>
                                                <div className="text-sm font-bold text-gray-900">{acc.views_count.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div className="text-[11px] text-gray-500">Engagement</div>
                                                <div className="text-sm font-bold text-gray-900">{acc.engagement_rate}%</div>
                                            </div>
                                        </div>
                                        {can('manage_social_accounts') && brands.length > 0 && (
                                            <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                                                <span className="text-gray-500">Brand:</span>
                                                <select
                                                    value={acc.social_brand_id || ''}
                                                    onChange={(e) =>
                                                        assignAccountBrandMut.mutate({
                                                            id: acc.id,
                                                            social_brand_id: e.target.value ? Number(e.target.value) : null,
                                                        })
                                                    }
                                                    className="flex-1 rounded-lg border bg-white px-2 py-1 text-xs"
                                                >
                                                    <option value="">No Brand</option>
                                                    {brands.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                                        <span className="text-[11px] text-gray-400">
                                            {acc.last_synced_at ? `Synced ${new Date(acc.last_synced_at).toLocaleDateString()}` : 'Not synced yet'}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <Link
                                                to={`/social/accounts/${acc.id}/analytics`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                                            >
                                                Analytics ↗
                                            </Link>
                                            {can('manage_social_accounts') && (
                                                <>
                                                    <button
                                                        onClick={() => syncAccountMut.mutate(acc.id)}
                                                        className="rounded-lg border px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Sync
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAccountMut.mutate(acc.id)}
                                                        className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                                    >
                                                        ×
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {analyticsAccountId && (
                        <div className="lg:col-span-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
                            {analyticsLoading ? (
                                <div className="py-8 text-center text-sm text-gray-500">Loading channel analytics…</div>
                            ) : channelAnalytics ? (
                                <>
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            {channelAnalytics.account.avatar_url && (
                                                <img
                                                    src={channelAnalytics.account.avatar_url}
                                                    alt={channelAnalytics.account.account_name}
                                                    className="h-12 w-12 rounded-full object-cover border"
                                                />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-semibold">{channelAnalytics.account.account_name}</h3>
                                                    <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${platformBadge(channelAnalytics.account.platform)}`}>
                                                        {channelAnalytics.account.platform}
                                                    </span>
                                                    <span className={`rounded px-2 py-0.5 text-xs ${channelAnalytics.source === 'live' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {channelAnalytics.source === 'live' ? 'Live API' : 'Cached'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {channelAnalytics.account.handle}
                                                    {channelAnalytics.channel_meta?.country ? ` · ${channelAnalytics.channel_meta.country}` : ''}
                                                    {channelAnalytics.channel_meta?.published_at
                                                        ? ` · Joined ${new Date(channelAnalytics.channel_meta.published_at).toLocaleDateString()}`
                                                        : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {channelAnalytics.channel_meta?.channel_url && (
                                                <a
                                                    href={channelAnalytics.channel_meta.channel_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                >
                                                    Open Channel ↗
                                                </a>
                                            )}
                                            <button
                                                onClick={() => refetchAnalytics()}
                                                disabled={analyticsFetching}
                                                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                {analyticsFetching ? 'Refreshing…' : 'Refresh'}
                                            </button>
                                            <button
                                                onClick={() => setAnalyticsAccountId(null)}
                                                className="rounded-lg border px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>

                                    {channelAnalytics.warning && (
                                        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-xs text-yellow-800">
                                            {channelAnalytics.warning}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <div className="text-xs text-gray-500">Subscribers / Followers</div>
                                            <div className="mt-1 text-lg font-bold">{channelAnalytics.summary.followers_count.toLocaleString()}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <div className="text-xs text-gray-500">Total Channel Views</div>
                                            <div className="mt-1 text-lg font-bold">{channelAnalytics.summary.views_count.toLocaleString()}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <div className="text-xs text-gray-500">Total Videos / Posts</div>
                                            <div className="mt-1 text-lg font-bold">{channelAnalytics.summary.posts_count.toLocaleString()}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <div className="text-xs text-gray-500">Avg Views (Last {channelAnalytics.summary.recent_videos_count})</div>
                                            <div className="mt-1 text-lg font-bold">{channelAnalytics.summary.avg_views_per_video.toLocaleString()}</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <div className="text-xs text-gray-500">Engagement Rate</div>
                                            <div className="mt-1 text-lg font-bold">{channelAnalytics.summary.engagement_rate}%</div>
                                        </div>
                                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                            <div className="text-xs text-gray-500">Shorts / Long-form</div>
                                            <div className="mt-1 text-lg font-bold">
                                                {channelAnalytics.summary.shorts_count} / {channelAnalytics.summary.long_form_count}
                                            </div>
                                        </div>
                                    </div>

                                    {channelAnalytics.recent_items.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-sm font-semibold text-gray-800">
                                                Recent Uploads Performance (Last {channelAnalytics.recent_items.length})
                                            </h4>
                                            <div className="overflow-x-auto rounded-lg border border-gray-100">
                                                <table className="min-w-full divide-y divide-gray-100 text-sm">
                                                    <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500">
                                                        <tr>
                                                            <th className="px-3 py-2">Video / Post</th>
                                                            <th className="px-3 py-2">Type</th>
                                                            <th className="px-3 py-2">Published</th>
                                                            <th className="px-3 py-2 text-right">Views</th>
                                                            <th className="px-3 py-2 text-right">Likes</th>
                                                            <th className="px-3 py-2 text-right">Comments</th>
                                                            <th className="px-3 py-2 text-right">Eng %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 bg-white">
                                                        {channelAnalytics.recent_items.map((item) => (
                                                            <tr key={item.id} className="hover:bg-gray-50">
                                                                <td className="px-3 py-2">
                                                                    <div className="flex items-center gap-2.5">
                                                                        {item.thumbnail_url && (
                                                                            <img
                                                                                src={item.thumbnail_url}
                                                                                alt=""
                                                                                className="h-9 w-16 rounded object-cover flex-shrink-0"
                                                                            />
                                                                        )}
                                                                        {item.url ? (
                                                                            <a
                                                                                href={item.url}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="font-medium text-gray-900 hover:text-indigo-600 line-clamp-2"
                                                                            >
                                                                                {item.title}
                                                                            </a>
                                                                        ) : (
                                                                            <span className="font-medium text-gray-900 line-clamp-2">{item.title}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase text-gray-700">
                                                                        {item.type}
                                                                    </span>
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
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: CONTENT PLANNER */}
            {tab === 'content' && (
                <ContentPlannerTab
                    accounts={accounts}
                    brands={brands}
                    contents={contents}
                    contentForm={contentForm}
                    setContentForm={setContentForm}
                    emptyContent={EMPTY_CONTENT}
                    canManage={can('manage_social_content')}
                    onSaved={invalidateAll}
                />
            )}

            {/* TAB 2B: GOOGLE DRIVE */}
            {tab === 'drive' && (
                <GoogleDriveTab
                    onImportVideo={(file) => {
                        const cleanTitle = file.name.replace(/\.[^.]+$/, '');
                        const ytAccount = accounts.find((a) => a.platform === 'youtube');
                        setContentForm((p) => ({
                            ...p,
                            social_account_id: p.social_account_id || (ytAccount ? String(ytAccount.id) : ''),
                            platform: 'youtube',
                            title: p.title || cleanTitle,
                            drive_file_id: file.id,
                            drive_file_name: file.name,
                            drive_file_url: file.web_view_url,
                            drive_mime_type: file.mime_type,
                        }));
                        setTab('content');
                    }}
                    onAttachThumbnail={(file) => {
                        setContentForm((p) => ({
                            ...p,
                            drive_thumbnail_file_id: file.id,
                            drive_thumbnail_name: file.name,
                        }));
                        setTab('content');
                    }}
                />
            )}

            {/* TAB 3: KEYWORD RESEARCH */}
            {tab === 'keywords' && (
                <div className="space-y-4">
                    {can('use_growth_tools') && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                analyzeKwMut.mutate(kwInput);
                            }}
                            className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white shadow-sm p-4"
                        >
                            <input
                                required
                                placeholder="Enter keyword or topic (e.g. instagram reels hooks)"
                                value={kwInput.keyword}
                                onChange={(e) => setKwInput({ ...kwInput, keyword: e.target.value })}
                                className="min-w-[240px] flex-1 rounded-lg border px-3 py-2 text-sm"
                            />
                            <select
                                value={kwInput.platform}
                                onChange={(e) => setKwInput({ ...kwInput, platform: e.target.value })}
                                className="rounded-lg border px-3 py-2 text-sm"
                            >
                                <option value="youtube">YouTube</option>
                                <option value="instagram">Instagram</option>
                                <option value="both">Both</option>
                            </select>
                            <button
                                type="submit"
                                disabled={analyzeKwMut.isPending}
                                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                {analyzeKwMut.isPending ? 'Analyzing…' : 'Analyze Keyword'}
                            </button>
                        </form>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Keyword</th>
                                    <th className="px-4 py-3">Platform</th>
                                    <th className="px-4 py-3">Volume</th>
                                    <th className="px-4 py-3">Competition</th>
                                    <th className="px-4 py-3">Overall Score</th>
                                    <th className="px-4 py-3">Trend</th>
                                    <th className="px-4 py-3">Related Tags</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {keywords.map((kw) => (
                                    <tr key={kw.id}>
                                        <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                                        <td className="px-4 py-3 uppercase text-xs">{kw.platform}</td>
                                        <td className="px-4 py-3">{kw.search_volume.toLocaleString()}</td>
                                        <td className="px-4 py-3">{kw.competition_score}/100</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded px-2 py-0.5 text-xs font-bold ${scoreBadge(kw.overall_score)}`}>
                                                {kw.overall_score}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 capitalize">{kw.trend}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{(kw.related_tags || []).join(', ')}</td>
                                        <td className="px-4 py-3 text-right">
                                            {can('use_growth_tools') && (
                                                <button onClick={() => deleteKwMut.mutate(kw.id)} className="text-xs text-red-600 hover:underline">
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: COMPETITORS */}
            {tab === 'competitors' && (
                <div className="grid gap-6 lg:grid-cols-3">
                    {can('use_growth_tools') && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                createCompMut.mutate(compForm);
                            }}
                            className="space-y-3 rounded-xl border border-gray-200 bg-white shadow-sm p-4"
                        >
                            <h2 className="font-semibold">Track Competitor</h2>
                            <select
                                value={compForm.platform}
                                onChange={(e) => setCompForm({ ...compForm, platform: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            >
                                <option value="youtube">YouTube</option>
                                <option value="instagram">Instagram</option>
                            </select>
                            <input
                                required
                                placeholder="Channel / Profile Name"
                                value={compForm.channel_name}
                                onChange={(e) => setCompForm({ ...compForm, channel_name: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                            <input
                                required
                                placeholder="Handle (e.g. @competitor)"
                                value={compForm.handle}
                                onChange={(e) => setCompForm({ ...compForm, handle: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Followers"
                                    value={compForm.followers_count}
                                    onChange={(e) => setCompForm({ ...compForm, followers_count: Number(e.target.value) })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm"
                                />
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Avg Views"
                                    value={compForm.avg_views}
                                    onChange={(e) => setCompForm({ ...compForm, avg_views: Number(e.target.value) })}
                                    className="w-full rounded-lg border px-3 py-2 text-sm"
                                />
                            </div>
                            <input
                                placeholder="Top Performing Video / Reel Title"
                                value={compForm.top_video_title}
                                onChange={(e) => setCompForm({ ...compForm, top_video_title: e.target.value })}
                                className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={createCompMut.isPending}
                                className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                Add Competitor
                            </button>
                        </form>
                    )}

                    <div className="space-y-3 lg:col-span-2">
                        {competitors.map((c) => (
                            <div key={c.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${platformBadge(c.platform)}`}>
                                            {c.platform}
                                        </span>
                                        <span className="font-semibold">{c.channel_name}</span>
                                        <span className="text-sm text-gray-500">{c.handle}</span>
                                    </div>
                                    <div className="mt-1 text-xs text-gray-500">
                                        Followers: {c.followers_count.toLocaleString()} · Avg Views: {c.avg_views.toLocaleString()}
                                        {c.top_video_title ? ` · Top: "${c.top_video_title}"` : ''}
                                    </div>
                                </div>
                                {can('use_growth_tools') && (
                                    <button onClick={() => deleteCompMut.mutate(c.id)} className="text-xs text-red-600 hover:underline">
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 5: DAILY IDEAS */}
            {tab === 'ideas' && (
                <div className="space-y-4">
                    {can('use_growth_tools') && (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                            <span className="text-sm text-gray-600">
                                Generate vidIQ-style daily video & Reel ideas tailored to your connected YT & IG accounts.
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        generateIdeasMut.mutate({
                                            social_account_id: selectedAccountId ? Number(selectedAccountId) : null,
                                            platform: platformFilter || 'youtube',
                                        })
                                    }
                                    disabled={generateIdeasMut.isPending}
                                    className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    {generateIdeasMut.isPending ? 'Generating…' : 'Generate Daily Ideas'}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                        {ideas.map((idea) => (
                            <div key={idea.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                                <div className="flex items-center justify-between">
                                    <span className={`rounded px-2 py-0.5 text-xs font-semibold uppercase ${platformBadge(idea.platform)}`}>
                                        {idea.platform} · {idea.angle || 'Idea'}
                                    </span>
                                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${scoreBadge(idea.predicted_score)}`}>
                                        Score {idea.predicted_score}
                                    </span>
                                </div>
                                <h3 className="mt-2 font-semibold">{idea.title}</h3>
                                {idea.hook && <p className="mt-1 text-xs text-gray-600">{idea.hook}</p>}
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded bg-gray-100 px-2 py-0.5 capitalize">{idea.status}</span>
                                    {can('use_growth_tools') && idea.status !== 'converted' && (
                                        <>
                                            <button
                                                onClick={() => updateIdeaMut.mutate({ id: idea.id, status: 'saved' })}
                                                className="rounded-lg border px-2 py-1 hover:bg-gray-50"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => updateIdeaMut.mutate({ id: idea.id, status: 'dismissed' })}
                                                className="rounded-lg border px-2 py-1 text-gray-500 hover:bg-gray-50"
                                            >
                                                Dismiss
                                            </button>
                                            {accounts.length > 0 && (
                                                <button
                                                    onClick={() =>
                                                        convertIdeaMut.mutate({
                                                            id: idea.id,
                                                            accountId: Number(selectedAccountId || accounts[0].id),
                                                        })
                                                    }
                                                    className="rounded bg-green-600 px-2.5 py-1 text-white hover:bg-green-700"
                                                >
                                                    Convert to Draft
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {brandModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            saveBrandMut.mutate({ id: editingBrand?.id, payload: brandForm });
                        }}
                        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-gray-900">
                                {editingBrand ? `Edit Brand: ${editingBrand.name}` : 'Create Social Brand'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setBrandModalOpen(false)}
                                className="rounded border px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Brand Name</label>
                                <input
                                    required
                                    value={brandForm.name}
                                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                                    placeholder="e.g. Krishna Motivation"
                                    className="w-full rounded-lg border px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Niche (Optional)</label>
                                <input
                                    value={brandForm.niche}
                                    onChange={(e) => setBrandForm({ ...brandForm, niche: e.target.value })}
                                    placeholder="e.g. Motivation, Spirituality"
                                    className="w-full rounded-lg border px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">
                                    Link Channels (YouTube, Instagram, Facebook)
                                </label>
                                <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border p-2">
                                    {accounts.map((a) => {
                                        const checked = brandForm.account_ids.includes(a.id);
                                        return (
                                            <label key={a.id} className="flex cursor-pointer items-center gap-2 rounded p-1.5 text-xs hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={(e) =>
                                                        setBrandForm((prev) => ({
                                                            ...prev,
                                                            account_ids: e.target.checked
                                                                ? [...prev.account_ids, a.id]
                                                                : prev.account_ids.filter((id) => id !== a.id),
                                                        }))
                                                    }
                                                />
                                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${platformBadge(a.platform)}`}>
                                                    {a.platform}
                                                </span>
                                                <span className="truncate font-medium text-gray-900">{a.account_name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setBrandModalOpen(false)}
                                className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saveBrandMut.isPending}
                                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {saveBrandMut.isPending ? 'Saving…' : 'Save Brand'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
