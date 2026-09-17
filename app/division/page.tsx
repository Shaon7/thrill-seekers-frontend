"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trophy,
  Users,
  X,
  CalendarDays,
} from "lucide-react";

type Player = {
  id: number;
  playerId: string;
  name: string;
  email: string;
  konamiId: string;
  deviceName: string;
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
  Status?: string | null;
  players: Player[];
};

type PointTableRow = {
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
};

export default function DivisionsPage() {
  const router = useRouter();

  const [divisions, setDivisions] =
    useState<Division[]>([]);

  const [pointTables, setPointTables] =
    useState<
      Record<string, PointTableRow[]>
    >({});

  const [loading, setLoading] =
    useState(true);

  const [tableLoading, setTableLoading] =
    useState(false);

  const [isSuperAdmin, setIsSuperAdmin] =
    useState(false);

  const [loggedInPlayerId, setLoggedInPlayerId] =
    useState<string>("");

  // Create Division
  const [showCreate, setShowCreate] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [divisionNumber, setDivisionNumber] =
    useState("");

  const [numberOfPlayers, setNumberOfPlayers] =
    useState("");

  // Mobile/table expansion
  const [expandedDivision, setExpandedDivision] =
    useState<string | null>(null);

  // Show all divisions
  const [showAllDivisions, setShowAllDivisions] =
    useState(false);

  useEffect(() => {
    const userType =
      localStorage.getItem("userType");

    if (
      userType?.toLowerCase() ===
      "superadmin"
    ) {
      setIsSuperAdmin(true);
    }

    /*
     * Load logged-in player
     */
    const storedPlayer =
      localStorage.getItem("player");

    if (storedPlayer) {
      try {
        const loggedInPlayer: Player =
          JSON.parse(storedPlayer);

        setLoggedInPlayerId(
          loggedInPlayer?.playerId || ""
        );
      } catch {
        setLoggedInPlayerId("");
      }
    }

    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "https://thrill-seekers-backend-production.up.railway.app/divisions"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch divisions"
        );
      }

      const data: Division[] =
        await response.json();

      const sorted = [...data].sort(
        (a, b) => {
          if (
            a.season !==
            b.season
          ) {
            return (
              b.season -
              a.season
            );
          }

          if (
            a.phase !==
            b.phase
          ) {
            return (
              a.phase -
              b.phase
            );
          }

          return (
            a.divisionNumber -
            b.divisionNumber
          );
        }
      );

      setDivisions(sorted);

      /*
       * Find ACTIVE divisions.
       *
       * Status is normalized so:
       * active
       * Active
       * ACTIVE
       *  active
       *
       * all work.
       */
      const activeDivisions =
        sorted.filter(
          (division) =>
            division.Status
              ?.trim()
              .toLowerCase() ===
            "active"
        );

      /*
       * Automatically open the first
       * active division.
       */
      if (
        activeDivisions.length >
        0
      ) {
        setExpandedDivision(
          activeDivisions[0]
            .divisionId
        );
      } else if (
        sorted.length > 0
      ) {
        /*
         * Fallback only when there is
         * no active division.
         */
        setExpandedDivision(
          sorted[0].divisionId
        );
      }

      await fetchAllPointTables(
        sorted
      );
    } catch (error) {
      console.error(
        "Error fetching divisions:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPointTables = async (
    divisionList: Division[]
  ) => {
    try {
      setTableLoading(true);

      const results =
        await Promise.all(
          divisionList.map(
            async (division) => {
              try {
                const response =
                  await fetch(
                    `https://thrill-seekers-backend-production.up.railway.app/point-tables/competition/${division.competitionId}`
                  );

                if (
                  !response.ok
                ) {
                  return {
                    competitionId:
                      division.competitionId,
                    rows: [],
                  };
                }

                const rows:
                  PointTableRow[] =
                  await response.json();

                return {
                  competitionId:
                    division.competitionId,
                  rows,
                };
              } catch (error) {
                console.error(
                  `Error loading table for ${division.divisionId}:`,
                  error
                );

                return {
                  competitionId:
                    division.competitionId,
                  rows: [],
                };
              }
            }
          )
        );

      const tableMap: Record<
        string,
        PointTableRow[]
      > = {};

      results.forEach(
        (item) => {
          tableMap[
            item.competitionId
          ] = item.rows;
        }
      );

      setPointTables(
        tableMap
      );
    } finally {
      setTableLoading(false);
    }
  };

  const getPlayerName = (
    division: Division,
    playerId: string
  ): string => {
    const player =
      division.players?.find(
        (item) =>
          item.playerId ===
          playerId
      );

    return (
      player?.name ||
      "Unknown Player"
    );
  };

  const handleCreateDivision =
    async () => {
      if (!divisionNumber || !numberOfPlayers) {
        alert(
          "Please select a Tier and enter the Number of Players."
        );
        return;
      }

      try {
        setCreating(true);

        const token =
          localStorage.getItem(
            "access_token"
          );

        const response =
          await fetch(
            "https://thrill-seekers-backend-production.up.railway.app/divisions",
            {
              method: "POST",

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

              body: JSON.stringify({
                // Backend still requires these fields.
                // They are fixed internally for the new league structure.
                season: 2026,
                phase: 1,
                divisionNumber: Number(divisionNumber),
                NumberOfPlayer: Number(numberOfPlayers),
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

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              data?.message
            )
              ? data.message.join(
                  ", "
                )
              : data?.message ||
                  "Failed to create division."
          );
        }

        if (
          !data?.divisionId
        ) {
          throw new Error(
            "Division was created, but the division ID was not returned."
          );
        }

        /*
         * After creating the division,
         * go directly to Add Players page.
         */
        router.push(
          `/division/${data.divisionId}/players`
        );
      } catch (error) {
        console.error(
          "Create division error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to create division."
        );
      } finally {
        setCreating(false);
      }
    };

  const toggleDivision = (
    divisionId: string
  ) => {
    setExpandedDivision(
      (current) =>
        current ===
        divisionId
          ? null
          : divisionId
    );
  };

  /*
   * ==================================================
   * ACTIVE DIVISIONS
   * ==================================================
   */

  const activeDivisions =
    divisions.filter(
      (division) =>
        division.Status
          ?.trim()
          .toLowerCase() ===
        "active"
    );

  /*
   * ==================================================
   * DISPLAYED DIVISIONS
   * ==================================================
   */

  const displayedDivisions =
    showAllDivisions
      ? divisions
      : activeDivisions;

  /*
   * ==================================================
   * DIVISION THEME
   * ==================================================
   */

  const getDivisionTheme = (
    divisionNumber: number
  ) => {
    /*
     * Division 1 = Red
     */
    if (
      divisionNumber === 1
    ) {
      return {
        border:
          "border-red-500/20",
        background:
          "bg-red-500/5",
        accent:
          "text-red-400",
        accentBorder:
          "border-red-500/20",
        accentBackground:
          "bg-red-500/10",
      };
    }

    /*
     * Division 2 = Orange
     */
    if (
      divisionNumber === 2
    ) {
      return {
        border:
          "border-orange-500/20",
        background:
          "bg-orange-500/5",
        accent:
          "text-orange-400",
        accentBorder:
          "border-orange-500/20",
        accentBackground:
          "bg-orange-500/10",
      };
    }

    /*
     * All other divisions = Green
     */
    return {
      border:
        "border-green-500/20",
      background:
        "bg-green-500/5",
      accent:
        "text-green-400",
      accentBorder:
        "border-green-500/20",
      accentBackground:
        "bg-green-500/10",
    };
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <Navbar />

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />

      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* HEADER */}

        <section className="mb-6 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl sm:p-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-2 text-yellow-400">

                <Trophy size={20} />

                <span className="text-sm font-semibold uppercase tracking-[0.2em]">
                  Thrill Seekers
                </span>

              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                League
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Follow the current competitions,
                player standings and division
                performance.
              </p>

            </div>

            {isSuperAdmin && (
              <button
                onClick={() =>
                  setShowCreate(true)
                }
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3.5 font-bold text-black transition hover:bg-yellow-300 active:scale-[0.98] sm:w-auto"
              >
                <Plus size={19} />
                Create Division
              </button>
            )}

          </div>

        </section>

        {/* CREATE DIVISION */}

        {showCreate &&
          isSuperAdmin && (
            <section className="mb-6 rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl sm:p-7">

              <div className="mb-6 flex items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                    SuperAdmin
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Create Division
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Enter the details for the new
                    division.
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowCreate(false)
                  }
                  className="rounded-xl border border-white/10 p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Tier */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Tier / Division
                  </label>

                  <select
                    value={divisionNumber}
                    onChange={(e) =>
                      setDivisionNumber(
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-yellow-400/50"
                  >
                    <option value="">
                      Select a Tier
                    </option>
                    <option value="1">
                      Tier 1 — Thrill Seekers Premier League
                    </option>
                    <option value="2">
                      Tier 2 — Thrill Seekers Championship
                    </option>
                    <option value="3">
                      Tier 3 — Thrill Seekers League One
                    </option>
                  </select>

                </div>

                {/* Number of Players */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Number of Players
                  </label>

                  <input
                    type="number"
                    placeholder="10"
                    min="1"
                    value={numberOfPlayers}
                    onChange={(e) =>
                      setNumberOfPlayers(
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/50"
                  />

                </div>

              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                <button
                  onClick={() =>
                    setShowCreate(false)
                  }
                  disabled={
                    creating
                  }
                  className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleCreateDivision
                  }
                  disabled={
                    creating
                  }
                  className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Division"}
                </button>

              </div>

            </section>
          )}

        {/* DIVISIONS */}

        {loading ? (

          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10">

            <div className="flex flex-col items-center justify-center py-12">

              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-yellow-400" />

              <p className="mt-4 text-sm text-zinc-500">
                Loading divisions...
              </p>

            </div>

          </section>

        ) : divisions.length ===
          0 ? (

          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 text-center sm:p-12">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/5">

              <Trophy
                className="text-yellow-400"
                size={28}
              />

            </div>

            <h2 className="mt-5 text-xl font-bold">
              No Divisions Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              There are currently no divisions
              available.
            </p>

            {isSuperAdmin && (
              <button
                onClick={() =>
                  setShowCreate(true)
                }
                className="mt-5 rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"
              >
                Create First Division
              </button>
            )}

          </section>

        ) : (

          <>

            {/* ==================================================
                NO ACTIVE DIVISIONS
            ================================================== */}

            {activeDivisions.length ===
              0 &&
              !showAllDivisions && (
                <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 text-center sm:p-12">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/5">

                    <Trophy
                      className="text-yellow-400"
                      size={28}
                    />

                  </div>

                  <h2 className="mt-5 text-xl font-bold">
                    No Active Divisions
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                    There are currently no active
                    divisions.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAllDivisions(
                        true
                      )
                    }
                    className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-5 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400/20"
                  >
                    See All Divisions
                  </button>

                </section>
              )}

            {/* ==================================================
                DIVISION LIST
            ================================================== */}

            {displayedDivisions.length >
              0 && (
              <div className="space-y-5">

                {displayedDivisions.map(
                  (
                    division,
                    index
                  ) => {

                    const rows =
                      pointTables[
                        division.competitionId
                      ] || [];

                    const isExpanded =
                      expandedDivision ===
                      division.divisionId;

                    const theme =
                      getDivisionTheme(
                        division.divisionNumber
                      );

                    const isActiveDivision =
                      division.Status
                        ?.trim()
                        .toLowerCase() ===
                      "active";

                    return (
                      <section
                        key={
                          division.divisionId
                        }
                        className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl"
                      >

                        {/* DIVISION HEADER */}

                        <button
                          onClick={() =>
                            toggleDivision(
                              division.divisionId
                            )
                          }
                          className="w-full text-left"
                        >
                          <div className="p-5 sm:p-6">

                            <div className="flex items-center justify-between gap-4">

                              <div className="flex min-w-0 items-center gap-4">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-lg font-black text-yellow-400">
                                  {
                                    division.divisionNumber
                                  }
                                </div>

                                <div className="min-w-0">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h2 className="truncate text-lg font-bold sm:text-xl">
                                      {
                                        division.name
                                      }
                                    </h2>

                                    {isActiveDivision && (
                                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                                        Current
                                      </span>
                                    )}

                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">

                                    <span>
                                      {
                                        division.divisionId
                                      }
                                    </span>

                                    <span className="flex items-center gap-1">
                                      <Users
                                        size={
                                          13
                                        }
                                      />

                                      {
                                        division
                                          .players
                                          ?.length ||
                                        0
                                      }{" "}
                                      Players
                                    </span>

                                    <span>
                                      Season{" "}
                                      {
                                        division.season
                                      }
                                    </span>

                                    <span>
                                      Phase{" "}
                                      {
                                        division.phase
                                      }
                                    </span>

                                  </div>

                                </div>
                              </div>

                              <div className="shrink-0 rounded-xl border border-white/10 p-2 text-zinc-400">

                                {isExpanded ? (
                                  <ChevronUp
                                    size={
                                      20
                                    }
                                  />
                                ) : (
                                  <ChevronDown
                                    size={
                                      20
                                    }
                                  />
                                )}

                              </div>

                            </div>
                          </div>
                        </button>

                        {/* POINT TABLE */}

                        {isExpanded && (
                          <div className="border-t border-white/10">

                            <div className="p-4 sm:p-6">

                              {/* POINT TABLE HEADER */}

                              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                <div>

                                  <h3 className="text-lg font-bold">
                                    Point Table
                                  </h3>

                                  <p className="mt-1 text-xs text-zinc-500">
                                    Current division
                                    standings
                                  </p>

                                </div>

                                <div className="flex items-center gap-2">

                                  <span className="hidden rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-400 sm:block">
                                    {
                                      rows.length
                                    }{" "}
                                    Players
                                  </span>

                                  {/* SEE ALL MATCHES */}

                                  <button
                                    onClick={(
                                      event
                                    ) => {
                                      event.stopPropagation();

                                      router.push(
                                        `/division/${division.divisionId}/matches`
                                      );
                                    }}
                                    className="flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2.5 text-xs font-bold text-yellow-400 transition hover:bg-yellow-400/20 active:scale-[0.98]"
                                  >
                                    <CalendarDays
                                      size={
                                        15
                                      }
                                    />

                                    See All Matches

                                  </button>

                                </div>
                              </div>

                              {/* TABLE LOADING */}

                              {tableLoading &&
                              rows.length ===
                                0 ? (

                                <div className="rounded-2xl border border-white/10 bg-black/20 py-10 text-center">

                                  <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-yellow-400" />

                                  <p className="mt-3 text-xs text-zinc-500">
                                    Loading point
                                    table...
                                  </p>

                                </div>

                              ) : rows.length ===
                                0 ? (

                                <div className="rounded-2xl border border-white/10 bg-black/20 py-10 text-center">

                                  <Trophy
                                    size={
                                      26
                                    }
                                    className="mx-auto text-zinc-600"
                                  />

                                  <p className="mt-3 text-sm font-medium text-zinc-400">
                                    No point table
                                    data yet
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-600">
                                    Players and match
                                    results will
                                    appear here.
                                  </p>

                                </div>

                              ) : (

                                <div
                                  className={`overflow-x-auto rounded-2xl border ${theme.border}`}
                                >

                                  <table className="w-full min-w-[850px] border-collapse text-left">

                                    <thead>
                                      <tr
                                        className={`border-b ${theme.border} ${theme.background}`}
                                      >

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          POS
                                        </th>

                                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          PLAYER
                                        </th>

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          MP
                                        </th>

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          W
                                        </th>

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          D
                                        </th>

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          L
                                        </th>

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          PTS
                                        </th>

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          GD
                                        </th>

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          GF
                                        </th>

                                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
                                          GA
                                        </th>

                                      </tr>
                                    </thead>

                                    <tbody>

                                      {rows.map(
                                        (
                                          row,
                                          rowIndex
                                        ) => {

                                          const playerName =
                                            getPlayerName(
                                              division,
                                              row.playerId
                                            );

                                          const isLoggedInPlayer =
                                            row.playerId ===
                                            loggedInPlayerId;

                                          return (
                                            <tr
                                              key={
                                                row.id
                                              }
                                              className={`border-b border-white/5 transition last:border-0 ${
                                                isLoggedInPlayer
                                                  ? "bg-yellow-400/10 hover:bg-yellow-400/15"
                                                  : "hover:bg-white/[0.025]"
                                              }`}
                                            >

                                              {/* POSITION */}

                                              <td className="px-4 py-4 text-center">

                                                <div
                                                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                                                    rowIndex ===
                                                    0
                                                      ? `${theme.accentBackground} ${theme.accent}`
                                                      : "bg-white/5 text-zinc-400"
                                                  }`}
                                                >
                                                  {rowIndex +
                                                    1}
                                                </div>

                                              </td>

                                              {/* PLAYER */}

                                              <td className="px-4 py-4">

                                                <div className="flex items-center gap-3">

                                                  <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                                      isLoggedInPlayer
                                                        ? `${theme.accentBackground} ${theme.accent}`
                                                        : "bg-white/5 text-zinc-400"
                                                    }`}
                                                  >
                                                    {playerName
                                                      .charAt(
                                                        0
                                                      )
                                                      .toUpperCase()}
                                                  </div>

                                                  <div className="min-w-0">

                                                    <div className="flex items-center">

                                                      <p
                                                        className={`max-w-[220px] truncate font-semibold ${
                                                          isLoggedInPlayer
                                                            ? "text-yellow-400"
                                                            : "text-white"
                                                        }`}
                                                      >
                                                        {
                                                          playerName
                                                        }
                                                      </p>

                                                      {isLoggedInPlayer && (
                                                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                                                          You
                                                        </span>
                                                      )}

                                                    </div>

                                                    <p className="mt-0.5 text-[10px] text-zinc-600">
                                                      {
                                                        row.playerId
                                                      }
                                                    </p>

                                                  </div>
                                                </div>

                                              </td>

                                              {/* MATCH PLAYED */}

                                              <td className="px-4 py-4 text-center text-sm text-zinc-300">
                                                {
                                                  row.played
                                                }
                                              </td>

                                              {/* WON */}

                                              <td className="px-4 py-4 text-center text-sm text-zinc-300">
                                                {
                                                  row.won
                                                }
                                              </td>

                                              {/* DRAWN */}

                                              <td className="px-4 py-4 text-center text-sm text-zinc-300">
                                                {
                                                  row.drawn
                                                }
                                              </td>

                                              {/* LOST */}

                                              <td className="px-4 py-4 text-center text-sm text-zinc-300">
                                                {
                                                  row.lost
                                                }
                                              </td>

                                              {/* POINTS */}

                                              <td className="px-4 py-4 text-center">

                                                <span
                                                  className={`font-black ${
                                                    isLoggedInPlayer
                                                      ? "text-yellow-400"
                                                      : theme.accent
                                                  }`}
                                                >
                                                  {
                                                    row.points
                                                  }
                                                </span>

                                              </td>

                                              {/* GOAL DIFFERENCE */}

                                              <td className="px-4 py-4 text-center text-sm font-medium text-zinc-300">

                                                {row.goalDifference >
                                                0
                                                  ? `+${row.goalDifference}`
                                                  : row.goalDifference}

                                              </td>

                                              {/* GOALS FOR */}

                                              <td className="px-4 py-4 text-center text-sm text-zinc-300">
                                                {
                                                  row.goalsFor
                                                }
                                              </td>

                                              {/* GOALS AGAINST */}

                                              <td className="px-4 py-4 text-center text-sm text-zinc-300">
                                                {
                                                  row.goalsAgainst
                                                }
                                              </td>

                                            </tr>
                                          );
                                        }
                                      )}

                                    </tbody>

                                  </table>

                                </div>
                              )}

                              {rows.length >
                                0 && (
                                <p className="mt-3 text-center text-[10px] text-zinc-600 sm:hidden">
                                  Swipe left/right to
                                  view the full table
                                </p>
                              )}

                            </div>
                          </div>
                        )}

                      </section>
                    );
                  }
                )}

              </div>
            )}

            {/* ==================================================
                SEE ALL DIVISIONS
            ================================================== */}

            {!showAllDivisions &&
              divisions.length >
                activeDivisions.length && (
                <div className="flex justify-center pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setShowAllDivisions(
                        true
                      )
                    }
                    className="rounded-2xl border border-white/10 bg-zinc-900/60 px-6 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/20 hover:bg-yellow-400/10 hover:text-yellow-400"
                  >
                    See All Divisions
                  </button>

                </div>
              )}

          </>
        )}

      </div>
    </main>
  );
}
