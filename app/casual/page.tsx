'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Play, ExternalLink, ChevronLeft, Zap, Users, Settings2, RotateCcw } from 'lucide-react';

export default function CasualMatchPage() {
  const router = useRouter();

  // Input Tim & Pemain (Default Kosong)
  const [team1Name, setTeam1Name] = useState('');
  const [team1P1, setTeam1P1] = useState('');
  const [team1P2, setTeam1P2] = useState('');

  const [team2Name, setTeam2Name] = useState('');
  const [team2P1, setTeam2P1] = useState('');
  const [team2P2, setTeam2P2] = useState('');

  // Konfigurasi Mode Permainan
  const [scoringMode, setScoringMode] = useState<'traditional' | 'americano16' | 'americano21'>('traditional');
  const [deuceRule, setDeuceRule] = useState<'golden' | 'star' | 'advantage'>('golden');
  const [gamesPerSet, setGamesPerSet] = useState<number>(5); // Default Fixed 5 Games
  const [totalSets, setTotalSets] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [createdMatchId, setCreatedMatchId] = useState<string | null>(null);

  const handleCreateCasualMatch = async () => {
    if (!team1P1.trim() || !team1P2.trim() || !team2P1.trim() || !team2P2.trim()) {
      return alert('Harap isi nama seluruh pemain terlebih dahulu!');
    }

    setLoading(true);

    // 1. Buat Data Pertandingan
    const { data: newMatch, error: mErr } = await supabase
      .from('matches')
      .insert({
        team1_name: team1Name.trim() || 'Tim 1',
        team1_p1_name: team1P1.trim(),
        team1_p2_name: team1P2.trim(),
        team2_name: team2Name.trim() || 'Tim 2',
        team2_p1_name: team2P1.trim(),
        team2_p2_name: team2P2.trim(),
        match_type: 'casual',
        scoring_mode: scoringMode,
        deuce_rule: deuceRule,
        games_per_set: gamesPerSet,
        total_sets: totalSets,
        status: 'live',
      })
      .select()
      .single();

    if (mErr || !newMatch) {
      setLoading(false);
      return alert(`Gagal membuat pertandingan: ${mErr?.message}`);
    }

    // 2. Inisialisasi State Skor
    const { error: sErr } = await supabase.from('match_states').insert({
      match_id: newMatch.id,
      team1_points: '0',
      team2_points: '0',
      team1_games: [0, 0, 0, 0, 0],
      team2_games: [0, 0, 0, 0, 0],
      current_set: 0,
      current_server: 1,
    });

    setLoading(false);

    if (sErr) {
      return alert(`Gagal menginisialisasi skor: ${sErr.message}`);
    }

    setCreatedMatchId(newMatch.id);
  };

  const handleResetForm = () => {
    setCreatedMatchId(null);
    setTeam1Name('');
    setTeam1P1('');
    setTeam1P2('');
    setTeam2Name('');
    setTeam2P1('');
    setTeam2P2('');
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto space-y-6 select-none text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-bold">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="text-right">
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider block">QUICK PLAY / CASUAL</span>
          <h1 className="text-xl font-extrabold">Buat Main Santai</h1>
        </div>
      </div>

      {!createdMatchId ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kolom Kiri: Form Tim 1 & Tim 2 */}
          <div className="md:col-span-2 space-y-6">
            {/* TIM 1 */}
            <div className="glass-panel p-5 rounded-3xl space-y-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Users className="w-4 h-4" /> Tim 1 (Sisi Kiri / Hijau)
              </div>
              <input
                type="text"
                placeholder="Nama Tim (Contoh: Eagle Padel)"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Pemain 1 (Contoh: Sanyo)"
                  value={team1P1}
                  onChange={(e) => setTeam1P1(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Pemain 2 (Contoh: Tapia)"
                  value={team1P2}
                  onChange={(e) => setTeam1P2(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* TIM 2 */}
            <div className="glass-panel p-5 rounded-3xl space-y-4 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Users className="w-4 h-4" /> Tim 2 (Sisi Kanan / Cyan)
              </div>
              <input
                type="text"
                placeholder="Nama Tim (Contoh: Smash Bros)"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Pemain 1 (Contoh: Galan)"
                  value={team2P1}
                  onChange={(e) => setTeam2P1(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Pemain 2 (Contoh: Lebron)"
                  value={team2P2}
                  onChange={(e) => setTeam2P2(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Aturan & Format Permainan */}
          <div className="glass-panel p-5 rounded-3xl space-y-4 border border-amber-500/30 h-fit">
            <h2 className="text-sm font-bold flex items-center gap-2 text-amber-400">
              <Settings2 className="w-4 h-4" /> Format Permainan
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Format Skoring</label>
                <select
                  value={scoringMode}
                  onChange={(e: any) => setScoringMode(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                >
                  <option value="traditional">Traditional Padel (15, 30, 40)</option>
                  <option value="americano16">Americano 16 Poin</option>
                  <option value="americano21">Americano 21 Poin</option>
                </select>
              </div>

              {scoringMode === 'traditional' && (
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Aturan Deuce</label>
                  <select
                    value={deuceRule}
                    onChange={(e: any) => setDeuceRule(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                  >
                    <option value="golden">Golden Point (Poin Penentu)</option>
                    <option value="star">2x AD ➔ Star Point (Poin Penentu)</option>
                    <option value="advantage">Advantage (Bebas Deuce)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Games per Set</label>
                <select
                  value={gamesPerSet}
                  onChange={(e) => setGamesPerSet(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                >
                  <option value={5}>Fixed 5 Games (5-0 / 4-1 / 3-2)</option>
                  <option value={6}>6 Games (Standard Tie-Break)</option>
                  <option value={4}>4 Games (Fast4)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Total Set</label>
                <select
                  value={totalSets}
                  onChange={(e) => setTotalSets(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                >
                  <option value={1}>1 Set Saja (Pro Set)</option>
                  <option value={3}>Best of 3 Sets</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateCasualMatch}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl text-xs transition-all shadow-xl flex items-center justify-center gap-2 mt-4"
            >
              <Play className="w-4 h-4 fill-black" />
              {loading ? 'Membuat Match...' : 'Mulai Pertandingan'}
            </button>
          </div>
        </div>
      ) : (
        /* Tampilan Setelah Match Berhasil Dibuat */
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 max-w-md mx-auto border border-emerald-500/40">
          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <Zap className="w-6 h-6 fill-emerald-400" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Pertandingan Berhasil Dibuat!</h2>
            <p className="text-xs text-slate-400 mt-1">Pilih panel yang ingin kamu buka di bawah ini:</p>
          </div>

          <div className="space-y-3">
            <a
              href={`/referee/${createdMatchId}`}
              target="_blank"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Play className="w-4 h-4 fill-black" /> Buka Panel Wasit (HP)
            </a>

            <a
              href={`/overlay/${createdMatchId}`}
              target="_blank"
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold py-3.5 rounded-xl text-xs border border-cyan-500/40 flex items-center justify-center gap-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Buka OBS Broadcast Overlay
            </a>
          </div>

          <button
            onClick={handleResetForm}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto pt-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Buat Pertandingan Casual Lain
          </button>
        </div>
      )}
    </main>
  );
}
