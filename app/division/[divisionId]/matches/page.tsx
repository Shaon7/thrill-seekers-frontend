"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Navbar from "../../../components/Navbar";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Trophy,
  UserPlus,
  Users,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  X,
} from "lucide-react";

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
  konamiId?: string;
  deviceName?: string;
  isAdmin?: boolean;
};

type Division = {
  id: number;
  divisionId: string;
  competitionId: string;
  NumberOfPlayer: number | null;
  season: number;
  phase: number;
  divisionNumber: number;
  name: string;
  players: Player[];
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

  const [userType, setUserType] =
    useState("");

  const [storedPlayer, setStoredPlayer] =
    useState<Player | null>(null);

  const [
    expandedRounds,
    setExpandedRounds,
  ] = useState<number[]>([]);

  const [
    changingTimeMatchId,
    setChangingTimeMatchId,
  ] = useState<string | null>(null);

  const [
    newMatchDate,
    setNewMatchDate,
  ] = useState("");

  const [savingTime, setSavingTime] =
    useState(false);

  // =====================================================
  // LOAD USER + DATA
  // =====================================================

  useEffect(() => {
    const storedUserType =
      localStorage.getItem("userType");

    setUserType(
      storedUserType?.toLowerCase() || "",
    );

    try {
      const player = JSON.parse(
        localStorage.getItem("player") ||
          "null",
      );

      setStoredPlayer(player);
    } catch {
      setStoredPlayer(null);
    }

    if (divisionId) {
      loadData();
    }
  }, [divisionId]);

  // =====================================================
  // LOAD DIVISION + MATCHES
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      /*
       * Load division first.
       */
      const divisionResponse =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/divisions/${divisionId}`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            cache: "no-store",
          },
        );

      if (!divisionResponse.ok) {
        let message =
          "Failed to load division.";

        try {
          const data =
            await divisionResponse.json();

          if (
            typeof data?.message ===
            "string"
          ) {
            message = data.message;
          }
        } catch {
          //
        }

        throw new Error(message);
      }

      const divisionData: Division =
        await divisionResponse.json();

      /*
       * Load only matches for this division.
       */
      const matchesResponse =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/matches/competition/${divisionData.competitionId}`,
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            cache: "no-store",
          },
        );

      if (!matchesResponse.ok) {
        let message =
          "Failed to load matches.";

        try {
          const data =
            await matchesResponse.json();

          if (
            typeof data?.message ===
            "string"
          ) {
            message = data.message;
          }
        } catch {
          //
        }

        throw new Error(message);
      }

      const matchesData: Match[] =
        await matchesResponse.json();

      const sortedMatches = [
        ...matchesData,
      ].sort((a, b) => {
        if (a.round !== b.round) {
          return a.round - b.round;
        }

        return a.id - b.id;
      });

      setDivision(divisionData);

      setMatches(sortedMatches);

      /*
       * Open first round automatically.
       */
      const roundList = [
        ...new Set(
          sortedMatches.map(
            (match) => match.round,
          ),
        ),
      ];

      if (roundList.length > 0) {
        setExpandedRounds([
          roundList[0],
        ]);
      }
    } catch (error) {
      console.error(
        "Matches page error:",
        error,
      );

      if (
        error instanceof TypeError
      ) {
        setError(
          "Unable to connect to the backend. Make sure the NestJS server is running.",
        );
      } else if (
        error instanceof Error
      ) {
        setError(error.message);
      } else {
        setError(
          "Something went wrong while loading matches.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GROUP MATCHES BY ROUND
  // =====================================================

  const matchesByRound =
    useMemo(() => {
      const grouped: Record<
        number,
        Match[]
      > = {};

      matches.forEach((match) => {
        if (!grouped[match.round]) {
          grouped[match.round] = [];
        }

        grouped[match.round].push(match);
      });

      return grouped;
    }, [matches]);

  const rounds =
    useMemo(() => {
      return Object.keys(
        matchesByRound,
      )
        .map(Number)
        .sort((a, b) => a - b);
    }, [matchesByRound]);

  // =====================================================
  // USER
  // =====================================================

  const isSuperAdmin =
    userType === "superadmin";

  const currentPlayerId =
    storedPlayer?.playerId;

  // =====================================================
  // RESULT PERMISSION
  // =====================================================

  // =====================================================
// RESULT PERMISSION
// =====================================================

const canSubmitMatch = (
  match: Match,
) => {
  /*
   * SuperAdmin can submit any match.
   */
  if (isSuperAdmin) {
    return true;
  }

  /*
   * Logged-in player's own match.
   */
  const isOwnMatch =
    match.homePlayerId ===
      currentPlayerId ||
    match.awayPlayerId ===
      currentPlayerId;

  /*
   * Admin can also submit matches
   * specifically assigned to them.
   */
  const isAssignedAdmin =
    userType === "player" &&
    storedPlayer?.isAdmin === true &&
    match.assignedAdminId ===
      currentPlayerId;

  return (
    isOwnMatch ||
    isAssignedAdmin
  );
};

  // =====================================================
  // GET PLAYER
  // =====================================================

  const getPlayer = (
    playerId: string,
  ) => {
    return division?.players?.find(
      (player) =>
        player.playerId ===
        playerId,
    );
  };

  // =====================================================
  // GET ASSIGNED ADMIN
  // =====================================================

  const getAssignedAdmin = (
    assignedAdminId: string | null,
  ) => {
    if (!assignedAdminId) {
      return null;
    }

    return division?.players?.find(
      (player) =>
        player.playerId ===
          assignedAdminId &&
        player.isAdmin === true,
    );
  };

  // =====================================================
  // FORMAT DEADLINE
  // =====================================================

  const formatDeadline = (
    deadline: string,
  ) => {
    const date =
      new Date(deadline);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "Invalid deadline";
    }

    return date.toLocaleString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  // =====================================================
  // FORMAT ROUND DATE
  // =====================================================

  const formatRoundDate = (
    roundMatches: Match[],
  ) => {
    if (!roundMatches.length) {
      return "";
    }

    const date =
      new Date(
        roundMatches[0]
          .deadline,
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    return date.toLocaleDateString(
      undefined,
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
  };

  // =====================================================
  // GET DATE FOR DATE INPUT
  // =====================================================

  const getDateInputValue = (
    deadline: string,
  ) => {
    const date =
      new Date(deadline);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      date.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =====================================================
  // CHANGE MATCH TIME
  // =====================================================

  const openChangeTime = (
    match: Match,
  ) => {
    /*
     * Only SCHEDULED matches can
     * be rescheduled.
     */
    if (
      match.status !==
      "SCHEDULED"
    ) {
      return;
    }

    setChangingTimeMatchId(
      match.matchId,
    );

    setNewMatchDate(
      getDateInputValue(
        match.deadline,
      ),
    );

    setError("");
  };

  // =====================================================
  // CLOSE CHANGE TIME
  // =====================================================

  const closeChangeTime = () => {
    setChangingTimeMatchId(
      null,
    );

    setNewMatchDate("");
  };

  // =====================================================
  // SAVE NEW MATCH DATE
  // =====================================================

  const handleChangeTime =
    async (
      match: Match,
    ) => {
      /*
       * A match can only be
       * rescheduled once.
       */
      if (
        match.status !==
        "SCHEDULED"
      ) {
        setError(
          "This match can no longer be rescheduled.",
        );

        return;
      }

      if (!newMatchDate) {
        setError(
          "Please select a date.",
        );

        return;
      }

      try {
        setSavingTime(true);
        setError("");

        const token =
          localStorage.getItem(
            "access_token",
          );

        if (!token) {
          router.push("/login");
          return;
        }

        const response =
          await fetch(
            `https://thrill-seekers-backend-production.up.railway.app/matches/${match.matchId}/change-time`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                newDate:
                  newMatchDate,
              }),
            },
          );

        let data: any = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              data?.message,
            )
              ? data.message.join(
                  ", ",
                )
              : data?.message ||
                  `Failed to change match date. HTTP ${response.status}`,
          );
        }

        closeChangeTime();

        await loadData();
      } catch (error) {
        console.error(
          "Change match time error:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to change match date.",
        );
      } finally {
        setSavingTime(false);
      }
    };

  // =====================================================
  // TOGGLE ROUND
  // =====================================================

  const toggleRound = (
    round: number,
  ) => {
    setExpandedRounds(
      (current) => {
        if (
          current.includes(
            round,
          )
        ) {
          return current.filter(
            (item) =>
              item !== round,
          );
        }

        return [
          ...current,
          round,
        ];
      },
    );
  };

  // =====================================================
  // MATCH STATS
  // =====================================================

  const completedMatches =
    matches.filter(
      (match) =>
        match.status ===
        "COMPLETED",
    ).length;

  const scheduledMatches =
    matches.filter(
      (match) =>
        match.status ===
        "SCHEDULED",
    ).length;

  const rescheduledMatches =
    matches.filter(
      (match) =>
        match.status ===
        "RESCHEDULED",
    ).length;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <Navbar />

      {/* Background glow */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />

      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ==================================================
            BACK
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/division",
            )
          }
          className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft
            size={17}
          />

          Back to Division
        </button>

        {/* ==================================================
            HEADER
        ================================================== */}

        {!loading &&
          division && (
            <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl sm:p-8">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="min-w-0">

                  <div className="mb-3 flex items-center gap-2 text-yellow-400">

                    <Trophy
                      size={19}
                    />

                    <span className="text-xs font-bold uppercase tracking-[0.2em]">
                      Division Matches
                    </span>

                  </div>

                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                    {division.name}
                  </h1>

                </div>

                {/* STATS */}

                <div className="grid grid-cols-3 gap-2 sm:gap-3">

                  <MiniStat
                    icon={
                      <Users
                        size={17}
                      />
                    }
                    value={
                      division
                        .players
                        ?.length ||
                      0
                    }
                    label="Players"
                  />

                  <MiniStat
                    icon={
                      <CalendarDays
                        size={
                          17
                        }
                      />
                    }
                    value={
                      rounds.length
                    }
                    label="Rounds"
                  />

                  <MiniStat
                    icon={
                      <CheckCircle2
                        size={
                          17
                        }
                      />
                    }
                    value={
                      matches.length
                    }
                    label="Matches"
                  />

                </div>

              </div>

              {/* MATCH PROGRESS */}

              {matches.length >
                0 && (
                <div className="mt-6 border-t border-white/10 pt-5">

                  <div className="flex items-center justify-between text-xs">

                    <span className="text-zinc-500">
                      Match Progress
                    </span>

                    <span className="font-semibold text-zinc-300">
                      {
                        completedMatches
                      }{" "}
                      /{" "}
                      {
                        matches.length
                      }
                    </span>

                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">

                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                      style={{
                        width: `${
                          matches.length >
                          0
                            ? (completedMatches /
                                matches.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />

                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-zinc-600">

                    <span>
                      {
                        scheduledMatches
                      }{" "}
                      scheduled
                    </span>

                    <span>
                      {
                        rescheduledMatches
                      }{" "}
                      rescheduled
                    </span>

                    <span>
                      {
                        completedMatches
                      }{" "}
                      completed
                    </span>

                  </div>

                </div>
              )}

            </section>
          )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <section className="flex min-h-[350px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50">

            <div className="flex flex-col items-center gap-3">

              <Loader2
                size={30}
                className="animate-spin text-yellow-400"
              />

              <p className="text-sm text-zinc-500">
                Loading matches...
              </p>

            </div>

          </section>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {!loading &&
          error && (
            <section className="mb-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-5 sm:p-6">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={22}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>

                  <h2 className="font-semibold text-red-400">
                    Unable to load matches
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-red-400/80">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadData
                    }
                    className="mt-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                  >
                    Try Again
                  </button>

                </div>

              </div>

            </section>
          )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          !error &&
          division &&
          matches.length ===
            0 && (
            <section className="rounded-3xl border border-white/10 bg-zinc-900/50 p-10 text-center sm:p-14">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/5">

                <CalendarDays
                  size={28}
                  className="text-yellow-400"
                />

              </div>

              <h2 className="mt-5 text-xl font-bold">
                No Matches Yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Matches have not been
                generated for this
                division yet.
              </p>

            </section>
          )}

        {/* ==================================================
            ROUNDS
        ================================================== */}

        {!loading &&
          !error &&
          division &&
          rounds.length > 0 && (
            <section>

              <div className="mb-5">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                  Schedule
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  All Rounds
                </h2>

              </div>

              <div className="space-y-4">

                {rounds.map(
                  (round) => {
                    const roundMatches =
                      matchesByRound[
                        round
                      ] || [];

                    const expanded =
                      expandedRounds.includes(
                        round,
                      );

                    const roundCompleted =
                      roundMatches.every(
                        (match) =>
                          match.status ===
                          "COMPLETED",
                      );

                    return (
                      <section
                        key={round}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl"
                      >

                        {/* ROUND HEADER */}

                        <button
                          type="button"
                          onClick={() =>
                            toggleRound(
                              round,
                            )
                          }
                          className="w-full text-left"
                        >

                          <div className="p-4 sm:p-6">

                            <div className="flex items-center justify-between gap-4">

                              <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-sm font-black text-yellow-400 sm:h-13 sm:w-13 sm:text-base">
                                  {round}
                                </div>

                                <div className="min-w-0">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h3 className="text-base font-bold sm:text-lg">
                                      Round{" "}
                                      {round}
                                    </h3>

                                    {roundCompleted && (
                                      <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-green-400">
                                        Completed
                                      </span>
                                    )}

                                  </div>

                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">

                                    <span>
                                      {formatRoundDate(
                                        roundMatches,
                                      )}
                                    </span>

                                    <span>
                                      {
                                        roundMatches.length
                                      }{" "}
                                      matches
                                    </span>

                                  </div>

                                </div>

                              </div>

                              <div className="flex shrink-0 items-center gap-2">

                                <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] text-zinc-500 sm:block">
                                  Deadline{" "}
                                  {formatDeadline(
                                    roundMatches[0]
                                      .deadline,
                                  )}
                                </div>

                                <div className="rounded-xl border border-white/10 p-2 text-zinc-500">

                                  {expanded ? (
                                    <ChevronUp
                                      size={18}
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={18}
                                    />
                                  )}

                                </div>

                              </div>

                            </div>

                          </div>

                        </button>

                        {/* ROUND MATCHES */}

                        {expanded && (
                          <div className="border-t border-white/10">

                            <div className="divide-y divide-white/5">

                              {roundMatches.map(
                                (
                                  match,
                                  matchIndex,
                                ) => {
                                  const homePlayer =
                                    getPlayer(
                                      match.homePlayerId,
                                    );

                                  const awayPlayer =
                                    getPlayer(
                                      match.awayPlayerId,
                                    );

                                  const assignedAdmin =
                                    getAssignedAdmin(
                                      match.assignedAdminId,
                                    );

                                  return (
                                    <MatchCard
                                      key={
                                        match.matchId
                                      }
                                      match={
                                        match
                                      }
                                      matchNumber={
                                        matchIndex +
                                        1
                                      }
                                      homePlayer={
                                        homePlayer
                                      }
                                      awayPlayer={
                                        awayPlayer
                                      }
                                      assignedAdmin={
                                        assignedAdmin
                                      }
                                      canSubmitResult={
                                        canSubmitMatch(
                                          match,
                                        )
                                      }
                                      isSuperAdmin={
                                        isSuperAdmin
                                      }
                                      changingTimeMatchId={
                                        changingTimeMatchId
                                      }
                                      newMatchDate={
                                        newMatchDate
                                      }
                                      savingTime={
                                        savingTime
                                      }
                                      onOpenChangeTime={
                                        openChangeTime
                                      }
                                      onCloseChangeTime={
                                        closeChangeTime
                                      }
                                      onDateChange={
                                        setNewMatchDate
                                      }
                                      onChangeTime={
                                        handleChangeTime
                                      }
                                      router={
                                        router
                                      }
                                    />
                                  );
                                },
                              )}

                            </div>

                          </div>
                        )}

                      </section>
                    );
                  },
                )}

              </div>

            </section>
          )}

      </div>
    </main>
  );
}

/* ================================================== */
/* MINI STAT */
/* ================================================== */

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center sm:px-5 sm:py-4">

      <div className="flex justify-center text-yellow-400">
        {icon}
      </div>

      <p className="mt-1.5 text-lg font-black sm:text-xl">
        {value}
      </p>

      <p className="text-[9px] uppercase tracking-wider text-zinc-600 sm:text-[10px]">
        {label}
      </p>

    </div>
  );
}

/* ================================================== */
/* MATCH CARD */
/* ================================================== */

function MatchCard({
  match,
  matchNumber,
  homePlayer,
  awayPlayer,
  assignedAdmin,
  canSubmitResult,
  isSuperAdmin,
  changingTimeMatchId,
  newMatchDate,
  savingTime,
  onOpenChangeTime,
  onCloseChangeTime,
  onDateChange,
  onChangeTime,
  router,
}: {
  match: Match;
  matchNumber: number;
  homePlayer?: Player;
  awayPlayer?: Player;
  assignedAdmin?: Player | null;
  canSubmitResult: boolean;
  isSuperAdmin: boolean;
  changingTimeMatchId: string | null;
  newMatchDate: string;
  savingTime: boolean;
  onOpenChangeTime: (
    match: Match,
  ) => void;
  onCloseChangeTime: () => void;
  onDateChange: (
    value: string,
  ) => void;
  onChangeTime: (
    match: Match,
  ) => void;
  router: ReturnType<
    typeof useRouter
  >;
}) {
  const isCompleted =
    match.status ===
    "COMPLETED";

  const isCancelled =
    match.status ===
    "CANCELLED";

  const isRescheduled =
    match.status ===
    "RESCHEDULED";

  const isChangingTime =
    changingTimeMatchId ===
    match.matchId;

  const adminName =
    assignedAdmin?.name ||
    "Not Assigned";

  // =====================================================
  // DATE PICKER
  // =====================================================

  const dateInputRef =
    useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    if (
      savingTime ||
      !dateInputRef.current
    ) {
      return;
    }

    try {
      dateInputRef.current.showPicker();
    } catch {
      dateInputRef.current.focus();
    }
  };

  return (
    <article className="p-4 sm:p-6">

      {/* ==================================================
          MATCH TOP
      ================================================== */}

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400">
            Match {matchNumber}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {isCompleted
              ? "Final Result"
              : isCancelled
              ? "Cancelled"
              : isRescheduled
              ? "Rescheduled Match"
              : "Scheduled Match"}
          </p>

        </div>

        <StatusBadge
          status={match.status}
        />

      </div>

      {/* ==================================================
          PLAYERS + SCORE
      ================================================== */}

      <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 sm:mt-5 sm:p-5">

        <div className="grid grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] sm:gap-5">

          {/* HOME */}

          <PlayerDisplay
            player={homePlayer}
            alignment="right"
          />

          {/* SCORE */}

          <div className="flex min-w-0 items-center justify-center">

            {isCompleted ? (
              <div className="flex items-center justify-center gap-1.5 sm:gap-3">

                <span className="w-7 text-center text-2xl font-black text-white sm:w-9 sm:text-3xl">
                  {match.homeScore}
                </span>

                <span className="text-xs font-bold text-zinc-700 sm:text-base">
                  -
                </span>

                <span className="w-7 text-center text-2xl font-black text-white sm:w-9 sm:text-3xl">
                  {match.awayScore}
                </span>

              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-12 sm:w-12">

                <span className="text-[9px] font-black tracking-wider text-zinc-600 sm:text-xs">
                  VS
                </span>

              </div>
            )}

          </div>

          {/* AWAY */}

          <PlayerDisplay
            player={awayPlayer}
            alignment="left"
          />

        </div>

        {/* ==================================================
            ASSIGNED ADMIN
        ================================================== */}

        <div className="mt-4 flex justify-center border-t border-white/5 pt-3">

          <div className="flex items-center gap-1.5">

            <ShieldCheck
              size={12}
              className={
                assignedAdmin
                  ? "text-yellow-400"
                  : "text-zinc-600"
              }
            />

            <span className="text-[9px] uppercase tracking-wider text-zinc-600 sm:text-[10px]">
              Admin:
            </span>

            <span
              className={
                assignedAdmin
                  ? "text-[10px] font-semibold text-zinc-400 sm:text-xs"
                  : "text-[10px] font-medium text-zinc-600 sm:text-xs"
              }
            >
              {adminName}
            </span>

          </div>

        </div>

      </div>

      {/* ==================================================
          DEADLINE
      ================================================== */}

      <div className="mt-4 flex flex-col items-start justify-between gap-2 text-xs sm:flex-row sm:items-center">

        <div className="flex items-center gap-2 text-zinc-500">

          <Clock size={14} />

          <span>
            Deadline:
          </span>

          <span className="font-semibold text-zinc-300">
            {formatDateTime(
              match.deadline,
            )}
          </span>

        </div>

      </div>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      {(canSubmitResult ||
        isSuperAdmin) && (
        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">

          {/* SUBMIT RESULT */}

          {canSubmitResult &&
            !isCompleted &&
            !isCancelled && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/matches/${match.matchId}/result`,
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 sm:w-auto"
              >
                <CheckCircle2
                  size={16}
                />

                Submit Match Result
              </button>
            )}

          {/* SUPERADMIN */}

          {isSuperAdmin && (
            <>
              {/* CHANGE TIME
                  ONLY SCHEDULED MATCHES
               */}

              {match.status ===
                "SCHEDULED" && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenChangeTime(
                      match,
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400/20 sm:w-auto"
                >
                  <Clock size={15} />

                  Change Time
                </button>
              )}

              {/* ADD ADMIN
                  ONLY WHEN MATCH IS NOT
                  COMPLETED/CANCELLED
               */}

              {!isCompleted &&
                !isCancelled && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/matches/${match.matchId}/admin`,
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  <UserPlus
                    size={15}
                  />

                  Add Admin
                </button>
              )}

            </>
          )}

        </div>
      )}

      {/* ==================================================
          CHANGE TIME CARD
      ================================================== */}

      {isChangingTime && (
        <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 sm:p-5">

          <div className="mb-4 flex items-start justify-between gap-3">

            <div>

              <h4 className="text-sm font-bold text-white sm:text-base">
                Change Match Time
              </h4>

              <p className="mt-1 text-[10px] leading-5 text-zinc-500 sm:text-xs">
                Select a new date. The
                current time will remain
                unchanged.
              </p>

            </div>

            <button
              type="button"
              onClick={
                onCloseChangeTime
              }
              disabled={
                savingTime
              }
              className="rounded-lg border border-white/10 p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

            {/* DATE */}

            <div className="flex-1">

              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 sm:text-xs">
                New Date
              </label>

              <div
                className="relative cursor-pointer"
                onClick={
                  openDatePicker
                }
              >

                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                />

                <input
                  ref={dateInputRef}
                  type="date"
                  value={
                    newMatchDate
                  }
                  onChange={(e) =>
                    onDateChange(
                      e.target.value,
                    )
                  }
                  onClick={
                    openDatePicker
                  }
                  onFocus={
                    openDatePicker
                  }
                  disabled={
                    savingTime
                  }
                  className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 pl-10 pr-12 text-sm text-white outline-none transition focus:border-yellow-400/50 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

            </div>

            {/* CANCEL */}

            <button
              type="button"
              onClick={
                onCloseChangeTime
              }
              disabled={
                savingTime
              }
              className="h-12 rounded-xl border border-white/10 px-5 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            {/* SAVE */}

            <button
              type="button"
              onClick={() =>
                onChangeTime(
                  match,
                )
              }
              disabled={
                savingTime ||
                !newMatchDate
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingTime ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                "Save Date"
              )}
            </button>

          </div>

        </div>
      )}

    </article>
  );
}

/* ================================================== */
/* PLAYER DISPLAY */
/* ================================================== */

function PlayerDisplay({
  player,
  alignment,
}: {
  player?: Player;
  alignment:
    | "left"
    | "right";
}) {
  return (
    <div
      className={`min-w-0 ${
        alignment === "right"
          ? "text-right"
          : "text-left"
      }`}
    >

      <p className="truncate text-[11px] font-bold text-white sm:text-base">
        {player?.name ||
          "Unknown Player"}
      </p>

      <p className="mt-1 truncate text-[8px] font-medium text-zinc-600 sm:text-xs">
        {player?.playerId ||
          "Unknown ID"}
      </p>

    </div>
  );
}

/* ================================================== */
/* STATUS */
/* ================================================== */

function StatusBadge({
  status,
}: {
  status: MatchStatus;
}) {
  if (
    status ===
    "COMPLETED"
  ) {
    return (
      <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-green-400">
        Completed
      </span>
    );
  }

  if (
    status ===
    "RESCHEDULED"
  ) {
    return (
      <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
        Rescheduled
      </span>
    );
  }

  if (
    status ===
    "CANCELLED"
  ) {
    return (
      <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-yellow-400">
      Scheduled
    </span>
  );
}

/* ================================================== */
/* DATE FORMAT */
/* ================================================== */

function formatDateTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
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
    },
  );
}