"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import RecentMatches from "@/app/components/RecentMatches";

import {
  User,
  Mail,
  Gamepad2,
  Trophy,
  Target,
  Shield,
  Pencil,
  Save,
  X,
  ArrowRight,
  Loader2,
  ShieldAlert,
  CalendarDays,
  Medal,
  Star,
} from "lucide-react";

/* ================================================== */
/* PLAYER */
/* ================================================== */

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
  divisionNumber?: number;
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

export default function PlayerProfilePage() {
  const params = useParams();

  const router = useRouter();

  const urlPlayerId =
    typeof params?.playerId === "string"
      ? params.playerId
      : "";

  /* ==================================================
     PLAYER STATE
  ================================================== */

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ==================================================
     EDIT STATE
  ================================================== */

  const [editing, setEditing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  /* ==================================================
     FORM
  ================================================== */

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    konamiId: "",
  });

  /* ==================================================
     MATCH STATE
  ================================================== */

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
     LOAD PLAYER + MATCH DATA
  ================================================== */

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        setLoading(true);
        setMatchLoading(true);
        setError("");

        /*
         * ==================================================
         * 1. LOAD PLAYER FROM LOCAL STORAGE
         * ==================================================
         */

        const storedPlayer =
          localStorage.getItem("player");

        let localPlayer: Player | null = null;

        if (storedPlayer) {
          try {
            localPlayer = JSON.parse(storedPlayer);
          } catch {
            localPlayer = null;
          }
        }

        /*
         * ==================================================
         * 2. DETERMINE PLAYER ID
         * ==================================================
         */

        const finalPlayerId =
          urlPlayerId ||
          localPlayer?.playerId ||
          "";

        if (!finalPlayerId) {
          setError(
            "Player ID was not found. Please login again."
          );

          setLoading(false);
          setMatchLoading(false);

          return;
        }

        /*
         * ==================================================
         * 3. SHOW LOCAL PLAYER IMMEDIATELY
         * ==================================================
         */

        if (localPlayer) {
          setPlayer(localPlayer);

          setFormData({
            name: localPlayer.name || "",
            phone: localPlayer.phone || "",
            email: localPlayer.email || "",
            konamiId: localPlayer.konamiId || "",
          });

          setLoading(false);
        }

        /*
         * ==================================================
         * TOKEN
         * ==================================================
         */

        const token =
          localStorage.getItem(
            "access_token"
          );

        const authHeaders: HeadersInit = {
          "Content-Type":
            "application/json",

          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        };

        /* ==================================================
           4. LOAD LATEST PLAYER
        ================================================== */

        const playerResponse =
          await fetch(
            `https://thrill-seekers-backend-production.up.railway.app/player/${finalPlayerId}`,
            {
              method: "GET",
              headers: authHeaders,
              cache: "no-store",
            }
          );

        let playerData: any = {};

        const playerContentType =
          playerResponse.headers.get(
            "content-type"
          );

        if (
          playerContentType?.includes(
            "application/json"
          )
        ) {
          try {
            playerData =
              await playerResponse.json();
          } catch {
            playerData = {};
          }
        }

        if (!playerResponse.ok) {
          let message =
            "Failed to load player profile.";

          if (
            Array.isArray(
              playerData.message
            )
          ) {
            message =
              playerData.message.join(
                ", "
              );
          } else if (
            typeof playerData.message ===
            "string"
          ) {
            message =
              playerData.message;
          }

          throw new Error(message);
        }

        /*
         * ==================================================
         * 5. UPDATE PLAYER
         * ==================================================
         */

        setPlayer(playerData);

        setFormData({
          name:
            playerData.name || "",
          phone:
            playerData.phone || "",
          email:
            playerData.email || "",
          konamiId:
            playerData.konamiId || "",
        });

        localStorage.setItem(
          "player",
          JSON.stringify(playerData)
        );

        /* ==================================================
           6. LOAD MATCHES + DIVISIONS
        ================================================== */

        const [matchesResponse, divisionsResponse] =
          await Promise.all([
            fetch(
              "https://thrill-seekers-backend-production.up.railway.app/matches",
              {
                method: "GET",
                headers: authHeaders,
                cache: "no-store",
              }
            ),

            fetch(
              "https://thrill-seekers-backend-production.up.railway.app/divisions",
              {
                method: "GET",
                headers: authHeaders,
                cache: "no-store",
              }
            ),
          ]);

        /*
         * ==================================================
         * MATCH DATA
         * ==================================================
         */

        let allMatches: Match[] = [];

        if (matchesResponse.ok) {
          const matchesData =
            await matchesResponse.json();

          if (Array.isArray(matchesData)) {
            allMatches = matchesData;
          } else if (
            Array.isArray(
              matchesData?.data
            )
          ) {
            allMatches =
              matchesData.data;
          }
        }

        /*
         * ==================================================
         * DIVISION / PLAYER LOOKUP
         * ==================================================
         */

        const playerLookup: Record<
          string,
          Player
        > = {};

        if (divisionsResponse.ok) {
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
                  if (
                    divisionPlayer?.playerId
                  ) {
                    playerLookup[
                      divisionPlayer.playerId
                    ] =
                      divisionPlayer;
                  }
                }
              );
            }
          );
        }

        /*
         * Add the current player as well.
         */

        playerLookup[
          playerData.playerId
        ] = playerData;

        setPlayersById(
          playerLookup
        );

        /* ==================================================
           7. FILTER PLAYER'S COMPLETED MATCHES
        ================================================== */

        const playerMatches =
          allMatches.filter(
            (match) => {
              const playerIsInMatch =
                match.homePlayerId ===
                  finalPlayerId ||
                match.awayPlayerId ===
                  finalPlayerId;

              return (
                playerIsInMatch &&
                match.status ===
                  "COMPLETED"
              );
            }
          );

        /* ==================================================
           8. CALCULATE STATISTICS
        ================================================== */

        let wins = 0;
        let draws = 0;
        let losses = 0;
        let goals = 0;

        playerMatches.forEach(
          (match) => {
            const isHome =
              match.homePlayerId ===
              finalPlayerId;

            const myScore =
              isHome
                ? match.homeScore ?? 0
                : match.awayScore ?? 0;

            const opponentScore =
              isHome
                ? match.awayScore ?? 0
                : match.homeScore ?? 0;

            goals += myScore;

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
          }
        );

        const totalMatches =
          playerMatches.length;

        const winRate =
          totalMatches > 0
            ? Math.round(
                (wins /
                  totalMatches) *
                  100
              )
            : 0;

        setMatchStats({
          matches: totalMatches,
          wins,
          draws,
          losses,
          goals,
          winRate,
        });

        /* ==================================================
           9. LATEST 5 MATCHES
        ================================================== */

        const latestMatches =
          [...playerMatches]
            .sort(
              (a, b) =>
                new Date(
                  b.deadline
                ).getTime() -
                new Date(
                  a.deadline
                ).getTime()
            )
            .slice(0, 5);

        setRecentMatches(
          latestMatches
        );

      } catch (error) {
        console.error(
          "Player profile loading error:",
          error
        );

        /*
         * If we already have local player data,
         * don't replace the page with an error.
         */

        if (!player) {
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
              "Something went wrong while loading the profile."
            );
          }
        }
      } finally {
        setLoading(false);
        setMatchLoading(false);
      }
    };

    loadPlayer();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlPlayerId]);

  /*
   * ==================================================
   * FORM CHANGE
   * ==================================================
   */

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /*
   * ==================================================
   * EDIT
   * ==================================================
   */

  const handleEdit = () => {
    if (!player) return;

    setFormData({
      name:
        player.name || "",
      phone:
        player.phone || "",
      email:
        player.email || "",
      konamiId:
        player.konamiId || "",
    });

    setError("");
    setEditing(true);
  };

  /*
   * ==================================================
   * CANCEL
   * ==================================================
   */

  const handleCancel = () => {
    if (!player) return;

    setFormData({
      name:
        player.name || "",
      phone:
        player.phone || "",
      email:
        player.email || "",
      konamiId:
        player.konamiId || "",
    });

    setError("");
    setEditing(false);
  };

  /*
   * ==================================================
   * SAVE
   * ==================================================
   */

  const handleSave = async () => {
    if (!player) return;

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token"
        );

      const response =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/player/${player.playerId}`,
          {
            method: "PATCH",

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
              name:
                formData.name.trim(),

              phone:
                formData.phone.trim(),

              email:
                formData.email.trim(),

              konamiId:
                formData.konamiId.trim(),
            }),
          }
        );

      let data: any = {};

      const contentType =
        response.headers.get(
          "content-type"
        );

      if (
        contentType?.includes(
          "application/json"
        )
      ) {
        try {
          data =
            await response.json();
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        let message =
          "Failed to update your profile.";

        if (
          Array.isArray(data.message)
        ) {
          message =
            data.message.join(
              ", "
            );
        } else if (
          typeof data.message ===
          "string"
        ) {
          message =
            data.message;
        }

        throw new Error(
          message
        );
      }

      setPlayer(data);

      setFormData({
        name:
          data.name || "",
        phone:
          data.phone || "",
        email:
          data.email || "",
        konamiId:
          data.konamiId || "",
      });

      localStorage.setItem(
        "player",
        JSON.stringify(data)
      );

      setEditing(false);

    } catch (error) {
      console.error(
        "Player profile update error:",
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
          "Failed to update your profile."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==================================================
   * LOADING
   * ==================================================
   */

  if (loading && !player) {
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
              Loading your profile...
            </p>

          </div>
        </div>
      </main>
    );
  }

  /*
   * ==================================================
   * ERROR
   * ==================================================
   */

  if (error && !player) {
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
                  {error}
                </p>

                <Link
                  href="/"
                  className="mt-4 inline-block rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                >
                  Back to Home
                </Link>

              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!player) {
    return null;
  }

  const memberSince =
    player.createdAt
      ? new Date(
          player.createdAt
        ).toLocaleDateString(
          "en-US",
          {
            month: "long",
            year: "numeric",
          }
        )
      : "—";

  return (
    <main className="min-h-screen bg-[#080808] text-white">

      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">

        {/* ================================================== */}
        {/* PROFILE HERO */}
        {/* ================================================== */}

        <section className="mb-8">

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-10">

            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-yellow-500/5 blur-3xl" />

            <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                  <User size={42} />
                </div>

                <div>

                  <div className="mb-2 flex flex-wrap items-center gap-2">

                    <span className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                      PLAYER PROFILE
                    </span>

                    {player.isAdmin && (
                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                        Admin
                      </span>
                    )}

                  </div>

                  <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                    {player.name}
                  </h1>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold text-zinc-300">
                      {player.playerId}
                    </span>

                    <span className="flex items-center gap-1.5 text-zinc-500">
                      <CalendarDays size={15} />
                      Member since {memberSince}
                    </span>

                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  router.push(
                    `/player/profile/${player.playerId}/edit`
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
              >
                <Pencil size={17} />
                Edit Profile
              </button>

            </div>
          </div>
        </section>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ================================================== */}
        {/* STATISTICS */}
        {/* ================================================== */}

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
                icon={<Gamepad2 size={18} />}
                label="Matches"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.matches
                      )
                }
              />

              <StatItem
                icon={<Trophy size={18} />}
                label="Wins"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.wins
                      )
                }
              />

              <StatItem
                icon={<Star size={18} />}
                label="Draws"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.draws
                      )
                }
              />

              <StatItem
                icon={<Shield size={18} />}
                label="Losses"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.losses
                      )
                }
              />

              <StatItem
                icon={<Target size={18} />}
                label="Goals"
                value={
                  matchLoading
                    ? "—"
                    : String(
                        matchStats.goals
                      )
                }
              />

              <StatItem
                icon={<Medal size={18} />}
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
            Statistics are calculated from all
            completed matches played by this player.
          </p>

        </section>

        {/* ================================================== */}
        {/* PROFILE CONTENT */}
        {/* ================================================== */}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* PLAYER INFORMATION */}

          <div className="lg:col-span-2">

            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-7">

              <div className="mb-6 flex items-center justify-between">

                <div>

                  <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                    ACCOUNT
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Player information
                  </h2>

                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Pencil size={17} />
                  </button>
                )}

              </div>

              {!editing ? (

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <InfoCard
                    icon={<User size={18} />}
                    label="Name"
                    value={player.name}
                  />

                  <InfoCard
                    icon={<Mail size={18} />}
                    label="Email"
                    value={player.email}
                  />

                  <InfoCard
                    icon={<Gamepad2 size={18} />}
                    label="Device"
                    value={player.deviceName}
                  />

                  <InfoCard
                    icon={<Shield size={18} />}
                    label="KONAMI ID"
                    value={player.konamiId}
                  />

                  <InfoCard
                    icon={<Trophy size={18} />}
                    label="Player ID"
                    value={player.playerId}
                  />

                </div>

              ) : (

                <div className="space-y-5">

                  <ProfileInput
                    label="Name"
                    value={formData.name}
                    onChange={(value) =>
                      handleChange(
                        "name",
                        value
                      )
                    }
                  />

                  <ProfileInput
                    label="Phone"
                    value={formData.phone}
                    onChange={(value) =>
                      handleChange(
                        "phone",
                        value
                      )
                    }
                    placeholder="Enter your phone number"
                  />

                  <ProfileInput
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(value) =>
                      handleChange(
                        "email",
                        value
                      )
                    }
                  />

                  <ProfileInput
                    label="KONAMI ID"
                    value={formData.konamiId}
                    onChange={(value) =>
                      handleChange(
                        "konamiId",
                        value
                      )
                    }
                  />

                  <div className="flex flex-wrap gap-3 pt-2">

                    <button
                      type="button"
                      onClick={
                        handleSave
                      }
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {saving ? (
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Save size={17} />
                      )}

                      {saving
                        ? "Saving..."
                        : "Save Changes"}

                    </button>

                    <button
                      type="button"
                      onClick={
                        handleCancel
                      }
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                    >
                      <X size={17} />
                      Cancel
                    </button>

                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ================================================== */}
          {/* RANKING CARD */}
          {/* ================================================== */}

          <div>

            <div className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 via-zinc-900/80 to-black p-6">

              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-yellow-400/10 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                      PLAYER RANKING
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Current ranking
                    </h2>

                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400 text-black">
                    <Trophy size={21} />
                  </div>

                </div>

                <div className="mt-7">

                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Overall rank
                  </p>

                  <p className="mt-1 text-5xl font-black text-yellow-400">
                    —
                  </p>

                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">

                  <RankingValue
                    label="Ranking"
                    value="—"
                  />

                  <RankingValue
                    label="Division"
                    value="—"
                  />

                </div>

                <Link
                  href={`/player/ranking/${player.playerId}`}
                  className="mt-5 flex items-center justify-between rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400/20"
                >
                  <span>
                    View full ranking
                  </span>

                  <ArrowRight size={17} />
                </Link>

              </div>
            </div>
          </div>

        </section>

        {/* ================================================== */}
        {/* RECENT ACTIVITY */}
        {/* ================================================== */}

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

          ) : recentMatches.length > 0 ? (

            <RecentMatches
              matches={recentMatches}
              playerId={player.playerId}
              playersById={playersById}
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
                Your recent matches will appear here.
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

/* ================================================== */
/* PROFILE INPUT */
/* ================================================== */

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-yellow-400/40 focus:bg-black/40"
      />

    </div>
  );
}

/* ================================================== */
/* RANKING VALUE */
/* ================================================== */

function RankingValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">

      <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-white">
        {value}
      </p>

    </div>
  );
}