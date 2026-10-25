"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Trophy,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Minus,
  XCircle,
} from "lucide-react";

type Player = {
  id?: number;
  playerId: string;
  name: string;
};

type Division = {
  id?: number;
  divisionId: string;
  competitionId: string;
  name: string;
  season?: number;
  phase?: number;
  divisionNumber?: number;
  players?: Player[];
};

type Match = {
  id: number;
  matchId: string;
  competitionId: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number | null;
  awayScore: number | null;
  round?: number | null;
  deadline?: string | null;
  status?: string | null;
};

const API_URL =
  "https://thrill-seekers-backend-production.up.railway.app";

function formatMatchDate(value?: string | null) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizedStatus(match: Match) {
  const status = String(match.status ?? "").trim().toUpperCase();
  if (status) return status.replaceAll("_", " ");
  return match.homeScore !== null && match.homeScore !== undefined &&
    match.awayScore !== null && match.awayScore !== undefined
    ? "COMPLETED"
    : "SCHEDULED";
}

function isCompletedMatch(match: Match) {
  const status = normalizedStatus(match).toUpperCase();

  // Do not treat scheduled 0–0 fixtures as completed results.
  return ["COMPLETED", "COMPLETE", "FINISHED"].includes(status);
}

function getPlayerMatchResult(
  match: Match,
  playerId: string,
): "WIN" | "DRAW" | "LOSS" | "UPCOMING" {
  if (!isCompletedMatch(match)) return "UPCOMING";

  const isHome = match.homePlayerId === playerId;
  const playerScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;

  if (playerScore == null || opponentScore == null) return "UPCOMING";
  if (playerScore > opponentScore) return "WIN";
  if (playerScore < opponentScore) return "LOSS";
  return "DRAW";
}

function readRouteParam(value: unknown): string {
  const resolved = Array.isArray(value) ? value[0] : value;
  if (typeof resolved !== "string") return "";
  try {
    return decodeURIComponent(resolved).trim();
  } catch {
    return resolved.trim();
  }
}

export default function PlayerDivisionMatchesPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  // useParams() should provide these values. The pathname fallback also
  // handles cases where the route params are unavailable during hydration.
  const pathSegments = (pathname || "").split("/").filter(Boolean);
  const divisionSegmentIndex = pathSegments.findIndex(
    (segment) => segment.toLowerCase() === "division"
  );
  const playersSegmentIndex = pathSegments.findIndex(
    (segment) => segment.toLowerCase() === "players"
  );

  const divisionId =
    readRouteParam((params as Record<string, unknown>)?.divisionId) ||
    readRouteParam(pathSegments[divisionSegmentIndex + 1]);
  const playerId =
    readRouteParam((params as Record<string, unknown>)?.playerId) ||
    readRouteParam(pathSegments[playersSegmentIndex + 1]);

  const [division, setDivision] = useState<Division | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Start by showing completed match results only.
  const [statusFilter, setStatusFilter] = useState("COMPLETED");
  const [resultFilter, setResultFilter] = useState("ALL");

  useEffect(() => {
    // Do not leave the page in an endless loading state if the route is incorrect.
    if (!divisionId || !playerId || divisionId === "undefined" || playerId === "undefined") {
      setError("The division or player ID is missing from this page URL. Please open this page by clicking a player name in the division point table.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        // This route uses the same division endpoint and authorization pattern
        // as the existing Division Matches page.
        const divisionResponse = await fetch(
          `${API_URL}/divisions/${encodeURIComponent(divisionId)}`,
          { method: "GET", headers, cache: "no-store" }
        );
        const divisionPayload: any = await divisionResponse.json().catch(() => ({}));

        if (!divisionResponse.ok) {
          throw new Error(
            typeof divisionPayload?.message === "string"
              ? divisionPayload.message
              : `Unable to load division (HTTP ${divisionResponse.status}).`
          );
        }

        // Accept both TypeORM camelCase fields and database-style snake_case,
        // so the UI does not render undefined if a response serializer changes.
        const divisionRaw = divisionPayload?.division ?? divisionPayload?.data ?? divisionPayload;
        const resolvedDivisionId = String(
          divisionRaw?.divisionId ?? divisionRaw?.division_id ?? divisionId
        );
        const competitionId = String(
          divisionRaw?.competitionId ??
          divisionRaw?.competition_id ??
          divisionRaw?.divisionId ??
          divisionRaw?.division_id ??
          divisionId
        );
        const rosterRaw = Array.isArray(divisionRaw?.players) ? divisionRaw.players : [];
        const roster: Player[] = rosterRaw.map((raw: any) => ({
          id: Number(raw?.id ?? 0),
          playerId: String(raw?.playerId ?? raw?.player_id ?? ""),
          name: String(raw?.name ?? raw?.playerName ?? raw?.player_name ?? ""),
        })).filter((player: Player) => Boolean(player.playerId));

        const normalizedDivision: Division = {
          id: Number(divisionRaw?.id ?? 0),
          divisionId: resolvedDivisionId,
          competitionId,
          name: String(divisionRaw?.name ?? divisionRaw?.divisionName ?? divisionRaw?.division_name ?? resolvedDivisionId),
          season: divisionRaw?.season == null ? undefined : Number(divisionRaw.season),
          phase: divisionRaw?.phase == null ? undefined : Number(divisionRaw.phase),
          divisionNumber: divisionRaw?.divisionNumber == null && divisionRaw?.division_number == null
            ? undefined
            : Number(divisionRaw?.divisionNumber ?? divisionRaw?.division_number),
          players: roster,
        };

        if (cancelled) return;
        setDivision(normalizedDivision);

        // Load all player names as well, because a former roster member may
        // still have scheduled/completed fixtures after leaving the division.
        let allPlayers: any[] = roster;
        try {
          const playersResponse = await fetch(`${API_URL}/player`, {
            method: "GET",
            headers,
            cache: "no-store",
          });
          if (playersResponse.ok) {
            const playersPayload = await playersResponse.json().catch(() => []);
            if (Array.isArray(playersPayload)) allPlayers = [...roster, ...playersPayload];
          }
        } catch (playerLoadError) {
          console.warn("Could not load the full player directory; using division roster names.", playerLoadError);
        }

        const nameMap: Record<string, string> = {};
        for (const raw of allPlayers) {
          const id = String(raw?.playerId ?? raw?.player_id ?? "");
          const name = String(raw?.name ?? raw?.playerName ?? raw?.player_name ?? "");
          if (id && name && !nameMap[id]) nameMap[id] = name;
        }
        if (cancelled) return;
        setPlayerNames(nameMap);
        setPlayerName(nameMap[playerId] || playerId);

        const matchesResponse = await fetch(
          `${API_URL}/matches/competition/${encodeURIComponent(competitionId)}`,
          { method: "GET", headers, cache: "no-store" }
        );
        const matchesPayload: any = await matchesResponse.json().catch(() => ({}));

        if (!matchesResponse.ok) {
          throw new Error(
            typeof matchesPayload?.message === "string"
              ? matchesPayload.message
              : `Unable to load division matches (HTTP ${matchesResponse.status}).`
          );
        }

        const rawMatches: any[] = Array.isArray(matchesPayload)
          ? matchesPayload
          : Array.isArray(matchesPayload?.matches)
            ? matchesPayload.matches
            : Array.isArray(matchesPayload?.data)
              ? matchesPayload.data
              : [];

        const allMatches: Match[] = rawMatches.map((raw: any, index: number) => {
          const homeScoreValue = raw?.homeScore ?? raw?.home_score;
          const awayScoreValue = raw?.awayScore ?? raw?.away_score;
          const roundValue = raw?.round ?? raw?.roundNumber ?? raw?.round_number;
          return {
            id: Number(raw?.id ?? index + 1),
            matchId: String(raw?.matchId ?? raw?.match_id ?? `MATCH-${index + 1}`),
            competitionId: String(raw?.competitionId ?? raw?.competition_id ?? competitionId),
            homePlayerId: String(raw?.homePlayerId ?? raw?.home_player_id ?? ""),
            awayPlayerId: String(raw?.awayPlayerId ?? raw?.away_player_id ?? ""),
            homeScore: homeScoreValue === null || homeScoreValue === undefined ? null : Number(homeScoreValue),
            awayScore: awayScoreValue === null || awayScoreValue === undefined ? null : Number(awayScoreValue),
            round: roundValue === null || roundValue === undefined ? null : Number(roundValue),
            deadline: raw?.deadline ?? raw?.matchDate ?? raw?.match_date ?? raw?.date ?? null,
            status: raw?.status ?? raw?.matchStatus ?? raw?.match_status ?? null,
          };
        }).filter((match) => Boolean(match.homePlayerId) && Boolean(match.awayPlayerId));

        const playerMatches = allMatches
          .filter((match) => match.homePlayerId === playerId || match.awayPlayerId === playerId)
          .sort((a, b) => {
            const roundA = a.round ?? Number.MAX_SAFE_INTEGER;
            const roundB = b.round ?? Number.MAX_SAFE_INTEGER;
            if (roundA !== roundB) return roundA - roundB;
            const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
            const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
            return dateA - dateB;
          });

        if (!cancelled) setMatches(playerMatches);
      } catch (loadError) {
        console.error("Player division matches error:", loadError);
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Something went wrong while loading matches."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [divisionId, playerId]);

  const completedMatches = useMemo(
    () => matches.filter(isCompletedMatch),
    [matches]
  );

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const status = normalizedStatus(match).toUpperCase();
      const completed = isCompletedMatch(match);

      if (statusFilter === "COMPLETED" && !completed) return false;
      if (statusFilter !== "ALL" && statusFilter !== "COMPLETED" && status !== statusFilter) {
        return false;
      }

      if (resultFilter !== "ALL" && getPlayerMatchResult(match, playerId) !== resultFilter) {
        return false;
      }

      return true;
    });
  }, [matches, playerId, statusFilter, resultFilter]);

  const record = useMemo(() => {
    return completedMatches.reduce(
      (total, match) => {
        const isHome = match.homePlayerId === playerId;
        const playerScore = isHome ? match.homeScore! : match.awayScore!;
        const opponentScore = isHome ? match.awayScore! : match.homeScore!;

        total.goalsFor += playerScore;
        total.goalsAgainst += opponentScore;

        if (playerScore > opponentScore) total.won += 1;
        else if (playerScore < opponentScore) total.lost += 1;
        else total.drawn += 1;

        return total;
      },
      { won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 }
    );
  }, [completedMatches, playerId]);

  const getOpponentName = (opponentId: string) => {
    return (
      playerNames[opponentId] ||
      division?.players?.find((player) => player.playerId === opponentId)?.name ||
      opponentId ||
      "Unknown Player"
    );
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080808] text-white">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full bg-yellow-400/[0.06] blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute -right-16 top-[45%] h-52 w-52 rounded-full bg-amber-500/[0.035] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:border-yellow-400/30 hover:text-yellow-300 sm:mb-6 sm:px-4 sm:text-sm"
        >
          <ArrowLeft size={15} />
          Back to Point Table
        </button>

        {/* Player header */}
        <section className="relative mb-5 overflow-hidden rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-4 shadow-2xl shadow-yellow-500/[0.04] sm:mb-7 sm:rounded-3xl sm:p-7 lg:p-8">
          <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-yellow-400/[0.07] blur-3xl sm:h-64 sm:w-64" />
          <div className="relative flex items-start gap-3 sm:items-center sm:gap-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-yellow-400/25 bg-yellow-400/10 text-yellow-300 sm:h-16 sm:w-16 sm:rounded-2xl">
              <Trophy size={24} className="sm:hidden" />
              <Trophy size={31} className="hidden sm:block" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-yellow-400 sm:text-xs sm:tracking-[0.28em]">
                Player Match History
              </p>
              <h1 className="mt-1 break-words text-xl font-black leading-tight tracking-tight text-white sm:mt-2 sm:text-3xl lg:text-4xl">
                {loading ? "Loading player..." : playerName || playerId}
              </h1>
              <p className="mt-1 text-[10px] font-medium text-zinc-500 sm:mt-2 sm:text-sm">
                {playerId}
                {division?.name ? <span> <span className="px-1.5 text-zinc-700">•</span> {division.name}</span> : null}
              </p>
              {division && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] text-zinc-400 sm:mt-3 sm:gap-2 sm:text-xs">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 sm:px-3">
                    Season {division.season ?? "—"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 sm:px-3">
                    Phase {division.phase ?? "—"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 sm:px-3">
                    {division.divisionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Summary stats */}
        {!loading && !error && (
          <section className="mb-5 grid grid-cols-2 gap-2 sm:mb-7 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[10px]">Matches</p>
              <p className="mt-1 text-xl font-black text-white sm:text-2xl">{completedMatches.length}</p>
              <p className="mt-0.5 text-[9px] text-zinc-600 sm:text-[10px]">All fixtures</p>
            </div>
            <div className="rounded-xl border border-green-400/15 bg-green-400/[0.04] p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[10px]">Wins</p>
              <p className="mt-1 text-xl font-black text-green-400 sm:text-2xl">{record.won}</p>
              <p className="mt-0.5 text-[9px] text-zinc-600 sm:text-[10px]">Completed matches</p>
            </div>
            <div className="rounded-xl border border-yellow-400/15 bg-yellow-400/[0.04] p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[10px]">Draws / Losses</p>
              <p className="mt-1 text-xl font-black text-yellow-300 sm:text-2xl">{record.drawn} <span className="text-zinc-600">/</span> {record.lost}</p>
              <p className="mt-0.5 text-[9px] text-zinc-600 sm:text-[10px]">Completed matches</p>
            </div>
            <div className="rounded-xl border border-blue-400/15 bg-blue-400/[0.04] p-3 sm:rounded-2xl sm:p-4">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 sm:text-[10px]">Goals For / Against</p>
              <p className="mt-1 text-xl font-black text-blue-300 sm:text-2xl">{record.goalsFor}<span className="px-1 text-zinc-600">:</span>{record.goalsAgainst}</p>
              <p className="mt-0.5 text-[9px] text-zinc-600 sm:text-[10px]">Completed matches</p>
            </div>
          </section>
        )}

        {/* Match history */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-xl sm:rounded-3xl">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-yellow-400">
                <CalendarDays size={16} />
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.25em]">Division fixtures</p>
              </div>
              <h2 className="mt-1 text-base font-bold sm:mt-2 sm:text-xl">Match History</h2>
              <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
                Completed results are shown first. Use the filters to view other fixtures.
              </p>
            </div>
            {!loading && !error && (
              <span className="shrink-0 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-bold text-yellow-300 sm:px-3 sm:text-xs">
                {filteredMatches.length} {filteredMatches.length === 1 ? "match" : "matches"}
              </span>
            )}
          </div>

          {/* Filters */}
          {!loading && !error && (
            <div className="grid grid-cols-1 gap-3 border-b border-white/10 bg-black/20 p-3 sm:grid-cols-2 sm:p-5">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px]">
                  Match Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-xs text-white outline-none transition focus:border-yellow-400/40 sm:text-sm"
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="ALL">All statuses</option>
                </select>
              </label>

              <label className="block min-w-0">
                <span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500 sm:text-[10px]">
                  Match Result
                </span>
                <select
                  value={resultFilter}
                  onChange={(event) => setResultFilter(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-xs text-white outline-none transition focus:border-yellow-400/40 sm:text-sm"
                >
                  <option value="ALL">All results</option>
                  <option value="WIN">Wins</option>
                  <option value="DRAW">Draws</option>
                  <option value="LOSS">Losses</option>
                </select>
              </label>
            </div>
          )}

          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6">
              <Loader2 size={28} className="animate-spin text-yellow-400" />
              <p className="text-xs text-zinc-500 sm:text-sm">Loading player matches...</p>
            </div>
          ) : error ? (
            <div className="m-4 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 sm:m-6 sm:rounded-2xl sm:p-5">
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-300">Unable to load matches</p>
                <p className="mt-1 text-xs leading-5 text-red-200/70">{error}</p>
              </div>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="p-8 text-center sm:p-12">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.05] text-yellow-400 sm:h-16 sm:w-16">
                <CalendarDays size={25} />
              </div>
              <h3 className="mt-4 text-sm font-bold sm:text-lg">
                {statusFilter === "COMPLETED" && resultFilter === "ALL" ? "No Completed Results Yet" : "No Matches Match These Filters"}
              </h3>
              <p className="mx-auto mt-1 max-w-sm text-[11px] leading-5 text-zinc-500 sm:text-sm">
                {statusFilter === "COMPLETED" && resultFilter === "ALL"
                  ? "Completed scores will appear here once match results are recorded."
                  : "Try changing the match status or result filter."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredMatches.map((match, index) => {
                const isHome = match.homePlayerId === playerId;
                const opponentId = isHome ? match.awayPlayerId : match.homePlayerId;
                const opponentName = getOpponentName(opponentId);
                const completed = isCompletedMatch(match);
                const status = normalizedStatus(match);
                const statusUpper = status.toUpperCase();
                const myScore = isHome ? match.homeScore : match.awayScore;
                const opponentScore = isHome ? match.awayScore : match.homeScore;
                let resultLabel = "UPCOMING";
                let resultClass = "border-blue-400/20 bg-blue-400/10 text-blue-300";

                if (completed) {
                  if (myScore! > opponentScore!) {
                    resultLabel = "WIN";
                    resultClass = "border-green-400/20 bg-green-400/10 text-green-300";
                  } else if (myScore! < opponentScore!) {
                    resultLabel = "LOSS";
                    resultClass = "border-red-400/20 bg-red-400/10 text-red-300";
                  } else {
                    resultLabel = "DRAW";
                    resultClass = "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
                  }
                } else if (statusUpper.includes("CANCEL")) {
                  // A cancelled fixture is not an upcoming match.
                  resultLabel = "CANCELLED";
                  resultClass = "border-red-400/20 bg-red-400/10 text-red-300";
                } else if (statusUpper.includes("RESCHEDULE")) {
                  resultLabel = "RESCHEDULED";
                  resultClass = "border-orange-400/20 bg-orange-400/10 text-orange-300";
                } else if (statusUpper.includes("SCHEDULE")) {
                  resultLabel = "UPCOMING";
                  resultClass = "border-blue-400/20 bg-blue-400/10 text-blue-300";
                } else {
                  // Display any other non-completed backend status accurately.
                  resultLabel = statusUpper || "UPCOMING";
                  resultClass = "border-white/10 bg-white/5 text-zinc-300";
                }

                return (
                  <article
                    key={match.matchId || match.id || `${match.round}-${index}`}
                    className="p-3 transition-colors hover:bg-white/[0.015] sm:p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-300 sm:rounded-lg sm:px-2.5 sm:text-[10px]">
                          {match.round ? `Round ${match.round}` : `Match ${index + 1}`}
                        </span>
                        <span className="truncate text-[9px] text-zinc-600 sm:text-[10px]">
                          {match.matchId || `Match #${match.id}`}
                        </span>
                      </div>
                      <span className={`rounded-full border px-2 py-1 text-[8px] font-bold uppercase tracking-wider sm:px-2.5 sm:text-[9px] ${resultClass}`}>
                        {resultLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                      <div className={`min-w-0 rounded-xl border p-2.5 sm:rounded-2xl sm:p-4 ${isHome ? "border-yellow-400/25 bg-yellow-400/[0.06]" : "border-white/[0.06] bg-black/20"}`}>
                        <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-zinc-600 sm:mb-2 sm:text-[9px]">Home</p>
                        <p className={`break-words text-[10px] font-bold leading-4 sm:text-sm sm:leading-5 ${isHome ? "text-yellow-300" : "text-zinc-200"}`}>
                          {getOpponentName(match.homePlayerId)}
                        </p>
                        <p className="mt-1 truncate text-[8px] text-zinc-600 sm:text-[10px]">{match.homePlayerId}</p>
                      </div>

                      <div className="min-w-[54px] text-center sm:min-w-[84px]">
                        <p className="text-lg font-black tabular-nums text-white sm:text-2xl">
                          {completed ? `${match.homeScore} - ${match.awayScore}` : "VS"}
                        </p>
                        <p className="mt-1 text-[8px] text-zinc-600 sm:text-[10px]">
                          {completed ? "Full time" : "Fixture"}
                        </p>
                      </div>

                      <div className={`min-w-0 rounded-xl border p-2.5 text-right sm:rounded-2xl sm:p-4 ${!isHome ? "border-yellow-400/25 bg-yellow-400/[0.06]" : "border-white/[0.06] bg-black/20"}`}>
                        <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-zinc-600 sm:mb-2 sm:text-[9px]">Away</p>
                        <p className={`break-words text-[10px] font-bold leading-4 sm:text-sm sm:leading-5 ${!isHome ? "text-yellow-300" : "text-zinc-200"}`}>
                          {getOpponentName(match.awayPlayerId)}
                        </p>
                        <p className="mt-1 truncate text-[8px] text-zinc-600 sm:text-[10px]">{match.awayPlayerId}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-zinc-500 sm:mt-4 sm:gap-x-4 sm:text-[10px]">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={11} className="text-zinc-600" />
                        {formatMatchDate(match.deadline)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        {completed ? (
                          <CheckCircle2 size={11} className="text-green-400" />
                        ) : statusUpper.includes("CANCEL") ? (
                          <XCircle size={11} className="text-red-300" />
                        ) : statusUpper.includes("RESCHEDULE") ? (
                          <Minus size={11} className="text-orange-300" />
                        ) : (
                          <CircleDashed size={11} className="text-blue-300" />
                        )}
                        {status}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && filteredMatches.length > 0 && (
            <div className="border-t border-white/10 bg-black/20 px-4 py-3 sm:px-6 sm:py-4">
              <p className="text-center text-[9px] text-zinc-600 sm:text-xs">
                Showing {filteredMatches.length} of {matches.length} matches in this division.
              </p>
            </div>
          )}
        </section>

        <div className="mt-4 flex justify-center sm:mt-6">
          <button
            type="button"
            onClick={() => router.push("/division")}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[11px] font-semibold text-zinc-400 transition hover:border-yellow-400/20 hover:text-yellow-300 sm:text-sm"
          >
            <Users size={14} />
            All Divisions
          </button>
        </div>
      </div>
    </main>
  );
}
