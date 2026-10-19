'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function OBSOverlay() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [matchData, setMatchData] = useState<any>(null);
  const [matchState, setMatchState] = useState<any>(null);

  useEffect(() => {
    if (!matchId) return;

    const fetchData = async () => {
      const { data: mData } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();
      if (mData) setMatchData(mData);

      const { data: sData } = await supabase
        .from('match_states')
        .select('*')
        .eq('match_id', matchId)
        .single();
      if (sData) setMatchState(sData);
    };

    fetchData();

    const channel = supabase
      .channel(`obs-realtime-${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_states', filter: `match_id=eq.${matchId}` },
        (payload) => setMatchState(payload.new)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  if (!matchState || !matchData) return <div className="bg-transparent text-white p-4 font-mono">Connecting Overlay...</div>;

  const fontStyle = matchState.overlay_font || 'Teko';

  return (
    <div className="w-full h-screen bg-transparent flex items-end p-8" style={{ fontFamily: `'${fontStyle}', sans-serif` }}>
      <div className="bg-slate-950/90 backdrop-blur-xl text-white rounded-2xl p-4 border border-white/20 shadow-2xl flex items-center gap-6 min-w-[620px] relative overflow-hidden">
        
        {matchData.tournament_logo && (
          <div className="w-12 h-12 flex items-center justify-center border-r border-white/10 pr-4">
            <img src={matchData.tournament_logo} alt="Tournament" className="max-h-full max-w-full object-contain" />
          </div>
        )}

        <div className="absolute -top-3 left-6 flex gap-2">
          {matchState.is_break_point && (
            <span className="bg-red-600 text-white text-[11px] px-3 py-0.5 rounded-full font-extrabold uppercase tracking-widest shadow-lg animate-bounce">
              🔥 BREAK POINT
            </span>
          )}
          {matchState.is_star_point && (
            <span className="bg-cyan-400 text-black text-[11px] px-3 py-0.5 rounded-full font-extrabold uppercase tracking-widest shadow-lg">
              ⭐ STAR POINT
            </span>
          )}
        </div>

        <div className="flex-1 space-y-2 mt-1">
          <div className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-3">
              {matchData.team1_logo && (
                <img src={matchData.team1_logo} alt="T1" className="w-7 h-7 object-contain rounded-full bg-black/40" />
              )}
              <span className="font-bold text-2xl tracking-wide">
                {matchData.team1_custom_name || 'Tim A'}
              </span>
              {matchState.current_server === 1 && <span className="text-emerald-400 text-xl animate-pulse">🎾</span>}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-xl font-bold">Games: {matchState.team1_games?.[matchState.current_set || 0] || 0}</span>
              <span className="text-4xl font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-4 py-0.5 rounded-lg">
                {matchState.team1_points}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-3">
              {matchData.team2_logo && (
                <img src={matchData.team2_logo} alt="T2" className="w-7 h-7 object-contain rounded-full bg-black/40" />
              )}
              <span className="font-bold text-2xl tracking-wide">
                {matchData.team2_custom_name || 'Tim B'}
              </span>
              {matchState.current_server === 2 && <span className="text-emerald-400 text-xl animate-pulse">🎾</span>}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-xl font-bold">Games: {matchState.team2_games?.[matchState.current_set || 0] || 0}</span>
              <span className="text-4xl font-extrabold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-4 py-0.5 rounded-lg">
                {matchState.team2_points}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
