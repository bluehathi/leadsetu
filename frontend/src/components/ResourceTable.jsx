import { Button, Pagination, inputClass } from './ui';

// Generic list screen: search box, table, pagination, row actions.
export default function ResourceTable({ title, columns, state, canCreate, canEdit, canDelete, rowEditable = () => true, rowDeletable = () => true, onCreate, onEdit, onDelete }) {
    const { list, search, setSearch, setPage } = state;
    const rows = list.data?.data ?? [];

    return (
        <div>
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-xl font-semibold">{title}</h1>
                {canCreate && <Button onClick={onCreate}>New</Button>}
            </div>
            <input className={`${inputClass} mb-4 max-w-xs`} placeholder="Search…" value={search}
                onChange={(e) => setSearch(e.target.value)} />
            {list.isError && <p className="text-sm text-red-600">Could not load data.</p>}
            <div className="overflow-x-auto rounded border bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50">
                        <tr>
                            {columns.map((c) => <th key={c.label} className="px-4 py-2 font-medium">{c.label}</th>)}
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className="border-b last:border-0">
                                {columns.map((c) => <td key={c.label} className="px-4 py-2">{c.render(row) ?? '—'}</td>)}
                                <td className="space-x-3 px-4 py-2 text-right">
                                    {canEdit && rowEditable(row) && <button className="text-blue-600 hover:underline" onClick={() => onEdit(row)}>Edit</button>}
                                    {canDelete && rowDeletable(row) && <Button variant="danger" onClick={() => onDelete(row)}>Delete</Button>}
                                </td>
                            </tr>
                        ))}
                        {!list.isLoading && rows.length === 0 && (
                            <tr><td className="px-4 py-6 text-center text-gray-500" colSpan={columns.length + 1}>Nothing here yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination meta={list.data?.meta} onPage={setPage} />
        </div>
    );
}
