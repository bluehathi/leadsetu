import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useMe } from './hooks/useMe';
import Companies from './pages/Companies';
import Contacts from './pages/Contacts';
import ActivityLogs from './pages/ActivityLogs';
import BusinessSettings from './pages/BusinessSettings';
import { DocumentDetail, DocumentEditor, DocumentList } from './pages/Documents';
import Items from './pages/Items';
import CampaignDetail from './pages/CampaignDetail';
import Campaigns from './pages/Campaigns';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import ForgotPassword from './pages/ForgotPassword';
import Login from './pages/Login';
import Permissions from './pages/Permissions';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import ProspectLists from './pages/ProspectLists';
import Roles from './pages/Roles';
import SmtpSettings from './pages/SmtpSettings';
import Users from './pages/Users';
import Workspace from './pages/Workspace';

function RequireAuth({ children }) {
    const { me, isLoading } = useMe();
    if (isLoading) return <div className="p-8">Loading…</div>;
    if (!me) return <Navigate to="/login" replace />;
    return children;
}

// Land on the first area the user is allowed to see.
const HOME = [
    ['view_dashboard', '/dashboard'], ['view_invoices', '/invoices'], ['view_leads', '/leads'], ['view_contacts', '/contacts'],
    ['view_companies', '/companies'], ['view_campaigns', '/campaigns'], ['view_users', '/users'],
];

function Home() {
    const { can } = useMe();
    const target = HOME.find(([p]) => can(p))?.[1];
    return target ? <Navigate to={target} replace /> : <p className="text-gray-600">Your account has no access to any area yet. Ask an administrator for permissions.</p>;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
                <Route index element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/activity-logs" element={<ActivityLogs />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/prospect-lists" element={<ProspectLists />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/campaigns/:id" element={<CampaignDetail />} />
                <Route path="/business" element={<BusinessSettings />} />
                <Route path="/items" element={<Items />} />
                <Route path="/quotes" element={<DocumentList kind="quote" />} />
                <Route path="/quotes/new" element={<DocumentEditor kind="quote" />} />
                <Route path="/quotes/:id" element={<DocumentDetail kind="quote" />} />
                <Route path="/quotes/:id/edit" element={<DocumentEditor kind="quote" />} />
                <Route path="/invoices" element={<DocumentList kind="invoice" />} />
                <Route path="/invoices/new" element={<DocumentEditor kind="invoice" />} />
                <Route path="/invoices/:id" element={<DocumentDetail kind="invoice" />} />
                <Route path="/invoices/:id/edit" element={<DocumentEditor kind="invoice" />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/users" element={<Users />} />
                <Route path="/roles" element={<Roles />} />
                <Route path="/permissions" element={<Permissions />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/settings/smtp" element={<SmtpSettings />} />
            </Route>
        </Routes>
    );
}
