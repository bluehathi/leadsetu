import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../api/social';

function formatBytes(bytes) {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
        val /= 1024;
        i++;
    }
    return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function GoogleDriveTab({ onImportVideo, onAttachThumbnail }) {
    const qc = useQueryClient();
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Drive' }]);
    const [search, setSearch] = useState('');
    const [connecting, setConnecting] = useState(false);

    const currentFolder = breadcrumbs[breadcrumbs.length - 1];

    const { data: status, isLoading: statusLoading } = useQuery({
        queryKey: ['social-drive-status'],
        queryFn: socialApi.getDriveStatus,
    });

    const { data: filesData, isLoading: filesLoading, error: filesError } = useQuery({
        queryKey: ['social-drive-files', currentFolder.id, search],
        queryFn: () =>
            socialApi.listDriveFiles({
                ...(currentFolder.id && !search ? { folder_id: currentFolder.id } : {}),
                ...(search ? { search } : {}),
            }),
        enabled: Boolean(status?.connected),
    });

    const refreshMut = useMutation({
        mutationFn: () =>
            socialApi.listDriveFiles({
                ...(currentFolder.id && !search ? { folder_id: currentFolder.id } : {}),
                ...(search ? { search } : {}),
                refresh: 1,
            }),
        onSuccess: (fresh) => {
            qc.setQueryData(['social-drive-files', currentFolder.id, search], fresh);
        },
    });

    const files = filesData?.items ?? [];
    const filesSource = filesData?.source;
    const filesSyncedAt = filesData?.synced_at;

    const disconnectMut = useMutation({
        mutationFn: socialApi.disconnectDrive,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['social-drive-status'] });
            qc.removeQueries({ queryKey: ['social-drive-files'] });
        },
    });

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const { url } = await socialApi.getDriveOAuthUrl();
            window.location.href = url;
        } finally {
            setConnecting(false);
        }
    };

    if (statusLoading) {
        return <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Checking Google Drive connection…</div>;
    }

    if (!status?.connected) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm space-y-3">
                <h2 className="text-lg font-semibold text-gray-900">Connect Google Drive</h2>
                <p className="mx-auto max-w-md text-sm text-gray-500">
                    Browse your Google Drive folders, import video & thumbnail files into Growth Studio content, and publish directly to YouTube.
                </p>
                <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                    {connecting ? 'Redirecting to Google…' : 'Connect Google Drive'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="rounded bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Connected</span>
                        <span className="text-sm font-semibold text-gray-900">{status.google_email || 'Google Drive'}</span>
                        {filesSource && (
                            <span className={`rounded px-2 py-0.5 text-xs ${filesSource === 'live' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {filesSource === 'live' ? 'Live API' : 'DB Cache'}
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                        Folder & file metadata is cached in DB (files are never copied).
                        {filesSyncedAt ? ` · Synced ${new Date(filesSyncedAt).toLocaleString()}` : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refreshMut.mutate()}
                        disabled={refreshMut.isPending}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {refreshMut.isPending ? 'Refreshing…' : 'Refresh from Drive'}
                    </button>
                    <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                    >
                        Switch Account
                    </button>
                    <button
                        onClick={() => disconnectMut.mutate()}
                        disabled={disconnectMut.isPending}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-1 text-sm">
                    {breadcrumbs.map((b, idx) => (
                        <span key={b.id || 'root'} className="flex items-center gap-1">
                            {idx > 0 && <span className="text-gray-400">/</span>}
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
                                }}
                                className={`rounded px-1.5 py-0.5 text-xs ${
                                    idx === breadcrumbs.length - 1
                                        ? 'font-semibold text-gray-900'
                                        : 'text-indigo-600 hover:underline'
                                }`}
                            >
                                {b.name}
                            </button>
                        </span>
                    ))}
                </div>

                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search files across Drive…"
                    className="rounded-lg border px-3 py-1.5 text-xs w-64"
                />
            </div>

            {filesError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {filesError.response?.data?.message || 'Unable to load Google Drive files.'}
                </div>
            )}

            {filesLoading ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading Drive files…</div>
            ) : files.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                    No folders, videos, or images found here.
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                            <div>
                                {file.thumbnail_url && !file.is_folder && (
                                    <img
                                        src={file.thumbnail_url}
                                        alt=""
                                        className="mb-2.5 aspect-video w-full rounded-lg border object-cover"
                                    />
                                )}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">
                                                {file.is_folder ? '📁' : file.is_video ? '🎬' : '🖼️'}
                                            </span>
                                            {file.is_folder ? (
                                                <button
                                                    onClick={() => {
                                                        setSearch('');
                                                        setBreadcrumbs([...breadcrumbs, { id: file.id, name: file.name }]);
                                                    }}
                                                    className="truncate text-sm font-semibold text-indigo-700 hover:underline"
                                                >
                                                    {file.name}
                                                </button>
                                            ) : (
                                                <span className="truncate text-sm font-semibold text-gray-900">{file.name}</span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {file.is_folder ? 'Folder' : formatBytes(file.size)}
                                            {file.modified_time ? ` · ${new Date(file.modified_time).toLocaleDateString()}` : ''}
                                        </p>
                                    </div>
                                    {file.web_view_url && (
                                        <a
                                            href={file.web_view_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-gray-400 hover:text-gray-600"
                                            title="Open in Google Drive"
                                        >
                                            ↗
                                        </a>
                                    )}
                                </div>
                            </div>

                            {!file.is_folder && (
                                <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                                    {file.is_video && (
                                        <button
                                            onClick={() => onImportVideo(file)}
                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                                        >
                                            Import Video to Content
                                        </button>
                                    )}
                                    {file.is_image && (
                                        <button
                                            onClick={() => onAttachThumbnail(file)}
                                            className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                                        >
                                            Use as Thumbnail
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
