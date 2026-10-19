'use client';

import { useState } from 'react';
import { Trophy, Users, Plus, Award } from 'lucide-react';

interface StandingItem {
  id: string;
  name: string;
  played: number;
  pointsWon: number;
  pointsLost: number;
  diff: number;
}

export default function TournamentPage() {
  const [format, setFormat] = useState<'americano_16' | 'americano_21'>('americano_21');
  const [players, setPlayers] = useState<string[]>(['Pemain 1', 'Pemain 2', 'Pemain 3', 'Pemain 4']);
  const [newPlayer, setNewPlayer] = useState('');

  // Sample Klasemen State
  const [standings, setStandings] = useState<StandingItem[]>([
    { id: '1', name: 'Pemain 1', played: 3, pointsWon: 45, pointsLost: 38, diff: 7 },
    { id: '2', name: 'Pemain 2', played: 3, pointsWon: 42, pointsLost: 41, diff: 1 },
    { id: '3', name: 'Pemain 3', played: 3, pointsWon: 39, pointsLost: 44, diff: -5 },
    { id: '4', name: 'Pemain 4', played: 3, pointsWon: 38, pointsLost: 41, diff: -3 },
  ]);

  const addPlayer = () => {
    if (!newPlayer.trim()) return;
    setPlayers([...players, newPlayer.trim()]);
    setStandings([
      ...standings,
      { id: String(Date.now()), name: newPlayer.trim(), played: 0, pointsWon: 0, pointsLost: 0, diff: 0 }
    ]);
    setNewPlayer('');
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header Turnamen */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">Tournament Engine</span>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 mt-1">
            <Trophy className="w-8 h-8 text-amber-400" />
            Americano Leaderboard
          </h1>
        </div>

        {/* Pemilih Format */}
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setFormat('americano_16')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              format === 'americano_16' ? 'bg-cyan-500 text-black' : 'text-slate-400'
            }`}
          >
            Americano 16
          </button>
          <button
            onClick={() => setFormat('americano_21')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              format === 'americano_21' ? 'bg-cyan-500 text-black' : 'text-slate-400'
            }`}
          >
            Americano 21
          </button>
        </div>
      </div>

      {/* Grid: Tambah Pemain & Tabel Klasemen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kolom 1: Daftar Pemain */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 h-fit">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
            <Users className="w-5 h-5 text-emerald-400" />
            Peserta ({players.length})
          </h2>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nama pemain/pasangan..."
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={addPlayer}
              className="bg-cyan-500 hover:bg-cyan-400 text-black p-2 rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {players.map((p, idx) => (
              <li key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-sm flex justify-between items-center">
                <span className="font-medium text-slate-300">{p}</span>
                <span className="text-xs text-slate-500">#{idx + 1}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Kolom 2: Tabel Klasemen Realtime */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
            <Award className="w-5 h-5 text-amber-400" />
            Klasemen Sementara ({format === 'americano_16' ? 'Max 16 Poin' : 'Max 21 Poin'})
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-xs uppercase">
                  <th className="pb-3 pl-2">Pos</th>
                  <th className="pb-3">Pemain</th>
                  <th className="pb-3 text-center">Main</th>
                  <th className="pb-3 text-center">Poin +</th>
                  <th className="pb-3 text-center">Poin -</th>
                  <th className="pb-3 text-right pr-2">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {standings
                  .sort((a, b) => b.pointsWon - a.pointsWon || b.diff - a.diff)
                  .map((item, index) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 pl-2 font-bold text-slate-400">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      <td className="py-3 font-semibold text-slate-100">{item.name}</td>
                      <td className="py-3 text-center text-slate-400">{item.played}</td>
                      <td className="py-3 text-center font-bold text-emerald-400">{item.pointsWon}</td>
                      <td className="py-3 text-center text-slate-400">{item.pointsLost}</td>
                      <td className={`py-3 text-right pr-2 font-bold ${item.diff >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        {item.diff > 0 ? `+${item.diff}` : item.diff}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
