import { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

interface Props {
  navigate: (to: string) => void;
}

const ADMIN_EMAIL = 'admin@agrirent.local';

export default function AdminLoginPage({ navigate }: Props) {
  const { signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(ADMIN_EMAIL, password);
    setLoading(false);
    if (error) {
      setError(error);
      return;
    }
    navigate('/admin');
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-bold text-stone-900">Setup Required</h1>
          <p className="mt-3 text-sm text-stone-600">Supabase environment variables are not configured. Please connect your Supabase project before using the admin dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-800 via-green-700 to-green-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <ShieldCheck size={28} />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Admin Access</h1>
          <p className="mt-1 text-sm text-green-100">AgriRent Administration Dashboard</p>
        </div>

        <div className="rounded-3xl bg-white p-7 shadow-2xl">
          <form onSubmit={doLogin} className="space-y-4">
            <div>
              <label className="label">Admin Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your admin password"
                />
              </div>
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <button onClick={() => navigate('/')} className="mt-5 block w-full text-center text-sm text-green-100 hover:text-white">
          ← Back to website
        </button>
      </div>
    </div>
  );
}
