
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";

import {
  ArrowLeft,
  Check,
  Loader2,
  Search,
  Users,
  UserPlus,
  AlertCircle,
  X,
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
  players: Player[];
};

export default function AddDivisionPlayersPage() {
  const params = useParams();
  const router = useRouter();

  const divisionId =
    params.divisionId as string;

  const [division, setDivision] =
    useState<Division | null>(null);

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [savingRoster, setSavingRoster] =
    useState(false);

  const [replacingPlayerId, setReplacingPlayerId] =
    useState<string | null>(null);

  /*
   * Players that were already in the division
   * when this page was opened.
   */
  const [initialPlayerIds, setInitialPlayerIds] =
    useState<Set<string>>(
      new Set()
    );

  const [loading, setLoading] =
    useState(true);

  const [addingPlayer, setAddingPlayer] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  /*
   * ==================================================
   * DONE — SAVE ROSTER ONLY
   * ==================================================
   *
   * This function does NOT generate matches.
   * Match generation and league setup happen separately
   * when SuperAdmin clicks Start League.
   */
  const handleDone = async () => {
    if (
      !division ||
      savingRoster ||
      replacingPlayerId
    ) {
      return;
    }

    try {
      setSavingRoster(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        router.push("/login");
        return;
      }

      const currentIds =
        new Set(
          division.players.map(
            (player) =>
              player.playerId
          )
        );

      /*
       * Players selected on this page
       * who were not in the saved roster initially.
       */
      const newlyAddedPlayers =
        division.players.filter(
          (player) =>
            !initialPlayerIds.has(
              player.playerId
            )
        );

      /*
       * Previously saved players removed
       * from the current frontend roster.
       */
      const removedPlayerIds =
        [...initialPlayerIds].filter(
          (playerId) =>
            !currentIds.has(
              playerId
            )
        );

      /*
       * SAVE NEWLY ADDED PLAYERS
       */
      for (
        const player of newlyAddedPlayers
      ) {
        const response =
          await fetch(
            `https://thrill-seekers-backend-production.up.railway.app/divisions/${division.divisionId}/players/${player.playerId}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json().catch(
            () => ({})
          );

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              data?.message
            )
              ? data.message.join(
                  ", "
                )
              : data?.message ||
                  `Failed to add ${player.name}.`
          );
        }
      }

      /*
       * SAVE PLAYER REMOVALS
       */
      for (
        const playerId of removedPlayerIds
      ) {
        const response =
          await fetch(
            `https://thrill-seekers-backend-production.up.railway.app/divisions/${division.divisionId}/players/${playerId}`,
            {
              method: "DELETE",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json().catch(
            () => ({})
          );

        if (!response.ok) {
          throw new Error(
            Array.isArray(
              data?.message
            )
              ? data.message.join(
                  ", "
                )
              : data?.message ||
                  `Failed to remove ${playerId}.`
          );
        }
      }

      /*
       * ROSTER SAVED.
       *
       * Do not generate matches here.
       * Do not create payments here.
       * Do not start the league here.
       */
      router.push(
        "/division"
      );

    } catch (error) {
      console.error(
        "Save division roster error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save the player list."
      );
    } finally {
      setSavingRoster(false);
    }
  };

  /*
   * ==================================================
   * LOAD DIVISION AND PLAYERS
   * ==================================================
   */

  useEffect(() => {
    if (divisionId) {
      loadData();
    }
  }, [divisionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        divisionResponse,
        playersResponse,
      ] = await Promise.all([
        fetch(
          `https://thrill-seekers-backend-production.up.railway.app/divisions/${divisionId}`
        ),

        fetch(
          "https://thrill-seekers-backend-production.up.railway.app/player"
        ),
      ]);

      let divisionData: any = {};
      let playersData: any = [];

      try {
        divisionData =
          await divisionResponse.json();
      } catch {
        divisionData = {};
      }

      try {
        playersData =
          await playersResponse.json();
      } catch {
        playersData = [];
      }

      if (!divisionResponse.ok) {
        throw new Error(
          divisionData?.message ||
            "Failed to load division."
        );
      }

      if (!playersResponse.ok) {
        throw new Error(
          playersData?.message ||
            "Failed to load players."
        );
      }

      if (
        !Array.isArray(
          playersData
        )
      ) {
        throw new Error(
          "Invalid player data received from server."
        );
      }

      setDivision({
        ...divisionData,
        players: Array.isArray(
          divisionData.players
        )
          ? divisionData.players
          : [],
      });

      setPlayers(
        playersData
      );

      /*
       * Remember which players were already
       * in the division when the page opened.
       */
      setInitialPlayerIds(
        new Set(
          (
            divisionData.players ||
            []
          ).map(
            (player: Player) =>
              player.playerId
          )
        )
      );

    } catch (error) {
      console.error(
        "Add players page error:",
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
          "Something went wrong while loading the page."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==================================================
   * CURRENT FRONTEND PLAYER LIST
   * ==================================================
   */

  const addedPlayerIds =
    useMemo(() => {
      if (!division?.players) {
        return new Set<string>();
      }

      return new Set(
        division.players.map(
          (player) =>
            player.playerId
        )
      );
    }, [division]);

  /*
   * ==================================================
   * FILTER PLAYERS
   * ==================================================
   */

  const filteredPlayers =
    useMemo(() => {
      const value =
        search
          .trim()
          .toLowerCase();

      if (!value) {
        return players;
      }

      return players.filter(
        (player) =>
          player.name
            .toLowerCase()
            .includes(value) ||
          player.playerId
            .toLowerCase()
            .includes(value)
      );
    }, [
      players,
      search,
    ]);

  /*
   * ==================================================
   * PLAYER COUNT
   * ==================================================
   */

  const currentPlayerCount =
    division?.players?.length ||
    0;

  const maximumPlayers =
    division?.NumberOfPlayer ??
    null;

  const isFull =
    maximumPlayers !== null &&
    currentPlayerCount >=
      maximumPlayers;

  /*
   * ==================================================
   * ADD PLAYER
   * ==================================================
   *
   * FRONTEND ONLY.
   * The selection is saved when Done is clicked.
   */

  const handleAddPlayer = (
    playerId: string
  ) => {
    if (!division) {
      return;
    }

    /*
     * Frontend duplicate protection.
     */
    if (
      addedPlayerIds.has(
        playerId
      )
    ) {
      return;
    }

    /*
     * Maximum player protection.
     */
    if (
      maximumPlayers !== null &&
      currentPlayerCount >=
        maximumPlayers
    ) {
      alert(
        "This division already has the maximum number of players."
      );
      return;
    }

    const playerToAdd =
      players.find(
        (player) =>
          player.playerId ===
          playerId
      );

    if (!playerToAdd) {
      return;
    }

    /*
     * Add only to the frontend list.
     */
    setDivision(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          players: [
            ...(current.players ||
              []),
            playerToAdd,
          ],
        };
      }
    );
  };

  /*
   * ==================================================
   * REMOVE PLAYER
   * ==================================================
   *
   * FRONTEND ONLY.
   * The removal is saved when Done is clicked.
   */

  const handleRemovePlayer = (
    playerId: string
  ) => {
    if (!division) {
      return;
    }

    /*
     * Remove only from the frontend list.
     */
    setDivision(
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,

          players:
            current.players.filter(
              (player) =>
                player.playerId !==
                playerId
            ),
        };
      }
    );
  };

  /*
   * ==================================================
   * REPLACE PLAYER
   * ==================================================
   *
   * Uses the existing backend replacement endpoint.
   * Replacement is saved immediately by the backend.
   * It does not generate matches or create payments.
   */

  const handleReplacePlayer = async (
    newPlayerId: string
  ) => {
    if (
      !division ||
      !replacingPlayerId ||
      addingPlayer
    ) {
      return;
    }

    const oldPlayerId =
      replacingPlayerId;

    /*
     * Only replace an existing saved player.
     */
    if (
      !initialPlayerIds.has(
        oldPlayerId
      )
    ) {
      alert(
        "Only a player already saved in this division can be replaced."
      );
      return;
    }

    /*
     * The replacement player must not
     * already be in this division.
     */
    if (
      addedPlayerIds.has(
        newPlayerId
      )
    ) {
      alert(
        "That player is already in this division."
      );
      return;
    }

    const newPlayer =
      players.find(
        (player) =>
          player.playerId ===
          newPlayerId
      );

    if (!newPlayer) {
      return;
    }

    try {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        router.push("/login");
        return;
      }

      setAddingPlayer(
        newPlayerId
      );

      const response =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/divisions/${division.divisionId}/players/${oldPlayerId}/replace/${newPlayerId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const data =
        await response.json().catch(
          () => ({})
        );

      if (!response.ok) {
        throw new Error(
          Array.isArray(
            data?.message
          )
            ? data.message.join(
                ", "
              )
            : data?.message ||
                "Failed to replace player."
        );
      }

      /*
       * Update the visible roster.
       */
      setDivision(
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,

            players:
              current.players.map(
                (player) =>
                  player.playerId ===
                  oldPlayerId
                    ? newPlayer
                    : player
              ),
          };
        }
      );

      /*
       * Update the saved-player baseline.
       * Done will not add or remove the replacement again.
       */
      setInitialPlayerIds(
        (current) => {
          const next =
            new Set(current);

          next.delete(
            oldPlayerId
          );

          next.add(
            newPlayerId
          );

          return next;
        }
      );

      setReplacingPlayerId(
        null
      );

    } catch (error) {
      console.error(
        "Replace player error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to replace player."
      );
    } finally {
      setAddingPlayer(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <Navbar />

      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* BACK */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/division"
            )
          }
          className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft
            size={17}
          />

          Back to Divisions
        </button>

        {/* HEADER */}

        {!loading &&
          division && (
            <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl sm:p-8">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="mb-3 flex items-center gap-2 text-yellow-400">

                    <Users
                      size={20}
                    />

                    <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                      Add Players
                    </span>

                  </div>

                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                    {division.name}
                  </h1>

                  <p className="mt-2 text-sm text-zinc-500">
                    {
                      division.divisionId
                    }
                  </p>

                </div>

                {/* PLAYER COUNT */}

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">

                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Players
                  </p>

                  <p className="mt-1 text-2xl font-black text-yellow-400">
                    {
                      currentPlayerCount
                    }

                    {maximumPlayers !==
                    null
                      ? ` / ${maximumPlayers}`
                      : ""}
                  </p>

                </div>

              </div>

            </section>
          )}

        {/* ERROR */}

        {!loading &&
          error && (
            <section className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>

                  <p className="font-semibold text-red-400">
                    Unable to load players
                  </p>

                  <p className="mt-1 text-sm text-red-400/80">
                    {error}
                  </p>

                </div>

              </div>

            </section>
          )}

        {/* LOADING */}

        {loading && (
          <section className="flex min-h-[350px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50">

            <div className="flex flex-col items-center gap-3">

              <Loader2
                size={30}
                className="animate-spin text-yellow-400"
              />

              <p className="text-sm text-zinc-500">
                Loading players...
              </p>

            </div>

          </section>
        )}

        {/* PLAYER SECTION */}

        {!loading &&
          division && (
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl">

              {/* TOP */}

              <div className="border-b border-white/10 p-5 sm:p-6">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <h2 className="text-xl font-bold">
                      All Players
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      Select players to add to this
                      division.
                    </p>

                  </div>

                  <div className="relative w-full sm:w-72">

                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                    />

                    <input
                      type="text"
                      value={search}
                      onChange={(e) =>
                        setSearch(
                          e.target.value
                        )
                      }
                      placeholder="Search player..."
                      className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
                    />

                  </div>

                </div>

              </div>

              {/* REPLACEMENT INSTRUCTION */}

              {replacingPlayerId && (
                <div className="border-b border-yellow-400/20 bg-yellow-400/5 px-5 py-3">

                  <p className="text-sm text-yellow-400">
                    Select a replacement for{" "}
                    <strong>
                      {
                        division.players.find(
                          (player) =>
                            player.playerId ===
                            replacingPlayerId
                        )?.name
                      }
                    </strong>.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setReplacingPlayerId(
                        null
                      )
                    }
                    className="mt-2 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel replacement
                  </button>

                </div>
              )}

              {/* FULL WARNING */}

              {isFull && !replacingPlayerId && (
                <div className="border-b border-yellow-400/10 bg-yellow-400/5 px-5 py-3">

                  <p className="text-sm font-medium text-yellow-400">
                    This division has reached its maximum
                    number of players.
                  </p>

                </div>
              )}

              {/* PLAYERS */}

              <div className="divide-y divide-white/5">

                {filteredPlayers.length ===
                0 ? (

                  <div className="p-10 text-center">

                    <Users
                      size={28}
                      className="mx-auto text-zinc-600"
                    />

                    <p className="mt-3 font-medium text-zinc-400">
                      No players found
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Try a different name or THS ID.
                    </p>

                  </div>

                ) : (

                  filteredPlayers.map(
                    (player) => {

                      const isAdded =
                        addedPlayerIds.has(
                          player.playerId
                        );

                      const isBeingReplaced =
                        replacingPlayerId ===
                        player.playerId;

                      return (
                        <div
                          key={
                            player.playerId
                          }
                          className="flex items-center justify-between gap-4 p-5 transition hover:bg-white/[0.02] sm:px-6"
                        >

                          {/* PLAYER INFO */}

                          <div className="flex min-w-0 items-center gap-4">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10 text-sm font-black text-yellow-400">
                              {player.name
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">

                              {/* NAME FIRST */}

                              <p className="truncate text-sm font-bold text-white sm:text-base">
                                {
                                  player.name
                                }
                              </p>

                              {/* THS ID BELOW */}

                              <p className="mt-1 text-xs font-medium text-zinc-600">
                                {
                                  player.playerId
                                }
                              </p>

                            </div>

                          </div>

                          {/* ADD / REMOVE / REPLACE BUTTONS */}

                          {isAdded ? (

                            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">

                              {isBeingReplaced ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplacingPlayerId(
                                      null
                                    )
                                  }
                                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-white/10 sm:px-4"
                                >
                                  <X size={16} />
                                  Cancel
                                </button>

                              ) : (

                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemovePlayer(
                                        player.playerId
                                      )
                                    }
                                    className="flex shrink-0 items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-400/20 sm:px-4"
                                  >
                                    <X size={16} />
                                    Remove
                                  </button>

                                  {initialPlayerIds.has(
                                    player.playerId
                                  ) && !replacingPlayerId && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReplacingPlayerId(
                                          player.playerId
                                        )
                                      }
                                      className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2.5 text-sm font-bold text-yellow-400 transition hover:bg-yellow-400/20"
                                    >
                                      Replace
                                    </button>
                                  )}
                                </>

                              )}

                            </div>

                          ) : (

                            <button
                              type="button"
                              disabled={
                                (isFull &&
                                  !replacingPlayerId) ||
                                addingPlayer !== null
                              }
                              onClick={() => {
                                if (replacingPlayerId) {
                                  void handleReplacePlayer(
                                    player.playerId
                                  );
                                } else {
                                  handleAddPlayer(
                                    player.playerId
                                  );
                                }
                              }}
                              className="flex shrink-0 items-center gap-2 rounded-xl bg-yellow-400 px-3 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4"
                            >

                              {addingPlayer ===
                              player.playerId ? (

                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />

                              ) : replacingPlayerId ? (

                                <Check
                                  size={16}
                                />

                              ) : (

                                <UserPlus
                                  size={16}
                                />

                              )}

                              {addingPlayer ===
                              player.playerId
                                ? "Replacing..."
                                : replacingPlayerId
                                  ? "Replace"
                                  : "Add"}

                            </button>

                          )}

                        </div>
                      );
                    }
                  )
                )}

              </div>

              {/* FOOTER */}

              <div className="border-t border-white/10 p-5 sm:p-6">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-xs leading-5 text-zinc-600">
                    Add or remove players from the list
                    before confirming.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleDone
                    }
                    disabled={
                      savingRoster ||
                      Boolean(replacingPlayerId) ||
                      addingPlayer !== null
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {savingRoster && (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    )}

                    {savingRoster
                      ? "Saving Players..."
                      : "Done"}

                  </button>

                </div>

              </div>

            </section>
          )}

      </div>
    </main>
  );
}
