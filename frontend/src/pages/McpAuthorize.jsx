import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { login } from '../api/auth';
import { useMe } from '../hooks/useMe';
import { useQueryClient } from '@tanstack/react-query';

export default function McpAuthorize() {
    const [params] = useSearchParams();
    const { me, isLoading } = useMe();
    const qc = useQueryClient();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const clientId = params.get('client_id') || '';
    const redirectUri = params.get('redirect_uri') || '';
    const state = params.get('state') || '';
    const codeChallenge = params.get('code_challenge') || '';
    const codeChallengeMethod = params.get('code_challenge_method') || 'S256';

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        setSubmitting(true);
        try {
            await login({ email, password });
            await qc.invalidateQueries({ queryKey: ['me'] });
        } catch (err) {
            setAuthError(err?.response?.data?.message || 'Invalid credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async () => {
        setAuthError('');
        setSubmitting(true);
        try {
            const res = await api.post('/mcp/oauth/approve', {
                client_id: clientId,
                redirect_uri: redirectUri,
                state,
                code_challenge: codeChallenge || null,
                code_challenge_method: codeChallengeMethod,
            });
            window.location.href = res.data.data.redirect_to;
        } catch (err) {
            setAuthError(err?.response?.data?.message || 'Failed to authorize connector.');
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">Loading…</div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Authorize AI Agent Access</h1>
                    <p className="mt-1 text-xs text-gray-500">
                        Grant read-only MCP access to your LeadSetu workspace (CRM, Analytics, Content Planner, and cached Drive metadata).
                    </p>
                </div>

                {authError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {authError}
                    </div>
                )}

                {!me ? (
                    <form onSubmit={handleLogin} className="space-y-3">
                        <p className="text-xs font-medium text-gray-700">Sign in to your LeadSetu account to continue:</p>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {submitting ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
                            <div>
                                <span className="font-medium">Signed in as:</span> {me.name} ({me.email})
                            </div>
                            <div>
                                <span className="font-medium">Workspace:</span> {me.workspace?.name || `#${me.workspace_id}`}
                            </div>
                            <div>
                                <span className="font-medium">Permissions:</span> Read-only (`readonly`)
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleApprove}
                                disabled={submitting || !clientId || !redirectUri}
                                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {submitting ? 'Authorizing…' : 'Approve & Connect'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
