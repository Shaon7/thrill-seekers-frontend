"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";

import {
  User,
  Users,
  Trophy,
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const API_URL = "https://thrill-seekers-backend-production.up.railway.app";

interface Player {
  id: number;
  playerId: string;
  name: string;
  email?: string;
  deviceName?: string;
  konamiId?: string;
  isAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
  password?: string;
  passwordResetCode?: string | null;
  passwordResetCodeExpiresAt?: string | null;
}

export default function PlayersPage() {
  const router = useRouter();

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // LOAD ALL PLAYERS
  // PUBLIC - NO LOGIN REQUIRED
  // =====================================================

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/player`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

        let data: any = null;

        try {
          data =
            await response.json();
        } catch {
          data = null;
        }

        if (!response.ok) {
          const message =
            Array.isArray(
              data?.message,
            )
              ? data.message.join(
                  ", ",
                )
              : data?.message ||
                `Failed to load players. HTTP ${response.status}`;

          throw new Error(
            message,
          );
        }

        const playerData: Player[] =
          Array.isArray(data)
            ? data
            : Array.isArray(
                data?.data,
              )
              ? data.data
              : [];

        setPlayers(
          playerData,
        );
      } catch (error) {
        console.error(
          "Players page error:",
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

    loadPlayers();
  }, []);

  // =====================================================
  // LOADING
  // =====================================================

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
              Loading players...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <Navbar />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>
                <h2 className="font-semibold text-red-400">
                  Unable to load players
                </h2>

                <p className="mt-2 text-sm leading-6 text-red-400/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

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

        {/* =================================================
            HEADER
        ================================================= */}

        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">

            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-yellow-400/5 blur-3xl" />

            <div className="relative">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                    <Users
                      size={25}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                      THRILL SEEKERS
                    </p>

                    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                      Players
                    </h1>
                  </div>

                </div>

                <div className="hidden rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex">
                  <User
                    size={22}
                    className="text-zinc-400"
                  />
                </div>

              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400">
                Explore the players of the Thrill
                Seekers eFootball Club.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">

                <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                  Total Players
                </span>

                <span className="text-sm font-bold text-white">
                  {players.length}
                </span>

              </div>

            </div>
          </div>
        </section>

        {/* =================================================
            PLAYERS
        ================================================= */}

        {players.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-10 text-center">

            <Users
              size={38}
              className="mx-auto text-zinc-600"
            />

            <h2 className="mt-4 text-lg font-semibold text-zinc-300">
              No Players Found
            </h2>

            <p className="mt-2 text-sm text-zinc-600">
              There are no players available right now.
            </p>

          </div>
        ) : (
          <section>

            <div className="mb-5">
              <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                CLUB MEMBERS
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                All Players
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

              {players.map(
                (player) => (
                  <div
                    key={player.id}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 transition hover:border-yellow-400/20 sm:p-6"
                  >

                    <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-yellow-400/5 blur-3xl transition group-hover:bg-yellow-400/10" />

                    <div className="relative flex items-center justify-between gap-4">

                      <div className="flex min-w-0 items-center gap-4">

                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-zinc-400">
                          <User
                            size={24}
                          />
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-lg font-bold text-white">
                            {player.name}
                          </p>

                          <div className="mt-1 flex items-center gap-2">

                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                              Player ID
                            </span>

                            <span className="text-sm font-semibold text-zinc-400">
                              {player.playerId}
                            </span>

                          </div>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/players/profile/${player.playerId}`,
                          )
                        }
                        className="flex shrink-0 items-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
                      >
                        Profile
                        <ArrowRight
                          size={16}
                        />
                      </button>

                    </div>

                  </div>
                ),
              )}

            </div>

          </section>
        )}

        {/* =================================================
            ACHIEVEMENTS
        ================================================= */}

        <section className="mt-10">

          <div className="mb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
              ACHIEVEMENTS
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Club Achievements
            </h2>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-8 sm:p-10">

            <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />

            <div className="relative text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                <Trophy
                  size={30}
                />
              </div>

              <h3 className="mt-5 text-lg font-bold text-zinc-300">
                No Achievement
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                Player achievements will appear here
                when the achievement system is added.
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
