'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { RotateCcw, Award, ChevronLeft, RefreshCw, Zap } from 'lucide-react';

interface MatchData {
  id: string;
  team1_name?: string;
  team1_p1_name?: string;
  team1_p2_name?: string;
  team2_name?: string;
  team2_p1_name?: string;
  team2_p2_name?: string;
  games_per_set?: number;
  total_sets?: number;
  deuce_rule?: string;
}

interface MatchStateData {
  match_id: string;
  team1_points: string;
  team2_points: string;
  team1_games: number[];
  team2_games: number[];
  team1_sets_won: number;
  team2_sets_won: number;
  current_set: number;
  deuce_count?: number;
  is_star_point?: boolean;
  is_finished: boolean;
  winner_team: number;
}

export default function RefereePanel() {
  const routeParams = useParams();
  const rawMatchId = routeParams?.matchId;
  const matchId = Array.isArray(rawMatchId) ? rawMatchId[0] : rawMatchId || '';

  const router = useRouter();

  const [match, setMatch] = useState<MatchData | null>(null);
  const [state, setState] = useState<MatchStateData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatchData = useCallback(async () => {
    if (!matchId) return;

    const { data: matchData } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    const { data: stateData } = await supabase
      .from('match_states')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (matchData) setMatch(matchData as MatchData);
    if (stateData) setState(stateData as MatchStateData);
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    fetchMatchData();

    if (!matchId) return;

    const channel = supabase
      .channel(`referee-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_states', filter: `match_id=eq.${matchId}` },
        (payload: any) => {
          if (payload && payload.new) setState(payload.new as MatchStateData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, fetchMatchData]);

  if (loading || !match || !state) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Memuat Panel Wasit...</p>
        </div>
      </main>
    );
  }

  const targetGames = match.games_per_set || 6;
  const totalSets = match.total_sets || 1;
  const deuceRule = match.deuce_rule || 'golden';

  const currentSet = state.current_set || 0;
  const games1 = state.team1_games?.[currentSet] || 0;
  const games2 = state.team2_games?.[currentSet] || 0;

  // Cek apakah mode Tie-Break aktif
  const isTieBreak =
    (targetGames === 6 && games1 === 6 && games2 === 6) ||
    (targetGames === 4 && games1 === 4 && games2 === 4);

  // Total poin Tie-Break untuk indikator rotasi tempat
  const tbP1 = parseInt(state.team1_points, 10) || 0;
  const tbP2 = parseInt(state.team2_points, 10) || 0;
  const totalTbPoints = tbP1 + tbP2;
  const isSwitchSideNext = isTieBreak && totalTbPoints > 0 && totalTbPoints % 6 === 0;

  // Logika Penambahan Poin Wasit
  const addPoint = async (team: 1 | 2) => {
    if (state.is_finished) return;

    let p1 = state.team1_points;
    let p2 = state.team2_points;
    let deuceCount = state.deuce_count || 0;
    let isStarPoint = state.is_star_point || false;

    let g1Array = [...(state.team1_games || [0, 0, 0, 0, 0])];
    let g2Array = [...(state.team2_games || [0, 0, 0, 0, 0])];
    let setsWon1 = state.team1_sets_won || 0;
    let setsWon2 = state.team2_sets_won || 0;
    let isFinished = false;
    let winnerTeam = 0;

    // --- 1. MODE TIE-BREAK (Poin 1, 2, 3...) ---
    if (isTieBreak) {
      let score1 = parseInt(p1, 10) || 0;
      let score2 = parseInt(p2, 10) || 0;

      if (team === 1) score1 += 1;
      else score2 += 1;

      p1 = score1.toString();
      p2 = score2.toString();

      if ((score1 >= 7 && score1 - score2 >= 2) || (score2 >= 7 && score2 - score1 >= 2)) {
        if (score1 > score2) g1Array[currentSet] += 1;
        else g2Array[currentSet] += 1;

        p1 = '0';
        p2 = '0';
      }
    } else {
      // --- 2. MODE SKOR TRADISIONAL (15, 30, 40) ---
      if (team === 1) {
        if (p1 === '0') p1 = '15';
        else if (p1 === '15') p1 = '30';
        else if (p1 === '30') p1 = '40';
        else if (p1 === '40') {
          if (p2 === '40') {
            if (deuceRule === 'golden') {
              g1Array[currentSet] += 1;
              p1 = '0';
              p2 = '0';
            } else if (deuceRule === 'star') {
              if (deuceCount === 0) {
                p1 = 'AD1';
              } else if (deuceCount === 1) {
                p1 = 'AD2';
              } else {
                g1Array[currentSet] += 1;
                p1 = '0';
                p2 = '0';
                deuceCount = 0;
                isStarPoint = false;
              }
            } else {
              p1 = 'AD';
            }
          } else if (p2 === 'AD' || p2 === 'AD1' || p2 === 'AD2') {
            p1 = '40';
            p2 = '40';
            if (deuceRule === 'star') {
              deuceCount += 1;
              if (deuceCount >= 2) isStarPoint = true;
            }
          } else {
            g1Array[currentSet] += 1;
            p1 = '0';
            p2 = '0';
            deuceCount = 0;
            isStarPoint = false;
          }
        } else if (p1 === 'AD' || p1 === 'AD1' || p1 === 'AD2') {
          g1Array[currentSet] += 1;
          p1 = '0';
          p2 = '0';
          deuceCount = 0;
          isStarPoint = false;
        }
      } else {
        if (p2 === '0') p2 = '15';
        else if (p2 === '15') p2 = '30';
        else if (p2 === '30') p2 = '40';
        else if (p2 === '40') {
          if (p1 === '40') {
            if (deuceRule === 'golden') {
              g2Array[currentSet] += 1;
              p1 = '0';
              p2 = '0';
            } else if (deuceRule === 'star') {
              if (deuceCount === 0) {
                p2 = 'AD1';
              } else if (deuceCount === 1) {
                p2 = 'AD2';
              } else {
                g2Array[currentSet] += 1;
                p1 = '0';
                p2 = '0';
                deuceCount = 0;
                isStarPoint = false;
              }
            } else {
              p2 = 'AD';
            }
          } else if (p1 === 'AD' || p1 === 'AD1' || p1 === 'AD2') {
            p1 = '40';
            p2 = '40';
            if (deuceRule === 'star') {
              deuceCount += 1;
              if (deuceCount >= 2) isStarPoint = true;
            }
          } else {
            g2Array[currentSet] += 1;
            p1 = '0';
            p2 = '0';
            deuceCount = 0;
            isStarPoint = false;
          }
        } else if (p2 === 'AD' || p2 === 'AD1' || p2 === 'AD2') {
          g2Array[currentSet] += 1;
          p1 = '0';
          p2 = '0';
          deuceCount = 0;
          isStarPoint = false;
        }
      }
    }

    const curG1 = g1Array[currentSet];
    const curG2 = g2Array[currentSet];

    let setWonByTeam = 0;

    if (targetGames === 5) {
      if (curG1 + curG2 >= 5) setWonByTeam = curG1 > curG2 ? 1 : 2;
    } else if (targetGames === 4) {
      if (curG1 >= 4 && curG1 - curG2 >= 1) setWonByTeam = 1;
      else if (curG2 >= 4 && curG2 - curG1 >= 1) setWonByTeam = 2;
      else if (curG1 === 5 || curG2 === 5) setWonByTeam = curG1 === 5 ? 1 : 2;
    } else {
      if (curG1 >= 6 && curG1 - curG2 >= 2) setWonByTeam = 1;
      else if (curG2 >= 6 && curG2 - curG1 >= 2) setWonByTeam = 2;
      else if (curG1 === 7 || curG2 === 7) setWonByTeam = curG1 === 7 ? 1 : 2;
    }

    if (setWonByTeam > 0) {
      if (setWonByTeam === 1) setsWon1 += 1;
      else setsWon2 += 1;

      const requiredSets = Math.ceil(totalSets / 2);
      if (setsWon1 >= requiredSets || setsWon2 >= requiredSets) {
        isFinished = true;
        winnerTeam = setsWon1 > setsWon2 ? 1 : 2;
      } else {
        currentSet += 1;
      }
    }

    await supabase
      .from('match_states')
      .update({
        team1_points: p1,
        team2_points: p2,
        team1_games: g1Array,
        team2_games: g2Array,
        team1_sets_won: setsWon1,
        team2_sets_won: setsWon2,
        current_set: currentSet,
        deuce_count: deuceCount,
        is_star_point: isStarPoint,
        is_finished: isFinished,
        winner_team: winnerTeam,
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId);
  };

  const resetScore = async () => {
    if (!confirm('Apakah kamu yakin ingin mereset skor pertandingan ini?')) return;

    await supabase
      .from('match_states')
      .update({
        team1_points: '0',
        team2_points: '0',
        team1_games: [0, 0, 0, 0, 0],
        team2_games: [0, 0, 0, 0, 0],
        team1_sets_won: 0,
        team2_sets_won: 0,
        current_set: 0,
        deuce_count: 0,
        is_star_point: false,
        is_finished: false,
        winner_team: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('match_id', matchId);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 max-w-md mx-auto flex flex-col justify-between select-none">
      <div className="space-y-3">
        <div className="flex justify-between items-center bg-slate-900 p-3 rounded-2xl border border-white/10">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-white p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">
              {isTieBreak ? '🔥 TIE-BREAK MODE' : `MODE ${targetGames} GAMES`}
            </span>
            <h1 className="text-xs font-bold text-slate-200">
              {match.team1_name} vs {match.team2_name}
            </h1>
          </div>
          <button onClick={resetScore} className="text-rose-400 hover:text-rose-300 p-1" title="Reset Skor">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {isSwitchSideNext && (
          <div className="bg-amber-500/20 border border-amber-500/40 p-3 rounded-2xl text-center flex items-center justify-center gap-2 animate-pulse text-amber-300 font-extrabold text-xs">
            <RefreshCw className="w-4 h-4" /> PERGANTIAN SISI LAPANGAN (POIN {totalTbPoints})
          </div>
        )}

        {state.is_finished && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 p-4 rounded-2xl text-center space-y-1 animate-bounce">
            <Award className="w-8 h-8 text-emerald-400 mx-auto" />
            <h2 className="text-sm font-black text-emerald-300 uppercase">PERTANDINGAN SELESAI</h2>
            <p className="text-xs font-bold text-white">
              PEMENANG:{' '}
              {state.winner_team === 1
                ? match.team1_name || `${match.team1_p1_name}/${match.team1_p2_name}`
                : match.team2_name || `${match.team2_p1_name}/${match.team2_p2_name}`}
            </p>
          </div>
        )}

        {state.is_star_point && !state.is_finished && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 p-2.5 rounded-2xl text-center flex items-center justify-center gap-2 text-yellow-300 font-black text-xs">
            <Zap className="w-4 h-4 fill-yellow-300" /> STAR POINT (POIN PENENTU GAME)
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 bg-slate-900 p-4 rounded-3xl border border-white/10">
          <div className="space-y-1 text-center">
            <span className="text-[10px] text-slate-400 font-bold block truncate">
              {match.team1_p1_name} / {match.team1_p2_name}
            </span>
            <div className="text-4xl font-black text-emerald-400">{state.team1_points}</div>
            <div className="text-xs font-bold text-slate-300">
              Games: <span className="text-white font-extrabold">{state.team1_games?.[currentSet] || 0}</span>
            </div>
          </div>

          <div className="space-y-1 text-center border-l border-white/10">
            <span className="text-[10px] text-slate-400 font-bold block truncate">
              {match.team2_p1_name} / {match.team2_p2_name}
            </span>
            <div className="text-4xl font-black text-cyan-400">{state.team2_points}</div>
            <div className="text-xs font-bold text-slate-300">
              Games: <span className="text-white font-extrabold">{state.team2_games?.[currentSet] || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 my-6">
        <button
          onClick={() => addPoint(1)}
          disabled={state.is_finished}
          className="bg-emerald-600 active:bg-emerald-500 disabled:opacity-40 text-white font-extrabold py-10 rounded-3xl text-2xl shadow-2xl border border-emerald-400/30 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <span>POIN TIM 1</span>
          <span className="text-xs font-medium opacity-80">
            {match.team1_p1_name} & {match.team1_p2_name}
          </span>
        </button>

        <button
          onClick={() => addPoint(2)}
          disabled={state.is_finished}
          className="bg-cyan-600 active:bg-cyan-500 disabled:opacity-40 text-white font-extrabold py-10 rounded-3xl text-2xl shadow-2xl border border-cyan-400/30 flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
        >
          <span>POIN TIM 2</span>
          <span className="text-xs font-medium opacity-80">
            {match.team2_p1_name} & {match.team2_p2_name}
          </span>
        </button>
      </div>

      <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5 text-[11px] text-slate-400 text-center space-y-1">
        <p>
          Deuce Rule:{' '}
          <span className="text-slate-200 font-bold">
            {deuceRule === 'star'
              ? '2x AD ➔ Star Point'
              : deuceRule === 'advantage'
              ? 'Advantage'
              : 'Golden Point'}
          </span>
        </p>
      </div>
    </main>
  );
}
