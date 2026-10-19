'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Trophy, Share2, Award, Calendar } from 'lucide-react';

export default function MatchSummaryPage() {
  const params = useParams();
  const matchId = params.matchId as string;

  const [matchData, setMatchData] = useState<any>(null);
  const [matchState, setMatchState] = useState<any>(null);

  useEffect(() => {
    if (!matchId) return;

    const fetchSummary = async () => {
      const { data: mData } = await supabase.from('matches').select('*').eq('id', matchId).single();
      if (mData) setMatchData(mData);

      const { data: sData } = await supabase.from('match_states').select('*').eq('match_id', matchId).single();
      if (sData) setMatchState(sData);
    };

    fetchSummary();
  }, [matchId]);

  if (!matchData || !matchState) return <div className="p-8 text-center text-white">Memuat Hasil Match...</div>;

  const isFinished = matchState.is_finished;

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest block">MATCH SUMMARY</span>
            <h1 className="text-2xl font-extrabold text-white">Laporan Pertandingan</h1>
          </div>
          <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${isFinished ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isFinished ? 'Selesai' : 'Sedang Berlangsung'}
          </span>
        </div>

        {/* Banner Pemenang */}
        {isFinished && (
          <div className="bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-500/30 p-6 rounded-2xl text-center space-y-2">
            <Trophy className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
            <span className="text-xs text-amber-300 font-bold uppercase tracking-wider block">PEMENANG MATCH</span>
            <h2 className="text-2xl font-black text-white">
              {matchState.winner_team === 1
                ? matchData.team1_name || `${matchData.team1_p1_name} / ${matchData.team1_p2_name}`
                : matchData.team2_name || `${matchData.team2_p1_name} / ${matchData.team2_p2_name}`}
            </h2>
          </div>
        )}

        {/* Tabel Skor Per Set */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" /> Rincian Skor Set
          </h3>

          <div className="bg-slate-900/80 rounded-2xl p-4 border border-white/10 space-y-3">
            {/* Tim A */}
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div>
                {matchData.team1_name && <span className="text-[10px] text-emerald-400 font-bold uppercase block">{matchData.team1_name}</span>}
                <span className="font-semibold text-sm text-white">{matchData.team1_p1_name} / {matchData.team1_p2_name}</span>
              </div>
              <div className="flex gap-3 text-sm font-bold text-emerald-400">
                {matchState.team1_games?.map((g: number, idx: number) => (
                  <span key={idx} className="bg-slate-950 px-2.5 py-1 rounded-lg border border-white/5">{g}</span>
                ))}
              </div>
            </div>

            {/* Tim B */}
            <div className="flex justify-between items-center pt-1">
              <div>
                {matchData.team2_name && <span className="text-[10px] text-cyan-400 font-bold uppercase block">{matchData.team2_name}</span>}
                <span className="font-semibold text-sm text-white">{matchData.team2_p1_name} / {matchData.team2_p2_name}</span>
              </div>
              <div className="flex gap-3 text-sm font-bold text-cyan-400">
                {matchState.team2_games?.map((g: number, idx: number) => (
                  <span key={idx} className="bg-slate-950 px-2.5 py-1 rounded-lg border border-white/5">{g}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Informasi Aturan Match */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 text-xs text-slate-400 space-y-1">
          <p>&bull; Mode: <span className="text-white font-semibold uppercase">{matchData.scoring_mode}</span></p>
          <p>&bull; Target Games: <span className="text-white font-semibold">{matchData.games_per_set} Games per Set</span></p>
          <p>&bull; Aturan Deuce: <span className="text-white font-semibold uppercase">{matchData.deuce_rule}</span></p>
        </div>
      </div>
    </main>
  );
}
