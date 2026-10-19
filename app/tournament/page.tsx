'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  GitMerge,
  Plus,
  UserPlus,
  Shuffle,
  Play,
  ExternalLink,
  LogOut,
  Lock,
  Settings2,
  CheckCircle2,
  FolderKanban,
  ArrowLeft,
} from 'lucide-react';

interface Participant {
  id?: string;
  teamName: string;
  p1: string;
  p2: string;
}

interface TournamentItem {
  id: string;
  name: string;
  title: string;
  scoring_mode: string;
  deuce_rule: string;
  games_per_set: number;
  total_sets: number;
  created_at: string;
}

export default function TournamentDashboard() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'manage'>('list');

  // List Turnamen & Turnamen Terpilih
  const [tournamentsList, setTournamentsList] = useState<TournamentItem[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentItem | null>(null);

  // Form Buat Turnamen Baru
  const [customTitle, setCustomTitle] = useState('BeeTenis Padel Open');
  const [scoringMode, setScoringMode] = useState<'traditional' | 'americano16' | 'americano21'>('traditional');
  const [deuceRule, setDeuceRule] = useState<'golden' | 'advantage' | 'star'>('golden');
  const [gamesPerSet, setGamesPerSet] = useState<number>(5); // Default Fixed 5 Games
  const [totalSets, setTotalSets] = useState<number>(1);

  // Tab & Peserta
  const [activeTab, setActiveTab] = useState<'participants' | 'bracket' | 'admins'>('participants');
  const [participants, setParticipants] = useState<Participant[]>([
    { teamName: 'Eagle Padel', p1: 'Sanyo', p2: 'Tapia' },
    { teamName: 'Smash Bros', p1: 'Galan', p2: 'Lebron' },
    { teamName: 'Padel Power', p1: 'Coello', p2: 'Paquito' },
    { teamName: 'Viper Club', p1: 'Chingotto', p2: 'Navarro' },
    { teamName: 'Tim 5', p1: 'Kao', p2: 'San' },
    { teamName: 'Tim 6', p1: 'Alex', p2: 'Budi' },
    { teamName: 'Tim 7', p1: 'Stev', p2: 'Joeu' },
    { teamName: 'Tim 8', p1: 'Rudi', p2: 'Deni' },
  ]);

  const [newTeam, setNewTeam] = useState('');
  const [newP1, setNewP1] = useState('');
  const [newP2, setNewP2] = useState('');

  // Admin & Bracket Data
  const [admins, setAdmins] = useState<{ email: string; role: string }[]>([
    { email: 'shndf1re@gmail.com', role: 'Owner' },
  ]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [brackets, setBrackets] = useState<any[]>([]);

  const router = useRouter();

  // Load Semua Turnamen
  const loadTournamentsList = useCallback(async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTournamentsList(data);
  }, []);

  // Load Bracket dari Turnamen Terpilih
  const loadBracketForTournament = useCallback(async (tId: string) => {
    const { data: bData } = await supabase
      .from('brackets')
      .select('*')
      .eq('tournament_id', tId)
      .order('match_index', { ascending: true });

    if (bData) setBrackets(bData);
  }, []);

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
    loadTournamentsList();
  }, [loadTournamentsList]);

  // Buka Kelola Turnamen
  const openTournamentManagement = (t: TournamentItem) => {
    setSelectedTournament(t);
    setScoringMode(t.scoring_mode as any || 'traditional');
    setDeuceRule(t.deuce_rule as any || 'golden');
    setGamesPerSet(t.games_per_set || 5);
    setTotalSets(t.total_sets || 1);
    loadBracketForTournament(t.id);
    setViewMode('manage');
  };

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

  // Buat Turnamen Baru & Generate Bracket
  const handleCreateTournament = async () => {
    if (!customTitle.trim()) return alert('Isi nama turnamen terlebih dahulu!');
    if (participants.length < 2) return alert('Butuh minimal 2 tim untuk membuat bracket!');

    const dynamicSlug = `padel-${Date.now()}`;

    // 1. Simpan Turnamen ke DB
    const { data: newT, error: tErr } = await supabase
      .from('tournaments')
      .insert({
        name: customTitle.trim(),
        title: customTitle.trim(),
        slug: dynamicSlug,
        scoring_mode: scoringMode,
        deuce_rule: deuceRule,
        games_per_set: gamesPerSet,
        total_sets: totalSets,
        status: 'active',
      })
      .select()
      .single();

    if (tErr || !newT) {
      console.error('Error creating tournament:', tErr);
      return alert(`Gagal membuat turnamen: ${tErr?.message}`);
    }

    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    // 2. Buat Slot Final
    const { data: finalSlot } = await supabase
      .from('brackets')
      .insert({ tournament_id: newT.id, round_name: 'FINAL', match_index: 6 })
      .select()
      .single();

    if (!finalSlot) return alert('Gagal membuat slot final');

    // 3. Buat Slot Semifinal
    const { data: semi1 } = await supabase
      .from('brackets')
      .insert({ tournament_id: newT.id, round_name: 'SEMIFINAL', match_index: 4, next_bracket_id: finalSlot.id, next_slot: 1 })
      .select()
      .single();

    const { data: semi2 } = await supabase
      .from('brackets')
      .insert({ tournament_id: newT.id, round_name: 'SEMIFINAL', match_index: 5, next_bracket_id: finalSlot.id, next_slot: 2 })
      .select()
      .single();

    if (!semi1 || !semi2) return alert('Gagal membuat slot semifinal');

    // 4. Buat Match Quarterfinal
    const qfTargets = [
      { nextId: semi1.id, slot: 1 },
      { nextId: semi1.id, slot: 2 },
      { nextId: semi2.id, slot: 1 },
      { nextId: semi2.id, slot: 2 },
    ];

    for (let i = 0; i < 4; i++) {
      const p1 = shuffled[i * 2];
      const p2 = shuffled[i * 2 + 1];

      if (p1 && p2) {
        const { data: mData } = await supabase
          .from('matches')
          .insert({
            team1_name: p1.teamName,
            team1_p1_name: p1.p1,
            team1_p2_name: p1.p2,
            team2_name: p2.teamName,
            team2_p1_name: p2.p1,
            team2_p2_name: p2.p2,
            match_type: 'tournament',
            scoring_mode: scoringMode,
            deuce_rule: deuceRule,
            games_per_set: gamesPerSet,
            total_sets: totalSets,
            status: 'live',
          })
          .select()
          .single();

        if (mData) {
          await supabase.from('match_states').insert({
            match_id: mData.id,
            team1_points: '0',
            team2_points: '0',
            team1_games: [0, 0, 0, 0, 0],
            team2_games: [0, 0, 0, 0, 0],
            current_set: 0,
            current_server: 1,
          });

          await supabase.from('brackets').insert({
            tournament_id: newT.id,
            round_name: 'QUARTERFINAL',
            match_index: i,
            match_id: mData.id,
            team1_name: p1.teamName,
            team1_p1: p1.p1,
            team1_p2: p1.p2,
            team2_name: p2.teamName,
            team2_p1: p2.p1,
            team2_p2: p2.p2,
            next_bracket_id: qfTargets[i].nextId,
            next_slot: qfTargets[i].slot,
          });
        }
      }
    }

    await loadTournamentsList();
    openTournamentManagement(newT);
  };

  const qfBrackets = brackets.filter((b) => b.round_name === 'QUARTERFINAL');
  const sfBrackets = brackets.filter((b) => b.round_name === 'SEMIFINAL');
  const finalBrackets = brackets.filter((b) => b.round_name === 'FINAL');

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Header Turnamen */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">
            SAAS TOURNAMENT MANAGER
          </span>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 mt-1 text-white">
            <Trophy className="w-8 h-8 text-amber-400" />
            {viewMode === 'manage' && selectedTournament ? selectedTournament.title : 'Daftar Turnamen Padel'}
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 p-2 px-4 rounded-2xl border border-white/10 text-xs">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-emerald-400 font-bold block">AKUN AKTIF</span>
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
              <Lock className="w-3.5 h-3.5" /> Login Akun
            </a>
          )}
        </div>
      </div>

      {/* TAMPILAN 1: DAFTAR TURNAMEN SAYA */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-cyan-400" /> Turnamen Tersimpan ({tournamentsList.length})
            </h2>
            <button
              onClick={() => setViewMode('manage')}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Buat Turnamen Baru
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournamentsList.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-3xl border border-white/5 space-y-2">
                <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">Belum ada turnamen. Klik "Buat Turnamen Baru" untuk mulai.</p>
              </div>
            ) : (
              tournamentsList.map((t) => (
                <div
                  key={t.id}
                  onClick={() => openTournamentManagement(t)}
                  className="bg-slate-900/80 hover:bg-slate-900 p-5 rounded-3xl border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer space-y-3 shadow-xl"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-cyan-400 font-extrabold uppercase bg-cyan-500/10 px-2 py-0.5 rounded">
                      {t.games_per_set === 5 ? '5 Games' : t.games_per_set === 4 ? 'Fast4' : '6 Games'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(t.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{t.title || t.name}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1 border-t border-white/5">
                    <span>Format: {t.scoring_mode}</span>
                    <span>•</span>
                    <span>Deuce: {t.deuce_rule}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAMPILAN 2: PANEL KELOLA TURNAMEN */}
      {viewMode === 'manage' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode('list')}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Turnamen
            </button>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/10 text-xs font-bold gap-2">
              <button
                onClick={() => setActiveTab('participants')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'participants' ? 'bg-emerald-500 text-black' : 'text-slate-400'
                }`}
              >
                Pengaturan & Peserta
              </button>
              <button
                onClick={() => setActiveTab('bracket')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'bracket' ? 'bg-cyan-500 text-black' : 'text-slate-400'
                }`}
              >
                Bagan Bracket
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'admins' ? 'bg-amber-500 text-black' : 'text-slate-400'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* TAB 1: PENGATURAN & PESERTA */}
          {activeTab === 'participants' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                {/* Form Nama Turnamen */}
                <div className="glass-panel p-6 rounded-3xl space-y-4 border border-amber-500/30">
                  <h2 className="text-base font-bold flex items-center gap-2 text-amber-400">
                    <Trophy className="w-5 h-5" /> Nama & Aturan Turnamen
                  </h2>
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold text-xs">Nama Turnamen</label>
                    <input
                      type="text"
                      placeholder="Misal: BeeTenis Open 2026"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

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
                          <option value="star">2x AD ➔ Star Point (Poin Penentu)</option>
                          <option value="advantage">Advantage (Bebas Deuce)</option>
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
                          <option value={5}>Fixed 5 Games (5-0 / 4-1 / 3-2)</option>
                          <option value={6}>6 Games (Standard)</option>
                          <option value={4}>4 Games (Fast4)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1 font-semibold">Total Set</label>
                        <select
                          value={totalSets}
                          onChange={(e) => setTotalSets(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-white font-medium"
                        >
                          <option value={1}>1 Set Saja (Pro Set)</option>
                          <option value={3}>Best of 3 Sets</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Pasangan Peserta */}
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <h2 className="text-base font-bold flex items-center gap-2 text-slate-200">
                    <Plus className="w-5 h-5 text-emerald-400" /> Tambah Pasangan Peserta
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
              </div>

              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-200">Daftar Tim Terdaftar</h2>
                    <p className="text-xs text-slate-400">Total {participants.length} tim terdaftar</p>
                  </div>
                  <button
                    onClick={handleCreateTournament}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl transition-all"
                  >
                    <Shuffle className="w-4 h-4" /> Acak & Simpan Bracket ke DB
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {participants.map((p, idx) => (
                    <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-1">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase block tracking-wider">
                        {p.teamName}
                      </span>
                      <p className="text-sm font-bold text-white">
                        {p.p1} & {p.p2}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BAGAN BRACKET */}
          {activeTab === 'bracket' && (
            <div className="glass-panel p-6 rounded-3xl space-y-6 overflow-x-auto">
              <div className="flex justify-between items-center min-w-[700px]">
                <div>
                  <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                    <GitMerge className="w-6 h-6" /> Bagan Eliminasi Gugur
                  </h2>
                  <p className="text-xs text-slate-400">Pemenang match otomatis maju ke babak selanjutnya</p>
                </div>
              </div>

              {brackets.length === 0 ? (
                <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
                  <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Belum ada bracket. Klik **Acak & Simpan Bracket ke DB** pada tab Pengaturan.</p>
                </div>
              ) : (
                <div className="flex gap-8 items-stretch pt-4 pb-6 min-w-[850px]">
                  {/* QUARTERFINAL */}
                  <div className="flex-1 space-y-4">
                    <div className="text-center bg-cyan-500/10 border border-cyan-500/20 py-2 rounded-xl text-xs font-black text-cyan-400 uppercase tracking-widest">
                      QUARTERFINAL
                    </div>
                    <div className="space-y-4">
                      {qfBrackets.map((b, idx) => (
                        <div key={b.id} className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 space-y-3 shadow-xl">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">MATCH #{idx + 1}</span>
                            {b.winner_team > 0 && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded">SELESAI</span>}
                          </div>
                          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-white/5 text-xs font-semibold">
                            <div className={`flex justify-between items-center ${b.winner_team === 1 ? 'text-emerald-400 font-extrabold' : 'text-slate-300'}`}>
                              <span>{b.team1_p1} / {b.team1_p2}</span>
                              {b.winner_team === 1 && <span>🏆</span>}
                            </div>
                            <div className={`border-t border-white/5 pt-1.5 flex justify-between items-center ${b.winner_team === 2 ? 'text-cyan-400 font-extrabold' : 'text-slate-300'}`}>
                              <span>{b.team2_p1} / {b.team2_p2}</span>
                              {b.winner_team === 2 && <span>🏆</span>}
                            </div>
                          </div>
                          {b.match_id && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <a href={`/referee/${b.match_id}`} target="_blank" className="bg-emerald-500/20 text-emerald-300 font-bold py-2 rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1 text-[11px]">
                                <Play className="w-3 h-3 fill-emerald-300" /> Wasit
                              </a>
                              <a href={`/overlay/${b.match_id}`} target="_blank" className="bg-cyan-500/20 text-cyan-300 font-bold py-2 rounded-xl border border-cyan-500/30 text-center flex items-center justify-center gap-1 text-[11px]">
                                <ExternalLink className="w-3 h-3" /> OBS
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEMIFINAL */}
                  <div className="flex-1 space-y-4">
                    <div className="text-center bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl text-xs font-black text-emerald-400 uppercase tracking-widest">
                      SEMIFINAL
                    </div>
                    <div className="flex flex-col justify-around h-[90%] space-y-6">
                      {sfBrackets.map((b, idx) => (
                        <div key={b.id} className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 space-y-3 shadow-xl">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">SEMI #{idx + 1}</span>
                          </div>
                          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-white/5 text-xs font-semibold">
                            <div>{b.team1_p1 ? `${b.team1_p1} / ${b.team1_p2}` : 'Menunggu Pemenang...'}</div>
                            <div className="border-t border-white/5 pt-1.5">{b.team2_p1 ? `${b.team2_p1} / ${b.team2_p2}` : 'Menunggu Pemenang...'}</div>
                          </div>
                          {b.match_id && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <a href={`/referee/${b.match_id}`} target="_blank" className="bg-emerald-500/20 text-emerald-300 font-bold py-2 rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1 text-[11px]">
                                <Play className="w-3 h-3 fill-emerald-300" /> Wasit
                              </a>
                              <a href={`/overlay/${b.match_id}`} target="_blank" className="bg-cyan-500/20 text-cyan-300 font-bold py-2 rounded-xl border border-cyan-500/30 text-center flex items-center justify-center gap-1 text-[11px]">
                                <ExternalLink className="w-3 h-3" /> OBS
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FINAL */}
                  <div className="flex-1 space-y-4">
                    <div className="text-center bg-amber-500/10 border border-amber-500/20 py-2 rounded-xl text-xs font-black text-amber-400 uppercase tracking-widest">
                      FINAL 🏆
                    </div>
                    <div className="flex flex-col justify-center h-[90%]">
                      {finalBrackets.map((b) => (
                        <div key={b.id} className="bg-slate-900/90 p-5 rounded-2xl border-2 border-amber-500/40 space-y-3 shadow-2xl">
                          <div className="text-[11px] font-extrabold text-amber-400">CHAMPIONSHIP MATCH</div>
                          <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-white/5 text-xs font-semibold">
                            <div>{b.team1_p1 ? `${b.team1_p1} / ${b.team1_p2}` : 'Menunggu Semifinalist 1...'}</div>
                            <div className="border-t border-white/5 pt-1.5">{b.team2_p1 ? `${b.team2_p1} / ${b.team2_p2}` : 'Menunggu Semifinalist 2...'}</div>
                          </div>
                          {b.match_id && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <a href={`/referee/${b.match_id}`} target="_blank" className="bg-emerald-500/20 text-emerald-300 font-bold py-2 rounded-xl border border-emerald-500/30 text-center flex items-center justify-center gap-1 text-[11px]">
                                <Play className="w-3 h-3 fill-emerald-300" /> Wasit
                              </a>
                              <a href={`/overlay/${b.match_id}`} target="_blank" className="bg-cyan-500/20 text-cyan-300 font-bold py-2 rounded-xl border border-cyan-500/30 text-center flex items-center justify-center gap-1 text-[11px]">
                                <ExternalLink className="w-3 h-3" /> OBS
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADMIN */}
          {activeTab === 'admins' && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6 max-w-xl mx-auto">
              <div>
                <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" /> Undang Admin & Moderator
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pengelola yang diundang dapat mengakses panel wasit tanpa mengubah pengaturan turnamen.
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
        </div>
      )}
    </main>
  );
}
