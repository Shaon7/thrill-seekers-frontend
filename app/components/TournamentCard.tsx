import { Trophy, ArrowRight, Medal } from "lucide-react";

export default function TournamentCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-400/10 blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <Trophy size={24} />
          </div>

          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-400">
            ACTIVE
          </span>
        </div>

        <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-yellow-400">
          ACTIVE TOURNAMENT
        </p>

        <h3 className="mt-2 text-2xl font-bold">
          Thrill Seekers Cup
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Season 1 • League Format
        </p>

        <div className="mt-7 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xl font-bold">#3</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
              Position
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xl font-bold">18</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
              Points
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xl font-bold">8</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">
              Matches
            </p>
          </div>
        </div>

        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300">
          View Tournament
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}
