import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth';
import { can } from '../lib/permissions';

export function useMe() {
    const query = useQuery({
        queryKey: ['me'],
        queryFn: () => getMe().catch((e) => (e.response?.status === 401 ? null : Promise.reject(e))),
        staleTime: 5 * 60 * 1000,
    });
    return { me: query.data, isLoading: query.isLoading, can: (p) => can(query.data, p) };
}
