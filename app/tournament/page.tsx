'use client';

import { useState } from 'react';
import { Trophy, Award, GitMerge, Users, Plus } from 'lucide-react';

export default function TournamentDashboard() {
  const [activeTab, setActiveTab] = useState<'standings' | 'bracket'>('standings');

  const [bracket] = useState([
    {
      round: 'SEMIFINAL',
      matches: [
        { team1: 'Sanyo / Tapia', team2: 'Galan / Lebron', score: '6-4, 6-3', winner: 'Sanyo / Tapia' },
        { team1: 'Chingotto / Paquito', team2: 'Coello / Tapia', score: '3-6, 4-6', winner: 'Coello / Tapia' },
      ],
    },
    {
      round: 'FINAL',
      matches: [
        { team1: 'Sanyo / Tapia', team2: 'Coello / Tapia', score: 'Live Match', winner: 'Pending' },
      ],
    },
  ]);

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">PADEL TOURNAMENT CENTER</span>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 mt-1">
            <Trophy className="w-8 h-8 text-amber-400" />
            Tournament & Leaderboard
          </h1>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'standings' ? 'bg-emerald-500 text-black' : 'text-slate-400'
            }`}
          >
            <Award className="w-4 h-4" /> Klasemen Americano
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'bracket' ? 'bg-cyan-500 text-black' : 'text-slate-400'
            }`}
          >
            <GitMerge className="w-4 h-4" /> Bagan Bracket Knockout
          </button>
        </div>
      </div>

      {activeTab === 'bracket' ? (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <GitMerge className="w-6 h-6" /> Bagan Eliminasi Gugur (Knockout)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {bracket.map((stage, idx) => (
              <div key={idx} className="space-y-4">
                <span className="text-xs font-bold bg-white/10 text-slate-300 px-3 py-1 rounded-full uppercase">
                  {stage.round}
                </span>

                {stage.matches.map((m, mIdx) => (
                  <div key={mIdx} className="bg-slate-900/80 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className={m.winner === m.team1 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                        {m.team1}
                      </span>
                      <span className="text-xs text-slate-500">{m.score}</span>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex justify-between items-center text-sm font-semibold">
                      <span className={m.winner === m.team2 ? 'text-emerald-400 font-bold' : 'text-slate-200'}>
                        {m.team2}
                      </span>
                      {m.winner !== 'Pending' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">WINNER</span>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <h2 className="text-xl font-bold text-emerald-400">Klasemen Poin Americano / League</h2>
          <p className="text-slate-400 text-sm">Hitung otomatis poin akumulasi 16 / 21 setiap round pertandingan.</p>
        </div>
      )}
    </main>
  );
}
