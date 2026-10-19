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
  FolderKanban,
  ArrowLeft,
  Globe,
  Trash2,
} from 'lucide-react';

// Dictionary Lokal Sederhana
const dictionary = {
  id: {
    dashboardTitle: 'Daftar Turnamen Padel',
    createNew: 'Buat Turnamen Baru',
    savedTournaments: 'Turnamen Tersimpan',
    noTournaments: 'Belum ada turnamen. Klik "Buat Turnamen Baru" untuk mulai.',
    backToList: 'Kembali ke Daftar Turnamen',
    tabSettings: 'Pengaturan & Peserta',
    tabBracket: 'Bagan Bracket',
    tabAdmins: 'Admin',
    tournamentName: 'Nama Turnamen',
    placeholderTournamentName: 'Contoh: BeeTenis Open 2026',
    addParticipant: 'Tambah Pasangan Peserta',
    teamName: 'Nama Tim (Opsional)',
    placeholderTeam: 'Contoh: Eagle Padel',
    player1: 'Pemain 1',
    placeholderP1: 'Contoh: Sanyo',
    player2: 'Pemain 2',
    placeholderP2: 'Contoh: Tapia',
    saveParticipant: 'Simpan Pasangan Peserta',
    generateBracket: 'Acak & Simpan Bracket ke DB',
    registeredTeams: 'Daftar Tim Terdaftar',
  },
  en: {
    dashboardTitle: 'Padel Tournament List',
    createNew: 'Create New Tournament',
    savedTournaments: 'Saved Tournaments',
    noTournaments: 'No tournaments yet. Click "Create New Tournament" to start.',
    backToList: 'Back to Tournament List',
    tabSettings: 'Settings & Players',
    tabBracket: 'Bracket View',
    tabAdmins: 'Admins',
    tournamentName: 'Tournament Name',
    placeholderTournamentName: 'e.g. BeeTenis Open 2026',
    addParticipant: 'Add Player Pair',
    teamName: 'Team Name (Optional)',
    placeholderTeam: 'e.g. Eagle Padel',
    player1: 'Player 1',
    placeholderP1: 'e.g. Sanyo',
    player2: 'Player 2',
    placeholderP2: 'e.g. Tapia',
    saveParticipant: 'Save Pair',
    generateBracket: 'Shuffle & Generate Bracket',
    registeredTeams: 'Registered Teams',
  },
};

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
  const [lang, setLang] = useState<'id' | 'en'>('id'); // Bahasa default
  const t = dictionary[lang]; // Ambil kamus sesuai bahasa aktif

  const [viewMode, setViewMode] = useState<'list' | 'manage'>('list');

  // List Turnamen & Turnamen Terpilih
  const [tournamentsList, setTournamentsList] = useState<TournamentItem[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<TournamentItem | null>(null);

  // Form Buat Turnamen Baru (KOSONG DEFAULT)
  const [customTitle, setCustomTitle] = useState('');
  const [scoringMode, setScoringMode] = useState<'traditional' | 'americano16' | 'americano21'>('traditional');
  const [deuceRule, setDeuceRule] = useState<'golden' | 'advantage' | 'star'>('golden');
  const [gamesPerSet, setGamesPerSet] = useState<number>(5);
  const [totalSets, setTotalSets] = useState<number>(1);

  // Tab & Peserta (KOSONG DEFAULT)
  const [activeTab, setActiveTab] = useState<'participants' | 'bracket' | 'admins'>('participants');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [newTeam, setNewTeam] = useState('');
  const [newP1, setNewP1] = useState('');
  const [newP2, setNewP2] = useState('');

  // Admin & Bracket Data
  const [admins, setAdmins] = useState<{ email: string; role: string }[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [brackets, setBrackets] = useState<any[]>([]);

  const router = useRouter();

  const loadTournamentsList = useCallback(async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setTournamentsList(data);
  }, []);

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
        setAdmins([{ email: data.user.email || '', role: 'Owner' }]);
      }
    };
    checkUser();
    loadTournamentsList();
  }, [loadTournamentsList]);

  const openTournamentManagement = (tournament: TournamentItem) => {
    setSelectedTournament(tournament);
    setCustomTitle(tournament.title || tournament.name);
    setScoringMode((tournament.scoring_mode as any) || 'traditional');
    setDeuceRule((tournament.deuce_rule as any) || 'golden');
    setGamesPerSet(tournament.games_per_set || 5);
    setTotalSets(tournament.total_sets || 1);
    loadBracketForTournament(tournament.id);
    setViewMode('manage');
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

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleCreateTournament = async () => {
    if (!customTitle.trim()) return alert('Isi nama turnamen terlebih dahulu!');
    if (participants.length < 2) return alert('Butuh minimal 2 tim untuk membuat bracket!');

    const dynamicSlug = `padel-${Date.now()}`;

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

    if (tErr || !newT) return alert(`Gagal membuat turnamen: ${tErr?.message}`);

    const shuffled = [...participants].sort(() => Math.random() - 0.5);

    const { data: finalSlot } = await supabase
      .from('brackets')
      .insert({ tournament_id: newT.id, round_name: 'FINAL', match_index: 6 })
      .select()
      .single();

    if (!finalSlot) return alert('Gagal membuat slot final');

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

    const qfTargets = [
      { nextId: semi1?.id, slot: 1 },
      { nextId: semi1?.id, slot: 2 },
      { nextId: semi2?.id, slot: 1 },
      { nextId: semi2?.id, slot: 2 },
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

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto space-y-8 select-none">
      {/* Header Turnamen & Switch Bahasa */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">
            SAAS TOURNAMENT MANAGER
          </span>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 mt-1 text-white">
            <Trophy className="w-8 h-8 text-amber-400" />
            {viewMode === 'manage' && selectedTournament ? selectedTournament.title : t.dashboardTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* SAKLAR BAHASA */}
          <div className="flex items-center bg-slate-900 border border-white/10 p-1 rounded-xl text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
            <button
              onClick={() => setLang('id')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                lang === 'id' ? 'bg-emerald-500 text-black' : 'text-slate-400'
              }`}
            >
              ID
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                lang === 'en' ? 'bg-emerald-500 text-black' : 'text-slate-400'
              }`}
            >
              EN
            </button>
          </div>

          <div className="flex items-center gap-3 bg-slate-900 p-2 px-4 rounded-2xl border border-white/10 text-xs">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-emerald-400 font-bold block">AKUN</span>
                  <span className="text-slate-200 font-medium">{currentUser.email}</span>
                </div>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.push('/login');
                  }}
                  className="p-2 bg-rose-500/20 text-rose-300 rounded-xl hover:bg-rose-500/30"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a href="/login" className="flex items-center gap-2 bg-emerald-500 text-black font-bold px-4 py-2 rounded-xl text-xs">
                <Lock className="w-3.5 h-3.5" /> Login Akun
              </a>
            )}
          </div>
        </div>
      </div>

      {/* TAMPILAN 1: DAFTAR TURNAMEN */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-cyan-400" /> {t.savedTournaments} ({tournamentsList.length})
            </h2>
            <button
              onClick={() => {
                setSelectedTournament(null);
                setCustomTitle('');
                setParticipants([]);
                setViewMode('manage');
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> {t.createNew}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tournamentsList.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-slate-900/50 rounded-3xl border border-white/5 space-y-2">
                <Trophy className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">{t.noTournaments}</p>
              </div>
            ) : (
              tournamentsList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openTournamentManagement(item)}
                  className="bg-slate-900/80 hover:bg-slate-900 p-5 rounded-3xl border border-white/10 hover:border-cyan-500/50 transition-all cursor-pointer space-y-3 shadow-xl"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-cyan-400 font-extrabold uppercase bg-cyan-500/10 px-2 py-0.5 rounded">
                      {item.games_per_set === 5 ? '5 Games' : item.games_per_set === 4 ? 'Fast4' : '6 Games'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{item.title || item.name}</h3>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAMPILAN 2: FORM PENGATURAN & PESERTA */}
      {viewMode === 'manage' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setViewMode('list')}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> {t.backToList}
            </button>

            <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/10 text-xs font-bold gap-2">
              <button
                onClick={() => setActiveTab('participants')}
                className={`px-4 py-2 rounded-xl ${activeTab === 'participants' ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}
              >
                {t.tabSettings}
              </button>
              <button
                onClick={() => setActiveTab('bracket')}
                className={`px-4 py-2 rounded-xl ${activeTab === 'bracket' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}
              >
                {t.tabBracket}
              </button>
            </div>
          </div>

          {activeTab === 'participants' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                {/* Form Nama Turnamen */}
                <div className="glass-panel p-6 rounded-3xl space-y-4 border border-amber-500/30">
                  <h2 className="text-base font-bold flex items-center gap-2 text-amber-400">
                    <Trophy className="w-5 h-5" /> {t.tournamentName}
                  </h2>
                  <input
                    type="text"
                    placeholder={t.placeholderTournamentName}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2 text-xs">
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

                {/* Form Tambah Peserta */}
                <div className="glass-panel p-6 rounded-3xl space-y-4">
                  <h2 className="text-base font-bold flex items-center gap-2 text-slate-200">
                    <Plus className="w-5 h-5 text-emerald-400" /> {t.addParticipant}
                  </h2>
                  <input
                    type="text"
                    placeholder={t.placeholderTeam}
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={t.placeholderP1}
                      value={newP1}
                      onChange={(e) => setNewP1(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder={t.placeholderP2}
                      value={newP2}
                      onChange={(e) => setNewP2(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={addParticipant}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-3.5 rounded-xl text-xs transition-all shadow-lg"
                  >
                    {t.saveParticipant}
                  </button>
                </div>
              </div>

              {/* Daftar Tim Terdaftar */}
              <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-200">{t.registeredTeams}</h2>
                    <p className="text-xs text-slate-400">Total {participants.length} tim terdaftar</p>
                  </div>
                  <button
                    onClick={handleCreateTournament}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl transition-all"
                  >
                    <Shuffle className="w-4 h-4" /> {t.generateBracket}
                  </button>
                </div>

                {participants.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500 border border-dashed border-white/10 rounded-2xl">
                    Belum ada pasangan peserta. Masukkan peserta di form sebelah kiri.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {participants.map((p, idx) => (
                      <div key={idx} className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                        <div className="space-y-1">
                          <span className="text-[10px] text-cyan-400 font-bold uppercase block tracking-wider">
                            {p.teamName}
                          </span>
                          <p className="text-sm font-bold text-white">
                            {p.p1} & {p.p2}
                          </p>
                        </div>
                        <button onClick={() => removeParticipant(idx)} className="text-rose-400 hover:text-rose-300 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
