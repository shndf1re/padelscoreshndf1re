'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Trophy, GitMerge, Plus, UserPlus, Shuffle, Play, ExternalLink, LogOut, Lock, Settings2 } from 'lucide-react';

interface Participant {
  id?: string;
  teamName: string;
  p1: string;
  p2: string;
}

export default function TournamentDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'participants' | 'bracket' | 'admins'>('participants');
  
  // Data Peserta
  const [participants, setParticipants] = useState<Participant[]>([
    { teamName: 'Eagle Padel', p1: 'Sanyo', p2: 'Tapia' },
    { teamName: 'Smash Bros', p1: 'Galan', p2: 'Lebron' },
    { teamName: 'Padel Power', p1: 'Coello', p2: 'Paquito' },
    { teamName: 'Viper Club', p1: 'Chingotto', p2: 'Navarro' },
    { teamName: 'Tim 5', p1: 'kao', p2: 'san' },
    { teamName: 'Tim 6', p1: 'Alex', p2: 'Budi' },
    { teamName: 'Tim 7', p1: 'Stev', p2: 'Joeu' },
    { teamName: 'Tim 8', p1: 'Rudi', p2: 'Deni' },
  ]);

  const [newTeam, setNewTeam] = useState('');
  const [newP1, setNewP1] = useState('');
  const [newP2, setNewP2] = useState('');

  // Config Rules Skoring Turnamen
  const [scoringMode, setScoringMode] = useState<'traditional' | 'americano16' | 'americano21'>('traditional');
  const [deuceRule, setDeuceRule] = useState<'golden' | 'advantage' | 'star'>('golden');
  const [gamesPerSet, setGamesPerSet] = useState<number>(6);
  const [totalSets, setTotalSets] = useState<number>(3);

  // Data Admin / Moderator
  const [admins, setAdmins] = useState<{ email: string; role: string }[]>([
    { email: 'shndf1re@gmail.com', role: 'Owner' },
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Data Bracket Match Terintegrasi
  const [bracketMatches, setBracketMatches] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setCurrentUser(data.user);
        setAdmins((prev) => [
          { email: data.user.email || 'shndf1re@gmail.com', role: 'Owner' },
          ...prev.filter((a) => a.email !== data.user.email),
        ]);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/login');
  };

  const addParticipant = () => {
    if (!newP1.trim() || !newP2.trim()) return alert('Isi nama kedua pemain!');
    setParticipants([
      ...participants,
      { teamName: newTeam.trim() || `Tim ${participants.length + 1}`, p1: newP1.trim(), p2: newP2.trim() },
    ]);
    setNewTeam('');
    setNewP1('');
    setNewP2('');
  };

  const inviteAdmin = () => {
    if (!newAdminEmail.trim()) return;
    if (admins.some((a) => a.email === newAdminEmail.trim())) {
      return alert('Email ini sudah menjadi Admin/Moderator!');
    }
    setAdmins([...admins, { email: newAdminEmail.trim(), role: 'Moderator' }]);
    setNewAdminEmail('');
    alert(`Akses Moderator berhasil ditambahkan untuk ${newAdminEmail}`);
  };

  // Fungsi Hitung Nama Babak Dinamis
  const getRoundLabel = (totalMatchesInRound: number) => {
    if (totalMatchesInRound === 1) return 'FINAL';
    if (totalMatchesInRound === 2) return 'SEMIFINAL';
    if (totalMatchesInRound === 4) return 'QUARTERFINAL';
    if (totalMatchesInRound === 8) return 'ROUND OF 16';
    return `BABAK ${totalMatchesInRound * 2} BESAR`;
  };

  // Pengacak Bracket & Pembuatan Match dengan Rule Skoring Khusus
  const generateBracket = async () => {
    if (participants.length < 2) return alert('Butuh minimal 2 tim untuk membuat bracket!');
    
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches = [];
    const totalMatches = Math.floor(shuffled.length / 2);
    const roundTitle = getRoundLabel(totalMatches);

    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) {
        // Buat record match baru di database Supabase dengan sistem skoring pilihan
        const { data: createdMatch } = await supabase
          .from('matches')
          .insert({
            team1_name: shuffled[i].teamName,
            team1_p1_name: shuffled[i].p1,
            team1_p2_name: shuffled[i].p2,
            team2_name: shuffled[i + 1].teamName,
            team2_p1_name: shuffled[i + 1].p1,
            team2_p2_name: shuffled[i + 1].p2,
            match_type: 'tournament',
            scoring_mode: scoringMode,
            deuce_rule: deuceRule,
            games_per_set: gamesPerSet,
            total_sets: totalSets,
            status: 'live',
          })
          .select()
          .single();

        if (createdMatch) {
          await supabase.from('match_states').insert({
            match_id: createdMatch.id,
            team1_points: '0',
            team2_points: '0',
            team1_games: [0, 0, 0, 0, 0],
            team2_games: [0, 0, 0, 0, 0],
            current_set: 0,
            current_server: 1,
          });

          matches.push({
            id: createdMatch.id,
            round: roundTitle,
            t1: `${shuffled[i].p1} / ${shuffled[i].p2}`,
            t2: `${shuffled[i + 1].p1} / ${shuffled[i + 1].p2}`,
            t1Name: shuffled[i].teamName,
            t2Name: shuffled[i + 1].teamName,
          });
        }
      }
    }

    setBracketMatches(matches);
    setActiveTab('bracket');
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Header Turnamen & Status User */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">PRO TOURNAMENT MANAGER</span>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 mt-1 text-white">
            <Trophy className="w-8 h-8 text-amber-400" />
            Padel Championship Hub
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 p-2 px-4 rounded-2xl border border-white/10 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold block">LOGGED IN</span>
                <span className="text-slate-200 font-medium">{currentUser.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-rose-500/20 text-rose-300 rounded-xl hover:bg-rose-500/30 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="flex items-center gap-2 bg-emerald-500 text-black font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-400 transition-all"
            >
              <Lock className="w-3.5 h-3.5" /> Login Manager
            </a>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/10 text-xs font-bold gap-2 max-w-md">
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'participants' ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}
        >
          Peserta ({participants.length})
        </button>
        <button
          onClick={() => setActiveTab('bracket')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'bracket' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}
        >
          Bagan Bracket
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${activeTab === 'admins' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
        >
          Admin & Moderator
        </button>
      </div>

      {/* TAB 1: KELOLA PESERTA & ATURAN SKORING */}
      {activeTab === 'participants' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel Form Tambah Peserta */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-200">
                <Plus className="w-5 h-5 text-emerald-400" /> Tambah Peserta Baru
              </h2>
              <input
                type="text"
                placeholder="Nama Tim (Opsional)"
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Pemain 1"
                  value={newP1}
                  onChange={(e) => setNewP1(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Pemain 2"
                  value={newP2}
                  onChange={(e) => setNewP2(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
              <button
                onClick={addParticipant}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-3.5 rounded-xl text-xs transition-all shadow-lg"
              >
                Simpan Pasangan Peserta
              </button>
            </div>

            {/* Panel Pengaturan Sistem Skoring Turnamen */}
            <div className="glass-panel p-6 rounded-3xl space-y-4 border border-cyan-500/30">
              <h2 className="text-base font-bold flex items-center gap-2 text-cyan-400">
                <Settings2 className="w-5 h-5" /> Aturan Skoring Turnamen
              </h2>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Format Skoring</label>
                  <select
                    value={scoringMode}
                    onChange={(e: any) => setScoringMode(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                  >
                    <option value="traditional">Traditional Padel (15, 30, 40)</option>
                    <option value="americano16">Americano 16 Poin</option>
                    <option value="americano21">Americano 21 Poin</option>
                  </select>
                </div>

                {scoringMode === 'traditional' && (
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Aturan Deuce</label>
                    <select
                      value={deuceRule}
                      onChange={(e: any) => setDeuceRule(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                    >
                      <option value="golden">Golden Point (Langsung Poin Penentu)</option>
                      <option value="advantage">Advantage (Keunggulan 2 Poin)</option>
                      <option value="star">2x AD lalu Star Point (Point Penentu)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Games / Set</label>
                    <select
                      value={gamesPerSet}
                      onChange={(e) => setGamesPerSet(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                    >
                      <option value={6}>6 Games (Standard)</option>
                      <option value={4}>4 Games (Fast4 / Race to 4)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Total Set</label>
                    <select
                      value={totalSets}
                      onChange={(e) => setTotalSets(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                    >
                      <option value={3}>Best of 3 Sets</option>
                      <option value={1}>1 Set Saja (Pro Set)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Daftar Tim Peserta */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-200">Daftar Tim Terdaftar</h2>
                <p className="text-xs text-slate-400">Total {participants.length} tim terdaftar</p>
              </div>
              <button
                onClick={generateBracket}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl transition-all"
              >
                <Shuffle className="w-4 h-4" /> Acak & Generate Bracket
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participants.map((p, idx) => (
                <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase block tracking-wider">{p.teamName}</span>
                  <p className="text-sm font-bold text-white">{p.p1} & {p.p2}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BAGAN BRACKET VISUAL TREE */}
      {activeTab === 'bracket' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6 overflow-x-auto">
          <div className="flex justify-between items-center min-w-[600px]">
            <div>
              <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <GitMerge className="w-6 h-6" /> Bagan Eliminasi Gugur (Knockout Tree)
              </h2>
              <p className="text-xs text-slate-400">Pilih match untuk membuka kontrol Wasit atau link OBS Stream</p>
            </div>
            <button
              onClick={generateBracket}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-white/10"
            >
              <Shuffle className="w-3.5 h-3.5" /> Acak Ulang
            </button>
          </div>

          {bracketMatches.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Belum ada bracket aktif. Silakan buat bracket pada tab Peserta.</p>
            </div>
          ) : (
            /* Tampilan Visual Tree Bracket Horizontal */
            <div className="flex gap-8 items-stretch pt-4 pb-6 min-w-[750px]">
              {/* Kolom Babak Utama (cth: Quarterfinal) */}
              <div className="flex-1 space-y-6">
                <div className="text-center bg-cyan-500/10 border border-cyan-500/20 py-2 rounded-xl text-xs font-black text-cyan-400 uppercase tracking-widest">
                  {bracketMatches[0]?.round || 'BABAK ELEMINASI'}
                </div>

                <div className="space-y-4">
                  {bracketMatches.map((m, idx) => (
                    <div key={idx} className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 space-y-3 shadow-xl hover:border-cyan-500/40 transition-all">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          MATCH #{idx + 1}
                        </span>
                        <span className="text-slate-500 font-mono text-[10px]">ID: {m.id.substring(0, 8)}...</span>
                      </div>

                      <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-white/5 text-xs font-semibold">
                        <div className="flex justify-between items-center text-emerald-400">
                          <span className="truncate">{m.t1}</span>
                          {m.t1Name && <span className="text-[9px] text-slate-500 uppercase shrink-0">{m.t1Name}</span>}
                        </div>
                        <div className="border-t border-white/5 pt-1.5 flex justify-between items-center text-cyan-400">
                          <span className="truncate">{m.t2}</span>
                          {m.t2Name && <span className="text-[9px] text-slate-500 uppercase shrink-0">{m.t2Name}</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <a
                          href={`/referee/${m.id}`}
                          target="_blank"
                          className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold py-2 rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1 text-[11px]"
                        >
                          <Play className="w-3 h-3 fill-emerald-300" /> Wasit
                        </a>
                        <a
                          href={`/overlay/${m.id}`}
                          target="_blank"
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold py-2 rounded-xl border border-cyan-500/30 text-center flex items-center justify-center gap-1 text-[11px]"
                        >
                          <ExternalLink className="w-3 h-3" /> OBS
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Garis Penghubung Alur Tree (Visual Diagram) */}
              <div className="w-12 flex flex-col justify-around items-center opacity-30">
                <div className="w-full h-0.5 bg-cyan-400"></div>
                <div className="w-full h-0.5 bg-cyan-400"></div>
              </div>

              {/* Kolom Slot Semifinal (Placeholder Pemenang) */}
              <div className="flex-1 space-y-6 opacity-60">
                <div className="text-center bg-slate-800 border border-white/10 py-2 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest">
                  SEMIFINAL
                </div>

                <div className="flex flex-col justify-around h-[85%] space-y-8">
                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-500">
                    Pemenang Match #1 vs Match #2
                  </div>
                  <div className="bg-slate-900/40 p-4 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-500">
                    Pemenang Match #3 vs Match #4
                  </div>
                </div>
              </div>

              {/* Kolom Slot Final */}
              <div className="w-48 space-y-6 opacity-40">
                <div className="text-center bg-amber-500/10 border border-amber-500/20 py-2 rounded-xl text-xs font-black text-amber-400 uppercase tracking-widest">
                  FINAL 🏆
                </div>

                <div className="flex flex-col justify-center h-[85%]">
                  <div className="bg-amber-500/5 p-4 rounded-2xl border border-dashed border-amber-500/20 text-center text-xs text-amber-300/60">
                    Perebutan Juara
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN & MODERATOR */}
      {activeTab === 'admins' && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 max-w-xl mx-auto">
          <div>
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Undang Admin & Moderator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Admin/Moderator yang diundang dapat mengakses panel wasit tanpa merusak pengaturan turnamen.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="email.wasit@padel.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
            />
            <button
              onClick={inviteAdmin}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-all"
            >
              Kirim Akses
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Daftar Pengelola Turnamen</span>
            {admins.map((adm, idx) => (
              <div key={idx} className="bg-slate-900/80 p-3.5 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                <span className="text-slate-200 font-medium">{adm.email}</span>
                <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase ${adm.role === 'Owner' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'}`}>
                  {adm.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
