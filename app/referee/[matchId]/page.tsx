'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { calculatePadelScore, ScoreState, DeuceRule } from '@/lib/padelEngine';
import { RotateCcw, Type, RefreshCw } from 'lucide-react';

export default function RefereeControl() {
  const params = useParams();
  const matchId = params.matchId as string;

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

  const [historyStack, setHistoryStack] = useState<ScoreState[]>([]);
  const [deuceRule, setDeuceRule] = useState<DeuceRule>('golden');
  const [selectedFont, setSelectedFont] = useState('Teko');

  useEffect(() => {
    if (!matchId) return;
    const fetchState = async () => {
      const { data } = await supabase
        .from('match_states')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (data) {
        setMatchState({
          team1Points: data.team1_points || '0',
          team2Points: data.team2_points || '0',
          team1Games: data.team1_games || [0, 0, 0],
          team2Games: data.team2_games || [0, 0, 0],
          currentSet: data.current_set || 0,
          currentServer: data.current_server || 1,
          deuceCount: 0,
          isBreakPoint: data.is_break_point || false,
          isSetPoint: data.is_set_point || false,
          isMatchPoint: data.is_match_point || false,
          isStarPoint: data.is_star_point || false,
        });
        if (data.overlay_font) setSelectedFont(data.overlay_font);
      }
    };
    fetchState();
  }, [matchId]);

  const pushToSupabase = async (updated: ScoreState, fontName = selectedFont) => {
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
        overlay_font: fontName,
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId);
  };

  const updateScore = async (scoringTeam: 1 | 2) => {
    setHistoryStack((prev) => [...prev, JSON.parse(JSON.stringify(matchState))]);
    const updated = calculatePadelScore(matchState, scoringTeam, 'traditional', deuceRule);
    setMatchState(updated);
    await pushToSupabase(updated);
  };

  const handleUndo = async () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setMatchState(previousState);
    await pushToSupabase(previousState);
  };

  const changeFont = async (font: string) => {
    setSelectedFont(font);
    await pushToSupabase(matchState, font);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-between select-none">
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-white/10">
          <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">WASIT DASHBOARD</span>
          <button
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-xl text-xs font-bold disabled:opacity-30"
          >
            <RotateCcw className="w-3.5 h-3.5" /> UNDO
          </button>
        </div>

        <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Type className="w-4 h-4 text-cyan-400" /> OBS Font:
          </span>
          <select
            value={selectedFont}
            onChange={(e) => changeFont(e.target.value)}
            className="bg-slate-950 border border-white/10 text-white rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="Teko">Teko (TV Broadcast)</option>
            <option value="Bebas Neue">Bebas Neue (Bold)</option>
            <option value="Montserrat">Montserrat (Modern)</option>
            <option value="Outfit">Outfit (Clean)</option>
          </select>
        </div>

        <div className="bg-slate-900/50 p-1.5 rounded-xl border border-white/5 flex gap-2 text-xs">
          <button
            onClick={() => setDeuceRule('golden')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              deuceRule === 'golden' ? 'bg-emerald-500 text-black' : 'text-slate-400'
            }`}
          >
            Golden Point
          </button>
          <button
            onClick={() => setDeuceRule('starpoint_after_ad')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              deuceRule === 'starpoint_after_ad' ? 'bg-amber-500 text-black' : 'text-slate-400'
            }`}
          >
            Star Point (SP)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 my-6">
        <button
          onClick={() => updateScore(1)}
          className="h-64 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 active:border-emerald-500 flex flex-col justify-between p-6 active:scale-95 transition-all shadow-2xl"
        >
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-slate-300 text-sm">TIM A</span>
            {matchState.currentServer === 1 && <span className="text-xl">🎾</span>}
          </div>
          <span className="text-6xl font-black text-emerald-400">{matchState.team1Points}</span>
          <span className="text-xs text-slate-500 font-medium">+1 Point</span>
        </button>

        <button
          onClick={() => updateScore(2)}
          className="h-64 rounded-3xl bg-slate-900 border-2 border-cyan-500/40 active:border-cyan-500 flex flex-col justify-between p-6 active:scale-95 transition-all shadow-2xl"
        >
          <div className="flex justify-between items-center w-full">
            <span className="font-bold text-slate-300 text-sm">TIM B</span>
            {matchState.currentServer === 2 && <span className="text-xl">🎾</span>}
          </div>
          <span className="text-6xl font-black text-cyan-400">{matchState.team2Points}</span>
          <span className="text-xs text-slate-500 font-medium">+1 Point</span>
        </button>
      </div>

      <div className="bg-slate-900 p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 font-semibold">Giliran Servis:</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const updated = { ...matchState, currentServer: 1 as const };
                setMatchState(updated);
                pushToSupabase(updated);
              }}
              className={`px-3 py-1 rounded-lg font-bold ${matchState.currentServer === 1 ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400'}`}
            >
              Tim A 🎾
            </button>
            <button
              onClick={() => {
                const updated = { ...matchState, currentServer: 2 as const };
                setMatchState(updated);
                pushToSupabase(updated);
              }}
              className={`px-3 py-1 rounded-lg font-bold ${matchState.currentServer === 2 ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}
            >
              Tim B 🎾
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
