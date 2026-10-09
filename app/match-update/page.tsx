
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/app/components/Navbar";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gamepad2,
  Loader2,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";

/* =========================================================
   API
========================================================= */

const API_URL =
  "https://thrill-seekers-backend-production.up.railway.app";

/* =========================================================
   TYPES
========================================================= */

type MatchStatus =
  | "SCHEDULED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

type Player = {
  id: number;
  playerId: string;
  name: string;
  email?: string;
  isAdmin?: boolean;
};

type Division = {
  id: number;
  divisionId: string;
  competitionId: string;
  divisionNumber: number;
  name: string;
  season: number;
  phase: number;
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

  assignedAdminId: string | null;

  round: number;
  deadline: string;
  status: MatchStatus;

  createdAt?: string;
  updatedAt?: string;
};

/* =========================================================
   RESPONSE HELPERS
========================================================= */

function extractArray<T>(
  payload: unknown,
  possibleKeys: string[],
): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (
    payload &&
    typeof payload === "object"
  ) {
    const record =
      payload as Record<
        string,
        unknown
      >;

    for (const key of possibleKeys) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  return [];
}

async function readResponse(
  response: Response,
) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(
  data: any,
  fallback: string,
) {
  if (
    Array.isArray(data?.message)
  ) {
    return data.message.join(", ");
  }

  return (
    data?.message ||
    data?.error ||
    fallback
  );
}

/* =========================================================
   FORMAT DATE
========================================================= */

function formatMatchDate(
  value: string,
) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Date unavailable";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function MatchUpdatePage() {
  const router = useRouter();

  const [authorized, setAuthorized] =
    useState(false);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [divisions, setDivisions] =
    useState<Division[]>([]);

  const [playerNames, setPlayerNames] =
    useState<Record<string, string>>(
      {},
    );

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* =======================================================
     SCORE UPDATE MODAL
  ======================================================= */

  const [editingMatch, setEditingMatch] =
    useState<Match | null>(null);

  const [homeScore, setHomeScore] =
    useState("");

  const [awayScore, setAwayScore] =
    useState("");

  const [updatingMatchId, setUpdatingMatchId] =
    useState<string | null>(null);

  const [modalError, setModalError] =
    useState("");

  /* =======================================================
     LOAD MATCHES + DIVISIONS + PLAYER NAMES
  ======================================================= */

  const loadData = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
        setSuccess("");

        const token =
          localStorage.getItem(
            "access_token",
          );

        if (!token) {
          router.replace("/login");
          return;
        }

        const headers: HeadersInit = {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        };

        const [
          matchesResponse,
          divisionsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/matches`,
            {
              method: "GET",
              headers,
              cache: "no-store",
            },
          ),

          fetch(
            `${API_URL}/divisions`,
            {
              method: "GET",
              headers,
              cache: "no-store",
            },
          ),
        ]);

        /* ===============================================
           MATCHES
        =============================================== */

        const matchesData =
          await readResponse(
            matchesResponse,
          );

        if (!matchesResponse.ok) {
          throw new Error(
            getErrorMessage(
              matchesData,
              "Failed to load matches.",
            ),
          );
        }

        const allMatches =
          extractArray<Match>(
            matchesData,
            [
              "matches",
              "data",
              "items",
            ],
          );

        /*
         * Only completed matches are shown.
         */
        const completedMatches =
          allMatches
            .filter(
              (match) =>
                match.status ===
                "COMPLETED",
            )
            .sort(
              (a, b) =>
                b.id - a.id,
            );

        setMatches(
          completedMatches,
        );

        /* ===============================================
           DIVISIONS
        =============================================== */

        const divisionsData =
          await readResponse(
            divisionsResponse,
          );

        if (!divisionsResponse.ok) {
          throw new Error(
            getErrorMessage(
              divisionsData,
              "Failed to load divisions.",
            ),
          );
        }

        const loadedDivisions =
          extractArray<Division>(
            divisionsData,
            [
              "divisions",
              "data",
              "items",
            ],
          );

        setDivisions(
          loadedDivisions,
        );

        /* ===============================================
           PLAYER LOOKUP
        =============================================== */

        const nameMap: Record<
          string,
          string
        > = {};

        /*
         * The divisions endpoint normally
         * provides the players in each division.
         */
        loadedDivisions.forEach(
          (division) => {
            division.players?.forEach(
              (player) => {
                if (
                  player?.playerId
                ) {
                  nameMap[
                    player.playerId
                  ] =
                    player.name ||
                    "Unknown Player";
                }
              },
            );
          },
        );

        /*
         * Fallback for player IDs that
         * were not found in divisions.
         */
        const matchPlayerIds =
          Array.from(
            new Set(
              completedMatches.flatMap(
                (match) => [
                  match.homePlayerId,
                  match.awayPlayerId,
                ],
              ),
            ),
          );

        const missingPlayerIds =
          matchPlayerIds.filter(
            (playerId) =>
              playerId &&
              !nameMap[playerId],
          );

        const nameResults =
          await Promise.allSettled(
            missingPlayerIds.map(
              async (playerId) => {
                const response =
                  await fetch(
                    `${API_URL}/player/${encodeURIComponent(playerId)}`,
                    {
                      method: "GET",
                      headers,
                      cache: "no-store",
                    },
                  );

                if (!response.ok) {
                  throw new Error(
                    `Could not load ${playerId}`,
                  );
                }

                const player =
                  await response.json();

                return {
                  playerId,
                  name:
                    player?.name ||
                    "Unknown Player",
                };
              },
            ),
          );

        nameResults.forEach(
          (result) => {
            if (
              result.status ===
              "fulfilled"
            ) {
              nameMap[
                result.value.playerId
              ] =
                result.value.name;
            }
          },
        );

        setPlayerNames(nameMap);
      } catch (err) {
        console.error(
          "Match update page error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load completed matches.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router],
  );

  /* =======================================================
     SUPERADMIN ACCESS CHECK
  ======================================================= */

  useEffect(() => {
    const token =
      localStorage.getItem(
        "access_token",
      );

    const userType =
      localStorage
        .getItem("userType")
        ?.toLowerCase() || "";

    if (!token) {
      router.replace("/login");
      return;
    }

    if (
      userType !== "superadmin"
    ) {
      router.replace("/home");
      return;
    }

    setAuthorized(true);

    void loadData();
  }, [loadData, router]);

  /* =======================================================
     DIVISION NAME
  ======================================================= */

  const getDivisionName = (
    competitionId: string,
  ) => {
    const division =
      divisions.find(
        (item) =>
          item.competitionId ===
          competitionId,
      );

    if (!division) {
      return competitionId;
    }

    return (
      division.name ||
      division.divisionId ||
      competitionId
    );
  };

  /* =======================================================
     PLAYER NAME
  ======================================================= */

  const getPlayerName = (
    playerId: string,
  ) => {
    return (
      playerNames[playerId] ||
      playerId ||
      "Unknown Player"
    );
  };

  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredMatches =
    useMemo(() => {
      const query =
        searchTerm
          .trim()
          .toLowerCase();

      if (!query) {
        return matches;
      }

      return matches.filter(
        (match) => {
          const homeName =
            getPlayerName(
              match.homePlayerId,
            ).toLowerCase();

          const awayName =
            getPlayerName(
              match.awayPlayerId,
            ).toLowerCase();

          const values = [
            match.matchId,
            match.homePlayerId,
            match.awayPlayerId,
            homeName,
            awayName,
            match.competitionId,
            getDivisionName(
              match.competitionId,
            ),
            `round ${match.round}`,
          ];

          return values.some(
            (value) =>
              value
                .toLowerCase()
                .includes(query),
          );
        },
      );
    }, [
      matches,
      playerNames,
      divisions,
      searchTerm,
    ]);

  /* =======================================================
     OPEN UPDATE MODAL
  ======================================================= */

  const openUpdateModal = (
    match: Match,
  ) => {
    setEditingMatch(match);

    /*
     * Pre-fill with the current score.
     */
    setHomeScore(
      match.homeScore === null
        ? ""
        : String(match.homeScore),
    );

    setAwayScore(
      match.awayScore === null
        ? ""
        : String(match.awayScore),
    );

    setModalError("");
    setError("");
    setSuccess("");
  };

  /* =======================================================
     CLOSE UPDATE MODAL
  ======================================================= */

  const closeUpdateModal = () => {
    if (updatingMatchId !== null) {
      return;
    }

    setEditingMatch(null);
    setHomeScore("");
    setAwayScore("");
    setModalError("");
  };

  /* =======================================================
     UPDATE COMPLETED MATCH SCORE
  ======================================================= */

  const updateScore = async () => {
    if (!editingMatch) {
      return;
    }

    const home = Number(homeScore);
    const away = Number(awayScore);

    if (
      homeScore.trim() === "" ||
      awayScore.trim() === ""
    ) {
      setModalError(
        "Please enter both scores.",
      );
      return;
    }

    if (
      !Number.isInteger(home) ||
      !Number.isInteger(away) ||
      home < 0 ||
      away < 0
    ) {
      setModalError(
        "Scores must be non-negative whole numbers.",
      );
      return;
    }

    try {
      setUpdatingMatchId(
        editingMatch.matchId,
      );

      setModalError("");
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      if (!token) {
        router.replace("/login");
        return;
      }

      /*
       * Matches the provided NestJS controller:
       *
       * PATCH /matches/:matchId/result
       *
       * Body:
       * {
       *   homeScore: number,
       *   awayScore: number
       * }
       */

      const response =
        await fetch(
          `${API_URL}/matches/${encodeURIComponent(
            editingMatch.matchId,
          )}/result`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              homeScore: home,
              awayScore: away,
            }),
          },
        );

      const data =
        await readResponse(
          response,
        );

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            `Failed to update score. HTTP ${response.status}`,
          ),
        );
      }

      /*
       * Update the UI immediately after
       * the backend confirms success.
       */
      setMatches(
        (current) =>
          current.map(
            (match) =>
              match.matchId ===
              editingMatch.matchId
                ? {
                    ...match,
                    homeScore: home,
                    awayScore: away,
                  }
                : match,
          ),
      );

      setSuccess(
        `The score for ${editingMatch.matchId} was updated successfully.`,
      );

      setEditingMatch(null);
      setHomeScore("");
      setAwayScore("");
    } catch (err) {
      console.error(
        "Update match score error:",
        err,
      );

      setModalError(
        err instanceof Error
          ? err.message
          : "Failed to update match score.",
      );
    } finally {
      setUpdatingMatchId(null);
    }
  };

  /* =======================================================
     LOADING / ACCESS CHECK
  ======================================================= */

  if (!authorized) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <Navbar />

        <div className="flex min-h-[55vh] items-center justify-center px-4">
          <div className="text-center">
            <Loader2
              size={32}
              className="mx-auto animate-spin text-yellow-400"
            />

            <p className="mt-4 text-sm text-zinc-400">
              Checking access...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* BACKGROUND GLOW */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">

            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-yellow-400/5 blur-3xl" />

            <div className="relative">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                    <ShieldCheck
                      size={25}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                      SUPERADMIN
                    </p>

                    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                      Match Result Manager
                    </h1>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadData(true)
                  }
                  disabled={
                    loading ||
                    refreshing
                  }
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  {refreshing ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw
                      size={17}
                    />
                  )}

                  Refresh Matches
                </button>

              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400">
                Find completed matches and correct
                their scores. Search by match ID,
                player name, or THS ID.
              </p>

              {/* SUMMARY */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

                <SummaryCard
                  label="Completed Matches"
                  value={matches.length}
                  icon={
                    <Trophy
                      size={19}
                    />
                  }
                />

                <SummaryCard
                  label="Search Results"
                  value={
                    filteredMatches.length
                  }
                  icon={
                    <Search
                      size={19}
                    />
                  }
                />

                <SummaryCard
                  label="Score Corrections"
                  value="SuperAdmin"
                  icon={
                    <Pencil
                      size={19}
                    />
                  }
                />

              </div>

            </div>
          </div>
        </section>

        {/* =================================================
            SUCCESS
        ================================================= */}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-400/20 bg-green-400/5 px-4 py-4">

            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-green-400"
            />

            <p className="text-sm leading-6 text-green-400">
              {success}
            </p>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-4">

            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <div>
              <p className="text-sm font-semibold text-red-400">
                Unable to load matches
              </p>

              <p className="mt-1 text-sm leading-6 text-red-400/80">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            SEARCH
        ================================================= */}

        <section className="mb-6 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 sm:p-5">

          <label
            htmlFor="match-search"
            className="mb-3 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500"
          >
            Search Completed Matches
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">

            <div className="relative flex-1">

              <Search
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
              />

              <input
                id="match-search"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search MAT-0001, player name, or THS-0001..."
                className="w-full rounded-xl border border-white/10 bg-black/40 py-3.5 pl-12 pr-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}

            </div>

          </div>

          <p className="mt-3 text-xs leading-5 text-zinc-600">
            Search uses the match ID, either player's
            name or THS ID, division name, or round.
          </p>

        </section>

        {/* =================================================
            MATCH LIST
        ================================================= */}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-12 text-center">

            <Loader2
              size={34}
              className="mx-auto animate-spin text-yellow-400"
            />

            <p className="mt-4 text-sm text-zinc-400">
              Loading completed matches...
            </p>

          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10 text-center sm:p-12">

            <Gamepad2
              size={38}
              className="mx-auto text-zinc-600"
            />

            <h2 className="mt-5 text-lg font-semibold text-zinc-300">
              {matches.length === 0
                ? "No Completed Matches"
                : "No Matches Found"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              {matches.length === 0
                ? "Completed matches will appear here when their results have been submitted."
                : "Try searching with a different match ID, player name, or THS ID."}
            </p>

          </div>
        ) : (
          <section className="space-y-4">

            {filteredMatches.map(
              (match) => {
                const homeName =
                  getPlayerName(
                    match.homePlayerId,
                  );

                const awayName =
                  getPlayerName(
                    match.awayPlayerId,
                  );

                const divisionName =
                  getDivisionName(
                    match.competitionId,
                  );

                return (
                  <article
                    key={match.matchId}
                    className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black transition hover:border-yellow-400/20"
                  >

                    {/* MATCH HEADER */}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-5 py-4 sm:px-6">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-xs font-bold text-yellow-400">
                          {match.matchId}
                        </span>

                        <span className="rounded-full border border-green-400/20 bg-green-400/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-400">
                          COMPLETED
                        </span>

                      </div>

                      <span className="text-xs text-zinc-600">
                        Round {match.round}
                      </span>

                    </div>

                    {/* MATCH BODY */}

                    <div className="p-5 sm:p-6">

                      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                        <div>
                          <p className="text-sm font-bold text-white">
                            {divisionName}
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            Competition:{" "}
                            {match.competitionId}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <CalendarDays
                            size={15}
                          />

                          {formatMatchDate(
                            match.deadline,
                          )}
                        </div>

                      </div>

                      {/* SCORE DISPLAY */}

                      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 sm:gap-6 sm:p-6">

                        {/* HOME PLAYER */}

                        <div className="min-w-0 text-left">

                          <p className="break-words text-sm font-bold leading-6 text-white sm:text-base">
                            {homeName}
                          </p>

                          <p className="mt-1 break-all text-xs text-zinc-600">
                            {match.homePlayerId}
                          </p>

                          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-700">
                            HOME
                          </p>

                        </div>

                        {/* SCORE */}

                        <div className="flex items-center gap-2 sm:gap-4">

                          <span className="min-w-8 text-center text-3xl font-black text-white sm:min-w-12 sm:text-4xl">
                            {match.homeScore ?? "—"}
                          </span>

                          <span className="text-sm font-bold text-zinc-700">
                            :
                          </span>

                          <span className="min-w-8 text-center text-3xl font-black text-white sm:min-w-12 sm:text-4xl">
                            {match.awayScore ?? "—"}
                          </span>

                        </div>

                        {/* AWAY PLAYER */}

                        <div className="min-w-0 text-right">

                          <p className="break-words text-sm font-bold leading-6 text-white sm:text-base">
                            {awayName}
                          </p>

                          <p className="mt-1 break-all text-xs text-zinc-600">
                            {match.awayPlayerId}
                          </p>

                          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-700">
                            AWAY
                          </p>

                        </div>

                      </div>

                      {/* UPDATE BUTTON */}

                      <div className="mt-5 flex flex-col gap-3 border-t border-white/5 pt-5 sm:flex-row sm:items-center sm:justify-between">

                        <div className="flex items-center gap-2 text-xs text-zinc-600">
                          <Clock3
                            size={15}
                          />

                          Completed match result
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openUpdateModal(
                              match,
                            )
                          }
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 sm:w-auto"
                        >
                          <Pencil
                            size={17}
                          />

                          Update Score
                        </button>

                      </div>

                    </div>

                  </article>
                );
              },
            )}

          </section>
        )}

      </div>

      {/* ===================================================
          UPDATE SCORE MODAL
      =================================================== */}

      {editingMatch && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeUpdateModal();
            }
          }}
        >

          <div className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                  <Pencil
                    size={20}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-400">
                    SuperAdmin Action
                  </p>

                  <h2 className="mt-1 text-xl font-black text-white">
                    Update Match Score
                  </h2>

                  <p className="mt-1 text-xs text-zinc-500">
                    {editingMatch.matchId}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeUpdateModal
                }
                disabled={
                  updatingMatchId !==
                  null
                }
                aria-label="Close update score dialog"
                className="rounded-xl p-2 text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>

            </div>

            {/* MATCH DETAILS */}

            <div className="p-5 sm:p-6">

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                <p className="text-xs font-semibold text-zinc-500">
                  {getDivisionName(
                    editingMatch.competitionId,
                  )}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-4">

                  <div>
                    <p className="text-sm font-bold text-white">
                      {getPlayerName(
                        editingMatch.homePlayerId,
                      )}
                    </p>

                    <p className="mt-1 break-all text-xs text-zinc-600">
                      {editingMatch.homePlayerId}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {getPlayerName(
                        editingMatch.awayPlayerId,
                      )}
                    </p>

                    <p className="mt-1 break-all text-xs text-zinc-600">
                      {editingMatch.awayPlayerId}
                    </p>
                  </div>

                </div>

              </div>

              {/* SCORE INPUTS */}

              <form
                className="mt-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void updateScore();
                }}
              >

                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3 sm:gap-4">

                  <div>
                    <label
                      htmlFor="home-score"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400"
                    >
                      Home Score
                    </label>

                    <input
                      id="home-score"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      required
                      autoComplete="off"
                      value={homeScore}
                      onChange={(event) =>
                        setHomeScore(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-4 text-center text-3xl font-black text-white outline-none transition focus:border-yellow-400/50 sm:px-4"
                    />
                  </div>

                  <span className="pb-4 text-lg font-bold text-zinc-600">
                    :
                  </span>

                  <div>
                    <label
                      htmlFor="away-score"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400"
                    >
                      Away Score
                    </label>

                    <input
                      id="away-score"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      step="1"
                      required
                      autoComplete="off"
                      value={awayScore}
                      onChange={(event) =>
                        setAwayScore(
                          event.target.value,
                        )
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-4 text-center text-3xl font-black text-white outline-none transition focus:border-yellow-400/50 sm:px-4"
                    />
                  </div>

                </div>

                {modalError && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 p-3">

                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0 text-red-400"
                    />

                    <p className="text-sm leading-5 text-red-400">
                      {modalError}
                    </p>

                  </div>
                )}

                <div className="mt-6 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-3">
                  <p className="text-xs leading-5 text-zinc-400">
                    Please verify the new score
                    carefully before saving. This
                    will send the corrected result
                    to the backend.
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      closeUpdateModal
                    }
                    disabled={
                      updatingMatchId !==
                      null
                    }
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      updatingMatchId !==
                        null ||
                      homeScore.trim() ===
                        "" ||
                      awayScore.trim() ===
                        "" ||
                      !Number.isInteger(
                        Number(homeScore),
                      ) ||
                      !Number.isInteger(
                        Number(awayScore),
                      ) ||
                      Number(homeScore) < 0 ||
                      Number(awayScore) < 0
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updatingMatchId !==
                    null ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Updating Score...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={17}
                        />
                        Save New Score
                      </>
                    )}
                  </button>

                </div>

              </form>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">

      <div className="flex items-center justify-between gap-3">

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
          {label}
        </p>

        <div className="text-yellow-400">
          {icon}
        </div>

      </div>

      <p className="mt-3 text-2xl font-black text-white">
        {value}
      </p>

    </div>
  );
}