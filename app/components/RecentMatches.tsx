"use client";

import {
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

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

interface Player {
  id: number;
  playerId: string;
  name: string;
  email?: string;
  phone?: string;
  deviceName?: string;
  konamiId?: string;
  isAdmin?: boolean;
}

interface RecentMatchesProps {
  matches: Match[];
  playerId: string;
  playersById: Record<string, Player>;
}

export default function RecentMatches({
  matches,
  playerId,
  playersById,
}: RecentMatchesProps) {
  if (!matches.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950/70 p-6 text-center">
        <p className="text-sm font-medium text-zinc-400">
          No completed matches yet.
        </p>
      </div>
    );
  }

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

  return (
    <div className="space-y-3">
      {matches.map(
        (match) => {
          const isHome =
            match.homePlayerId ===
            playerId;

          const myScore =
            isHome
              ? match.homeScore ?? 0
              : match.awayScore ?? 0;

          const opponentScore =
            isHome
              ? match.awayScore ?? 0
              : match.homeScore ?? 0;

          let result:
            | "WIN"
            | "DRAW"
            | "LOSS" =
            "DRAW";

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
          }

          // =====================================================
          // GET PLAYER NAMES
          // =====================================================

          const homePlayer =
            playersById[
              match.homePlayerId
            ];

          const awayPlayer =
            playersById[
              match.awayPlayerId
            ];

          const homePlayerName =
            homePlayer?.name ||
            match.homePlayerId;

          const awayPlayerName =
            awayPlayer?.name ||
            match.awayPlayerId;

          return (
            <div
              key={match.matchId}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0 flex-1">

                  <div className="flex flex-wrap items-center gap-2">

                   

                    <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-[10px] font-bold text-green-400">
                      COMPLETED
                    </span>

                  </div>

                  <div className="mt-3 flex items-center gap-3">

                    {/* HOME PLAYER */}

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-bold ${
                          isHome
                            ? "text-white"
                            : "text-zinc-400"
                        }`}
                      >
                        {homePlayerName}
                      </p>
                    </div>

                    {/* SCORE */}

                    <div className="shrink-0 text-center">
                      <p className="text-lg font-black">
                        {
                          match.homeScore
                        }{" "}
                        -{" "}
                        {
                          match.awayScore
                        }
                      </p>
                    </div>

                    {/* AWAY PLAYER */}

                    <div className="min-w-0 flex-1 text-right">
                      <p
                        className={`truncate text-sm font-bold ${
                          !isHome
                            ? "text-white"
                            : "text-zinc-400"
                        }`}
                      >
                        {awayPlayerName}
                      </p>
                    </div>

                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">

                    <Clock3
                      size={14}
                    />

                    <span>
                      {formatDate(
                        match.deadline
                      )}
                    </span>

                    <span>
                      • Round{" "}
                      {match.round}
                    </span>

                  </div>

                </div>

                {/* RESULT */}

                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black ${
                    result ===
                    "WIN"
                      ? "border-green-400/20 bg-green-400/10 text-green-400"
                      : result ===
                        "LOSS"
                      ? "border-red-400/20 bg-red-400/10 text-red-400"
                      : "border-yellow-400/20 bg-yellow-400/10 text-yellow-400"
                  }`}
                >
                  {result ===
                  "WIN" ? (
                    <CheckCircle2
                      size={15}
                    />
                  ) : (
                    <XCircle
                      size={15}
                    />
                  )}

                  {result}
                </div>

              </div>
            </div>
          );
        }
      )}
    </div>
  );
}
