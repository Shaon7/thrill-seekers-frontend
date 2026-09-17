"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Check,
  Loader2,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

type Admin = {
  id: number;
  playerId: string;
  name: string;
  email: string;
  deviceName?: string;
  isAdmin: boolean;
};

type Match = {
  matchId: string;
  homePlayerId: string;
  awayPlayerId: string;
  assignedAdminId: string | null;
};

export default function AssignAdminPage() {
  const params = useParams();
  const router = useRouter();

  const matchId =
    params.matchId as string;

  const [match, setMatch] =
    useState<Match | null>(null);

  const [admins, setAdmins] =
    useState<Admin[]>([]);

  const [selectedAdmin, setSelectedAdmin] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadData();
  }, [matchId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      const [
        matchResponse,
        adminsResponse,
      ] = await Promise.all([
        fetch(
          `https://thrill-seekers-backend-production.up.railway.app/matches/${matchId}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
          },
        ),

        fetch(
          "https://thrill-seekers-backend-production.up.railway.app/matches/admins",
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
            cache: "no-store",
          },
        ),
      ]);

      if (!matchResponse.ok) {
        throw new Error(
          "Failed to load match.",
        );
      }

      if (!adminsResponse.ok) {
        throw new Error(
          "Failed to load admins.",
        );
      }

      const matchData =
        await matchResponse.json();

      const adminData =
        await adminsResponse.json();

      setMatch(matchData);
      setAdmins(adminData);

      if (
        matchData.assignedAdminId
      ) {
        setSelectedAdmin(
          matchData.assignedAdminId,
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAdmin) {
      setError(
        "Please select an admin.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      const response =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/matches/${matchId}/admin`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              adminPlayerId:
                selectedAdmin,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(
                ", ",
              )
            : data?.message ||
              "Failed to assign admin.",
        );
      }

      router.back();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to assign admin.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">

        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 hover:text-white"
        >
          <ArrowLeft size={17} />
          Back
        </button>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/60">
            <Loader2
              size={30}
              className="animate-spin text-yellow-400"
            />
          </div>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-2xl">

            <div className="border-b border-white/10 p-5 sm:p-7">

              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                  <ShieldCheck
                    size={22}
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                    SuperAdmin
                  </p>

                  <h1 className="mt-1 text-xl font-bold sm:text-2xl">
                    Assign Match Admin
                  </h1>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-zinc-500">
                Choose the admin responsible for
                submitting the result of this match.
              </p>
            </div>

            <div className="p-5 sm:p-7">

              {error && (
                <div className="mb-5 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-400">
                  {error}
                </div>
              )}

              <label className="mb-2 block text-sm font-semibold text-zinc-300">
                Select Admin
              </label>

              <select
                value={selectedAdmin}
                onChange={(e) =>
                  setSelectedAdmin(
                    e.target.value,
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
              >
                <option value="">
                  Select an admin
                </option>

                {admins.map(
                  (admin) => (
                    <option
                      key={
                        admin.playerId
                      }
                      value={
                        admin.playerId
                      }
                    >
                      {admin.name} —{" "}
                      {admin.playerId}
                    </option>
                  ),
                )}
              </select>

              {admins.length === 0 && (
                <p className="mt-3 text-xs text-zinc-600">
                  No admin players are available.
                </p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() =>
                    router.back()
                  }
                  disabled={saving}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-400 hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleAssign
                  }
                  disabled={
                    saving ||
                    !selectedAdmin
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserPlus
                        size={16}
                      />
                      Assign Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}