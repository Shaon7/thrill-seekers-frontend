"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Trophy,
  AlertCircle,
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
  round: number;
  deadline: string;
  status:
    | "SCHEDULED"
    | "RESCHEDULED"
    | "COMPLETED"
    | "CANCELLED";
};

type Player = {
  id: number;
  playerId: string;
  name: string;
  email?: string;
  deviceName?: string;
  konamiId?: string;
  isAdmin?: boolean;
};

export default function SubmitMatchResultPage() {
  const params = useParams();
  const router = useRouter();

  const matchId =
    params.matchId as string;

  const [match, setMatch] =
    useState<Match | null>(null);

  const [homePlayer, setHomePlayer] =
    useState<Player | null>(null);

  const [awayPlayer, setAwayPlayer] =
    useState<Player | null>(null);

  const [homeScore, setHomeScore] =
    useState("");

  const [awayScore, setAwayScore] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [userType, setUserType] =
    useState("");

  useEffect(() => {
    const type =
      localStorage.getItem("userType")?.toLowerCase() || "";

    let storedPlayer: Player | null = null;

    try {
      storedPlayer = JSON.parse(
        localStorage.getItem("player") || "null"
      );
    } catch {
      storedPlayer = null;
    }

    /*
     * A logged-in user can reach this page if they are:
     * - SuperAdmin
     * - A logged-in player
     *
     * The exact match permission is checked after
     * loading the match.
     */
    const isAllowed =
      type === "superadmin" ||
      (type === "player" &&
        !!storedPlayer?.playerId);

    setUserType(type);

    if (!isAllowed) {
      setError(
        "You do not have permission to submit match results."
      );

      setLoading(false);
      return;
    }

    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      // =====================================================
      // LOAD MATCH
      // =====================================================

      const matchResponse =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/matches/${matchId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

      let matchResponseData: any = {};

      try {
        matchResponseData =
          await matchResponse.json();
      } catch {
        matchResponseData = {};
      }

      if (!matchResponse.ok) {
        throw new Error(
          Array.isArray(
            matchResponseData?.message
          )
            ? matchResponseData.message.join(", ")
            : matchResponseData?.message ||
                `Failed to load match. HTTP ${matchResponse.status}`
        );
      }

      const matchData: Match =
        matchResponseData;

      // =====================================================
      // CHECK RESULT SUBMISSION PERMISSION
      // =====================================================

      let loggedInPlayer: Player | null = null;

      try {
        loggedInPlayer = JSON.parse(
          localStorage.getItem("player") || "null"
        );
      } catch {
        loggedInPlayer = null;
      }

      const currentUserType =
        localStorage
          .getItem("userType")
          ?.toLowerCase() || "";

      /*
       * SuperAdmin can submit any match.
       */
      const isSuperAdmin =
        currentUserType === "superadmin";

      /*
       * Normal player can submit only
       * their own match.
       */
      const isOwnMatch =
        !!loggedInPlayer?.playerId &&
        (
          matchData.homePlayerId ===
            loggedInPlayer.playerId ||
          matchData.awayPlayerId ===
            loggedInPlayer.playerId
        );

      /*
       * Admin player can submit matches
       * assigned to them.
       */
      const isAssignedAdmin =
        loggedInPlayer?.isAdmin === true &&
        !!loggedInPlayer?.playerId &&
        matchData.assignedAdminId ===
          loggedInPlayer.playerId;

      if (
        !isSuperAdmin &&
        !isOwnMatch &&
        !isAssignedAdmin
      ) {
        throw new Error(
          "You do not have permission to submit this match result."
        );
      }

      // =====================================================
      // CHECK MATCH STATUS
      // =====================================================

      if (
        matchData.status === "COMPLETED"
      ) {
        throw new Error(
          "This match result has already been submitted."
        );
      }

      if (
        matchData.status === "CANCELLED"
      ) {
        throw new Error(
          "This match has been cancelled."
        );
      }

      setMatch(matchData);

      // =====================================================
      // LOAD PLAYERS
      // =====================================================

      const playersResponse =
        await fetch(
          "https://thrill-seekers-backend-production.up.railway.app/player",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

      let playersResponseData: any = {};

      try {
        playersResponseData =
          await playersResponse.json();
      } catch {
        playersResponseData = {};
      }

      if (!playersResponse.ok) {
        throw new Error(
          Array.isArray(
            playersResponseData?.message
          )
            ? playersResponseData.message.join(", ")
            : playersResponseData?.message ||
                `Failed to load player information. HTTP ${playersResponse.status}`
        );
      }

      const players: Player[] =
        playersResponseData;

      const home =
        players.find(
          (player) =>
            player.playerId ===
            matchData.homePlayerId
        );

      const away =
        players.find(
          (player) =>
            player.playerId ===
            matchData.awayPlayerId
        );

      if (!home || !away) {
        throw new Error(
          "Unable to find both players."
        );
      }

      setHomePlayer(home);
      setAwayPlayer(away);
    } catch (error) {
      console.error(
        "Load result page error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load match."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError("");

    // =====================================================
    // VALIDATE SCORE INPUT
    // =====================================================

    if (
      homeScore.trim() === "" ||
      awayScore.trim() === ""
    ) {
      setError(
        "Please enter both scores."
      );
      return;
    }

    const home =
      Number(homeScore);

    const away =
      Number(awayScore);

    if (
      !Number.isInteger(home) ||
      !Number.isInteger(away)
    ) {
      setError(
        "Scores must be whole numbers."
      );
      return;
    }

    if (home < 0 || away < 0) {
      setError(
        "Scores cannot be negative."
      );
      return;
    }

    try {
      setSubmitting(true);

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      // =====================================================
      // SUBMIT RESULT
      // =====================================================

      const response =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/matches/${matchId}/result`,
          {
            method: "POST",

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
          }
        );

      let data: any = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "===== SUBMIT RESULT RESPONSE ====="
      );

      console.log(
        "HTTP STATUS:",
        response.status
      );

      console.log(
        "STATUS TEXT:",
        response.statusText
      );

      console.log(
        "RESPONSE DATA:",
        data
      );

      console.log(
        "=================================="
      );

      if (!response.ok) {
        const message =
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                `Request failed with status ${response.status}`;

        throw new Error(message);
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      router.push(
        `/division/${match?.competitionId}/matches`
      );
    } catch (error) {
      console.error(
        "Submit result error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit match result."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDeadline = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown";
    }

    return date.toLocaleString(
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
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">

        {/* =====================================================
            BACK
        ====================================================== */}

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div className="flex min-h-[350px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/60">
            <div className="text-center">

              <Loader2
                size={30}
                className="mx-auto animate-spin text-yellow-400"
              />

              <p className="mt-3 text-sm text-zinc-500">
                Loading match...
              </p>

            </div>
          </div>
        )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {!loading && error && (
          <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={22}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>

                <h1 className="font-bold text-red-400">
                  Unable to submit result
                </h1>

                <p className="mt-2 text-sm leading-6 text-red-400/80">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.back()
                  }
                  className="mt-5 rounded-xl bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Go Back
                </button>

              </div>

            </div>
          </section>
        )}

        {/* =====================================================
            RESULT FORM
        ====================================================== */}

        {!loading &&
          !error &&
          match &&
          homePlayer &&
          awayPlayer && (
            <section>

              {/* HEADER */}

              <div className="mb-6">

                <div className="mb-3 flex items-center gap-2">

                  <Trophy
                    size={20}
                    className="text-yellow-400"
                  />

                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                    Round {match.round}
                  </span>

                </div>

                <h1 className="text-2xl font-black sm:text-3xl">
                  Submit Match Result
                </h1>

                <p className="mt-2 text-sm text-zinc-500">
                  Enter the final score for this
                  match.
                </p>

              </div>

              {/* MATCH CARD */}

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-2xl">

                {/* MATCH HEADER */}

                <div className="border-b border-white/10 px-5 py-4 sm:px-6">

                  <div className="flex items-center justify-between">

                    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                      {match.status ===
                      "RESCHEDULED"
                        ? "Rescheduled"
                        : "Scheduled"}
                    </span>

                    <span className="text-xs text-zinc-600">
                      Match Result
                    </span>

                  </div>

                </div>

                {/* PLAYERS */}

                <div className="p-5 sm:p-8">

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto_1fr] sm:items-center">

                    {/* HOME */}

                    <div className="text-center sm:text-right">

                      <p className="text-lg font-bold text-white sm:text-xl">
                        {homePlayer.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {homePlayer.playerId}
                      </p>

                      <label className="mt-5 block text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:text-right">
                        Home Score
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={homeScore}
                        onChange={(e) =>
                          setHomeScore(
                            e.target.value
                          )
                        }
                        placeholder="0"
                        className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-center text-2xl font-black text-white outline-none transition focus:border-yellow-400/50 sm:text-right"
                      />

                    </div>

                    {/* VS */}

                    <div className="flex justify-center">

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-xs font-black text-zinc-600">
                        VS
                      </div>

                    </div>

                    {/* AWAY */}

                    <div className="text-center sm:text-left">

                      <p className="text-lg font-bold text-white sm:text-xl">
                        {awayPlayer.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        {awayPlayer.playerId}
                      </p>

                      <label className="mt-5 block text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Away Score
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={awayScore}
                        onChange={(e) =>
                          setAwayScore(
                            e.target.value
                          )
                        }
                        placeholder="0"
                        className="mt-2 h-14 w-full rounded-2xl border border-white/10 bg-black/30 px-4 text-center text-2xl font-black text-white outline-none transition focus:border-yellow-400/50 sm:text-left"
                      />

                    </div>

                  </div>

                  {/* DEADLINE */}

                  <div className="mt-7 flex flex-col gap-2 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">

                    <span className="text-xs text-zinc-600">
                      Submission deadline
                    </span>

                    <span className="text-sm font-semibold text-zinc-300">
                      {formatDeadline(
                        match.deadline
                      )}
                    </span>

                  </div>

                  {/* WARNING */}

                  <div className="mt-4 rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-4">

                    <p className="text-xs leading-5 text-yellow-400/70">
                      Make sure the final score is
                      correct before submitting.
                      The point table will be updated
                      automatically.
                    </p>

                  </div>

                  {/* SUBMIT */}

                  <button
                    type="button"
                    onClick={
                      handleSubmit
                    }
                    disabled={submitting}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 py-4 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Submitting Result...
                      </>
                    ) : (
                      <>
                        <CheckCircle2
                          size={18}
                        />
                        Submit Match Result
                      </>
                    )}
                  </button>

                  {/* CANCEL */}

                  <button
                    type="button"
                    onClick={() =>
                      router.back()
                    }
                    disabled={
                      submitting
                    }
                    className="mt-3 w-full rounded-2xl border border-white/10 py-3.5 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                  >
                    Cancel
                  </button>

                </div>
              </div>
            </section>
          )}
      </div>
    </main>
  );
}