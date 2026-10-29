import React from 'react';

export default function CampaignForm({ data, setData, errors, prospectLists, processing, onSubmit }) {
    // Multi-select handler for prospect lists
    const handleProspectListsChange = (e) => {
        const options = Array.from(e.target.options);
        const selected = options.filter(o => o.selected).map(o => o.value);
        setData('prospect_list_ids', selected);
    };
    return (
        <form onSubmit={onSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 space-y-5">
            <div>
                <label className="block text-sm font-medium mb-1">Campaign Name</label>
                <input type="text" className="w-full border px-3 py-2 rounded" value={data.name} onChange={e => setData('name', e.target.value)} required />
                {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <input type="text" className="w-full border px-3 py-2 rounded" value={data.subject} onChange={e => setData('subject', e.target.value)} required />
                {errors.subject && <div className="text-red-500 text-xs mt-1">{errors.subject}</div>}
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Email Body</label>
                <textarea className="w-full border px-3 py-2 rounded min-h-[120px]" value={data.body} onChange={e => setData('body', e.target.value)} required />
                {errors.body && <div className="text-red-500 text-xs mt-1">{errors.body}</div>}
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Prospect Lists</label>
                <select
                    className="w-full border px-3 py-2 rounded"
                    multiple
                    value={data.prospect_list_ids || []}
                    onChange={handleProspectListsChange}
                    required
                    size={Math.min(5, prospectLists.length)}
                >
                    {prospectLists.map(list => (
                        <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                </select>
                {errors.prospect_list_ids && <div className="text-red-500 text-xs mt-1">{errors.prospect_list_ids}</div>}
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">Schedule (optional)</label>
                <input type="datetime-local" className="w-full border px-3 py-2 rounded" value={data.scheduled_at} onChange={e => setData('scheduled_at', e.target.value)} />
                {errors.scheduled_at && <div className="text-red-500 text-xs mt-1">{errors.scheduled_at}</div>}
            </div>
            <div className="flex justify-end gap-2">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={processing}>Save</button>
            </div>
        </form>
    );
}
