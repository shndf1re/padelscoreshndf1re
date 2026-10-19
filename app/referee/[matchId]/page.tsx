'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { calculatePadelScore, ScoreState, DeuceRule } from '@/lib/padelEngine';
import { RotateCcw, Type } from 'lucide-react';

export default function RefereeControl() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [matchInfo, setMatchInfo] = useState<any>(null);
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
  const [selectedFont, setSelectedFont] = useState('Teko');

  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      const { data: mData } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (mData) setMatchInfo(mData);

      const { data: sData } = await supabase.from('match_states').select('*').eq('match_id', matchId).single();
      if (sData) {
        setMatchState({
          team1Points: sData.team1_points || '0',
          team2Points: sData.team2_points || '0',
          team1Games: sData.team1_games || [0, 0, 0],
          team2Games: sData.team2_games || [0, 0, 0],
          currentSet: sData.current_set || 0,
          currentServer: sData.current_server || 1,
          deuceCount: 0,
          isBreakPoint: sData.is_break_point || false,
          isSetPoint: sData.is_set_point || false,
          isMatchPoint: sData.is_match_point || false,
          isStarPoint: sData.is_star_point || false,
        });
        if (sData.overlay_font) setSelectedFont(sData.overlay_font);
      }
    };

    fetchMatch();
  }, [matchId]);

  const syncToSupabase = async (updated: ScoreState, fontName = selectedFont) => {
    await supabase
      .from('match_states')
      .update({
        team1_points: updated.team1Points,
        team2_points: updated.team2Points,
        team1_games: updated.team1Games,
        team2_games: updated.team2Games,
        current_set: updated.currentSet,
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
    const mode = matchInfo?.scoring_mode || 'traditional';
    const deuceRule = matchInfo?.deuce_rule || 'golden';

    const updated = calculatePadelScore(matchState, scoringTeam, mode, deuceRule as DeuceRule);
    setMatchState(updated);
    await syncToSupabase(updated);
  };

  const handleUndo = async () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setMatchState(previousState);
    await syncToSupabase(previousState);
  };

  const changeFont = async (font: string) => {
    setSelectedFont(font);
    await syncToSupabase(matchState, font);
  };

  if (!matchInfo) return <div className="p-6 text-center text-white">Loading Control Panel...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-between select-none">
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-white/10">
          <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">WASIT DASHBOARD</span>
          <button
            onClick={handleUndo}
            disabled={historyStack.length === 0}
            className="flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-xl text-xs font-bold disabled:opacity-30 active:scale-95 transition-all"
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
            <option value="Montserrat">Montserrat (Clean)</option>
            <option value="Outfit">Outfit (SaaS Modern)</option>
          </select>
        </div>
      </div>

      {/* Tombol Tambah Poin Tim A & B */}
      <div className="grid grid-cols-2 gap-4 my-4">
        {/* Tim 1 */}
        <button
          onClick={() => updateScore(1)}
          className="h-72 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 active:border-emerald-500 flex flex-col justify-between p-5 active:scale-95 transition-all shadow-2xl text-left"
        >
          <div>
            {matchInfo.team1_name && <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">{matchInfo.team1_name}</span>}
            <p className="text-sm font-semibold text-slate-200">{matchInfo.team1_p1_name}</p>
            <p className="text-sm font-semibold text-slate-200">{matchInfo.team1_p2_name}</p>
          </div>
          <div className="text-center">
            <span className="text-6xl font-black text-emerald-400 block">{matchState.team1Points}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">+1 Point</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Games: {matchState.team1Games[matchState.currentSet]}</span>
            {matchState.currentServer === 1 && <span>🎾 Servis</span>}
          </div>
        </button>

        {/* Tim 2 */}
        <button
          onClick={() => updateScore(2)}
          className="h-72 rounded-3xl bg-slate-900 border-2 border-cyan-500/40 active:border-cyan-500 flex flex-col justify-between p-5 active:scale-95 transition-all shadow-2xl text-left"
        >
          <div>
            {matchInfo.team2_name && <span className="text-xs font-bold text-cyan-400 uppercase block mb-1">{matchInfo.team2_name}</span>}
            <p className="text-sm font-semibold text-slate-200">{matchInfo.team2_p1_name}</p>
            <p className="text-sm font-semibold text-slate-200">{matchInfo.team2_p2_name}</p>
          </div>
          <div className="text-center">
            <span className="text-6xl font-black text-cyan-400 block">{matchState.team2Points}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">+1 Point</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Games: {matchState.team2Games[matchState.currentSet]}</span>
            {matchState.currentServer === 2 && <span>🎾 Servis</span>}
          </div>
        </button>
      </div>

      {/* Kontrol Servis Manual */}
      <div className="bg-slate-900 p-3 rounded-2xl border border-white/10 flex justify-between items-center text-xs">
        <span className="text-slate-400 font-semibold">Ganti Giliran Servis:</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const updated = { ...matchState, currentServer: 1 as const };
              setMatchState(updated);
              syncToSupabase(updated);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold ${matchState.currentServer === 1 ? 'bg-emerald-500 text-black' : 'bg-white/5 text-slate-400'}`}
          >
            Tim A 🎾
          </button>
          <button
            onClick={() => {
              const updated = { ...matchState, currentServer: 2 as const };
              setMatchState(updated);
              syncToSupabase(updated);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold ${matchState.currentServer === 2 ? 'bg-cyan-500 text-black' : 'bg-white/5 text-slate-400'}`}
          >
            Tim B 🎾
          </button>
        </div>
      </div>
    </div>
  );
}
