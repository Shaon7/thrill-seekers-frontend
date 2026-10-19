"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";

type Division = {
  id: number;
  divisionId: string;
  competitionId: string;
  name: string;
  season: number;
  phase: number;
  divisionNumber: number;
  Status?: string | null;
};

type Match = {
  id: number;
  matchId: string;
  competitionId: string;
  homePlayerId: string;
  awayPlayerId: string;
  round: number | null;
  deadline: string | null;
  status: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://thrill-seekers-backend-production.up.railway.app";

function unwrapArray<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.data)) return data.data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  if (Array.isArray(data?.matches)) return data.matches as T[];
  if (Array.isArray(data?.divisions)) return data.divisions as T[];
  return [];
}

function toLocalDateTimeInput(value: string | null | undefined): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDeadline(value: string | null | undefined): string {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDeadlineKey(value: string | null | undefined): string {
  if (!value) return "NULL";
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? `INVALID:${value}` : String(time);
}

function getErrorMessage(data: any, fallback: string): string {
  if (Array.isArray(data?.message)) return data.message.join(", ");
  if (typeof data?.message === "string") return data.message;
  return fallback;
}

export default function RoundDeadlinesPage() {
  const router = useRouter();

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [deadlineInputs, setDeadlineInputs] = useState<Record<number, string>>({});
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [savingRound, setSavingRound] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const userType = localStorage.getItem("userType")?.toLowerCase() || "";
    const token = localStorage.getItem("access_token");

    if (userType !== "superadmin") {
      setError("Only Super Admin can manage round deadlines.");
      setLoadingDivisions(false);
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    let ignore = false;

    const loadDivisions = async () => {
      try {
        setLoadingDivisions(true);
        setError("");

        const response = await fetch(`${API_URL}/divisions`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let data: any = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(getErrorMessage(data, "Failed to load divisions."));
        }

        const result = unwrapArray<Division>(data).sort((a, b) => {
          if (a.season !== b.season) return b.season - a.season;
          if (a.phase !== b.phase) return a.phase - b.phase;
          return a.divisionNumber - b.divisionNumber;
        });

        if (!ignore) {
          setDivisions(result);
          const firstDivision =
            result.find((item) => item.Status?.trim().toUpperCase() === "ACTIVE") ||
            result[0];
          setSelectedDivisionId(firstDivision?.divisionId || "");
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load divisions.");
        }
      } finally {
        if (!ignore) setLoadingDivisions(false);
      }
    };

    void loadDivisions();

    return () => {
      ignore = true;
    };
  }, [router]);

  const selectedDivision = useMemo(
    () => divisions.find((division) => division.divisionId === selectedDivisionId),
    [divisions, selectedDivisionId],
  );

  useEffect(() => {
    if (!selectedDivision?.competitionId) {
      setMatches([]);
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    let ignore = false;

    const loadMatches = async () => {
      try {
        setLoadingMatches(true);
        setError("");
        setNotice("");
        setDeadlineInputs({});

        const response = await fetch(
          `${API_URL}/matches/competition/${encodeURIComponent(selectedDivision.competitionId)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        let data: any = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(getErrorMessage(data, "Failed to load this division's matches."));
        }

        if (!ignore) setMatches(unwrapArray<Match>(data));
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : "Failed to load this division's matches.",
          );
          setMatches([]);
        }
      } finally {
        if (!ignore) setLoadingMatches(false);
      }
    };

    void loadMatches();

    return () => {
      ignore = true;
    };
  }, [selectedDivision, router]);

  const rounds = useMemo(() => {
    const grouped = new Map<number, Match[]>();

    for (const match of matches) {
      if (typeof match.round !== "number") continue;
      const list = grouped.get(match.round) || [];
      list.push(match);
      grouped.set(match.round, list);
    }

    return [...grouped.entries()]
      .sort(([a], [b]) => a - b)
      .map(([round, roundMatches]) => {
        const uniqueDeadlines = new Set(
          roundMatches.map((match) => getDeadlineKey(match.deadline)),
        );
        const firstDeadline = roundMatches.find((match) => match.deadline)?.deadline || null;
        const completed = roundMatches.filter(
          (match) => match.status?.toUpperCase() === "COMPLETED",
        ).length;
        const scheduled = roundMatches.filter(
          (match) => match.status?.toUpperCase() === "SCHEDULED",
        ).length;
        const rescheduled = roundMatches.filter(
          (match) => match.status?.toUpperCase() === "RESCHEDULED",
        ).length;

        return {
          round,
          matches: roundMatches,
          currentDeadline: firstDeadline,
          hasMixedDeadlines: uniqueDeadlines.size > 1,
          completed,
          scheduled,
          rescheduled,
        };
      });
  }, [matches]);

  const saveRoundDeadline = async (round: number, roundMatchCount: number) => {
    const localValue = deadlineInputs[round] ?? toLocalDateTimeInput(
      rounds.find((item) => item.round === round)?.currentDeadline,
    );

    if (!localValue) {
      setError(`Choose a deadline for Round ${round}.`);
      setNotice("");
      return;
    }

    const localDate = new Date(localValue);
    if (Number.isNaN(localDate.getTime())) {
      setError("Please choose a valid date and time.");
      setNotice("");
      return;
    }

    if (!selectedDivision?.competitionId) {
      setError("Please select a division first.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSavingRound(round);
      setError("");
      setNotice("");

      // datetime-local is browser-local. Send an ISO timestamp so the backend
      // can store the UTC wall-clock value in the existing timestamp column.
      const deadline = localDate.toISOString();
      const response = await fetch(
        `${API_URL}/matches/competition/${encodeURIComponent(selectedDivision.competitionId)}/round/${round}/deadline`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ deadline }),
        },
      );

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, `Failed to update Round ${round}'s deadline.`),
        );
      }

      setMatches((current) =>
        current.map((match) =>
          match.round === round ? { ...match, deadline } : match,
        ),
      );
      setDeadlineInputs((current) => ({ ...current, [round]: localValue }));
      setNotice(
        data?.message ||
          `Round ${round} deadline updated for ${data?.updatedMatches ?? roundMatchCount} match(es).`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to update Round ${round}'s deadline.`,
      );
    } finally {
      setSavingRound(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/5 px-3 py-1.5 text-xs font-semibold text-yellow-300">
              <CalendarClock size={14} /> SUPER ADMIN TOOL
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Round Deadlines</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Choose a deadline for each round. Saving applies the same deadline to every match in that round, without changing match scores, fixtures, or statuses.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/superadmin")}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5"
          >
            Back to Super Admin
          </button>
        </div>

        <section className="mb-6 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 sm:p-5">
          <label htmlFor="division" className="mb-2 block text-sm font-semibold text-zinc-300">
            Select Division
          </label>
          {loadingDivisions ? (
            <div className="flex items-center gap-2 py-2 text-sm text-zinc-400">
              <Loader2 size={16} className="animate-spin" /> Loading divisions...
            </div>
          ) : divisions.length === 0 ? (
            <p className="text-sm text-zinc-500">No divisions were found.</p>
          ) : (
            <select
              id="division"
              value={selectedDivisionId}
              onChange={(event) => setSelectedDivisionId(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-400/50 sm:max-w-xl"
            >
              {divisions.map((division) => (
                <option key={division.divisionId} value={division.divisionId}>
                  {division.divisionId} — {division.name}
                </option>
              ))}
            </select>
          )}
          {selectedDivision && (
            <p className="mt-2 text-xs text-zinc-500">
              Competition ID: {selectedDivision.competitionId}
            </p>
          )}
        </section>

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-300">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {loadingMatches ? (
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950/50 text-sm text-zinc-400">
            <Loader2 size={18} className="mr-2 animate-spin text-yellow-400" /> Loading rounds...
          </div>
        ) : rounds.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/50 px-5 py-12 text-center">
            <Clock3 size={28} className="mx-auto text-zinc-600" />
            <h2 className="mt-3 font-bold">No rounds available</h2>
            <p className="mt-2 text-sm text-zinc-500">This division does not have any match fixtures yet.</p>
          </div>
        ) : (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-lg font-bold">Available Rounds</h2>
              <span className="text-xs text-zinc-500">{rounds.length} rounds</span>
            </div>

            {rounds.map((item) => {
              const value = deadlineInputs[item.round] ?? toLocalDateTimeInput(item.currentDeadline);
              const isSaving = savingRound === item.round;

              return (
                <article
                  key={item.round}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold">Round {item.round}</h3>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400">
                          {item.matches.length} matches
                        </span>
                        {item.hasMixedDeadlines && (
                          <span className="rounded-full border border-orange-400/20 bg-orange-400/5 px-2.5 py-1 text-[11px] text-orange-300">
                            Mixed deadlines
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-zinc-500">
                        Current deadline: <span className="text-zinc-300">{item.hasMixedDeadlines ? "Different values across matches" : formatDeadline(item.currentDeadline)}</span>
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {item.completed} completed · {item.scheduled} scheduled · {item.rescheduled} rescheduled
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                      <div className="min-w-0 flex-1 lg:w-72 lg:flex-none">
                        <label htmlFor={`deadline-${item.round}`} className="mb-1.5 block text-xs font-medium text-zinc-400">
                          New deadline (your local time)
                        </label>
                        <input
                          id={`deadline-${item.round}`}
                          type="datetime-local"
                          value={value}
                          onChange={(event) =>
                            setDeadlineInputs((current) => ({
                              ...current,
                              [item.round]: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-white/10 bg-[#111111] px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-400/50 [color-scheme:dark]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void saveRoundDeadline(item.round, item.matches.length)}
                        disabled={isSaving || savingRound !== null || !value}
                        className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-32"
                      >
                        {isSaving ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        {isSaving ? "Saving..." : "Save Deadline"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-yellow-400/10 bg-yellow-400/[0.03] p-4 text-xs leading-5 text-zinc-400">
          <RefreshCw size={15} className="mt-0.5 shrink-0 text-yellow-400" />
          <p>Saving a round deadline updates the deadline field for every match in that round. Match results, player pairings, round numbers, and statuses are not changed.</p>
        </div>
      </div>
    </main>
  );
}
