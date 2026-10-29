import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMe } from './api/auth';
import Login from './pages/Login';

function RequireAuth({ children }) {
    const { data: me, isLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
    if (isLoading) return <div className="p-8">Loading…</div>;
    if (!me) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/"
                element={
                    <RequireAuth>
                        <div className="p-8">Dashboard (migrate modules here)</div>
                    </RequireAuth>
                }
            />
        </Routes>
    );
}
