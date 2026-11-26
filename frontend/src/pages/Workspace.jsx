import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mcpApi, workspaceApi } from '../api/resource';
import { Button, Field, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { parseApiError } from '../lib/errors';

export default function Workspace() {
    const { can } = useMe();
    const qc = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['workspace'], queryFn: workspaceApi.get });
    const { data: mcpData } = useQuery({ queryKey: ['mcp-tokens'], queryFn: mcpApi.listTokens });
    const [values, setValues] = useState({ name: '', description: '' });
    const [error, setError] = useState({ fields: {} });
    const [saved, setSaved] = useState(false);
    const [tokenName, setTokenName] = useState('');
    const [createdToken, setCreatedToken] = useState(null);

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

    const createMcpToken = useMutation({
        mutationFn: mcpApi.createToken,
        onSuccess: (res) => {
            setTokenName('');
            setCreatedToken(res);
            qc.invalidateQueries({ queryKey: ['mcp-tokens'] });
        },
    });

    const deleteMcpToken = useMutation({
        mutationFn: mcpApi.deleteToken,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['mcp-tokens'] }),
    });

    if (isLoading) return <p>Loading…</p>;
    const editable = can('edit_workspaces');
    const mcpEndpoint = mcpData?.endpoint || `${window.location.origin}/api/mcp`;
    const mcpTokens = mcpData?.tokens || [];

    return (
        <div className="space-y-8">
            <form onSubmit={submit} className="max-w-lg space-y-4">
                <h1 className="text-2xl font-semibold">Workspace</h1>
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

            <div className="max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">MCP Server (AI Agent Access · Read-Only)</h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Connect ChatGPT, Claude, or Gemini to read your workspace CRM, analytics, Content Planner, and cached Drive metadata.
                    </p>
                    <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                        <span className="font-medium text-gray-600">Endpoint: </span>
                        <code className="font-mono text-indigo-700">{mcpEndpoint}</code>
                    </div>
                </div>

                {createdToken && (
                    <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-900">
                        <div className="font-semibold">New MCP Token Created (copy now — shown once):</div>
                        <code className="block break-all rounded bg-white px-2.5 py-1.5 font-mono text-gray-900 border">
                            {createdToken.plain_text_token}
                        </code>
                        <div className="text-[11px] text-green-800">
                            Use header: <code>Authorization: Bearer {createdToken.plain_text_token}</code>
                        </div>
                    </div>
                )}

                {editable && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!tokenName.trim()) return;
                            createMcpToken.mutate(tokenName.trim());
                        }}
                        className="flex gap-2"
                    >
                        <input
                            required
                            value={tokenName}
                            onChange={(e) => setTokenName(e.target.value)}
                            placeholder="Token label (e.g. Claude, ChatGPT, Gemini)"
                            className="flex-1 rounded-lg border px-3 py-2 text-sm"
                        />
                        <Button type="submit" disabled={createMcpToken.isPending}>
                            {createMcpToken.isPending ? 'Generating…' : 'Generate Token'}
                        </Button>
                    </form>
                )}

                {mcpTokens.length > 0 && (
                    <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
                        {mcpTokens.map((t) => (
                            <div key={t.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                                <div>
                                    <div className="font-medium text-gray-900">{t.name}</div>
                                    <div className="text-xs text-gray-500">
                                        <code>{t.token_prefix}…</code>
                                        {t.last_used_at ? ` · Last used ${new Date(t.last_used_at).toLocaleString()}` : ' · Never used'}
                                    </div>
                                </div>
                                {editable && (
                                    <button
                                        type="button"
                                        onClick={() => deleteMcpToken.mutate(t.id)}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        Revoke
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
