import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { changePassword, updateProfile } from '../api/auth';
import { Button, Field, inputClass } from '../components/ui';
import { useMe } from '../hooks/useMe';
import { parseApiError } from '../lib/errors';

export default function Profile() {
    const { me } = useMe();
    const qc = useQueryClient();
    const [profile, setProfile] = useState({ name: '', email: '' });
    const [pwd, setPwd] = useState({ current_password: '', password: '', password_confirmation: '' });
    const [pErr, setPErr] = useState({ fields: {} });
    const [wErr, setWErr] = useState({ fields: {} });
    const [notice, setNotice] = useState({});

    useEffect(() => { if (me) setProfile({ name: me.name, email: me.email }); }, [me]);

    const saveProfile = async (e) => {
        e.preventDefault();
        try {
            qc.setQueryData(['me'], await updateProfile(profile));
            setPErr({ fields: {} });
            setNotice((n) => ({ ...n, profile: 'Profile saved.' }));
        } catch (err) { setPErr(parseApiError(err)); }
    };

    const savePassword = async (e) => {
        e.preventDefault();
        try {
            await changePassword(pwd);
            setPwd({ current_password: '', password: '', password_confirmation: '' });
            setWErr({ fields: {} });
            setNotice((n) => ({ ...n, password: 'Password updated.' }));
        } catch (err) { setWErr(parseApiError(err)); }
    };

    return (
        <div className="max-w-lg space-y-8">
            <form onSubmit={saveProfile} className="space-y-4">
                <h1 className="text-xl font-semibold">My profile</h1>
                {notice.profile && <p className="text-sm text-green-700">{notice.profile}</p>}
                <Field label="Name" error={pErr.fields.name}><input className={inputClass} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
                <Field label="Email" error={pErr.fields.email}><input className={inputClass} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
                {me && profile.email !== me.email && <p className="text-xs text-gray-500">Changing your email requires verifying the new address.</p>}
                <Button>Save profile</Button>
            </form>

            <form onSubmit={savePassword} className="space-y-4">
                <h2 className="text-lg font-semibold">Change password</h2>
                {notice.password && <p className="text-sm text-green-700">{notice.password}</p>}
                <Field label="Current password" error={wErr.fields.current_password}><input className={inputClass} type="password" autoComplete="current-password" value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} /></Field>
                <Field label="New password" error={wErr.fields.password}><input className={inputClass} type="password" autoComplete="new-password" value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} /></Field>
                <Field label="Confirm new password"><input className={inputClass} type="password" autoComplete="new-password" value={pwd.password_confirmation} onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })} /></Field>
                <Button>Change password</Button>
            </form>
        </div>
    );
}
