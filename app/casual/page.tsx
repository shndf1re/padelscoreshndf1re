'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Play, ExternalLink, Settings2, Users } from 'lucide-react';

export default function CasualMatchSetup() {
  // Tim A
  const [team1Name, setTeam1Name] = useState('');
  const [team1P1, setTeam1P1] = useState('Rahmat');
  const [team1P2, setTeam1P2] = useState('Paul');

  // Tim B
  const [team2Name, setTeam2Name] = useState('');
  const [team2P1, setTeam2P1] = useState('Andre');
  const [team2P2, setTeam2P2] = useState('Ateng');

  // Konfigurasi Sistem Poin (Bisa Dipilih Tanpa Login)
  const [scoringMode, setScoringMode] = useState<'traditional' | 'americano_16' | 'americano_21'>('traditional');
  const [deuceRule, setDeuceRule] = useState<'golden' | 'advantage' | 'starpoint_after_ad'>('golden');
  const [totalSets, setTotalSets] = useState<number>(3);

  const [loading, setLoading] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);

  const createMatch = async () => {
    if (!team1P1 || !team1P2 || !team2P1 || !team2P2) {
      alert('Mohon isi nama 2 pemain untuk masing-masing tim!');
      return;
    }

    setLoading(true);

    try {
      const { data: match, error: matchErr } = await supabase
        .from('matches')
        .insert({
          team1_name: team1Name.trim() || null,
          team1_p1_name: team1P1.trim(),
          team1_p2_name: team1P2.trim(),
          team2_name: team2Name.trim() || null,
          team2_p1_name: team2P1.trim(),
          team2_p2_name: team2P2.trim(),
          match_type: 'casual',
          scoring_mode: scoringMode,
          deuce_rule: deuceRule,
          total_sets: totalSets,
          status: 'live',
        })
        .select()
        .single();

      if (matchErr) throw matchErr;

      const { error: stateErr } = await supabase
        .from('match_states')
        .insert({
          match_id: match.id,
          team1_points: '0',
          team2_points: '0',
          team1_games: [0, 0, 0],
          team2_games: [0, 0, 0],
          current_set: 0,
          current_server: 1,
          overlay_font: 'Teko',
        });

      if (stateErr) throw stateErr;

      setCreatedMatchId(match.id);
    } catch (err: any) {
      alert(`Gagal membuat match: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 max-w-xl mx-auto flex flex-col justify-center">
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-emerald-400">Buat Match Casual Baru</h1>
          <p className="text-xs text-slate-400">Tanpa Login &bull; Bebas Atur Aturan & Pemain</p>
        </div>

        {!createdMatchId ? (
          <div className="space-y-6">
            {/* Input Tim A */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-4 h-4" /> Tim A
                </span>
                <span className="text-[10px] text-slate-500">2 Pemain Wajib</span>
              </div>
              <input
                type="text"
                placeholder="Nama Tim A (Opsional, contoh: Eagle Padel)"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Pemain 1 (Atas)"
                  value={team1P1}
                  onChange={(e) => setTeam1P1(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Pemain 2 (Bawah)"
                  value={team1P2}
                  onChange={(e) => setTeam1P2(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Input Tim B */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-4 h-4" /> Tim B
                </span>
                <span className="text-[10px] text-slate-500">2 Pemain Wajib</span>
              </div>
              <input
                type="text"
                placeholder="Nama Tim B (Opsional, contoh: Smash Bros)"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Pemain 1 (Atas)"
                  value={team2P1}
                  onChange={(e) => setTeam2P1(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Pemain 2 (Bawah)"
                  value={team2P2}
                  onChange={(e) => setTeam2P2(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Pengaturan Sistem Poin */}
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-amber-400" /> Mode & Aturan Scoring
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setScoringMode('traditional')}
                  className={`p-2 rounded-xl font-bold border transition-all ${scoringMode === 'traditional' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-slate-950 text-slate-400 border-white/10'}`}
                >
                  Tennis / Padel
                </button>
                <button
                  type="button"
                  onClick={() => setScoringMode('americano_16')}
                  className={`p-2 rounded-xl font-bold border transition-all ${scoringMode === 'americano_16' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-slate-950 text-slate-400 border-white/10'}`}
                >
                  Americano 16
                </button>
                <button
                  type="button"
                  onClick={() => setScoringMode('americano_21')}
                  className={`p-2 rounded-xl font-bold border transition-all ${scoringMode === 'americano_21' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-slate-950 text-slate-400 border-white/10'}`}
                >
                  Americano 21
                </button>
              </div>

              {scoringMode === 'traditional' && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Aturan Deuce (40-40)</label>
                    <select
                      value={deuceRule}
                      onChange={(e: any) => setDeuceRule(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl p-2 focus:outline-none"
                    >
                      <option value="golden">Golden Point (Sudden Death)</option>
                      <option value="advantage">Standard Advantage (AD)</option>
                      <option value="starpoint_after_ad">Star Point (SP setelah 1x AD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Jumlah Set</label>
                    <select
                      value={totalSets}
                      onChange={(e) => setTotalSets(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-white/10 text-white rounded-xl p-2 focus:outline-none"
                    >
                      <option value={1}>1 Set Match</option>
                      <option value={3}>Best of 3 Sets</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={createMatch}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl"
            >
              <Play className="w-5 h-5 fill-black" />
              {loading ? 'Membuka Court...' : 'Mulai Pertandingan'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl text-center">
              <p className="text-xs text-emerald-400 font-bold uppercase">Match Berhasil Dibuat!</p>
              <p className="text-xs text-slate-400 mt-1">Match ID: {createdMatchId}</p>
            </div>

            <a
              href={`/referee/${createdMatchId}`}
              target="_blank"
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold p-3.5 rounded-xl flex items-center justify-between border border-white/10 text-sm"
            >
              <span>Buka Control Panel Wasit (HP)</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={`/overlay/${createdMatchId}`}
              target="_blank"
              className="w-full bg-cyan-500/20 text-cyan-300 font-bold p-3.5 rounded-xl flex items-center justify-between border border-cyan-500/30 text-sm"
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
