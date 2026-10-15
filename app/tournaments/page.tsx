"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  Clock,
  Medal,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

type Player = {
  playerId?: string;
  player_id?: string;
  name?: string;
};

type PointTableRow = {
  playerId?: string;
  player_id?: string;
  points?: number | string | null;
  goalDifference?: number | string | null;
  goal_difference?: number | string | null;
  goalsFor?: number | string | null;
  goals_for?: number | string | null;
  played?: number | string | null;
  won?: number | string | null;
};

type QualifiedPlayer = {
  playerId: string;
  name: string;
  points: number;
  goalDifference: number;
  goalsFor: number;
  played: number;
  won: number;
};

type LeagueKey = "premier" | "championship";

type QualifiedPlayers = Record<LeagueKey, QualifiedPlayer[]>;

const API_URL =
  "https://thrill-seekers-backend-production.up.railway.app";

const emptyQualifiers: QualifiedPlayers = {
  premier: [],
  championship: [],
};

const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPlayerId = (row: PointTableRow | Player) =>
  String(row.playerId ?? row.player_id ?? "");

function buildTopEight(
  rows: PointTableRow[],
  playersById: Map<string, string>,
): QualifiedPlayer[] {
  return rows
    .map((row) => {
      const playerId = getPlayerId(row);
      return {
        playerId,
        name: playersById.get(playerId) || "Unknown Player",
        points: toNumber(row.points),
        goalDifference: toNumber(
          row.goalDifference ?? row.goal_difference,
        ),
        goalsFor: toNumber(row.goalsFor ?? row.goals_for),
        played: toNumber(row.played),
        won: toNumber(row.won),
      };
    })
    .filter((player) => player.playerId)
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        b.won - a.won ||
        a.playerId.localeCompare(b.playerId),
    )
    .slice(0, 8);
}

const confettiPieces = Array.from({ length: 35 }, (_, index) => ({
  id: index,
  left: `${(index * 41 + 5) % 94 + 3}%`,
  delay: `${-((index * 0.73) % 10)}s`,
  duration: `${7 + (index % 6)}s`,
  color: ["#facc15", "#f59e0b", "#60a5fa", "#c084fc", "#f8fafc", "#34d399"][index % 6],
  width: index % 3 === 0 ? "7px" : index % 3 === 1 ? "5px" : "4px",
  height: index % 4 === 0 ? "12px" : index % 4 === 1 ? "8px" : "5px",
  shape: index % 4 === 2 ? "confetti-circle" : "confetti-paper",
}));

export default function TournamentPage() {
  const [qualifiers, setQualifiers] =
    useState<QualifiedPlayers>(emptyQualifiers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadQualifiers = async () => {
      try {
        setLoading(true);
        setError("");

        const [premierResponse, championshipResponse, playersResponse] =
          await Promise.all([
            fetch(`${API_URL}/point-tables/competition/DIV-0001`, {
              cache: "no-store",
            }),
            fetch(`${API_URL}/point-tables/competition/DIV-0010`, {
              cache: "no-store",
            }),
            fetch(`${API_URL}/player`, { cache: "no-store" }),
          ]);

        if (!premierResponse.ok) {
          throw new Error("Unable to load THS Premier League standings.");
        }
        if (!championshipResponse.ok) {
          throw new Error("Unable to load THS Championship standings.");
        }
        if (!playersResponse.ok) {
          throw new Error("Unable to load player details.");
        }

        const [premierData, championshipData, playersData] =
          await Promise.all([
            premierResponse.json(),
            championshipResponse.json(),
            playersResponse.json(),
          ]);

        if (
          !Array.isArray(premierData) ||
          !Array.isArray(championshipData) ||
          !Array.isArray(playersData)
        ) {
          throw new Error("The server returned an unexpected data format.");
        }

        const playerNames = new Map<string, string>();
        (playersData as Player[]).forEach((player) => {
          const playerId = getPlayerId(player);
          if (playerId) {
            playerNames.set(playerId, player.name || "Unknown Player");
          }
        });

        if (!cancelled) {
          setQualifiers({
            premier: buildTopEight(premierData as PointTableRow[], playerNames),
            championship: buildTopEight(
              championshipData as PointTableRow[],
              playerNames,
            ),
          });
        }
      } catch (loadError) {
        console.error("Tournament qualifiers loading error:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the qualifier list right now.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadQualifiers();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalQualifiers =
    qualifiers.premier.length + qualifiers.championship.length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b17] text-white selection:bg-yellow-400 selection:text-black">
      <Navbar />

      {/* Cyberpunk Grid Texture & Ambient Lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d15_1px,transparent_1px),linear-gradient(to_bottom,#1f293d15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute -top-40 left-1/2 h-[420px] w-[560px] -translate-x-1/2 rounded-full bg-yellow-500/[0.08] blur-[120px]" />
        <div className="absolute left-[-140px] top-[45%] h-72 w-72 rounded-full bg-amber-600/[0.06] blur-[100px]" />
        <div className="absolute right-[-140px] top-[58%] h-80 w-80 rounded-full bg-yellow-300/[0.05] blur-[110px]" />
      </div>

      {/* Container with minimized padding-top (pt-4 sm:pt-6) */}
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-20 sm:pt-6 lg:px-8">
        
        {/* Tournament Hero */}
        <section className="relative mb-10 overflow-hidden rounded-[2.5rem] border border-yellow-500/30 bg-gradient-to-br from-zinc-900 via-[#10111b] to-black px-5 py-12 text-center shadow-2xl shadow-yellow-500/[0.08] sm:mb-12 sm:px-10 sm:py-16">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-yellow-400/[0.08] blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-500/[0.07] blur-3xl" />

          {/* Confetti */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                className={`confetti-piece ${piece.shape}`}
                style={{
                  left: piece.left,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                  backgroundColor: piece.color,
                  width: piece.width,
                  height: piece.height,
                }}
              />
            ))}
          </div>

          <style jsx>{`
            @keyframes confetti-fall {
              0% {
                transform: translate3d(0, -24px, 0) rotate(0deg);
                opacity: 0;
              }
              10% { opacity: 0.72; }
              52% {
                transform: translate3d(22px, 320px, 0) rotate(340deg);
                opacity: 0.64;
              }
              100% {
                transform: translate3d(-18px, 680px, 0) rotate(720deg);
                opacity: 0;
              }
            }
            .confetti-piece {
              position: absolute;
              top: -14px;
              display: block;
              border-radius: 1px;
              opacity: 0;
              animation-name: confetti-fall;
              animation-timing-function: linear;
              animation-iteration-count: infinite;
              will-change: transform, opacity;
            }
            .confetti-paper { border-radius: 1px; }
            .confetti-circle { border-radius: 9999px; }
          `}</style>

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
            <div className="relative mb-7 flex h-32 w-32 items-center justify-center sm:h-40 sm:w-40">
              <div className="absolute inset-0 animate-ping rounded-[2.2rem] bg-yellow-400/10 [animation-duration:2.6s]" />
              <div className="absolute inset-2 rounded-[2rem] border border-yellow-300/30 bg-yellow-400/[0.06] shadow-[0_0_60px_rgba(250,204,21,0.15)]" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.8rem] border border-yellow-200/60 bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-600 text-black shadow-2xl shadow-yellow-400/30 sm:h-32 sm:w-32">
                <Trophy
                  size={64}
                  strokeWidth={1.6}
                  className="animate-bounce drop-shadow-md sm:h-20 sm:w-20"
                />
              </div>
            </div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-yellow-300 backdrop-blur-md">
              <Sparkles size={15} className="text-yellow-400 animate-pulse" />
              The Ultimate eFootball Stage
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.35em] text-zinc-400 sm:text-sm">
              Thrill Seekers Presents
            </p>
            <h1 className="mt-3 bg-gradient-to-r from-yellow-100 via-yellow-400 to-amber-500 bg-clip-text text-3xl font-black uppercase leading-tight tracking-[0.08em] text-transparent sm:text-5xl lg:text-6xl drop-shadow-sm">
              THS Champions League
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Two leagues. Sixteen elite competitors. One ultimate champion. 
              Only the top 8 players from each qualifying division earn their spot.
            </p>

            <div className="mt-8 grid w-full max-w-xl grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 text-center backdrop-blur-sm">
                <Trophy className="mx-auto mb-2 text-yellow-400" size={20} />
                <p className="text-2xl font-black text-yellow-300 sm:text-3xl">16</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Elite Slots
                </p>
              </div>
              <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 text-center backdrop-blur-sm">
                <Users className="mx-auto mb-2 text-yellow-400" size={20} />
                <p className="text-2xl font-black text-yellow-300 sm:text-3xl">2</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Leagues
                </p>
              </div>
              <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 text-center backdrop-blur-sm">
                <Medal className="mx-auto mb-2 text-yellow-400" size={20} />
                <p className="text-2xl font-black text-yellow-300 sm:text-3xl">8 + 8</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Top Qualifiers
                </p>
              </div>
            </div>

            <a
              href="#qualifiers"
              className="mt-9 inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 px-7 py-3.5 text-sm font-black text-black shadow-lg shadow-yellow-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-yellow-400/40 active:translate-y-0"
            >
              <Zap size={18} fill="currentColor" />
              View Qualified Players
            </a>
          </div>
        </section>

        {/* Qualifiers Grid */}
        <section id="qualifiers" className="scroll-mt-28">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-400">
                Live Qualification Standings
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Qualified Players
              </h2>
              <p className="mt-2 text-sm text-zinc-400">
                Real-time leaderboard tracking the top 8 contenders securing their tournament slots.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/[0.06] px-3.5 py-2 text-xs font-bold text-yellow-300 backdrop-blur-sm">
              <Users size={14} className="text-yellow-400" />
              {loading ? "Syncing standings…" : `${totalQualifiers} / 16 qualified spots secured`}
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-300">
              <AlertCircle className="mt-0.5 shrink-0" size={18} />
              <div>
                <p className="font-semibold">Unable to load qualifiers</p>
                <p className="mt-1 text-red-200/70">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 rounded-lg border border-red-300/20 px-3 py-1.5 text-xs font-bold hover:bg-red-300/10"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <QualifierCard
              title="THS Premier League"
              subtitle="Competition ID: DIV-0001"
              players={qualifiers.premier}
              loading={loading}
              theme="blue"
            />
            <QualifierCard
              title="THS Championship"
              subtitle="Competition ID: DIV-0010"
              players={qualifiers.championship}
              loading={loading}
              theme="purple"
            />
          </div>

          {/* Bolder NB Note Box */}
                  {/* Bolder NB Note Box with Animations */}
<div className="group relative mt-6 overflow-hidden rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-5 text-center backdrop-blur-md shadow-lg shadow-yellow-500/[0.08] transition-all duration-300 hover:scale-[1.01] hover:border-yellow-400/70 hover:shadow-yellow-500/20">
  
  {/* Subtle background light sweep / shimmer effect */}
  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

  <p className="relative z-10 text-xs font-semibold text-zinc-200 leading-relaxed sm:text-sm flex items-center justify-center flex-wrap gap-1">
    {/* Pulsing indicator dot */}
    <span className="relative flex h-2 w-2 mr-1">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
    </span>

    <strong className="font-black text-red-400 tracking-wide">N.B.</strong>
    
    <span>This is not the final qualifiers list. It can change dynamically based on point table updates and remaining match results.</span>
  </p>
</div>
        </section>

        {/* Tournament Standby Panel */}
        <section className="relative mt-12 overflow-hidden rounded-[2.5rem] border border-yellow-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black px-5 py-10 text-center shadow-2xl shadow-yellow-500/[0.06] sm:mt-16 sm:px-10 sm:py-14">
          <div className="absolute -right-14 -top-20 h-56 w-56 rounded-full bg-yellow-400/[0.07] blur-3xl" />
          <div className="absolute -bottom-20 -left-14 h-56 w-56 rounded-full bg-amber-500/[0.06] blur-3xl" />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-yellow-400 backdrop-blur-md">
              <Clock size={14} className="animate-pulse" />
              Status: Standby &amp; Preparation
            </div>

            <h2 className="text-2xl font-black uppercase tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 sm:text-4xl">
              Tournament Not Started Yet
            </h2>
            <p className="mt-3 text-sm font-semibold tracking-wide text-yellow-200/90 sm:text-base">
              Sharpen your skills. The main stage is preparing.
            </p>
            <p className="mt-2 text-xs leading-6 tracking-wide text-zinc-400 sm:text-sm">
              Current qualifiers are displayed above. Official tournament schedules, brackets, and fixtures will be unlocked once league matches conclude.
            </p>

            <div className="mt-8">
              <Link
                href="/home"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-6 py-3.5 text-sm font-bold text-yellow-300 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-lg hover:shadow-yellow-400/25 active:translate-y-0"
              >
                <ArrowLeft
                  size={18}
                  className="transition-transform duration-300 group-hover:-translate-x-1"
                />
                Back To  Home
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}

function QualifierCard({
  title,
  subtitle,
  players,
  loading,
  theme,
}: {
  title: string;
  subtitle: string;
  players: QualifiedPlayer[];
  loading: boolean;
  theme: "blue" | "purple";
}) {
  const themeClasses =
    theme === "blue"
      ? {
          border: "border-blue-500/25",
          badge: "border-blue-400/30 bg-blue-400/10 text-blue-300",
          icon: "bg-blue-400/15 text-blue-300 border border-blue-400/20",
          glow: "bg-blue-500/[0.08]",
          rank: "bg-blue-400/10 text-blue-200",
        }
      : {
          border: "border-purple-500/25",
          badge: "border-purple-400/30 bg-purple-400/10 text-purple-300",
          icon: "bg-purple-400/15 text-purple-300 border border-purple-400/20",
          glow: "bg-purple-500/[0.08]",
          rank: "bg-purple-400/10 text-purple-200",
        };

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border ${themeClasses.border} bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-[#090b14] shadow-2xl`}>
      <div className={`pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full ${themeClasses.glow} blur-3xl`} />

      <div className="relative border-b border-white/[0.08] p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${themeClasses.icon}`}>
              <Trophy size={22} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black tracking-tight sm:text-xl">{title}</h3>
              <p className="mt-1 text-xs font-medium text-zinc-400">{subtitle}</p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${themeClasses.badge}`}>
            Top 8 Cutoff
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-400">
          <span>Contender</span>
          <span className="pr-1 text-right">Standings &amp; Stats</span>
        </div>
      </div>

      <div className="relative divide-y divide-white/[0.05] p-3 sm:p-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex animate-pulse items-center gap-3 rounded-2xl px-3 py-3.5">
              <div className="h-9 w-9 rounded-xl bg-white/[0.07]" />
              <div className="flex-1">
                <div className="h-3.5 w-32 rounded bg-white/[0.07]" />
                <div className="mt-2 h-2.5 w-20 rounded bg-white/[0.04]" />
              </div>
              <div className="h-6 w-16 rounded-full bg-white/[0.05]" />
            </div>
          ))
        ) : players.length > 0 ? (
          players.map((player, index) => (
            <div
              key={player.playerId}
              className="group flex items-center gap-3.5 rounded-2xl px-3 py-3.5 transition-all duration-200 hover:bg-white/[0.04] sm:px-4"
            >
              {/* Podium Rank Indicator */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-sm ${
                index === 0
                  ? "border border-yellow-400/40 bg-gradient-to-br from-yellow-300 to-amber-500 text-black shadow-yellow-400/20"
                  : index === 1
                  ? "border border-zinc-300/40 bg-gradient-to-br from-zinc-200 to-zinc-400 text-black shadow-zinc-300/20"
                  : index === 2
                  ? "border border-amber-600/40 bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-amber-600/20"
                  : `border border-white/10 ${themeClasses.rank}`
              }`}>
                {index < 3 ? <Medal size={16} /> : index + 1}
              </div>

              {/* Player Name & ID */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-zinc-100 transition-colors group-hover:text-yellow-300">
                  {player.name}
                </p>
                <p className="mt-0.5 text-[10px] font-medium tracking-wide text-zinc-400">
                  {player.playerId}
                </p>
              </div>

              {/* Live Points, GD & Green Status Dot */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-black text-yellow-300">
                    {player.points} <span className="text-[9px] font-bold text-zinc-400">PTS</span>
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400">
                    GD {player.goalDifference > 0 ? `+${player.goalDifference}` : player.goalDifference}
                  </div>
                </div>

                {/* Small Green Circle Dot */}
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-12 text-center">
            <Users size={28} className="mx-auto text-zinc-600" />
            <p className="mt-3 text-sm font-bold text-zinc-300">No qualifier data available yet</p>
            <p className="mt-1 text-xs text-zinc-500">Standings and top contenders will populate once matches are played.</p>
          </div>
        )}
      </div>

      <div className="relative flex flex-col gap-3 border-t border-white/[0.08] px-6 py-4.5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <p className="text-xs font-medium text-zinc-400">
          <span className="font-bold text-yellow-400">{players.length} of 8</span> qualifying places secured
        </p>
        <Link
          href="/division"
          aria-label={`View ${title} point table`}
          className="group inline-flex w-fit items-center gap-2 rounded-xl border border-yellow-400/25 bg-yellow-400/[0.08] px-4 py-2.5 text-xs font-bold text-yellow-300 transition-all hover:border-yellow-400 hover:bg-yellow-400 hover:text-black hover:shadow-md hover:shadow-yellow-400/20"
        >
          View Full Standings Table
          <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}