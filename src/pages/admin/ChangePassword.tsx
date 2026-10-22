import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { KeyRound, Lock } from 'lucide-react';

export default function ChangePassword() {
  const { user, signOut } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);

    if (next.length < 8) {
      setMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      setBusy(false);
      return;
    }
    if (next !== confirm) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      setBusy(false);
      return;
    }

    // Reauthenticate with current password
    if (!user?.email) {
      setMsg({ type: 'error', text: 'No user session found.' });
      setBusy(false);
      return;
    }
    const { error: reErr } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (reErr) {
      setMsg({ type: 'error', text: 'Current password is incorrect.' });
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Password changed successfully. Please sign in again.' });
      setCurrent(''); setNext(''); setConfirm('');
      setTimeout(async () => { await signOut(); window.location.hash = '/admin/login'; }, 2000);
    }
    setBusy(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Change Password</h1>
      <p className="mt-1 text-sm text-stone-500">Update your admin account password securely.</p>

      <form onSubmit={submit} className="mt-6 max-w-md rounded-2xl bg-white p-6 ring-1 ring-stone-200">
        {msg && <div className={`mb-4 rounded-xl p-3 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.text}</div>}
        <div className="space-y-4">
          <div>
            <label className="label">Current Password *</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="input pl-10" />
            </div>
          </div>
          <div>
            <label className="label">New Password * (min 8 characters)</label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input type="password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} className="input pl-10" />
            </div>
          </div>
          <div>
            <label className="label">Confirm New Password *</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'Updating...' : 'Change Password'}</button>
        </div>
      </form>
    </div>
  );
}
