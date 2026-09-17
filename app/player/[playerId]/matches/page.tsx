"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import {
  CalendarDays,
  Clock3,
  Gamepad2,
  Trophy,
  ChevronRight,
  Loader2,
  Shield,
} from "lucide-react";

/* ================================================== */
/* PLAYER */
/* ================================================== */

interface Player {
  id: number;
  playerId: string;
  name: string;
  email?: string;
  deviceName?: string;
  konamiId?: string;
  isAdmin?: boolean;
}

/* ================================================== */
/* MATCH */
/* ================================================== */

interface Match {
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
  status:
    | "SCHEDULED"
    | "RESCHEDULED"
    | "COMPLETED"
    | "CANCELLED";
}

/* ================================================== */
/* DIVISION */
/* ================================================== */

interface Division {
  id: number;
  competitionId: string;
  players?: Player[];
}

/* ================================================== */
/* PAGE */
/* ================================================== */

export default function MatchesPage() {
  const router = useRouter();

  const [player, setPlayer] =
    useState<Player | null>(null);

  /*
   * Matches belonging to the logged-in player.
   */
  const [matches, setMatches] =
    useState<Match[]>([]);

  /*
   * ALL matches from backend.
   * Required for admin assigned matches.
   */
  const [allMatches, setAllMatches] =
    useState<Match[]>([]);

  const [playersById, setPlayersById] =
    useState<Record<string, Player>>({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState<
      "UPCOMING" | "COMPLETED" | "ASSIGNED"
    >("UPCOMING");

  /* ==================================================
     LOAD DATA
  ================================================== */

  useEffect(() => {
    const loadMatches = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * ================================================
         * LOAD LOGGED-IN PLAYER
         * ================================================
         */

        const storedPlayer =
          localStorage.getItem("player");

        if (!storedPlayer) {
          setError(
            "Player information was not found. Please login again."
          );

          setLoading(false);
          return;
        }

        const loggedInPlayer: Player =
          JSON.parse(storedPlayer);

        if (!loggedInPlayer?.playerId) {
          setError(
            "Player ID was not found. Please login again."
          );

          setLoading(false);
          return;
        }

        setPlayer(loggedInPlayer);

        /*
         * ================================================
         * TOKEN
         * ================================================
         */

        const token =
          localStorage.getItem(
            "access_token"
          );

        const headers: HeadersInit = {
          "Content-Type":
            "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        };

        /*
         * ================================================
         * LOAD MATCHES + DIVISIONS
         * ================================================
         */

        const [
          matchesResponse,
          divisionsResponse,
        ] = await Promise.all([
          fetch(
            "https://thrill-seekers-backend-production.up.railway.app/matches",
            {
              method: "GET",
              headers,
              cache: "no-store",
            }
          ),

          fetch(
            "https://thrill-seekers-backend-production.up.railway.app/divisions",
            {
              method: "GET",
              headers,
              cache: "no-store",
            }
          ),
        ]);

        if (!matchesResponse.ok) {
          throw new Error(
            "Failed to load matches."
          );
        }

        /*
         * ================================================
         * MATCH DATA
         * ================================================
         */

        const matchesData =
          await matchesResponse.json();

        let fetchedMatches: Match[] = [];

        if (
          Array.isArray(matchesData)
        ) {
          fetchedMatches =
            matchesData;
        } else if (
          Array.isArray(
            matchesData?.data
          )
        ) {
          fetchedMatches =
            matchesData.data;
        }

        /*
         * Save ALL backend matches.
         *
         * This is important because an admin can be
         * assigned to a match where the admin is NOT
         * one of the two players.
         */

        setAllMatches(
          fetchedMatches
        );

        /*
         * ================================================
         * BUILD PLAYER LOOKUP
         * ================================================
         */

        const playerLookup: Record<
          string,
          Player
        > = {};

        if (
          divisionsResponse.ok
        ) {
          const divisionsData =
            await divisionsResponse.json();

          let divisions: Division[] = [];

          if (
            Array.isArray(
              divisionsData
            )
          ) {
            divisions =
              divisionsData;
          } else if (
            Array.isArray(
              divisionsData?.data
            )
          ) {
            divisions =
              divisionsData.data;
          }

          divisions.forEach(
            (division) => {
              division.players?.forEach(
                (divisionPlayer) => {
                  /*
                   * Player ID lookup
                   */
                  if (
                    divisionPlayer?.playerId
                  ) {
                    playerLookup[
                      divisionPlayer.playerId
                    ] =
                      divisionPlayer;
                  }

                  /*
                   * Numeric database ID lookup
                   */
                  if (
                    divisionPlayer?.id !==
                    undefined
                  ) {
                    playerLookup[
                      String(
                        divisionPlayer.id
                      )
                    ] =
                      divisionPlayer;
                  }
                }
              );
            }
          );
        }

        /*
         * Make sure logged-in player is available.
         */

        playerLookup[
          loggedInPlayer.playerId
        ] = loggedInPlayer;

        playerLookup[
          String(
            loggedInPlayer.id
          )
        ] = loggedInPlayer;

        setPlayersById(
          playerLookup
        );

        /*
         * ================================================
         * PLAYER'S OWN MATCHES
         * ================================================
         *
         * ALL competitions.
         * ALL divisions.
         * Only matches where the logged-in player
         * is home or away.
         */

        const playerMatches =
          fetchedMatches.filter(
            (match) =>
              match.homePlayerId ===
                loggedInPlayer.playerId ||
              match.awayPlayerId ===
                loggedInPlayer.playerId
          );

        setMatches(
          playerMatches
        );

      } catch (error) {
        console.error(
          "Matches loading error:",
          error
        );

        if (
          error instanceof
          TypeError
        ) {
          setError(
            "Unable to connect to the backend. Make sure the NestJS server is running."
          );
        } else if (
          error instanceof Error
        ) {
          setError(
            error.message
          );
        } else {
          setError(
            "Failed to load matches."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, []);

  /* ==================================================
     FILTER + SORT
  ================================================== */

  const displayedMatches =
    useMemo(() => {
      if (!player) {
        return [];
      }

      /*
       * ================================================
       * UPCOMING
       * ================================================
       *
       * Only the logged-in player's matches.
       * Earliest match first.
       */

      if (
        activeTab ===
        "UPCOMING"
      ) {
        return [...matches]
          .filter(
            (match) =>
              match.status ===
                "SCHEDULED" ||
              match.status ===
                "RESCHEDULED"
          )
          .sort(
            (a, b) =>
              new Date(
                a.deadline
              ).getTime() -
              new Date(
                b.deadline
              ).getTime()
          );
      }

      /*
       * ================================================
       * COMPLETED
       * ================================================
       *
       * Only the logged-in player's matches.
       * Most recently completed first.
       */

      if (
        activeTab ===
        "COMPLETED"
      ) {
        return [...matches]
          .filter(
            (match) =>
              match.status ===
              "COMPLETED"
          )
          .sort(
            (a, b) =>
              new Date(
                b.deadline
              ).getTime() -
              new Date(
                a.deadline
              ).getTime()
          );
      }

      /*
       * ================================================
       * ASSIGNED TO ME
       * ================================================
       *
       * IMPORTANT:
       * Use ALL matches here, NOT player's matches.
       *
       * An admin can be assigned to a match between
       * two completely different players.
       */

      return [...allMatches]
        .filter(
          (match) =>
            match.assignedAdminId ===
              player.playerId ||
            match.assignedAdminId ===
              String(player.id)
        )
        .sort(
          (a, b) => {
            /*
             * Upcoming assigned matches first.
             */

            const aUpcoming =
              a.status ===
                "SCHEDULED" ||
              a.status ===
                "RESCHEDULED";

            const bUpcoming =
              b.status ===
                "SCHEDULED" ||
              b.status ===
                "RESCHEDULED";

            if (
              aUpcoming &&
              !bUpcoming
            ) {
              return -1;
            }

            if (
              !aUpcoming &&
              bUpcoming
            ) {
              return 1;
            }

            /*
             * Both upcoming:
             * earliest first.
             */

            if (
              aUpcoming &&
              bUpcoming
            ) {
              return (
                new Date(
                  a.deadline
                ).getTime() -
                new Date(
                  b.deadline
                ).getTime()
              );
            }

            /*
             * Both completed/other:
             * newest first.
             */

            return (
              new Date(
                b.deadline
              ).getTime() -
              new Date(
                a.deadline
              ).getTime()
            );
          }
        );
    }, [
      matches,
      allMatches,
      activeTab,
      player,
    ]);

  /* ==================================================
     COUNTS
  ================================================== */

  const upcomingCount =
    matches.filter(
      (match) =>
        match.status ===
          "SCHEDULED" ||
        match.status ===
          "RESCHEDULED"
    ).length;

  const completedCount =
    matches.filter(
      (match) =>
        match.status ===
        "COMPLETED"
    ).length;

  /*
   * Assigned count MUST use all matches.
   */

  const assignedCount =
    player?.isAdmin
      ? allMatches.filter(
          (match) =>
            match.assignedAdminId ===
              player.playerId ||
            match.assignedAdminId ===
              String(player.id)
        ).length
      : 0;

  /* ==================================================
     DATE
  ================================================== */

  const formatDate = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown date";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* ==================================================
     TIME
  ================================================== */

  const formatTime = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown time";
    }

    return date.toLocaleTimeString(
      undefined,
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  /* ==================================================
     LOADING
  ================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">

        <Navbar />

        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">

          <div className="flex flex-col items-center gap-3">

            <Loader2
              size={34}
              className="animate-spin text-yellow-400"
            />

            <p className="text-sm text-zinc-400">
              Loading your matches...
            </p>

          </div>
        </div>
      </main>
    );
  }

  /* ==================================================
     ERROR
  ================================================== */

  if (error) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">

        <Navbar />

        <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">

          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">

            <h2 className="font-semibold text-red-400">
              Unable to load matches
            </h2>

            <p className="mt-2 text-sm text-red-400/80">
              {error}
            </p>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section className="mb-8">

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">

            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <Gamepad2
                    size={23}
                  />
                </div>

                <div>

                  <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                    PLAYER MATCHES
                  </p>

                  <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                    My Matches
                  </h1>

                </div>
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">
                All matches played and scheduled
                for{" "}
                <span className="font-semibold text-white">
                  {player?.name}
                </span>
                .
              </p>

            </div>
          </div>

        </section>

        {/* ==================================================
            TABS
        ================================================== */}

        <section className="mb-6">

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-2 sm:flex-row">

            {/* ==================================================
                UPCOMING
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "UPCOMING"
                )
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                activeTab ===
                "UPCOMING"
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Clock3
                size={17}
              />

              Upcoming

              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab ===
                  "UPCOMING"
                    ? "bg-black/10 text-black"
                    : "bg-white/5 text-zinc-500"
                }`}
              >
                {upcomingCount}
              </span>
            </button>

            {/* ==================================================
                COMPLETED
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "COMPLETED"
                )
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                activeTab ===
                "COMPLETED"
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Trophy
                size={17}
              />

              Completed

              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab ===
                  "COMPLETED"
                    ? "bg-black/10 text-black"
                    : "bg-white/5 text-zinc-500"
                }`}
              >
                {completedCount}
              </span>
            </button>

            {/* ==================================================
                ASSIGNED TO ME
                ONLY FOR ADMIN
            ================================================== */}

            {player?.isAdmin && (
              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    "ASSIGNED"
                  )
                }
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                  activeTab ===
                  "ASSIGNED"
                    ? "bg-yellow-400 text-black"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Shield
                  size={17}
                />

                Assigned to Me

                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeTab ===
                    "ASSIGNED"
                      ? "bg-black/10 text-black"
                      : "bg-white/5 text-zinc-500"
                  }`}
                >
                  {assignedCount}
                </span>
              </button>
            )}

          </div>

        </section>

        {/* ==================================================
            MATCHES
        ================================================== */}

        {displayedMatches.length ===
        0 ? (

          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-10 text-center">

            <Gamepad2
              size={38}
              className="mx-auto text-zinc-600"
            />

            <h2 className="mt-4 text-lg font-semibold text-zinc-300">

              {activeTab ===
              "UPCOMING"
                ? "No upcoming matches"
                : activeTab ===
                  "COMPLETED"
                ? "No completed matches"
                : "No matches assigned to you"}

            </h2>

            <p className="mt-2 text-sm text-zinc-600">

              {activeTab ===
              "UPCOMING"
                ? "You currently have no scheduled matches."
                : activeTab ===
                  "COMPLETED"
                ? "You have not completed any matches yet."
                : "You currently have no matches assigned to you."}

            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {displayedMatches.map(
              (match) => (
                <MatchCard
                  key={match.matchId}
                  match={match}
                  playerId={
                    player?.playerId ||
                    ""
                  }
                  playersById={
                    playersById
                  }
                  formatDate={
                    formatDate
                  }
                  formatTime={
                    formatTime
                  }
                  isAssignedTab={
                    activeTab ===
                    "ASSIGNED"
                  }
                  onSubmitResult={() =>
                    router.push(
                      `/matches/${match.matchId}/result`
                    )
                  }
                />
              )
            )}

          </div>
        )}

      </div>
    </main>
  );
}

/* ================================================== */
/* MATCH CARD */
/* ================================================== */

function MatchCard({
  match,
  playerId,
  playersById,
  formatDate,
  formatTime,
  isAssignedTab,
  onSubmitResult,
}: {
  match: Match;
  playerId: string;
  playersById: Record<
    string,
    Player
  >;
  formatDate: (
    value: string
  ) => string;
  formatTime: (
    value: string
  ) => string;
  isAssignedTab: boolean;
  onSubmitResult: () => void;
}) {
  const homePlayer =
    playersById[
      match.homePlayerId
    ];

  const awayPlayer =
    playersById[
      match.awayPlayerId
    ];

  /*
   * ================================================
   * MATCH ADMIN
   * ================================================
   */

  const matchAdmin =
    match.assignedAdminId
      ? playersById[
          match.assignedAdminId
        ]
      : null;

  const isHome =
    match.homePlayerId ===
    playerId;

  const isCompleted =
    match.status ===
    "COMPLETED";

  let result:
    | "WIN"
    | "DRAW"
    | "LOSS"
    | null = null;

  if (isCompleted) {
    const myScore = isHome
      ? match.homeScore ?? 0
      : match.awayScore ?? 0;

    const opponentScore =
      isHome
        ? match.awayScore ?? 0
        : match.homeScore ?? 0;

    if (
      myScore >
      opponentScore
    ) {
      result = "WIN";
    } else if (
      myScore <
      opponentScore
    ) {
      result = "LOSS";
    } else {
      result = "DRAW";
    }
  }

  /*
   * Submit result should be available
   * only when viewing Assigned to Me,
   * and the match is not completed.
   */

  const isPlayerMatch =
  match.homePlayerId === playerId ||
  match.awayPlayerId === playerId;

const isAssignedAdmin =
  match.assignedAdminId === playerId;

const showSubmitResult =
  !isCompleted &&
  (
    match.status === "SCHEDULED" ||
    match.status === "RESCHEDULED"
  ) &&
  (
    isPlayerMatch ||
    isAssignedAdmin
  );

  return (

    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 transition hover:border-yellow-400/20 hover:bg-zinc-900 sm:p-6">

      {/* ==================================================
          TOP ROW
      ================================================== */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        <div className="flex flex-wrap items-center gap-2">

          {isCompleted ? (
            <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              Completed
            </span>
          ) : match.status ===
            "RESCHEDULED" ? (
            <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
              Rescheduled
            </span>
          ) : (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              Upcoming
            </span>
          )}

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Round{" "}
            {match.round}
          </span>

        </div>

        <ChevronRight
          size={18}
          className="text-zinc-600"
        />

      </div>

      {/* ==================================================
          PLAYERS + SCORE
      ================================================== */}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">

        {/* HOME */}

        <div className="min-w-0">

          <p
            className={`truncate text-base font-bold sm:text-lg ${
              isHome
                ? "text-white"
                : "text-zinc-300"
            }`}
          >
            {homePlayer?.name ||
              match.homePlayerId}
          </p>

          {homePlayer?.playerId && (
            <p className="mt-1 text-xs text-zinc-600">
              {homePlayer.playerId}
            </p>
          )}

          {isHome && (
            <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              You
            </span>
          )}

        </div>

        {/* SCORE */}

        <div className="flex min-w-[95px] flex-col items-center">

          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-2">

            {isCompleted ? (

              <span className="text-xl font-black tracking-tight text-white sm:text-2xl">

                {match.homeScore ??
                  0}

                <span className="mx-2 text-zinc-600">
                  -
                </span>

                {match.awayScore ??
                  0}

              </span>

            ) : (

              <span className="text-sm font-bold text-zinc-500">
                VS
              </span>

            )}

          </div>

          {result && (
            <span
              className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                result ===
                "WIN"
                  ? "text-green-400"
                  : result ===
                    "LOSS"
                  ? "text-red-400"
                  : "text-zinc-400"
              }`}
            >
              {result}
            </span>
          )}

        </div>

        {/* AWAY */}

        <div className="min-w-0 text-right">

          <p
            className={`truncate text-base font-bold sm:text-lg ${
              !isHome
                ? "text-white"
                : "text-zinc-300"
            }`}
          >
            {awayPlayer?.name ||
              match.awayPlayerId}
          </p>

          {awayPlayer?.playerId && (
            <p className="mt-1 text-xs text-zinc-600">
              {awayPlayer.playerId}
            </p>
          )}

          {!isHome && (
            <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              You
            </span>
          )}

        </div>

      </div>

      {/* ==================================================
          MATCH ADMIN
      ================================================== */}

      <div className="mt-4 text-center">

        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
          Match Admin
        </p>

        <p className="mt-1 text-xs font-semibold text-zinc-400">
          {matchAdmin?.name ||
            match.assignedAdminId ||
            "Not assigned"}
        </p>

      </div>

      {/* ==================================================
          MATCH DETAILS
      ================================================== */}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-4">

        <div className="flex items-center gap-1.5 text-xs text-zinc-500">

          <CalendarDays
            size={14}
          />

          {formatDate(
            match.deadline
          )}

        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500">

          <Clock3
            size={14}
          />

          {formatTime(
            match.deadline
          )}

        </div>

      </div>

      {/* ==================================================
          SUBMIT RESULT
      ================================================== */}

      {showSubmitResult && (
        <div className="mt-4 border-t border-white/10 pt-4">

          <button
            type="button"
            onClick={
              onSubmitResult
            }
            className="w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
          >
            Submit Result
          </button>

        </div>
      )}

    </div>
  );
}