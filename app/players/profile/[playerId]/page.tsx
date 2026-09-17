"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import RecentMatches from "@/app/components/RecentMatches";

import {
  User,
  Mail,
  Gamepad2,
  Trophy,
  Target,
  Shield,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  CalendarDays,
  Medal,
  Star,
  Users,
} from "lucide-react";

const API_URL = "https://thrill-seekers-backend-production.up.railway.app";

/* ================================================== */
/* PLAYER */
/* ================================================== */

interface Player {
  id: number;
  playerId: string;
  name: string;
  email: string;
  deviceName: string;
  konamiId: string;
  isAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
  divisions?: Division[];
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
  divisionId?: string;
  competitionId: string;
  divisionNumber?: number;
  name?: string;
  players?: Player[];
}

/* ================================================== */
/* PLAYER STATISTICS */
/* ================================================== */

interface PlayerStats {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goals: number;
  winRate: number;
}

/* ================================================== */
/* PAGE */
/* ================================================== */

export default function PublicPlayerProfilePage() {
  const params = useParams();

  const urlPlayerId =
    typeof params?.playerId ===
    "string"
      ? params.playerId
      : "";

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [matchStats, setMatchStats] =
    useState<PlayerStats>({
      matches: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals: 0,
      winRate: 0,
    });

  const [recentMatches, setRecentMatches] =
    useState<Match[]>([]);

  const [playersById, setPlayersById] =
    useState<Record<string, Player>>({});

  const [matchLoading, setMatchLoading] =
    useState(true);

  /* ==================================================
     LOAD PUBLIC PLAYER PROFILE
  ================================================== */

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        setLoading(true);
        setMatchLoading(true);
        setError("");

        if (!urlPlayerId) {
          throw new Error(
            "Player ID was not found.",
          );
        }

        /* ==================================================
           1. LOAD PLAYER
        ================================================== */

        const playerResponse =
          await fetch(
            `${API_URL}/player/${urlPlayerId}`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

        let playerData: any = {};

        try {
          playerData =
            await playerResponse.json();
        } catch {
          playerData = {};
        }

        if (!playerResponse.ok) {
          const message =
            Array.isArray(
              playerData?.message,
            )
              ? playerData.message.join(
                  ", ",
                )
              : playerData?.message ||
                `Failed to load player profile. HTTP ${playerResponse.status}`;

          throw new Error(
            message,
          );
        }

        /*
         * Only keep public fields.
         * Password/reset fields are intentionally
         * never used or displayed.
         */

        const publicPlayer: Player =
          {
            id:
              playerData.id,
            playerId:
              playerData.playerId,
            name:
              playerData.name,
            email:
              playerData.email,
            deviceName:
              playerData.deviceName,
            konamiId:
              playerData.konamiId,
            isAdmin:
              Boolean(
                playerData.isAdmin,
              ),
            createdAt:
              playerData.createdAt,
            updatedAt:
              playerData.updatedAt,
            divisions:
              Array.isArray(
                playerData.divisions,
              )
                ? playerData.divisions
                : [],
          };

        setPlayer(
          publicPlayer,
        );

        /* ==================================================
           2. LOAD MATCHES + DIVISIONS
        ================================================== */

        const [
          matchesResponse,
          divisionsResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/matches`,
            {
              method: "GET",
              cache: "no-store",
            },
          ),

          fetch(
            `${API_URL}/divisions`,
            {
              method: "GET",
              cache: "no-store",
            },
          ),
        ]);

        /* ==================================================
           MATCH DATA
        ================================================== */

        let allMatches: Match[] =
          [];

        if (
          matchesResponse.ok
        ) {
          let matchesData: any =
            null;

          try {
            matchesData =
              await matchesResponse.json();
          } catch {
            matchesData = null;
          }

          if (
            Array.isArray(
              matchesData,
            )
          ) {
            allMatches =
              matchesData;
          } else if (
            Array.isArray(
              matchesData?.data,
            )
          ) {
            allMatches =
              matchesData.data;
          }
        }

        /* ==================================================
           PLAYER LOOKUP
        ================================================== */

        const playerLookup: Record<
          string,
          Player
        > = {};

        if (
          divisionsResponse.ok
        ) {
          let divisionsData: any =
            null;

          try {
            divisionsData =
              await divisionsResponse.json();
          } catch {
            divisionsData = null;
          }

          let divisions: Division[] =
            [];

          if (
            Array.isArray(
              divisionsData,
            )
          ) {
            divisions =
              divisionsData;
          } else if (
            Array.isArray(
              divisionsData?.data,
            )
          ) {
            divisions =
              divisionsData.data;
          }

          divisions.forEach(
            (division) => {
              division.players?.forEach(
                (
                  divisionPlayer,
                ) => {
                  if (
                    divisionPlayer?.playerId
                  ) {
                    playerLookup[
                      divisionPlayer
                        .playerId
                    ] =
                      divisionPlayer;
                  }
                },
              );
            },
          );
        }

        playerLookup[
          publicPlayer.playerId
        ] =
          publicPlayer;

        setPlayersById(
          playerLookup,
        );

        /* ==================================================
           PLAYER COMPLETED MATCHES
        ================================================== */

        const playerMatches =
          allMatches.filter(
            (match) => {
              const playerIsInMatch =
                match.homePlayerId ===
                  urlPlayerId ||
                match.awayPlayerId ===
                  urlPlayerId;

              return (
                playerIsInMatch &&
                match.status ===
                  "COMPLETED"
              );
            },
          );

        /* ==================================================
           CALCULATE STATISTICS
        ================================================== */

        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goals = 0;

        playerMatches.forEach(
          (match) => {
            const isHome =
              match.homePlayerId ===
              urlPlayerId;

            const myScore =
              isHome
                ? match.homeScore ??
                  0
                : match.awayScore ??
                  0;

            const opponentScore =
              isHome
                ? match.awayScore ??
                  0
                : match.homeScore ??
                  0;

            goals +=
              myScore;

            if (
              myScore >
              opponentScore
            ) {
              wins++;
            } else if (
              myScore <
              opponentScore
            ) {
              losses++;
            } else {
              draws++;
            }
          },
        );

        const totalMatches =
          playerMatches.length;

        const winRate =
          totalMatches > 0
            ? Math.round(
                (wins /
                  totalMatches) *
                  100,
              )
            : 0;

        setMatchStats({
          matches:
            totalMatches,
          wins,
          draws,
          losses,
          goals,
          winRate,
        });

        /* ==================================================
           LATEST 5 MATCHES
        ================================================== */

        const latestMatches =
          [
            ...playerMatches,
          ]
            .sort(
              (a, b) =>
                new Date(
                  b.deadline,
                ).getTime() -
                new Date(
                  a.deadline,
                ).getTime(),
            )
            .slice(0, 5);

        setRecentMatches(
          latestMatches,
        );
      } catch (error) {
        console.error(
          "Public player profile error:",
          error,
        );

        if (
          error instanceof
          TypeError
        ) {
          setError(
            "Unable to connect to the backend. Make sure the NestJS server is running.",
          );
        } else if (
          error instanceof Error
        ) {
          setError(
            error.message,
          );
        } else {
          setError(
            "Something went wrong while loading the profile.",
          );
        }
      } finally {
        setLoading(false);
        setMatchLoading(false);
      }
    };

    loadPlayer();
  }, [urlPlayerId]);

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
              Loading player profile...
            </p>

          </div>

        </div>
      </main>
    );
  }

  /* ==================================================
     ERROR
  ================================================== */

  if (error || !player) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">

          <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">

            <div className="flex items-start gap-3">

              <ShieldAlert
                size={23}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>

                <h2 className="font-semibold text-red-400">
                  Unable to load profile
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-400/80">
                  {error ||
                    "Player was not found."}
                </p>

                <Link
                  href="/players"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                >
                  <ArrowLeft
                    size={16}
                  />
                  Back to Players
                </Link>

              </div>

            </div>

          </section>

        </div>
      </main>
    );
  }

  /* ==================================================
     MEMBER SINCE
  ================================================== */

  const memberSince =
    player.createdAt
      ? new Date(
          player.createdAt,
        ).toLocaleDateString(
          "en-US",
          {
            month: "long",
            year: "numeric",
          },
        )
      : "—";

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">

        {/* ==================================================
            BACK TO PLAYERS
        ================================================== */}

        <Link
          href="/players"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft
            size={16}
          />
          Back to Players
        </Link>

        {/* ==================================================
            PROFILE HERO
        ================================================== */}

        <section className="mb-8">

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-10">

            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-yellow-500/5 blur-3xl" />

            <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                  <User
                    size={42}
                  />
                </div>

                <div>

                  <div className="mb-2 flex flex-wrap items-center gap-2">

                    <span className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                      PLAYER PROFILE
                    </span>

                  </div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                    {player.name}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-zinc-300">
                      {player.playerId}
                    </span>

                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <CalendarDays
                        size={15}
                      />
                      Member since{" "}
                      {memberSince}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            PLAYER STATISTICS
        ================================================== */}

        <section className="mb-10">

          <div className="mb-5">

            <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
              PLAYER PERFORMANCE
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Career statistics
            </h2>

          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60">

            <div className="grid grid-cols-2 divide-x divide-y divide-white/10 sm:grid-cols-3 lg:grid-cols-6">

              <StatItem
                icon={
                  <Gamepad2
                    size={18}
                  />
                }
                label="Matches"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.matches,
                      )
                }
              />

              <StatItem
                icon={
                  <Trophy
                    size={18}
                  />
                }
                label="Wins"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.wins,
                      )
                }
              />

              <StatItem
                icon={
                  <Star
                    size={18}
                  />
                }
                label="Draws"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.draws,
                      )
                }
              />

              <StatItem
                icon={
                  <Shield
                    size={18}
                  />
                }
                label="Losses"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.losses,
                      )
                }
              />

              <StatItem
                icon={
                  <Target
                    size={18}
                  />
                }
                label="Goals"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.goals,
                      )
                }
              />

              <StatItem
                icon={
                  <Medal
                    size={18}
                  />
                }
                label="Win Rate"
                value={
                  matchLoading
                    ? "—"
                    : `${matchStats.winRate}%`
                }
              />

            </div>

          </div>

          <p className="mt-3 text-xs text-zinc-600">
            Statistics are calculated from completed
            matches played by this player.
          </p>

        </section>

        {/* ==================================================
            PROFILE CONTENT
        ================================================== */}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ==================================================
              PLAYER INFORMATION
          ================================================== */}

          <div className="lg:col-span-2">

            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-7">

              <div className="mb-6">

                <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                  ACCOUNT
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Player information
                </h2>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <InfoCard
                  icon={
                    <User
                      size={18}
                    />
                  }
                  label="Name"
                  value={
                    player.name
                  }
                />

                <InfoCard
                  icon={
                    <Mail
                      size={18}
                    />
                  }
                  label="Email"
                  value={
                    player.email
                  }
                />

                <InfoCard
                  icon={
                    <Gamepad2
                      size={18}
                    />
                  }
                  label="Device"
                  value={
                    player.deviceName
                  }
                />

                <InfoCard
                  icon={
                    <Shield
                      size={18}
                    />
                  }
                  label="KONAMI ID"
                  value={
                    player.konamiId
                  }
                />

                <InfoCard
                  icon={
                    <Trophy
                      size={18}
                    />
                  }
                  label="Player ID"
                  value={
                    player.playerId
                  }
                />

                <InfoCard
                  icon={
                    <Users
                      size={18}
                    />
                  }
                  label="Divisions"
                  value={
                    player.divisions &&
                    player.divisions.length >
                      0
                      ? player.divisions
                          .map(
                            (
                              division,
                            ) =>
                              division.name ||
                              (division.divisionNumber
                                ? `Division ${division.divisionNumber}`
                                : division.divisionId) ||
                              division.competitionId,
                          )
                          .join(
                            ", ",
                          )
                      : "No division"
                  }
                />

              </div>

            </div>

          </div>

          {/* ==================================================
              ACHIEVEMENTS
          ================================================== */}

          <div>

            <div className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 via-zinc-900/80 to-black p-6">

              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-yellow-400/10 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                      ACHIEVEMENTS
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Player achievements
                    </h2>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400 text-black">
                    <Trophy
                      size={21}
                    />
                  </div>

                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-7 text-center">

                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                    <Medal
                      size={25}
                    />
                  </div>

                  <p className="mt-4 text-sm font-bold text-zinc-300">
                    No Achievement
                  </p>

                  <p className="mt-2 text-xs leading-5 text-zinc-600">
                    Achievements will appear here when
                    they are available.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ==================================================
            RECENT MATCHES
        ================================================== */}

        <section className="mt-10">

          <div className="mb-5">

            <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
              RECENT ACTIVITY
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Recent matches
            </h2>

          </div>

          {matchLoading ? (
            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center">

              <Loader2
                size={32}
                className="mx-auto animate-spin text-yellow-400"
              />

              <p className="mt-3 text-sm font-medium text-zinc-400">
                Loading recent matches...
              </p>

            </div>
          ) : recentMatches.length >
            0 ? (
            <RecentMatches
              matches={
                recentMatches
              }
              playerId={
                player.playerId
              }
              playersById={
                playersById
              }
            />
          ) : (
            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-8 text-center">

              <Gamepad2
                size={32}
                className="mx-auto text-zinc-600"
              />

              <p className="mt-3 text-sm font-medium text-zinc-400">
                No recent matches available
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Recent completed matches will appear
                here.
              </p>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

/* ================================================== */
/* STAT ITEM */
/* ================================================== */

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-5">

      <div className="flex items-center justify-center text-yellow-400">
        {icon}
      </div>

      <p className="mt-2 text-center text-2xl font-bold sm:text-3xl">
        {value}
      </p>

      <p className="mt-1 text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>

    </div>
  );
}

/* ================================================== */
/* INFO CARD */
/* ================================================== */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-yellow-400/20">

      <div className="flex items-center gap-2 text-zinc-500">

        {icon}

        <p className="text-xs font-medium uppercase tracking-wider">
          {label}
        </p>

      </div>

      <p
        className="mt-2 truncate text-sm font-semibold text-white"
        title={value}
      >
        {value || "—"}
      </p>

    </div>
  );
}