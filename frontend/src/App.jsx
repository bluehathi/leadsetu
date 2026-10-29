import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useMe } from './hooks/useMe';
import Companies from './pages/Companies';
import Contacts from './pages/Contacts';
import Login from './pages/Login';
import Permissions from './pages/Permissions';
import Roles from './pages/Roles';
import Users from './pages/Users';

function RequireAuth({ children }) {
    const { me, isLoading } = useMe();
    if (isLoading) return <div className="p-8">Loading…</div>;
    if (!me) return <Navigate to="/login" replace />;
    return children;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
                <Route index element={<Navigate to="/contacts" replace />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/users" element={<Users />} />
                <Route path="/roles" element={<Roles />} />
                <Route path="/permissions" element={<Permissions />} />
            </Route>
        </Routes>
    );
}
