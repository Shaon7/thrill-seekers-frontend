"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  Pencil,
  UserPlus,
  Users,
  Trophy,
} from "lucide-react";

type Match = {
  id: number;
  matchId: string;
  competitionId: string;
  homePlayerId: string;
  awayPlayerId: string;
  homeScore: number | null;
  awayScore: number | null;
  assignedAdminId: string | null;
  deadline: string;
  status:
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED";
};

type Player = {
  id: number;
  playerId: string;
  name: string;
  email: string;
  isAdmin?: boolean;
};

type Division = {
  divisionId: string;
  competitionId: string;
  name: string;
  season: number;
  phase: number;
  divisionNumber: number;
  players: Player[];
};

export default function MatchesPage() {
  const params = useParams();
  const router = useRouter();

  const divisionId =
    params.divisionId as string;

  const [division, setDivision] =
    useState<Division | null>(null);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [isSuperAdmin, setIsSuperAdmin] =
    useState(false);

  useEffect(() => {
    const userType =
      localStorage.getItem("userType");

    setIsSuperAdmin(
      userType?.toLowerCase() ===
        "superadmin"
    );

    loadData();
  }, [divisionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        divisionResponse,
        matchesResponse,
      ] = await Promise.all([
        fetch(
          `https://thrill-seekers-backend-production.up.railway.app/divisions/${divisionId}`
        ),
        fetch(
          `https://thrill-seekers-backend-production.up.railway.app/matches`
        ),
      ]);

      if (!divisionResponse.ok) {
        throw new Error(
          "Failed to load division."
        );
      }

      if (!matchesResponse.ok) {
        throw new Error(
          "Failed to load matches."
        );
      }

      const divisionData =
        await divisionResponse.json();

      const allMatches =
        await matchesResponse.json();

      const divisionMatches =
        allMatches.filter(
          (match: Match) =>
            match.competitionId ===
            divisionData.competitionId
        );

      setDivision(
        divisionData
      );

      setMatches(
        divisionMatches
      );
    } catch (error) {
      console.error(
        "Match page error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load matches."
      );
    } finally {
      setLoading(false);
    }
  };

  const getPlayer = (
    playerId: string
  ) => {
    return division?.players?.find(
      (player) =>
        player.playerId === playerId
    );
  };

  const formatDeadline = (
    deadline: string
  ) => {
    return new Date(
      deadline
    ).toLocaleString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">

        {/* BACK */}
        <button
          type="button"
          onClick={() =>
            router.push(
              `/division/${divisionId}`
            )
          }
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Division
        </button>

        {/* HEADER */}
        {!loading && division && (
          <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 shadow-2xl sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <div className="mb-3 flex items-center gap-2 text-yellow-400">
                  <Trophy size={19} />

                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    Division Matches
                  </span>
                </div>

                <h1 className="text-2xl font-black sm:text-3xl">
                  {division.name}
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  {division.divisionId}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
                  <Users
                    size={18}
                    className="mx-auto text-yellow-400"
                  />

                  <p className="mt-2 text-xl font-black">
                    {
                      division.players
                        ?.length || 0
                    }
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Players
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
                  <CalendarDays
                    size={18}
                    className="mx-auto text-yellow-400"
                  />

                  <p className="mt-2 text-xl font-black">
                    {matches.length}
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Matches
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50">

            <div className="text-center">
              <Loader2
                size={30}
                className="mx-auto animate-spin text-yellow-400"
              />

              <p className="mt-3 text-sm text-zinc-500">
                Loading matches...
              </p>
            </div>
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-red-400">
            {error}
          </div>
        )}

        {/* MATCHES */}
        {!loading &&
          !error &&
          division && (
            <section>

              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                  Schedule
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  All Matches
                </h2>
              </div>

              {matches.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-10 text-center">

                  <CalendarDays
                    size={28}
                    className="mx-auto text-zinc-600"
                  />

                  <p className="mt-3 text-sm font-semibold text-zinc-400">
                    No matches generated yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">

                  {matches.map(
                    (match, index) => {
                      const homePlayer =
                        getPlayer(
                          match.homePlayerId
                        );

                      const awayPlayer =
                        getPlayer(
                          match.awayPlayerId
                        );

                      return (
                        <article
                          key={
                            match.matchId
                          }
                          className="rounded-3xl border border-white/10 bg-zinc-900/60 p-5 shadow-xl sm:p-6"
                        >

                          {/* TOP */}
                          <div className="flex items-center justify-between">

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-400">
                                Match {String(
                                  index + 1
                                ).padStart(
                                  2,
                                  "0"
                                )}
                              </p>

                              <p className="mt-1 text-xs text-zinc-600">
                                {
                                  match.matchId
                                }
                              </p>
                            </div>

                            <StatusBadge
                              status={
                                match.status
                              }
                            />
                          </div>

                          {/* PLAYERS */}
                          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">

                            {/* HOME */}
                            <PlayerSide
                              player={
                                homePlayer
                              }
                              align="right"
                              score={
                                match.homeScore
                              }
                            />

                            <div className="text-center">
                              <span className="text-xs font-black text-zinc-600">
                                VS
                              </span>
                            </div>

                            {/* AWAY */}
                            <PlayerSide
                              player={
                                awayPlayer
                              }
                              align="left"
                              score={
                                match.awayScore
                              }
                            />
                          </div>

                          {/* DEADLINE */}
                          <div className="mt-6 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-xs text-zinc-500">
                            <Clock size={14} />
                            Deadline:
                            <span className="font-semibold text-zinc-300">
                              {formatDeadline(
                                match.deadline
                              )}
                            </span>
                          </div>

                          {/* ACTIONS */}
                          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">

                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/player/matches/${match.matchId}`
                                )
                              }
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
                            >
                              View Match
                            </button>

                            {isSuperAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/matches/${match.matchId}/update`
                                    )
                                  }
                                  className="flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-400/20"
                                >
                                  <Pencil
                                    size={14}
                                  />
                                  Update
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/matches/${match.matchId}/admin`
                                    )
                                  }
                                  className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-300"
                                >
                                  <UserPlus
                                    size={14}
                                  />
                                  Add Admin
                                </button>
                              </>
                            )}
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          )}
      </div>
    </main>
  );
}

function PlayerSide({
  player,
  align,
  score,
}: {
  player?: Player;
  align: "left" | "right";
  score: number | null;
}) {
  return (
    <div
      className={`min-w-0 ${
        align === "right"
          ? "text-right"
          : "text-left"
      }`}
    >
      <p className="truncate text-sm font-bold text-white sm:text-base">
        {player?.name ||
          "Unknown Player"}
      </p>

      <p className="mt-1 text-[10px] text-zinc-600">
        {player?.playerId ||
          "Unknown"}
      </p>

      {score !== null && (
        <p className="mt-2 text-2xl font-black text-yellow-400">
          {score}
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "COMPLETED") {
    return (
      <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-green-400">
        Completed
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
      Scheduled
    </span>
  );
}
