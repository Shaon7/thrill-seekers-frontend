"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import StatCard from "../components/StatCard";
import DivisionCard from "../components/DivisionCard";
import RecentMatches from "../components/RecentMatches";

import {
  usePathname,
} from "next/navigation";

import Navbar from "../components/Navbar";
import {
  Trophy,
  Target,
  Gamepad2,
  Star,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import path from "path";

const API_URL = "https://thrill-seekers-backend-production.up.railway.app";

interface Player {
  id: number;
  playerId: string;
  name: string;
  email: string;
  phone?: string;
  deviceName: string;
  konamiId: string;
  isAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Division {
  id: number;
  divisionId: string;
  competitionId: string;
  NumberOfPlayer: number | null;
  season: number;
  phase: number;
  divisionNumber: number;
  name: string;

  status?: string;
  Status?: string;
  divisionStatus?: string;

  players?: Player[];
}

interface PointTableRow {
  id: number;
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
}

type MatchStatus =
  | "SCHEDULED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

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

  status: MatchStatus;

  createdAt?: string;
  updatedAt?: string;
}

interface MatchStatistics {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winRate: number;
}

export default function Home() {
  const router = useRouter();

  const loadedRef = useRef(false);

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [activeDivision, setActiveDivision] =
    useState<Division | null>(null);

  const [divisionPointTables, setDivisionPointTables] =
    useState<PointTableRow[]>([]);

  const [recentMatches, setRecentMatches] =
    useState<Match[]>([]);

  /*
   * Player lookup for Recent Matches.
   *
   * This is built from all players returned
   * through all divisions.
   */
  const [playersById, setPlayersById] =
    useState<Record<string, Player>>({});

  const [matchStats, setMatchStats] =
    useState<MatchStatistics>({
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      winRate: 0,
    });

    const routes: Record<string, string> = {
     Matches: `/player/${player?.playerId || "THS-0012"}/matches`,
  };

  const [loading, setLoading] =
    useState(true);

  const [dataLoading, setDataLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (loadedRef.current) {
      return;
    }

    loadedRef.current = true;

    loadHomeData();
  }, []);

  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const token =
      localStorage.getItem(
        "access_token"
      );

    return fetch(url, {
      ...options,

      headers: {
        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },

      cache: "no-store",
    });
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      setDataLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        router.push("/login");
        return;
      }

      // =====================================================
      // GET STORED PLAYER
      // =====================================================

      const storedPlayer =
        localStorage.getItem(
          "player"
        );

      let localPlayer: Player | null =
        null;

      if (storedPlayer) {
        try {
          localPlayer =
            JSON.parse(
              storedPlayer
            );
        } catch {
          localPlayer = null;
        }
      }

      if (
        !localPlayer?.playerId
      ) {
        router.push("/login");
        return;
      }

      // =====================================================
      // 1. GET CURRENT PLAYER
      // =====================================================

      const playerResponse =
        await authenticatedFetch(
          `${API_URL}/player/${localPlayer.playerId}`
        );

      if (
        !playerResponse.ok
      ) {
        throw new Error(
          "Failed to load player information."
        );
      }

      const playerData: Player =
        await playerResponse.json();

      setPlayer(
        playerData
      );

      localStorage.setItem(
        "player",
        JSON.stringify(
          playerData
        )
      );

      // =====================================================
      // 2. GET ALL DIVISIONS
      // =====================================================

      const divisionResponse =
        await authenticatedFetch(
          `${API_URL}/divisions`
        );

      if (
        !divisionResponse.ok
      ) {
        throw new Error(
          "Failed to load divisions."
        );
      }

      const divisions: Division[] =
        await divisionResponse.json();

      // =====================================================
      // BUILD PLAYER LOOKUP FROM ALL DIVISIONS
      //
      // This does not change any backend/API.
      // It only prepares names for match display.
      // =====================================================

      const playerLookup: Record<
        string,
        Player
      > = {};

      divisions.forEach(
        (division) => {
          division.players?.forEach(
            (divisionPlayer) => {
              if (
                divisionPlayer?.playerId
              ) {
                playerLookup[
                  divisionPlayer.playerId
                ] = divisionPlayer;
              }
            }
          );
        }
      );

      // Make sure the logged-in player is
      // also available in the lookup.
      playerLookup[
        playerData.playerId
      ] = playerData;

      setPlayersById(
        playerLookup
      );

      // =====================================================
      // 3. ONLY ACTIVE DIVISIONS
      // =====================================================

      const activeDivisions =
        divisions.filter(
          (division) => {
            const currentStatus =
              division.status ??
              division.Status ??
              division.divisionStatus ??
              "";

            return (
              String(
                currentStatus
              )
                .trim()
                .toUpperCase() ===
              "ACTIVE"
            );
          }
        );

      // =====================================================
      // 4. PREFER DIVISION THAT CONTAINS PLAYER
      // =====================================================

      const playerActiveDivisions =
        activeDivisions.filter(
          (division) =>
            division.players?.some(
              (divisionPlayer) =>
                divisionPlayer.playerId ===
                playerData.playerId
            )
        );

      const possibleDivisions =
        playerActiveDivisions.length >
        0
          ? playerActiveDivisions
          : activeDivisions;

      // =====================================================
      // 5. SORT ACTIVE DIVISIONS
      // =====================================================

      const sortedDivisions =
        [...possibleDivisions].sort(
          (a, b) => {
            if (
              b.season !==
              a.season
            ) {
              return (
                b.season -
                a.season
              );
            }

            if (
              b.phase !==
              a.phase
            ) {
              return (
                b.phase -
                a.phase
              );
            }

            return (
              a.divisionNumber -
              b.divisionNumber
            );
          }
        );

      const currentDivision =
        sortedDivisions[0] ??
        null;

      setActiveDivision(
        currentDivision
      );

      // =====================================================
      // 6. GET POINT TABLE FOR ACTIVE DIVISION
      // =====================================================

      let pointTableRows: PointTableRow[] =
        [];

      if (
        currentDivision?.competitionId
      ) {
        const pointTableResponse =
          await authenticatedFetch(
            `${API_URL}/point-tables/competition/${currentDivision.competitionId}`
          );

        if (
          pointTableResponse.ok
        ) {
          const pointTableData =
            await pointTableResponse.json();

          if (
            Array.isArray(
              pointTableData
            )
          ) {
            pointTableRows =
              pointTableData;
          } else if (
            Array.isArray(
              pointTableData?.rows
            )
          ) {
            pointTableRows =
              pointTableData.rows;
          }
        }
      }

      setDivisionPointTables(
        pointTableRows
      );

      // =====================================================
      // 7. GET ALL MATCHES
      //
      // OVERALL STATISTICS COME FROM THIS API
      // =====================================================

      const matchesResponse =
        await authenticatedFetch(
          `${API_URL}/matches`
        );

      if (
        !matchesResponse.ok
      ) {
        throw new Error(
          "Failed to load matches."
        );
      }

      const matchesResponseData =
        await matchesResponse.json();

      let allMatches: Match[] =
        [];

      if (
        Array.isArray(
          matchesResponseData
        )
      ) {
        allMatches =
          matchesResponseData;
      } else if (
        Array.isArray(
          matchesResponseData?.matches
        )
      ) {
        allMatches =
          matchesResponseData.matches;
      }

      // =====================================================
      // 8. CALCULATE OVERALL PLAYER STATISTICS
      // =====================================================

      const completedPlayerMatches =
        allMatches.filter(
          (match) => {
            const playerIsInMatch =
              match.homePlayerId ===
                playerData.playerId ||
              match.awayPlayerId ===
                playerData.playerId;

            return (
              playerIsInMatch &&
              match.status ===
                "COMPLETED"
            );
          }
        );

      let wins = 0;
      let draws = 0;
      let losses = 0;

      let goalsFor = 0;
      let goalsAgainst = 0;

      completedPlayerMatches.forEach(
        (match) => {
          const isHome =
            match.homePlayerId ===
            playerData.playerId;

          const myScore =
            isHome
              ? match.homeScore ?? 0
              : match.awayScore ?? 0;

          const opponentScore =
            isHome
              ? match.awayScore ?? 0
              : match.homeScore ?? 0;

          goalsFor +=
            myScore;

          goalsAgainst +=
            opponentScore;

          if (
            myScore >
            opponentScore
          ) {
            wins += 1;
          } else if (
            myScore ===
            opponentScore
          ) {
            draws += 1;
          } else {
            losses += 1;
          }
        }
      );

      const played =
        completedPlayerMatches.length;

      const goalDifference =
        goalsFor -
        goalsAgainst;

      const winRate =
        played > 0
          ? Number(
              (
                (wins /
                  played) *
                100
              ).toFixed(1)
            )
          : 0;

      setMatchStats({
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference,
        winRate,
      });

      // =====================================================
      // 9. RECENT MATCHES
      //
      // ALL COMPETITIONS
      // + LOGGED-IN PLAYER
      // + COMPLETED
      // + LATEST 5
      // =====================================================

      const sortedRecentMatches =
        [...allMatches]
          .filter(
            (match) => {
              const playerIsInMatch =
                match.homePlayerId ===
                  playerData.playerId ||
                match.awayPlayerId ===
                  playerData.playerId;

              return (
                playerIsInMatch &&
                match.status ===
                  "COMPLETED"
              );
            }
          )
          .sort(
            (a, b) => {
              const dateA =
                new Date(
                  a.deadline
                ).getTime();

              const dateB =
                new Date(
                  b.deadline
                ).getTime();

              return (
                dateB - dateA
              );
            }
          )
          .slice(0, 5);

      setRecentMatches(
        sortedRecentMatches
      );
    } catch (error) {
      console.error(
        "Home page error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load home page."
      );
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  // =====================================================
  // PLAYER HOME
  // =====================================================

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

        {/* ================================================= */}
        {/* WELCOME */}
        {/* ================================================= */}

        <section className="mb-5 sm:mb-6">
          <p className="text-sm font-medium text-zinc-500">
            Welcome back
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
            {player?.name ||
              "Player"}
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            Here is your latest
            Thrill Seekers
            performance.
          </p>
        </section>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400 sm:mb-6">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* UPCOMING MATCHES */}
        {/* ================================================= */}

        <section className="mb-4 sm:mb-5">
          <button
            onClick={() =>
              router.push(
                  `/player/${player?.playerId}/matches`
              )
            }
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400/20 sm:w-auto sm:px-5"
          >
            <CalendarDays
              size={17}
            />

            <span>
              View Upcoming Matches
            </span>

            <span className="text-yellow-400/60">
              →
            </span>
          </button>
        </section>

        {/* ================================================= */}
        {/* TOURNAMENT */}
        {/* ================================================= */}

        <section className="mb-5 sm:mb-6">
          <div className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 sm:p-8">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-yellow-400/10 blur-3xl sm:-right-16 sm:-top-16 sm:h-52 sm:w-52" />

            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-black sm:h-12 sm:w-12">
                  <Trophy size={23} />
                </div>

                
              </div>

              <p className="mt-5 text-[10px] font-semibold tracking-[0.2em] text-yellow-400 sm:mt-6 sm:text-xs">
                ACTIVE TOURNAMENT
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                No Active Tournament
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                New Tournament Coming Soon!
              </p>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* ACTIVE DIVISION */}
        {/* ================================================= */}

        <section className="mb-5 sm:mb-6">
          <DivisionCard
            division={
              activeDivision
            }
            playerId={
              player?.playerId
            }
            pointTables={
              divisionPointTables
            }
            loading={
              dataLoading
            }
          />
        </section>

        {/* ================================================= */}
        {/* OVERALL MATCH STATISTICS */}
        {/* ================================================= */}

        <section className="mb-5 sm:mb-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
              OVERALL PERFORMANCE
            </p>

            <h2 className="mt-1 text-xl font-bold sm:text-2xl">
              Match Statistics
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

            <StatCard
              icon={
                <Gamepad2
                  size={20}
                />
              }
              label="Played"
              value={
                loading
                  ? "..."
                  : String(
                      matchStats.played
                    )
              }
              description="Completed matches"
            />

            <StatCard
              icon={
                <TrendingUp
                  size={20}
                />
              }
              label="Wins"
              value={
                loading
                  ? "..."
                  : String(
                      matchStats.wins
                    )
              }
              description="Matches won"
            />

            <StatCard
              icon={
                <Target
                  size={20}
                />
              }
              label="Draws"
              value={
                loading
                  ? "..."
                  : String(
                      matchStats.draws
                    )
              }
              description="Matches drawn"
            />

            <StatCard
              icon={
                <Star
                  size={20}
                />
              }
              label="Losses"
              value={
                loading
                  ? "..."
                  : String(
                      matchStats.losses
                    )
              }
              description="Matches lost"
            />

            <StatCard
              icon={
                <Trophy
                  size={20}
                />
              }
              label="Goals For"
              value={
                loading
                  ? "..."
                  : String(
                      matchStats.goalsFor
                    )
              }
              description="Goals scored"
            />

            <StatCard
              icon={
                <CalendarDays
                  size={20}
                />
              }
              label="Win Rate"
              value={
                loading
                  ? "..."
                  : `${matchStats.winRate}%`
              }
              description="Overall win percentage"
            />

          </div>
        </section>

        {/* ================================================= */}
        {/* RECENT MATCHES */}
        {/* ================================================= */}

        <section className="mb-5 sm:mb-6">
          <div className="mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                LATEST RESULTS
              </p>

              <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                Recent Matches
              </h2>
            </div>
          </div>

          <RecentMatches
            matches={
              recentMatches
            }
            playerId={
              player?.playerId || ""
            }
            playersById={
              playersById
            }
          />
        </section>

      </div>
    </main>
  );
}
