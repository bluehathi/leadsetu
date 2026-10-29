import { useQuery } from '@tanstack/react-query';
import { permissionsApi } from '../api/resource';

// Permissions are defined by the application; tenants can only view them.
export default function Permissions() {
    const { data, isLoading, isError } = useQuery({ queryKey: ['permissions'], queryFn: permissionsApi.list });
    if (isLoading) return <p>Loading…</p>;
    if (isError) return <p className="text-sm text-red-600">Could not load permissions.</p>;

    return (
        <div>
            <h1 className="mb-1 text-xl font-semibold">Permissions</h1>
            <p className="mb-4 text-sm text-gray-600">Defined by the application. Combine them into roles on the Roles page.</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {data.data.map((p) => (
                    <div key={p.id} className="rounded border bg-white px-3 py-2 text-sm">
                        {p.name}
                        {!p.grantable && <span className="ml-2 text-xs text-gray-500">(you don't hold this)</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}
