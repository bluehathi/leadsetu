import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workspaceApi } from '../api/resource';
import { Button, Field, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { parseApiError } from '../lib/errors';

export default function Workspace() {
    const { can } = useMe();
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['workspace'], queryFn: workspaceApi.get });
    const [values, setValues] = useState({ name: '', description: '' });
    const [error, setError] = useState({ fields: {} });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (data) setValues({ name: data.name ?? '', description: data.description ?? '' });
    }, [data]);

    const save = useMutation({
        mutationFn: workspaceApi.update,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['workspace'] });
            qc.invalidateQueries({ queryKey: ['me'] }); // header shows the workspace name
        },
    });

    const submit = async (e) => {
        e.preventDefault();
        setSaved(false);
        try {
            await save.mutateAsync(values);
            setError({ fields: {} });
            setSaved(true);
        } catch (err) {
            setError(parseApiError(err));
        }
    };

    if (isLoading) return <p>Loading…</p>;
    const editable = can('edit_workspaces');

    return (
        <form onSubmit={submit} className="max-w-lg space-y-4">
            <h1 className="text-xl font-semibold">Workspace</h1>
            {error.message && !Object.keys(error.fields).length && <p className="text-sm text-red-600">{error.message}</p>}
            <Field label="Name" error={error.fields.name}>
                <input className={inputClass} disabled={!editable} value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
            </Field>
            <Field label="Description" error={error.fields.description}>
                <textarea className={inputClass} rows={3} disabled={!editable} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
            </Field>
            {editable && (
                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={save.isPending}>Save</Button>
                    {saved && <span className="text-sm text-green-700">Saved.</span>}
                </div>
            )}
        </form>
    );
}
