'use client';

import { useState } from 'react';
import { Trophy, Award, GitMerge, Users, Plus, UserPlus, Shuffle } from 'lucide-react';

interface Participant {
  teamName: string;
  p1: string;
  p2: string;
}

export default function TournamentDashboard() {
  const [activeTab, setActiveTab] = useState<'standings' | 'participants' | 'bracket' | 'admins'>('participants');
  
  // State Peserta
  const [participants, setParticipants] = useState<Participant[]>([
    { teamName: 'Eagle Padel', p1: 'Sanyo', p2: 'Tapia' },
    { teamName: 'Smash Bros', p1: 'Galan', p2: 'Lebron' },
    { teamName: 'Padel Power', p1: 'Coello', p2: 'Paquito' },
    { teamName: 'Viper Club', p1: 'Chingotto', p2: 'Navarro' },
  ]);

  const [newTeam, setNewTeam] = useState('');
  const [newP1, setNewP1] = useState('');
  const [newP2, setNewP2] = useState('');

  // State Admin / Moderator
  const [admins, setAdmins] = useState<string[]>(['owner@padel.com']);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // State Generated Bracket
  const [bracketMatches, setBracketMatches] = useState<any[]>([]);

  // Tambah Peserta Baru
  const addParticipant = () => {
    if (!newP1.trim() || !newP2.trim()) return alert('Isi 2 nama pemain!');
    setParticipants([...participants, { teamName: newTeam.trim() || `Tim ${participants.length + 1}`, p1: newP1.trim(), p2: newP2.trim() }]);
    setNewTeam('');
    setNewP1('');
    setNewP2('');
  };

  // Undang Admin/Moderator
  const inviteAdmin = () => {
    if (!newAdminEmail.trim()) return;
    setAdmins([...admins, newAdminEmail.trim()]);
    setNewAdminEmail('');
    alert(`Undangan Admin berhasil dikirim ke ${newAdminEmail}`);
  };

  // Pengacak Bracket Otomatis (Random Pairing)
  const generateBracket = () => {
    if (participants.length < 2) return alert('Butuh minimal 2 tim untuk buat bracket!');
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const matches = [];

    for (let i = 0; i < shuffled.length; i += 2) {
      if (shuffled[i + 1]) {
        matches.push({
          team1: `${shuffled[i].p1} / ${shuffled[i].p2}`,
          team2: `${shuffled[i + 1].p1} / ${shuffled[i + 1].p2}`,
          score: 'Belum Dimulai',
        });
      }
    }
    setBracketMatches(matches);
    setActiveTab('bracket');
  };

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Turnamen */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider">PRO TOURNAMENT MANAGER</span>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 mt-1">
            <Trophy className="w-8 h-8 text-amber-400" />
            Padel Championship Hub
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-slate-900 p-1 rounded-xl border border-white/10 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('participants')}
            className={`px-3 py-2 rounded-lg transition-all ${activeTab === 'participants' ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}
          >
            Peserta ({participants.length})
          </button>
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-3 py-2 rounded-lg transition-all ${activeTab === 'bracket' ? 'bg-cyan-500 text-black' : 'text-slate-400'}`}
          >
            Bagan Bracket
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-3 py-2 rounded-lg transition-all ${activeTab === 'admins' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
          >
            Admin & Moderator
          </button>
        </div>
      </div>

      {/* Tab 1: Peserta */}
      {activeTab === 'participants' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
              <Plus className="w-5 h-5 text-emerald-400" /> Tambah Peserta
            </h2>
            <input
              type="text"
              placeholder="Nama Tim (Opsional)"
              value={newTeam}
              onChange={(e) => setNewTeam(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Pemain 1"
                value={newP1}
                onChange={(e) => setNewP1(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Pemain 2"
                value={newP2}
                onChange={(e) => setNewP2(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
            <button
              onClick={addParticipant}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-3 rounded-xl text-xs transition-all"
            >
              Simpan Peserta
            </button>
          </div>

          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200">Daftar Tim Terdaftar</h2>
              <button
                onClick={generateBracket}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Shuffle className="w-4 h-4" /> Acak & Generate Bracket
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {participants.map((p, idx) => (
                <div key={idx} className="bg-slate-900/80 p-3 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase block">{p.teamName}</span>
                  <p className="text-xs font-semibold text-white">{p.p1} & {p.p2}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bracket */}
      {activeTab === 'bracket' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6">
          <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
            <GitMerge className="w-6 h-6" /> Hasil Pengacakan Bracket Knockout
          </h2>

          {bracketMatches.length === 0 ? (
            <p className="text-xs text-slate-400">Belum ada bracket. Buka tab Peserta lalu klik **Acak & Generate Bracket**.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bracketMatches.map((m, idx) => (
                <div key={idx} className="bg-slate-900 p-4 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Match #{idx + 1}</span>
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-emerald-400">{m.team1}</span>
                    <span className="text-xs text-slate-500">VS</span>
                    <span className="text-cyan-400">{m.team2}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Admin & Moderator */}
      {activeTab === 'admins' && (
        <div className="glass-panel p-6 rounded-3xl space-y-6 max-w-xl mx-auto">
          <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Undang Admin / Moderator
          </h2>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="email.admin@padel.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
            />
            <button
              onClick={inviteAdmin}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-4 py-2 rounded-xl text-xs"
            >
              Kirim Akses
            </button>
          </div>
          <ul className="space-y-2">
            {admins.map((adm, idx) => (
              <li key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-white/5 text-xs flex justify-between items-center">
                <span className="text-slate-200">{adm}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold uppercase">
                  {idx === 0 ? 'Owner' : 'Moderator'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
