'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function OBSOverlay({ params }: { params: { matchId: string } }) {
  const [matchState, setMatchState] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch data awal
    const fetchState = async () => {
      const { data } = await supabase
        .from('match_states')
        .select('*')
        .eq('match_id', params.matchId)
        .single();
      if (data) setMatchState(data);
    };

    fetchState();

    // 2. Realtime Listener dari Supabase
    const channel = supabase
      .channel(`obs-match-${params.matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_states', filter: `match_id=eq.${params.matchId}` },
        (payload) => {
          setMatchState(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [params.matchId]);

  if (!matchState) return <div className="bg-transparent text-white p-4">Loading Overlay...</div>;

  const fontClass = matchState.overlay_font || 'sans-serif';

  return (
    <div className="w-full h-screen bg-transparent flex items-end p-8 font-sans">
      {/* Container Overlay Scoreboard */}
      <div 
        className="bg-black/80 backdrop-blur-md text-white rounded-xl p-4 shadow-2xl border border-white/20 flex items-center gap-6 min-w-[500px]"
        style={{ fontFamily: fontClass }}
      >
        {/* Indikator Badge Status */}
        <div className="flex flex-col gap-1 text-xs font-bold uppercase">
          {matchState.is_break_point && <span className="bg-red-600 px-2 py-0.5 rounded text-white animate-pulse">Break Point</span>}
          {matchState.is_star_point && <span className="bg-yellow-500 px-2 py-0.5 rounded text-black">Star Point</span>}
        </div>

        {/* Skor Tim 1 vs Tim 2 */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg flex items-center gap-2">
              {matchState.current_server === 1 && <span>🎾</span>} Tim A
            </span>
            <span className="text-2xl font-bold bg-white/10 px-3 py-1 rounded">{matchState.team1_points}</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/10 pt-2">
            <span className="font-semibold text-lg flex items-center gap-2">
              {matchState.current_server === 2 && <span>🎾</span>} Tim B
            </span>
            <span className="text-2xl font-bold bg-white/10 px-3 py-1 rounded">{matchState.team2_points}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
