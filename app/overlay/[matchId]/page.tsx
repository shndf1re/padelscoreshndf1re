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

    const loadData = async () => {
      const { data: mData } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (mData) setMatchData(mData);

      const { data: sData } = await supabase.from('match_states').select('*').eq('id', matchId).single();
      if (sData) setMatchState(sData);
    };

    loadData();

    const channel = supabase
      .channel(`obs-stream-${matchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'match_states', filter: `match_id=eq.${matchId}` },
        (payload) => {
          if (payload.new) setMatchState(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  if (!matchState || !matchData) return <div className="bg-transparent text-white p-4 font-mono text-sm">Connecting Stream Overlay...</div>;

  const fontStyle = matchState.overlay_font || 'Teko';

  return (
    <div className="w-full h-screen bg-transparent flex items-end p-8" style={{ fontFamily: `'${fontStyle}', sans-serif` }}>
      <div className="bg-slate-950/90 backdrop-blur-xl text-white rounded-2xl p-4 border border-white/20 shadow-2xl flex items-center gap-6 min-w-[700px] relative overflow-hidden">
        
        {/* Badges Indikator */}
        <div className="absolute -top-3 left-6 flex gap-2">
          {matchState.is_finished && (
            <span className="bg-amber-500 text-black text-[11px] px-3 py-0.5 rounded-full font-extrabold uppercase tracking-widest shadow-lg">
              🏆 MATCH FINISHED
            </span>
          )}
          {matchState.is_break_point && !matchState.is_finished && (
            <span className="bg-red-600 text-white text-[11px] px-3 py-0.5 rounded-full font-extrabold uppercase tracking-widest shadow-lg animate-bounce">
              🔥 BREAK POINT
            </span>
          )}
          {matchState.is_star_point && !matchState.is_finished && (
            <span className="bg-cyan-400 text-black text-[11px] px-3 py-0.5 rounded-full font-extrabold uppercase tracking-widest shadow-lg">
              ⭐ STAR POINT
            </span>
          )}
        </div>

        {/* Skor Bar */}
        <div className="flex-1 space-y-2 mt-1">
          {/* Tim A */}
          <div className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-3">
              {matchState.current_server === 1 && !matchState.is_finished && <span className="text-emerald-400 text-xl animate-pulse">🎾</span>}
              <div>
                {matchData.team1_name && (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block tracking-wider">{matchData.team1_name}</span>
                )}
                <div className="font-bold text-lg leading-tight">
                  {matchData.team1_p1_name} / {matchData.team1_p2_name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Tampilan Per Set (Premier Padel Style) */}
              <div className="flex gap-2 text-slate-400 font-bold text-base">
                {matchState.team1_games?.map((g: number, i: number) => (
                  <span key={i} className={`px-2 py-0.5 rounded ${i === matchState.current_set ? 'bg-white/10 text-white' : ''}`}>
                    {g}
                  </span>
                ))}
              </div>
              <span className="text-3xl font-extrabold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-4 py-0.5 rounded-lg min-w-[50px] text-center">
                {matchState.team1_points}
              </span>
            </div>
          </div>

          {/* Tim B */}
          <div className="flex justify-between items-center bg-white/5 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-3">
              {matchState.current_server === 2 && !matchState.is_finished && <span className="text-cyan-400 text-xl animate-pulse">🎾</span>}
              <div>
                {matchData.team2_name && (
                  <span className="text-[10px] text-cyan-400 font-bold uppercase block tracking-wider">{matchData.team2_name}</span>
                )}
                <div className="font-bold text-lg leading-tight">
                  {matchData.team2_p1_name} / {matchData.team2_p2_name}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 text-slate-400 font-bold text-base">
                {matchState.team2_games?.map((g: number, i: number) => (
                  <span key={i} className={`px-2 py-0.5 rounded ${i === matchState.current_set ? 'bg-white/10 text-white' : ''}`}>
                    {g}
                  </span>
                ))}
              </div>
              <span className="text-3xl font-extrabold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-4 py-0.5 rounded-lg min-w-[50px] text-center">
                {matchState.team2_points}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
