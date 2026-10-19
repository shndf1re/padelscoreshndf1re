'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Key, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Registrasi berhasil! Silakan login.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/tournament');
      }
    } catch (err: any) {
      alert(`Gagal: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto flex flex-col justify-center">
      <div className="glass-panel p-8 rounded-3xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isSignUp ? 'Buat Akun Penyelenggara' : 'Login Penyelenggara Turnamen'}
          </h1>
          <p className="text-xs text-slate-400">
            Kelola turnamen, atur sistem poin, undang admin/moderator, dan acak bracket.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                placeholder="penyelenggara@padel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-3.5 rounded-xl transition-all shadow-lg text-sm mt-2"
          >
            {loading ? 'Memproses...' : isSignUp ? 'Daftar Akun Baru' : 'Masuk Dashboard'}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-white/5">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-cyan-400 hover:underline font-semibold"
          >
            {isSignUp ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar gratis'}
          </button>
        </div>
      </div>
    </main>
  );
}
