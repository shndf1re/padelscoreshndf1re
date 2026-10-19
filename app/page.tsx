'use client';

import Link from 'next/link';
import { Activity, Trophy, Tv } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto flex flex-col justify-between">
      {/* Header Bar */}
      <header className="flex justify-between items-center py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black text-xl">
            P
          </div>
          <span className="font-bold text-xl tracking-wide">PADEL<span className="text-emerald-400">SCORE</span></span>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-medium">
          SaaS Edition
        </span>
      </header>

      {/* Hero Section */}
      <section className="my-12 text-center space-y-4">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          Scoring Realtime & Overlay <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Pertandingan Padel
          </span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Sistem SaaS scoring padel modern: Kontrol dari HP, hitung otomatis poin Deuce/Americano, serta tampilan OBS Stream Overlay berkelas broadcast.
        </p>
      </section>

      {/* Menu Mode Utama */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto">
        {/* Card 1: Casual Game */}
        <Link href="/casual" className="group p-6 rounded-2xl glass-panel hover:border-emerald-500/50 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">Casual Game / Quick Play</h2>
          <p className="text-slate-400 text-sm">
            Bebas atur mode Golden Point, Advantage (AD1/AD2), atau Star Point (SP) dengan OBS Overlay transparan.
          </p>
        </Link>

        {/* Card 2: Turnamen & Bracket */}
        <Link href="/tournament" className="group p-6 rounded-2xl glass-panel hover:border-cyan-500/50 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">Tournament & Bracket</h2>
          <p className="text-slate-400 text-sm">
            Klasemen Poin Americano 16/21 dan bagan Knockout Bracket turnamen otomatis.
          </p>
        </Link>
      </div>

      {/* Footer Info */}
      <footer className="py-8 border-t border-white/10 text-center text-slate-500 text-xs">
        PadelScore SaaS Engine &bull; Ready for OBS Browser Source
      </footer>
    </main>
  );
}
