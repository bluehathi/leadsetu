export default function PlatformPreviewCard({ form, account }) {
    const platform = account?.platform || form.platform || 'youtube';
    const handle = account?.handle || '@channel';
    const accountName = account?.account_name || 'Your Channel';
    const title = (form.title || '').trim() || 'Untitled Post';
    const description = (form.description || '').trim();
    const tags = String(form.tagsText || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    const hashtags = String(form.hashtagsText || '')
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((h) => (h.startsWith('#') ? h : `#${h}`));

    const combinedCaption = [
        form.title ? form.title.trim() : '',
        description,
        hashtags.join(' '),
    ]
        .filter(Boolean)
        .join('\n\n');

    const mediaLabel = form.drive_file_name || form.drive_thumbnail_name || 'No Google Drive media attached yet';
    const isShortOrReel = ['short', 'reel'].includes(form.content_type);

    return (
        <div className="space-y-3">
            {/* Platform limit checks */}
            <div className="flex flex-wrap gap-1.5 text-[11px]">
                {platform === 'youtube' && (
                    <span
                        className={`rounded-full px-2.5 py-0.5 font-medium ${
                            title.length > 100 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        YT Title: {title.length}/100 chars {title.length > 100 ? '⚠ Too long' : ''}
                    </span>
                )}
                {platform === 'instagram' && (
                    <span
                        className={`rounded-full px-2.5 py-0.5 font-medium ${
                            combinedCaption.length > 2200 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        IG Caption: {combinedCaption.length}/2,200 chars {combinedCaption.length > 2200 ? '⚠ Too long' : ''}
                    </span>
                )}
                {form.scheduled_at && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-700">
                        📅 {new Date(form.scheduled_at).toLocaleString()}
                    </span>
                )}
            </div>

            {platform === 'youtube' && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div
                        className={`flex flex-col items-center justify-center bg-gray-900 p-4 text-center text-white ${
                            isShortOrReel ? 'mx-auto aspect-[9/16] max-h-64 w-44 rounded-b-xl' : 'aspect-video w-full'
                        }`}
                    >
                        <div className="text-2xl">{form.drive_file_id ? '🎬' : '▶️'}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] text-gray-300">{mediaLabel}</div>
                        <span className="mt-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase">
                            YouTube {form.content_type}
                        </span>
                    </div>
                    <div className="space-y-2 p-3.5">
                        <div className="text-sm font-semibold leading-snug text-gray-900">{title}</div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium text-gray-800">{accountName}</span>
                            <span>·</span>
                            <span>{handle}</span>
                            {form.contains_ai_content && (
                                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-800">
                                    Altered / synthetic content
                                </span>
                            )}
                        </div>
                        {(description || hashtags.length > 0) && (
                            <p className="whitespace-pre-line rounded-xl bg-gray-50 p-2.5 text-xs text-gray-700 line-clamp-4">
                                {[description, hashtags.join(' ')].filter(Boolean).join('\n\n')}
                            </p>
                        )}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {tags.slice(0, 8).map((t) => (
                                    <span key={t} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {platform === 'instagram' && (
                <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-[10px] font-bold text-white">
                                IG
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-900">{handle}</div>
                                {form.contains_ai_content && (
                                    <div className="text-[10px] font-medium text-purple-700">✨ AI info</div>
                                )}
                            </div>
                        </div>
                        <span className="rounded bg-pink-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-pink-700">
                            {form.content_type}
                        </span>
                    </div>
                    <div className="flex aspect-[4/5] max-h-60 w-full flex-col items-center justify-center bg-gray-900 p-4 text-center text-white">
                        <div className="text-2xl">{form.drive_file_id ? '🎞️' : '🖼️'}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] text-gray-300">{mediaLabel}</div>
                    </div>
                    <div className="space-y-1.5 p-3.5 text-xs">
                        <div className="whitespace-pre-line text-gray-800 line-clamp-5">
                            <span className="mr-1.5 font-semibold">{handle}</span>
                            {combinedCaption}
                        </div>
                    </div>
                </div>
            )}

            {platform === 'facebook' && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between px-3.5 pt-3">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                                FB
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-gray-900">{accountName}</div>
                                <div className="text-[10px] text-gray-400">
                                    {form.scheduled_at ? `Scheduled · ${new Date(form.scheduled_at).toLocaleDateString()}` : 'Just now · 🌐'}
                                </div>
                            </div>
                        </div>
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">
                            {form.content_type}
                        </span>
                    </div>
                    <div className="whitespace-pre-line px-3.5 py-2.5 text-xs text-gray-800 line-clamp-5">
                        {combinedCaption}
                    </div>
                    {(form.drive_file_id || form.drive_thumbnail_file_id) && (
                        <div className="flex aspect-video w-full flex-col items-center justify-center bg-gray-900 p-4 text-center text-white">
                            <div className="text-2xl">{form.drive_file_id ? '🎬' : '🖼️'}</div>
                            <div className="mt-1 line-clamp-2 text-[11px] text-gray-300">{mediaLabel}</div>
                        </div>
                    )}
                </div>
            )}

            {form.first_comment && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs">
                    <div className="flex items-center justify-between font-semibold text-gray-700">
                        <span>💬 First Comment Preview</span>
                        {form.pin_first_comment && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">📌 Pin Intent</span>
                        )}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-gray-700">{form.first_comment}</p>
                </div>
            )}
        </div>
    );
}
