'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { calculatePadelScore, ScoreState, DeuceRule } from '@/lib/padelEngine';
import { RotateCcw, Type, Trophy, History } from 'lucide-react';

export default function RefereeControl() {
  const params = useParams();
  const matchId = params?.matchId as string;

  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [matchState, setMatchState] = useState<ScoreState>({
    team1Points: '0',
    team2Points: '0',
    team1Games: [0, 0, 0, 0, 0],
    team2Games: [0, 0, 0, 0, 0],
    team1SetsWon: 0,
    team2SetsWon: 0,
    currentSet: 0,
    currentServer: 1,
    deuceCount: 0,
    isBreakPoint: false,
    isSetPoint: false,
    isMatchPoint: false,
    isStarPoint: false,
    isFinished: false,
    winnerTeam: 0,
  });

  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [historyStack, setHistoryStack] = useState<ScoreState[]>([]);
  const [selectedFont, setSelectedFont] = useState('Teko');
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      const { data: mData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
      if (mData) setMatchInfo(mData);

      const { data: sData } = await supabase
        .from('match_states')
        .select('*')
        .eq('match_id', matchId)
        .single();

      if (sData) {
        setMatchState({
          team1Points: sData.team1_points || '0',
          team2Points: sData.team2_points || '0',
          team1Games: sData.team1_games || [0, 0, 0, 0, 0],
          team2Games: sData.team2_games || [0, 0, 0, 0, 0],
          team1SetsWon: sData.team1_sets_won || 0,
          team2SetsWon: sData.team2_sets_won || 0,
          currentSet: sData.current_set || 0,
          currentServer: sData.current_server || 1,
          deuceCount: 0,
          isBreakPoint: sData.is_break_point || false,
          isSetPoint: sData.is_set_point || false,
          isMatchPoint: sData.is_match_point || false,
          isStarPoint: sData.is_star_point || false,
          isFinished: sData.is_finished || false,
          winnerTeam: sData.winner_team || 0,
        });
        if (sData.overlay_font) setSelectedFont(sData.overlay_font);
        if (sData.point_history) setPointHistory(sData.point_history);
      }
    };

    fetchMatch();
  }, [matchId]);

  const syncToSupabase = async (updated: ScoreState, newHistory = pointHistory, fontName = selectedFont) => {
    const { error } = await supabase
      .from('match_states')
      .upsert(
        {
          match_id: matchId,
          team1_points: updated.team1Points,
          team2_points: updated.team2Points,
          team1_games: updated.team1Games,
          team2_games: updated.team2Games,
          team1_sets_won: updated.team1SetsWon,
          team2_sets_won: updated.team2SetsWon,
          current_set: updated.currentSet,
          current_server: updated.currentServer,
          is_break_point: updated.isBreakPoint,
          is_star_point: updated.isStarPoint,
          is_finished: updated.isFinished,
          winner_team: updated.winnerTeam,
          point_history: newHistory,
          overlay_font: fontName,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'match_id' }
      );

    if (error) setSyncError(error.message);
    else setSyncError(null);
  };

  const updateScore = async (scoringTeam: 1 | 2) => {
    if (matchState.isFinished) return;

    setHistoryStack((prev) => [...prev, JSON.parse(JSON.stringify(matchState))]);
    const mode = matchInfo?.scoring_mode || 'traditional';
    const deuceRule = matchInfo?.deuce_rule || 'golden';
    const gamesPerSet = matchInfo?.games_per_set || 6;
    const totalSets = matchInfo?.total_sets || 3;

    const updated = calculatePadelScore(
      matchState,
      scoringTeam,
      mode,
      deuceRule as DeuceRule,
      gamesPerSet,
      totalSets
    );

    // Tambah Log Alur Poin
    const logItem = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      set: updated.currentSet + 1,
      scoringTeam,
      scoreText: `${updated.team1Points} - ${updated.team2Points}`,
      gamesText: `Set ${updated.currentSet + 1}: (${updated.team1Games[updated.currentSet]} - ${updated.team2Games[updated.currentSet]})`,
    };

    const updatedHistory = [logItem, ...pointHistory].slice(0, 50); // Simpan 50 poin terakhir
    setPointHistory(updatedHistory);

    setMatchState(updated);
    await syncToSupabase(updated, updatedHistory);
  };

  const handleUndo = async () => {
    if (historyStack.length === 0) return;
    const previousState = historyStack[historyStack.length - 1];
    const previousHistory = pointHistory.slice(1);

    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setPointHistory(previousHistory);
    setMatchState(previousState);
    await syncToSupabase(previousState, previousHistory);
  };

  if (!matchInfo) return <div className="p-6 text-center text-white">Memuat Panel Wasit...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-between select-none space-y-4">
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

        {syncError && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-3 rounded-xl text-xs font-semibold">
            ⚠️ Gagal sync ke database: {syncError}
          </div>
        )}

        {matchState.isFinished && (
          <div className="bg-amber-500/20 border border-amber-500/40 p-4 rounded-2xl text-center space-y-2">
            <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
            <h2 className="text-lg font-bold text-amber-300">MATCH SELESAI!</h2>
            <p className="text-xs text-slate-300">
              Pemenang:{' '}
              <span className="font-bold text-emerald-400">
                {matchState.winnerTeam === 1
                  ? matchInfo.team1_name || `${matchInfo.team1_p1_name} / ${matchInfo.team1_p2_name}`
                  : matchInfo.team2_name || `${matchInfo.team2_p1_name} / ${matchInfo.team2_p2_name}`}
              </span>
            </p>
          </div>
        )}

        <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Type className="w-4 h-4 text-cyan-400" /> OBS Font:
          </span>
          <select
            value={selectedFont}
            onChange={(e) => {
              setSelectedFont(e.target.value);
              syncToSupabase(matchState, pointHistory, e.target.value);
            }}
            className="bg-slate-950 border border-white/10 text-white rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value="Teko">Teko (TV Broadcast)</option>
            <option value="Bebas Neue">Bebas Neue (Bold)</option>
            <option value="Montserrat">Montserrat (Clean)</option>
            <option value="Outfit">Outfit (SaaS Modern)</option>
          </select>
        </div>
      </div>

      {/* Ringkasan Set */}
      <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/10 text-xs flex justify-around text-center my-2">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Set Sekarang</span>
          <span className="font-bold text-emerald-400 text-sm">Set {matchState.currentSet + 1}</span>
        </div>
        <div className="border-r border-white/10" />
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-bold">Skor Set (A - B)</span>
          <span className="font-bold text-white text-sm">
            {matchState.team1SetsWon} - {matchState.team2SetsWon}
          </span>
        </div>
      </div>

      {/* Area Tombol Poin */}
      <div className="grid grid-cols-2 gap-4 my-2">
        <button
          onClick={() => updateScore(1)}
          disabled={matchState.isFinished}
          className="h-64 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 active:border-emerald-500 flex flex-col justify-between p-5 active:scale-95 transition-all shadow-2xl text-left disabled:opacity-40"
        >
          <div>
            {matchInfo.team1_name && (
              <span className="text-xs font-bold text-emerald-400 uppercase block mb-1">
                {matchInfo.team1_name}
              </span>
            )}
            <p className="text-xs font-semibold text-slate-200">{matchInfo.team1_p1_name}</p>
            <p className="text-xs font-semibold text-slate-200">{matchInfo.team1_p2_name}</p>
          </div>
          <div className="text-center">
            <span className="text-6xl font-black text-emerald-400 block">{matchState.team1Points}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">+1 Point</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Games: {matchState.team1Games[matchState.currentSet]}</span>
            {matchState.currentServer === 1 && <span>🎾</span>}
          </div>
        </button>

        <button
          onClick={() => updateScore(2)}
          disabled={matchState.isFinished}
          className="h-64 rounded-3xl bg-slate-900 border-2 border-cyan-500/40 active:border-cyan-500 flex flex-col justify-between p-5 active:scale-95 transition-all shadow-2xl text-left disabled:opacity-40"
        >
          <div>
            {matchInfo.team2_name && (
              <span className="text-xs font-bold text-cyan-400 uppercase block mb-1">
                {matchInfo.team2_name}
              </span>
            )}
            <p className="text-xs font-semibold text-slate-200">{matchInfo.team2_p1_name}</p>
            <p className="text-xs font-semibold text-slate-200">{matchInfo.team2_p2_name}</p>
          </div>
          <div className="text-center">
            <span className="text-6xl font-black text-cyan-400 block">{matchState.team2Points}</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">+1 Point</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Games: {matchState.team2Games[matchState.currentSet]}</span>
            {matchState.currentServer === 2 && <span>🎾</span>}
          </div>
        </button>
      </div>

      {/* Log Alur Poin Terakhir */}
      <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/10 space-y-2">
        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
          <History className="w-3.5 h-3.5 text-cyan-400" /> Alur Poin Terakhir
        </span>
        <div className="max-h-28 overflow-y-auto space-y-1 text-xs pr-1">
          {pointHistory.length === 0 ? (
            <p className="text-slate-600 text-[11px]">Belum ada alur poin tercatat.</p>
          ) : (
            pointHistory.slice(0, 5).map((log, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-950 px-2.5 py-1 rounded-lg text-[11px]">
                <span className="text-slate-500">{log.time}</span>
                <span className={log.scoringTeam === 1 ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                  +1 {log.scoringTeam === 1 ? 'Tim A' : 'Tim B'}
                </span>
                <span className="text-slate-300 font-mono font-bold">{log.scoreText}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
