import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// List state (search/sort/page) + mutations for a CRUD resource.
export function useResourceList(key, api, { sort, filters = {} } = {}) {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const list = useQuery({
        queryKey: [key, { search, page, sort, filters }],
        queryFn: () => api.list({ search: search || undefined, page, sort, ...filters }),
        placeholderData: keepPreviousData,
    });

    const invalidate = () => qc.invalidateQueries({ queryKey: [key] });
    const save = useMutation({
        mutationFn: ({ id, values }) => (id ? api.update(id, values) : api.create(values)),
        onSuccess: invalidate,
    });
    const remove = useMutation({ mutationFn: (id) => api.remove(id), onSuccess: invalidate });

    return {
        list, save, remove,
        search, setSearch: (v) => { setSearch(v); setPage(1); },
        page, setPage,
    };
}
