'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Play, Copy, ExternalLink } from 'lucide-react';

export default function CasualMatchSetup() {
  const [team1Name, setTeam1Name] = useState('Tim A');
  const [team2Name, setTeam2Name] = useState('Tim B');
  const [loading, setLoading] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);

  const createMatch = async () => {
    setLoading(true);

    // 1. Insert Match Baru
    const { data: match, error: matchErr } = await supabase
      .from('matches')
      .insert({
        team1_custom_name: team1Name,
        team2_custom_name: team2Name,
        match_type: 'casual',
        scoring_mode: 'traditional_golden',
        status: 'live',
      })
      .select()
      .single();

    if (matchErr || !match) {
      alert('Gagal membuat pertandingan');
      setLoading(false);
      return;
    }

    // 2. Init Match State untuk Skor & Realtime
    const { error: stateErr } = await supabase
      .from('match_states')
      .insert({
        match_id: match.id,
        team1_points: '0',
        team2_points: '0',
        team1_games: [0, 0, 0],
        team2_games: [0, 0, 0],
        current_server: 1,
      });

    if (stateErr) {
      alert('Gagal inisialisasi state skor');
    } else {
      setCreatedMatchId(match.id);
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-6 max-w-lg mx-auto flex flex-col justify-center">
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <h1 className="text-2xl font-bold text-center text-emerald-400">Buat Match Casual Baru</h1>

        {!createdMatchId ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Nama Tim / Pasangan 1</label>
              <input
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Nama Tim / Pasangan 2</label>
              <input
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={createMatch}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-5 h-5 fill-black" />
              {loading ? 'Membuka Court...' : 'Mulai Pertandingan'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center">
              <p className="text-xs text-emerald-400 font-bold uppercase">Match Berhasil Dibuat!</p>
              <p className="text-xs text-slate-400 mt-1">ID: {createdMatchId}</p>
            </div>

            <a
              href={`/referee/${createdMatchId}`}
              target="_blank"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold p-3.5 rounded-xl flex items-center justify-between border border-white/10"
            >
              <span>Buka Control Panel Wasit (HP)</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={`/overlay/${createdMatchId}`}
              target="_blank"
              className="w-full bg-cyan-500/20 text-cyan-300 font-bold p-3.5 rounded-xl flex items-center justify-between border border-cyan-500/30"
            >
              <span>Link OBS Stream Overlay</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
