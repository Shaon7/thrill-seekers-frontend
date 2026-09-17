"use client";

import { Trophy, ArrowLeft, Sparkles, Clock } from "lucide-react";
import Link from "next/link";

export default function Tournament() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 sm:p-12 shadow-2xl shadow-yellow-500/5 transition-all duration-300">
      {/* Background Animated Glows */}
      <div className="absolute -right-16 -top-16 h-56 w-56 animate-pulse rounded-full bg-yellow-400/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 h-56 w-56 animate-pulse rounded-full bg-yellow-500/10 blur-3xl [animation-delay:1000ms]" />

      <div className="relative flex flex-col items-center text-center">
        {/* Animated Trophy Container */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-3xl bg-yellow-400/20 opacity-75 duration-1000" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-400/20">
            <Trophy size={40} className="animate-bounce" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-yellow-400 uppercase backdrop-blur-md">
          <Clock size={14} className="animate-spin [animation-duration:6s]" />
          <span>Status: Standby</span>
        </div>

        {/* Main Title */}
        <h2 className="text-2xl font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 uppercase sm:text-3xl">
          No Active Tournament
        </h2>

        {/* Subtitles / Details */}
        <div className="mt-3 space-y-1 text-zinc-400">
          <p className="flex items-center justify-center gap-1.5 text-sm font-medium tracking-wider text-yellow-300/80">
            <Sparkles size={14} className="text-yellow-400" />
            Tournament Coming Soon!
          </p>
          <p className="text-xs font-light tracking-widest text-zinc-500">
            Thank you for your patience
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <Link
            href="/home"
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-7 py-3 text-sm font-semibold text-yellow-400 backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-lg hover:shadow-yellow-400/25 active:scale-95"
          >
            <ArrowLeft
              size={18}
              className="transition-transform duration-300 group-hover:-translate-x-1"
            />
            <span>Go Back</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
