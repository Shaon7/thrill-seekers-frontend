"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#070b17] text-white overflow-x-hidden selection:bg-blue-500 selection:text-white">

      {/* ================= NAVBAR ================= */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#070b17]/85 backdrop-blur-xl transition-all duration-300">
        <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* LOGO */}
          <div className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 font-black text-sm sm:text-base shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/40">
              TS
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wide transition-colors duration-300 group-hover:text-blue-400">
                THRILL SEEKERS
              </h1>
              <p className="text-[9px] sm:text-[10px] font-semibold tracking-[0.2em] sm:tracking-[0.25em] text-gray-500">
                eFOOTBALL CLUB
              </p>
            </div>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden items-center gap-6 lg:gap-8 md:flex">
            <a href="#" className="text-sm font-semibold text-white transition-all duration-300 hover:text-blue-400 hover:scale-105">
              Home
            </a>
            <a href="#matches" className="text-sm font-semibold text-gray-400 transition-all duration-300 hover:text-white hover:scale-105">
              Matches
            </a>
            <a href="#squad" className="text-sm font-semibold text-gray-400 transition-all duration-300 hover:text-white hover:scale-105">
              Squad
            </a>
            <a href="#ranking" className="text-sm font-semibold text-gray-400 transition-all duration-300 hover:text-white hover:scale-105">
              Rankings
            </a>
            <a href="#statistics" className="text-sm font-semibold text-gray-400 transition-all duration-300 hover:text-white hover:scale-105">
              Statistics
            </a>
          </div>

          {/* LOGIN & MOBILE TOGGLE */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-blue-300 transition-all duration-300 hover:border-blue-400/60 hover:bg-blue-500/20 hover:text-white hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              LOGIN
            </Link>

            {/* HAMBURGER BUTTON */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 md:hidden text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN MENU */}
        {mobileMenuOpen && (
          <div className="border-b border-white/10 bg-[#070b17] px-6 py-4 md:hidden animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col gap-4">
              <a href="#" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-white hover:text-blue-400">Home</a>
              <a href="#matches" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-gray-400 hover:text-white">Matches</a>
              <a href="#squad" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-gray-400 hover:text-white">Squad</a>
              <a href="#ranking" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-gray-400 hover:text-white">Rankings</a>
              <a href="#statistics" onClick={() => setMobileMenuOpen(false)} className="text-sm font-semibold text-gray-400 hover:text-white">Statistics</a>
            </div>
          </div>
        )}
      </nav>

      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden pt-24 sm:pt-32 lg:pt-36">

        {/* BACKGROUND GLOW */}
        <div className="absolute left-1/2 top-12 sm:top-20 -z-10 h-[300px] w-[350px] sm:h-[500px] sm:w-[700px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[100px] sm:blur-[150px] animate-pulse duration-[4000ms]" />

        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:gap-12 px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 lg:grid-cols-2">

          {/* HERO TEXT */}
          <div className="text-center lg:text-left animate-in fade-in slide-in-from-bottom-6 duration-700">

            <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3.5 py-1.5 sm:px-4 sm:py-2 transition-all duration-300 hover:border-blue-400/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-bold tracking-widest text-blue-300">
                eFOOTBALL CLUB
              </span>
            </div>

            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
              WE DON'T
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-300 bg-clip-text text-transparent">
                PLAY SAFE.
              </span>
            </h2>

            <p className="mt-4 sm:mt-6 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-7 sm:leading-8 text-gray-400">
              Welcome to{" "}
              <span className="font-bold text-white">Thrill Seekers</span>. A competitive eFootball club built for players who chase victories, rivalries and unforgettable matches.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4">
              <button className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-black shadow-lg shadow-blue-900/30 transition-all duration-300 hover:scale-105 hover:shadow-blue-600/50 active:scale-95">
                VIEW CLUB
              </button>
              <button className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 sm:py-4 text-xs sm:text-sm font-black transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-105 active:scale-95">
                VIEW MATCHES
              </button>
            </div>

          </div>

          {/* HERO CARD */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="absolute -inset-4 sm:-inset-5 rounded-[32px] sm:rounded-[40px] bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-2xl sm:blur-3xl animate-pulse duration-[3000ms]" />

            <div className="relative overflow-hidden rounded-2xl sm:rounded-[32px] border border-white/10 bg-gradient-to-br from-[#111a36] to-[#090d1c] p-6 sm:p-8 shadow-2xl transition-all duration-500 hover:border-blue-500/30 hover:shadow-blue-500/10">

              {/* CARD TOP */}
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1 text-[10px] sm:text-xs font-bold text-blue-300">
                  MAIN TEAM
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] sm:text-xs font-bold text-gray-300">
                  ELITE
                </span>
              </div>

              {/* CREST */}
                {/* CREST */}
<div className="flex flex-col items-center py-1 sm:py-2">
  <div className="relative  h-44 w-48 sm:h-64 sm:w-64 transition-transform duration-700 hover:scale-105">
    <Image
      src="/club-logo.jpg"
      alt="Thrill Seekers Logo"
      fill
      priority
      className="object-contain drop-shadow-[0_0_35px_rgba(59,130,246,0.4)]"
    />
  </div>
  <h3 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-center">
    Thrill Seekers
  </h3>
  <p className="mt-0.5 text-xs font-bold tracking-[0.3em] text-gray-500">
    TS • 2026
  </p>
</div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Stat value="68" label="Rank" />
                <Stat value="164" label="Matches" />
                <Stat value="44.5%" label="Win Rate" />
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ================= CLUB INTRO ================= */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">

        <div className="mb-8 sm:mb-10 text-center sm:text-left">
          <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-blue-400">
            THE CLUB
          </p>
          <h2 className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-black">
            More than just a team.
          </h2>
          <p className="mt-2 sm:mt-3 max-w-2xl text-sm sm:text-base text-gray-400">
            Every match tells a story. Every victory adds to our legacy.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 grid-cols-1 md:grid-cols-3">
          <Feature
            icon="⚽"
            title="Competitive"
            description="We play every match with one goal — to win."
          />
          <Feature
            icon="🏆"
            title="Ambitious"
            description="From local battles to the biggest competitions."
          />
          <Feature
            icon="🔥"
            title="Fearless"
            description="We never stop attacking. We never stop believing."
          />
        </div>

      </section>

      {/* ================= RANKING OVERVIEW ================= */}
      <section id="ranking" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">

        {/* SECTION HEADER */}
        <div className="mb-8 sm:mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-blue-400">
                ALL-TIME
              </p>
              <span className="h-px w-12 bg-blue-500/40" />
            </div>
            <h2 className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-black">
              Ranking Overview
            </h2>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-400">
              The legacy of Thrill Seekers across all competitions.
            </p>
          </div>

          <div className="self-start sm:self-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs sm:text-sm font-bold text-gray-400 transition-all duration-300 hover:bg-white/10 hover:border-white/20">
            2 TEAMS
          </div>
        </div>

        {/* RANKING CARDS */}
        <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
          <RankingCard
            rank="68"
            team="Main"
            level="ELITE"
            matches="164"
            wins="70"
            draws="6"
            gfga="752 : 905"
            gd="-153"
            winRate="44.5%"
            rating="1,154.90"
            main
          />
          <RankingCard
            rank="78"
            team="Academy"
            level="ELITE"
            matches="22"
            wins="8"
            draws="1"
            gfga="103 : 123"
            gd="-20"
            winRate="38.6%"
            rating="986.94"
          />
        </div>

      </section>

      {/* ================= RECENT MATCHES ================= */}
      <section id="matches" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-20">

        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs sm:text-sm font-bold tracking-[0.3em] text-blue-400">
              MATCH CENTER
            </p>
            <h2 className="mt-2 sm:mt-3 text-3xl sm:text-4xl font-black">
              Recent Matches
            </h2>
          </div>

          <button className="hidden text-xs sm:text-sm font-bold text-gray-400 transition-all duration-300 hover:text-white hover:translate-x-1 sm:block">
            View all →
          </button>
        </div>

        <div className="mt-6 sm:mt-8 space-y-3">
          <Match opponent="Shadow FC" result="W" score="4 - 1" date="Sep 05, 2026" />
          <Match opponent="Elite Warriors" result="W" score="3 - 2" date="Sep 03, 2026" />
          <Match opponent="Dhaka Kings" result="D" score="2 - 2" date="Aug 31, 2026" />
        </div>

        <button className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-center text-xs font-bold text-gray-400 sm:hidden">
          View all matches →
        </button>

      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-white/10 px-4 sm:px-6 py-8 sm:py-10">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
          <p>© 2026 Thrill Seekers</p>
          <p className="font-semibold text-gray-400">I Can't. But We Can.</p>
          <p>eFootball Club</p>
        </div>
      </footer>

    </main>
  );
}

/* ================= COMPONENT SUB-MODULES ================= */

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-white/5 bg-white/5 p-2.5 sm:p-4 text-center transition-all duration-300 hover:scale-105 hover:bg-white/10 hover:border-white/10">
      <p className="text-lg sm:text-2xl font-black">{value}</p>
      <p className="mt-0.5 sm:mt-1 text-[8px] sm:text-[10px] font-bold uppercase text-gray-500">{label}</p>
    </div>
  );
}

function Feature({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/40 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-blue-500/5">
      <div className="mb-4 sm:mb-6 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-500/10 text-xl sm:text-2xl transition-transform duration-500 group-hover:scale-110 group-hover:bg-blue-500/20">
        {icon}
      </div>
      <h3 className="text-lg sm:text-xl font-black transition-colors duration-300 group-hover:text-blue-400">{title}</h3>
      <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-5 sm:leading-6 text-gray-400">{description}</p>
    </div>
  );
}

function RankingCard({
  rank,
  team,
  level,
  matches,
  wins,
  draws,
  gfga,
  gd,
  winRate,
  rating,
  main = false,
}: {
  rank: string;
  team: string;
  level: string;
  matches: string;
  wins: string;
  draws: string;
  gfga: string;
  gd: string;
  winRate: string;
  rating: string;
  main?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-5 sm:p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl ${
        main
          ? "border-blue-500/30 bg-gradient-to-br from-blue-950/50 to-[#0b1020] hover:border-blue-500/50 hover:shadow-blue-950/50"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      {main && (
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl animate-pulse duration-[3000ms]" />
      )}

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-white/5 transition-transform duration-300 hover:scale-105">
            <div className="text-center">
              <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-500">Rank</p>
              <p className="text-lg sm:text-2xl font-black">#{rank}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-xl sm:text-2xl font-black">{team}</h3>
              <span className="rounded-full border border-white/10 bg-white/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[8px] sm:text-[9px] font-black tracking-wider text-gray-300">
                {level}
              </span>
            </div>
            <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-semibold text-gray-500">Thrill Seekers</p>
          </div>
        </div>
      </div>

      <div className="my-4 sm:my-6 h-px bg-white/10" />

      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
        <RankingStat label="PL" value={matches} />
        <RankingStat label="W" value={wins} />
        <RankingStat label="D" value={draws} />
        <RankingStat label="WIN" value={winRate} />
      </div>

      <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        <RankingStat label="GF : GA" value={gfga} />
        <RankingStat label="GD" value={gd} />
      </div>

      <div className="mt-4 sm:mt-5 flex items-center justify-between rounded-xl sm:rounded-2xl border border-white/5 bg-black/20 px-4 sm:px-5 py-3 sm:py-4 transition-all duration-300 hover:border-white/10 hover:bg-black/30">
        <div>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">Club Rating</p>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-black">{rating}</p>
        </div>
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition-transform duration-300 hover:rotate-12 hover:scale-110">
          ★
        </div>
      </div>
    </div>
  );
}

function RankingStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg sm:rounded-xl border border-white/5 bg-white/[0.03] px-3 sm:px-4 py-2 sm:py-3 transition-all duration-300 hover:bg-white/[0.08] hover:border-white/10">
      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-base sm:text-lg font-black">{value}</p>
    </div>
  );
}

function Match({ opponent, result, score, date }: { opponent: string; result: string; score: string; date: string }) {
  return (
    <div className="group flex items-center justify-between rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-5 transition-all duration-300 hover:translate-x-1 hover:border-blue-500/30 hover:bg-white/[0.06]">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-white/5 text-base sm:text-lg font-black transition-transform duration-300 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400">
          {opponent.charAt(0)}
        </div>
        <div>
          <p className="text-xs sm:text-base font-bold transition-colors duration-300 group-hover:text-blue-300">Thrill Seekers</p>
          <p className="text-[10px] sm:text-xs text-gray-500">vs {opponent}</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-base sm:text-xl font-black tracking-wider">{score}</p>
        <p className="text-[9px] sm:text-[10px] font-bold uppercase text-gray-500">{date}</p>
      </div>

      <div
        className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm font-black transition-transform duration-300 group-hover:scale-110 ${
          result === "W"
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : result === "D"
            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        }`}
      >
        {result}
      </div>
    </div>
  );
}
