'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { calculatePadelScore, ScoreState, DeuceRule } from '@/lib/padelEngine';
import { RotateCcw, Volume2, ShieldAlert } from 'lucide-react';

export default function RefereeControl({ params }: { params: { matchId: string } }) {
  const [matchState, setMatchState] = useState<ScoreState>({
    team1Points: '0',
    team2Points: '0',
    team1Games: [0, 0, 0],
    team2Games: [0, 0, 0],
    currentSet: 0,
    currentServer: 1,
    deuceCount: 0,
    isBreakPoint: false,
    isSetPoint: false,
    isMatchPoint: false,
    isStarPoint: false,
  });

  const [deuceRule, setDeuceRule] = useState<DeuceRule>('golden');

  // Sync data ke Supabase saat ada perubahan skor
  const updateScore = async (scoringTeam: 1 | 2) => {
    const updated = calculatePadelScore(matchState, scoringTeam, 'traditional', deuceRule);
    setMatchState(updated);

    await supabase
      .from('match_states')
      .update({
        team1_points: updated.team1Points,
        team2_points: updated.team2Points,
        team1_games: updated.team1Games,
        team2_games: updated.team2Games,
        current_server: updated.currentServer,
        is_break_point: updated.isBreakPoint,
        is_star_point: updated.isStarPoint,
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', params.matchId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-between select-none">
      {/* Header Status */}
      <div className="flex justify-between items-center bg-slate-900 p-3 rounded-xl border border-white/10">
        <span className="text-xs text-slate-400 font-semibold">REFEREE DASHBOARD</span>
        <div className="flex gap-2">
          {matchState.isBreakPoint && (
            <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/30">
              BREAK POINT
            </span>
          )}
          {matchState.isStarPoint && (
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
              STAR POINT
            </span>
          )}
        </div>
      </div>

      {/* Pemilih Aturan Deuce */}
      <div className="my-4 bg-slate-900/50 p-2 rounded-xl border border-white/5 flex gap-2 text-xs">
        <button
          onClick={() => setDeuceRule('golden')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            deuceRule === 'golden' ? 'bg-emerald-500 text-black' : 'text-slate-400 bg-white/5'
          }`}
        >
          Golden Point
        </button>
        <button
          onClick={() => setDeuceRule('starpoint_after_ad')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            deuceRule === 'starpoint_after_ad' ? 'bg-amber-500 text-black' : 'text-slate-400 bg-white/5'
          }`}
        >
          Star Point (SP)
        </button>
      </div>

      {/* Area Tombol Poin Tim A & B */}
      <div className="grid grid-cols-2 gap-4 my-auto">
        {/* Tim 1 */}
        <button
          onClick={() => updateScore(1)}
          className="h-64 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500/30 active:border-emerald-500 flex flex-col justify-between p-6 active:scale-95 transition-all shadow-xl"
        >
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-slate-300 text-sm">TIM A</span>
            {matchState.currentServer === 1 && <span className="text-xl">🎾</span>}
          </div>
          <span className="text-6xl font-black text-emerald-400">{matchState.team1Points}</span>
          <span className="text-xs text-slate-500 font-medium">+1 Point</span>
        </button>

        {/* Tim 2 */}
        <button
          onClick={() => updateScore(2)}
          className="h-64 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-cyan-500/30 active:border-cyan-500 flex flex-col justify-between p-6 active:scale-95 transition-all shadow-xl"
        >
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-slate-300 text-sm">TIM B</span>
            {matchState.currentServer === 2 && <span className="text-xl">🎾</span>}
          </div>
          <span className="text-6xl font-black text-cyan-400">{matchState.team2Points}</span>
          <span className="text-xs text-slate-500 font-medium">+1 Point</span>
        </button>
      </div>

      {/* Informasi Game Set Saat Ini */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 flex justify-around text-center my-4">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Games Tim A</p>
          <p className="text-xl font-bold text-slate-200">{matchState.team1Games[matchState.currentSet]}</p>
        </div>
        <div className="border-r border-white/10" />
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold">Games Tim B</p>
          <p className="text-xl font-bold text-slate-200">{matchState.team2Games[matchState.currentSet]}</p>
        </div>
      </div>
    </div>
  );
}
