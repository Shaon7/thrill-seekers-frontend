"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Info,
  Loader2,
  RefreshCw,
  Trophy,
  Users,
} from "lucide-react";

const API_URL =
  "https://thrill-seekers-backend-production.up.railway.app";
const PREMIER_LEAGUE_ID = "DIV-0001";

const removedPlayerIds = [
  "THS-0035",
  "THS-0027",
  "THS-0009",
  "THS-0018",
];

const previousPlayerId = "THS-0055";
const replacementPlayerId = "THS-0028";

type Player = {
  playerId: string;
  name?: string | null;
};

type PointTableRow = {
  id: number | string;
  competitionId: string;
  playerId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

function getArray<T = any>(value: any): T[] {
  if (Array.isArray(value)) return value as T[];
  if (Array.isArray(value?.data)) return value.data as T[];
  if (Array.isArray(value?.items)) return value.items as T[];
  if (Array.isArray(value?.players)) return value.players as T[];
  if (Array.isArray(value?.rows)) return value.rows as T[];
  return [];
}

function readValue(source: any, ...keys: string[]) {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }
  return undefined;
}

function toNumber(value: unknown): number {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function normalizePointRow(row: any, index: number): PointTableRow {
  const playerId = String(readValue(row, "playerId", "player_id") ?? "");
  const goalsFor = toNumber(readValue(row, "goalsFor", "goals_for"));
  const goalsAgainst = toNumber(readValue(row, "goalsAgainst", "goals_against"));
  return {
    id: readValue(row, "id") ?? `${playerId}-${index}`,
    competitionId: String(readValue(row, "competitionId", "competition_id") ?? PREMIER_LEAGUE_ID),
    playerId,
    played: toNumber(readValue(row, "played", "matchesPlayed", "matches_played")),
    won: toNumber(readValue(row, "won", "wins")),
    drawn: toNumber(readValue(row, "drawn", "draws")),
    lost: toNumber(readValue(row, "lost", "losses")),
    goalsFor,
    goalsAgainst,
    goalDifference: toNumber(
      readValue(row, "goalDifference", "goal_difference") ?? goalsFor - goalsAgainst,
    ),
    points: toNumber(readValue(row, "points", "pts")),
  };
}

export default function AnnouncementsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [pointTable, setPointTable] = useState<PointTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const playerNames = useMemo(() => {
    const map = new Map<string, string>();
    players.forEach((player) => {
      if (player?.playerId) {
        map.set(player.playerId, player.name?.trim() || player.playerId);
      }
    });
    return map;
  }, [players]);

  const getPlayerName = (playerId: string) =>
    playerNames.get(playerId) || playerId;

  const fetchAnnouncementData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setTableError("");

      const token = typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const [playersResult, tableResult] = await Promise.allSettled([
        fetch(`${API_URL}/player`, { headers, cache: "no-store" }),
        fetch(`${API_URL}/point-tables/competition/${PREMIER_LEAGUE_ID}`, {
          headers,
          cache: "no-store",
        }),
      ]);

      if (playersResult.status === "fulfilled" && playersResult.value.ok) {
        const data = await playersResult.value.json().catch(() => []);
        setPlayers(
          getArray<any>(data)
            .map((player) => ({
              playerId: String(readValue(player, "playerId", "player_id") ?? ""),
              name: readValue(player, "name", "playerName", "player_name") ?? null,
            }))
            .filter((player) => player.playerId),
        );
      }

      if (tableResult.status !== "fulfilled") {
        throw new Error("Could not connect to the Premier League point table.");
      }
      if (!tableResult.value.ok) {
        throw new Error(`Failed to load the point table (${tableResult.value.status}).`);
      }

      const tableData = await tableResult.value.json().catch(() => []);
      const normalized = getArray<any>(tableData)
        .map(normalizePointRow)
        .filter((row) => row.playerId);

      // Preserve a consistent league ranking order: points, GD, GF, wins.
      normalized.sort((a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        b.won - a.won ||
        a.playerId.localeCompare(b.playerId),
      );
      setPointTable(normalized);
    } catch (error) {
      console.error("Announcement page data error:", error);
      setTableError(
        error instanceof Error
          ? error.message
          : "Unable to load the THS Premier League point table.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchAnnouncementData();
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#080808] text-white">
      <Navbar />

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-24 h-80 w-80 -translate-x-1/2 rounded-full bg-yellow-400/[0.045] blur-3xl" />
        <div className="absolute right-[-9rem] top-[42%] h-72 w-72 rounded-full bg-amber-500/[0.035] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* TITLE */}
        <header className="mb-5 overflow-hidden rounded-3xl border border-yellow-400/15 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-2xl shadow-yellow-400/[0.035] sm:mb-7">
          <div className="h-1 w-full bg-gradient-to-r from-amber-700 via-yellow-300 to-amber-700" />
          <div className="relative p-5 sm:p-8 md:p-10">
            <div className="absolute right-6 top-7 hidden h-20 w-20 items-center justify-center rounded-3xl border border-yellow-400/15 bg-yellow-400/[0.035] sm:flex">
              <BellRing size={34} className="text-yellow-400/75" strokeWidth={1.4} />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400 sm:text-xs">
              <BellRing size={14} /> Official Announcement
            </div>

            <h1 className="max-w-3xl text-2xl font-black tracking-tight sm:text-4xl md:text-5xl">
              THS Premier League <span className="text-yellow-400">Update</span>
            </h1>
            <p className="mt-3 max-w-2xl text-xs leading-6 text-zinc-400 sm:text-sm sm:leading-7">
              Important information about recent roster changes, match validity, and arrangements for the replacement player.
              Please read the announcement carefully before checking the updated point table below.
            </p>
          </div>
        </header>

        {/* REMOVED PLAYERS */}
        <section className="mb-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:mb-6 sm:rounded-3xl sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/[0.08] sm:h-12 sm:w-12 sm:rounded-2xl">
              <Users size={21} className="text-red-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-300 sm:text-xs">
                Roster Changes
              </p>
              <h2 className="mt-1 text-lg font-black sm:text-xl">Players Removed from THS Premier League</h2>
              <p className="mt-2 text-xs leading-6 text-zinc-400 sm:text-sm sm:leading-7">
                The following four players have been removed from the THS Premier League roster:
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {removedPlayerIds.map((playerId, index) => (
                  <div
                    key={playerId}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-red-400/10 bg-black/25 p-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-400/[0.08] text-[10px] font-bold text-red-300">
                      0{index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-zinc-100 sm:text-sm">
                        {getPlayerName(playerId)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-zinc-500 sm:text-xs">
                        {playerId}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 rounded-full border border-red-400/20 bg-red-400/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-red-300 sm:text-[10px]">
                      Removed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-400/15 bg-red-400/[0.045] p-3 sm:p-4">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" />
            <p className="text-xs leading-6 text-zinc-300 sm:text-sm sm:leading-7">
              <strong className="text-red-200">Match update:</strong> All matches involving the four removed players listed above have been voided. Those fixtures should no longer be treated as valid THS Premier League results.
            </p>
          </div>
        </section>

        {/* REPLACEMENT */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/[0.055] via-zinc-950 to-zinc-900/80 sm:mb-6 sm:rounded-3xl">
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/[0.08] sm:h-12 sm:w-12 sm:rounded-2xl">
                <ArrowRight size={22} className="text-yellow-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400 sm:text-xs">
                  Replacement Announcement
                </p>
                <h2 className="mt-1 text-lg font-black sm:text-xl">Player Replacement</h2>
                <p className="mt-2 text-xs leading-6 text-zinc-400 sm:text-sm sm:leading-7">
                  THS-0028 has replaced THS-0055 in the THS Premier League. THS-0028 will take over this roster position and complete all previous matches associated with it, according to the league's updated arrangements.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-white/[0.08] bg-black/30 p-3 sm:gap-4 sm:p-5">
              <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.025] p-3 sm:p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[10px]">Previous Player</p>
                <p className="mt-2 truncate font-mono text-xs font-bold text-zinc-300 sm:text-base">THS-0055</p>
                <p className="mt-1 text-[10px] text-zinc-600 sm:text-xs">Replaced</p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-400/[0.08] sm:h-11 sm:w-11">
                <ArrowRight size={19} className="text-yellow-400" />
              </div>

              <div className="min-w-0 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.055] p-3 sm:p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-400/80 sm:text-[10px]">Replacement Player</p>
                <p className="mt-2 truncate font-mono text-xs font-black text-yellow-400 sm:text-base">THS-0028</p>
                <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">Will complete the matches</p>
              </div>
            </div>
          </div>
        </section>

        {/* HOW TO VIEW MATCH HISTORY */}
        <section className="mb-5 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:mb-6 sm:rounded-3xl sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/[0.07] sm:h-12 sm:w-12 sm:rounded-2xl">
              <Info size={21} className="text-sky-300" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black sm:text-lg">How to View Player Match History</h2>
              <p className="mt-2 text-xs leading-6 text-zinc-400 sm:text-sm sm:leading-7">
                To review a player's match history, please log in to the Thrill Seekers website and follow these steps:
              </p>

              <ol className="mt-4 space-y-2">
                {[
                  "Log in to your Thrill Seekers account.",
                  "Open the Divisions page from the navigation bar.",
                  "Find the THS Premier League point table.",
                  "Click the player's name to open their match history for that division.",
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-yellow-400/[0.09] text-[10px] font-black text-yellow-400">
                      {index + 1}
                    </span>
                    <span className="text-xs leading-5 text-zinc-300 sm:text-sm sm:leading-6">{step}</span>
                  </li>
                ))}
              </ol>

              <Link
                href="/division"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.07] px-4 py-2.5 text-xs font-bold text-yellow-400 transition hover:bg-yellow-400/[0.13] sm:text-sm"
              >
                Go to Divisions
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* APOLOGY BEFORE POINT TABLE */}
        <section className="mb-5 rounded-2xl border border-yellow-400/15 bg-gradient-to-br from-yellow-400/[0.055] to-transparent p-5 text-center sm:mb-6 sm:rounded-3xl sm:p-7">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-yellow-400/20 bg-yellow-400/[0.08]">
            <CheckCircle2 size={22} className="text-yellow-400" />
          </div>
          <h2 className="mt-3 text-lg font-black sm:text-xl">Sorry for the inconvenience.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-xs leading-6 text-zinc-400 sm:text-sm sm:leading-7">
            We apologize for any confusion caused by these roster and fixture changes. Thank you for your patience, understanding, and continued support of Thrill Seekers.
          </p>
        </section>

        {/* POINT TABLE */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-xl sm:rounded-3xl">
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400 sm:text-xs">
                Official League Standings
              </p>
              <h2 className="text-lg font-black sm:text-xl">THS Premier League Point Table</h2>
              <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                Competition ID: {PREMIER_LEAGUE_ID}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void fetchAnnouncementData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-yellow-400/20 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh Table
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-14">
              <Loader2 size={27} className="animate-spin text-yellow-400" />
              <p className="mt-3 text-xs text-zinc-500 sm:text-sm">Loading Premier League point table...</p>
            </div>
          ) : tableError ? (
            <div className="m-4 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 sm:m-6 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-300" />
                <div>
                  <p className="text-sm font-bold text-red-200">Unable to load point table</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-400 sm:text-sm">{tableError}</p>
                  <button
                    type="button"
                    onClick={() => void fetchAnnouncementData(true)}
                    className="mt-3 rounded-lg bg-red-400/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-400/15"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          ) : pointTable.length === 0 ? (
            <div className="px-4 py-14 text-center sm:px-6">
              <Trophy size={28} className="mx-auto text-zinc-600" />
              <p className="mt-3 text-sm font-semibold text-zinc-300">No point table data available</p>
              <p className="mt-1 text-xs text-zinc-500">The standings endpoint did not return any player rows.</p>
            </div>
          ) : (
            <>
              {/* Desktop / tablet table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/30">
                      {[
                        "POS",
                        "PLAYER",
                        "MP",
                        "W",
                        "D",
                        "L",
                        "GF",
                        "GA",
                        "GD",
                        "PTS",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className={`px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 ${heading === "PLAYER" ? "text-left" : "text-center"}`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pointTable.map((row, index) => {
                      const playerName = getPlayerName(row.playerId);
                      const isRemoved = removedPlayerIds.includes(row.playerId);
                      const isReplacedPlayer = row.playerId === previousPlayerId;
                      return (
                        <tr
                          key={`${row.competitionId}-${row.playerId}-${row.id}`}
                          className={`border-b border-white/[0.055] transition last:border-0 hover:bg-white/[0.025] ${isRemoved || isReplacedPlayer ? "opacity-60" : ""}`}
                        >
                          <td className="px-4 py-3.5 text-center">
                            <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-black ${index === 0 ? "bg-yellow-400/10 text-yellow-400" : "bg-white/[0.04] text-zinc-400"}`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-xs font-bold text-zinc-400">
                                {playerName.charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="max-w-[240px] truncate text-xs font-bold text-zinc-100">{playerName}</p>
                                <p className="mt-0.5 font-mono text-[10px] text-zinc-600">{row.playerId}</p>
                              </div>
                              {isRemoved && (
                                <span className="rounded-full border border-red-400/15 bg-red-400/[0.06] px-2 py-0.5 text-[9px] font-bold uppercase text-red-300">Removed</span>
                              )}
                              {isReplacedPlayer && (
                                <span className="rounded-full border border-zinc-400/15 bg-zinc-400/[0.05] px-2 py-0.5 text-[9px] font-bold uppercase text-zinc-400">Replaced</span>
                              )}
                            </div>
                          </td>
                          {[row.played, row.won, row.drawn, row.lost, row.goalsFor, row.goalsAgainst].map((value, statIndex) => (
                            <td key={`${row.playerId}-stat-${statIndex}`} className="px-4 py-3.5 text-center text-xs text-zinc-300">{value}</td>
                          ))}
                          <td className="px-4 py-3.5 text-center text-xs font-semibold text-zinc-300">
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm font-black text-yellow-400">{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phone cards */}
              <div className="space-y-2 p-3 sm:hidden">
                {pointTable.map((row, index) => {
                  const playerName = getPlayerName(row.playerId);
                  const isRemoved = removedPlayerIds.includes(row.playerId);
                  const isReplacedPlayer = row.playerId === previousPlayerId;
                  return (
                    <div
                      key={`${row.competitionId}-${row.playerId}-${row.id}`}
                      className={`rounded-xl border border-white/[0.08] bg-black/20 p-3 ${isRemoved || isReplacedPlayer ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${index === 0 ? "bg-yellow-400/10 text-yellow-400" : "bg-white/[0.04] text-zinc-400"}`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate text-xs font-bold text-white">{playerName}</p>
                            {isRemoved && <span className="rounded-full bg-red-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-red-300">Removed</span>}
                            {isReplacedPlayer && <span className="rounded-full bg-zinc-400/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-zinc-400">Replaced</span>}
                          </div>
                          <p className="mt-0.5 font-mono text-[9px] text-zinc-600">{row.playerId}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">PTS</p>
                          <p className="text-base font-black text-yellow-400">{row.points}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-1.5 border-t border-white/[0.06] pt-2.5">
                        {[
                          ["MP", row.played],
                          ["W", row.won],
                          ["D", row.drawn],
                          ["L", row.lost],
                          ["GF", row.goalsFor],
                          ["GA", row.goalsAgainst],
                          ["GD", row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference],
                          ["PTS", row.points],
                        ].map(([label, value]) => (
                          <div key={`${row.playerId}-${label}`} className="rounded-md bg-white/[0.025] px-2 py-1.5 text-center">
                            <p className="text-[8px] font-bold uppercase tracking-wider text-zinc-600">{label}</p>
                            <p className={`mt-0.5 text-[10px] font-bold ${label === "PTS" ? "text-yellow-400" : "text-zinc-300"}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="border-t border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4">
            <p className="text-[10px] leading-5 text-zinc-600 sm:text-xs">
              Standings are loaded from the current THS Premier League point-table data. Removed or replaced player rows are marked where they remain in the returned data.
            </p>
          </div>
        </section>

        <footer className="py-6 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-700 sm:py-8 sm:text-xs">
          Thrill Seekers · eFootball Club
        </footer>
      </div>
    </main>
  );
}
