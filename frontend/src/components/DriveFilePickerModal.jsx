import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../api/social';

export default function DriveFilePickerModal({ mode, onSelect, onClose }) {
    const qc = useQueryClient();
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'My Drive' }]);
    const [initializedDefault, setInitializedDefault] = useState(false);
    const [search, setSearch] = useState('');

    const currentFolder = breadcrumbs[breadcrumbs.length - 1];

    const { data: status, isLoading: statusLoading } = useQuery({
        queryKey: ['social-drive-status'],
        queryFn: socialApi.getDriveStatus,
    });

    useEffect(() => {
        if (!initializedDefault && status?.connected) {
            if (status.default_folder_id && status.default_folder_name) {
                setBreadcrumbs([
                    { id: null, name: 'My Drive' },
                    { id: status.default_folder_id, name: status.default_folder_name },
                ]);
            }
            setInitializedDefault(true);
        }
    }, [status, initializedDefault]);

    const { data: filesData, isLoading: filesLoading } = useQuery({
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

    const favorites = status?.favorite_folders ?? [];
    const allItems = filesData?.items ?? [];
    const items = allItems.filter((f) => {
        if (f.is_folder) return true;
        return mode === 'video' ? f.is_video : f.is_image;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">
                            {mode === 'video' ? 'Select Video from Google Drive' : 'Select Thumbnail from Google Drive'}
                        </h3>
                        <p className="text-xs text-gray-500">
                            Showing cached folder & {mode === 'video' ? 'video' : 'image'} metadata from DB
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {status?.connected && (
                            <button
                                type="button"
                                onClick={() => refreshMut.mutate()}
                                disabled={refreshMut.isPending}
                                className="rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                            >
                                {refreshMut.isPending ? 'Refreshing…' : 'Refresh'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {statusLoading ? (
                    <div className="p-6 text-sm text-gray-500">Checking Google Drive connection…</div>
                ) : !status?.connected ? (
                    <div className="p-8 text-center space-y-3">
                        <p className="text-sm text-gray-600">Google Drive is not connected yet.</p>
                        <button
                            type="button"
                            onClick={async () => {
                                const { url } = await socialApi.getDriveOAuthUrl();
                                window.location.href = url;
                            }}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                            Connect Google Drive
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-5 py-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        setBreadcrumbs([{ id: null, name: 'My Drive' }]);
                                    }}
                                    className={`rounded px-2 py-0.5 text-xs ${
                                        currentFolder.id === null
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-white border text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    My Drive
                                </button>
                                {favorites.map((fav) => (
                                    <button
                                        key={fav.id}
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setBreadcrumbs([
                                                { id: null, name: 'My Drive' },
                                                { id: fav.id, name: fav.name },
                                            ]);
                                        }}
                                        className={`rounded px-2 py-0.5 text-xs ${
                                            currentFolder.id === fav.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white border text-gray-700 hover:bg-gray-100'
                                        }`}
                                    >
                                        {status.default_folder_id === fav.id ? '★ ' : '📁 '}
                                        {fav.name}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search Drive…"
                                className="w-48 rounded-lg border bg-white px-2.5 py-1 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-1 border-b border-gray-100 px-5 py-2 text-xs">
                            {breadcrumbs.map((b, idx) => (
                                <span key={b.id || 'root'} className="flex items-center gap-1">
                                    {idx > 0 && <span className="text-gray-400">/</span>}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
                                        }}
                                        className={idx === breadcrumbs.length - 1 ? 'font-semibold text-gray-900' : 'text-indigo-600 hover:underline'}
                                    >
                                        {b.name}
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {filesLoading ? (
                                <div className="py-8 text-center text-sm text-gray-500">Loading files…</div>
                            ) : items.length === 0 ? (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    No folders or {mode === 'video' ? 'video' : 'image'} files found here.
                                </div>
                            ) : (
                                <div className="grid gap-2.5 sm:grid-cols-2">
                                    {items.map((file) => (
                                        <button
                                            key={file.id}
                                            type="button"
                                            onClick={() => {
                                                if (file.is_folder) {
                                                    setSearch('');
                                                    setBreadcrumbs([...breadcrumbs, { id: file.id, name: file.name }]);
                                                } else {
                                                    onSelect(file);
                                                    onClose();
                                                }
                                            }}
                                            className="flex items-center gap-3 rounded-xl border border-gray-200 p-2.5 text-left hover:border-indigo-400 hover:bg-indigo-50/40"
                                        >
                                            {file.thumbnail_url && !file.is_folder ? (
                                                <img
                                                    src={file.thumbnail_url}
                                                    alt=""
                                                    className="h-12 w-20 flex-shrink-0 rounded object-cover border"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
                                                    {file.is_folder ? '📁' : mode === 'video' ? '🎬' : '🖼️'}
                                                </div>
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium text-gray-900">{file.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {file.is_folder ? 'Open folder →' : 'Click to select'}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
