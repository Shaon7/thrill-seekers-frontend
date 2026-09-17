"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ShieldCheck,
  ShieldOff,
  Users,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

import Navbar from "@/app/components/Navbar";

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
}

export default function AdminsPage() {
  const router = useRouter();

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  useEffect(() => {
    const userType =
      localStorage
        .getItem("userType")
        ?.toLowerCase();

    if (userType !== "superadmin") {
      router.replace("/home");
      return;
    }

    fetchPlayers();
  }, [router]);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      if (!token) {
        router.replace("/login");
        return;
      }

      const response =
        await fetch(
          "https://thrill-seekers-backend-production.up.railway.app/player",
          {
            method: "GET",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            cache: "no-store",
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
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                "Failed to load players.",
        );
      }

      setPlayers(data);
    } catch (error) {
      console.error(
        "Load players error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load players.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAction = async (
    player: Player,
  ) => {
    try {
      setActionLoading(
        player.playerId,
      );

      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      if (!token) {
        router.replace("/login");
        return;
      }

      const method =
        player.isAdmin
          ? "DELETE"
          : "PATCH";

      const response =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/player/${player.playerId}/admin`,
          {
            method,

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },
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
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                "Failed to update admin status.",
        );
      }

      setPlayers(
        (currentPlayers) =>
          currentPlayers.map(
            (item) =>
              item.playerId ===
              player.playerId
                ? {
                    ...item,
                    isAdmin:
                      !player.isAdmin,
                  }
                : item,
          ),
      );
    } catch (error) {
      console.error(
        "Admin action error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update admin status.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* Background glow */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl sm:p-8">

          <button
            type="button"
            onClick={() =>
              router.push("/superadmin")
            }
            className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-2 text-yellow-400">

                <ShieldCheck size={21} />

                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                  SuperAdmin
                </span>

              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Admin Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Manage which players have admin
                privileges in the Thrill Seekers club.
              </p>

            </div>

            <div className="flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">

              <Users
                size={17}
                className="text-yellow-400"
              />

              <span className="text-sm font-semibold text-zinc-300">
                {players.length}
              </span>

              <span className="text-sm text-zinc-500">
                Players
              </span>

            </div>

          </div>
        </section>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <section className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <p className="text-sm leading-6 text-red-400/90">
                {error}
              </p>

            </div>

          </section>
        )}

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading ? (
          <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-10">

            <div className="flex flex-col items-center justify-center py-12">

              <Loader2
                size={32}
                className="animate-spin text-yellow-400"
              />

              <p className="mt-4 text-sm text-zinc-500">
                Loading players...
              </p>

            </div>

          </section>
        ) : players.length === 0 ? (
          <section className="rounded-3xl border border-white/10 bg-zinc-900/60 p-10 text-center">

            <Users
              size={34}
              className="mx-auto text-zinc-600"
            />

            <h2 className="mt-4 text-xl font-bold">
              No Players Found
            </h2>

            <p className="mt-2 text-sm text-zinc-500">
              There are currently no players in the club.
            </p>

          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl">

            {/* =================================================
                SECTION HEADER
            ================================================== */}

            <div className="border-b border-white/10 px-5 py-4 sm:px-6">

              <h2 className="text-lg font-bold">
                All Players
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Add or remove admin privileges.
              </p>

            </div>

            {/* =================================================
                PLAYER LIST
            ================================================== */}

            <div className="divide-y divide-white/5">

              {players.map(
                (player) => {
                  const isActionLoading =
                    actionLoading ===
                    player.playerId;

                  return (
                    <div
                      key={player.playerId}
                      className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >

                      {/* PLAYER INFO */}

                      <div className="flex min-w-0 items-center gap-4">

                        {/* Avatar */}

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-black text-zinc-400">
                          {player.name
                            ?.charAt(0)
                            .toUpperCase() ||
                            "P"}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-base font-bold text-white sm:text-lg">
                            {player.name}
                          </p>

                          <p className="mt-1 text-xs font-medium text-zinc-600">
                            {player.playerId}
                          </p>

                        </div>

                      </div>

                      {/* ADMIN STATUS + ACTION */}

                      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">

                        {/* STATUS */}

                        {player.isAdmin && (
                          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
                            Admin
                          </span>
                        )}

                        {/* BUTTON */}

                        {player.isAdmin ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleAdminAction(
                                player,
                              )
                            }
                            disabled={
                              isActionLoading
                            }
                            className="flex min-w-[145px] items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-xs font-bold text-red-400 transition hover:bg-red-400/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <ShieldOff
                                size={15}
                              />
                            )}

                            {isActionLoading
                              ? "Removing..."
                              : "Remove Admin"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleAdminAction(
                                player,
                              )
                            }
                            disabled={
                              isActionLoading
                            }
                            className="flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-yellow-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isActionLoading ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <ShieldCheck
                                size={15}
                              />
                            )}

                            {isActionLoading
                              ? "Adding..."
                              : "Add Admin"}
                          </button>
                        )}

                      </div>

                    </div>
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
