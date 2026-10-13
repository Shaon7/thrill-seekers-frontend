"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Clock,
  Download,
  FileDown,
  Loader2,
  Search,
  Square,
  X,
} from "lucide-react";

type MatchStatus =
  | "SCHEDULED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

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
};

type Player = {
  id: number;
  playerId: string;
  name: string;
  isAdmin?: boolean;
};

type StatusFilter = "ALL" | "COMPLETED" | "SCHEDULED" | "RESCHEDULED";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://thrill-seekers-backend-production.up.railway.app";

function getArrayData<T>(data: any): T[] {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray(data?.data)) return data.data as T[];
  if (Array.isArray(data?.items)) return data.items as T[];
  if (Array.isArray(data?.players)) return data.players as T[];
  if (Array.isArray(data?.matches)) return data.matches as T[];
  return [];
}

function getLocalDateInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string): string {
  const normalized = status?.toUpperCase() || "UNKNOWN";
  if (normalized === "RESCHEDULED") return "Rescheduled";
  if (normalized === "COMPLETED") return "Completed";
  if (normalized === "CANCELLED") return "Cancelled";
  if (normalized === "SCHEDULED") return "Scheduled";
  return normalized;
}

function getStatusClass(status: string): string {
  const normalized = status?.toUpperCase() || "";
  if (normalized === "COMPLETED") {
    return "border-green-400/20 bg-green-400/10 text-green-400";
  }
  if (normalized === "RESCHEDULED") {
    return "border-orange-400/20 bg-orange-400/10 text-orange-300";
  }
  if (normalized === "CANCELLED") {
    return "border-red-400/20 bg-red-400/10 text-red-400";
  }
  return "border-yellow-400/20 bg-yellow-400/10 text-yellow-400";
}

export default function MatchManagementPage() {
  const router = useRouter();

  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [savingTime, setSavingTime] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const userType = localStorage.getItem("userType")?.toLowerCase() || "";
    const token = localStorage.getItem("access_token");

    if (userType !== "superadmin") {
      setError("Only Super Admin can access Match Management.");
      setLoading(false);
      return;
    }

    if (!token) {
      router.push("/login");
      return;
    }

    void loadMatchData(token);
    // Fetch on first page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMatchData = async (token?: string) => {
    try {
      setLoading(true);
      setError("");

      const authToken = token || localStorage.getItem("access_token");
      if (!authToken) {
        router.push("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      };

      const [matchesResponse, playersResponse] = await Promise.all([
        fetch(`${API_URL}/matches`, {
          method: "GET",
          headers,
          cache: "no-store",
        }),
        fetch(`${API_URL}/player`, {
          method: "GET",
          headers,
          cache: "no-store",
        }),
      ]);

      let matchesJson: any = {};
      let playersJson: any = {};

      try {
        matchesJson = await matchesResponse.json();
      } catch {
        matchesJson = {};
      }

      try {
        playersJson = await playersResponse.json();
      } catch {
        playersJson = {};
      }

      if (!matchesResponse.ok) {
        throw new Error(
          Array.isArray(matchesJson?.message)
            ? matchesJson.message.join(", ")
            : matchesJson?.message ||
                `Failed to load matches (HTTP ${matchesResponse.status}).`,
        );
      }

      if (!playersResponse.ok) {
        throw new Error(
          Array.isArray(playersJson?.message)
            ? playersJson.message.join(", ")
            : playersJson?.message ||
                `Failed to load players (HTTP ${playersResponse.status}).`,
        );
      }

      const loadedMatches = getArrayData<Match>(matchesJson);
      const loadedPlayers = getArrayData<Player>(playersJson);

      setMatches(loadedMatches);
      setPlayers(loadedPlayers);
    } catch (err) {
      console.error("Match Management loading error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load match management data.",
      );
    } finally {
      setLoading(false);
    }
  };

  const playersById = useMemo(() => {
    const lookup: Record<string, Player> = {};

    players.forEach((player) => {
      if (player.playerId) lookup[player.playerId.trim()] = player;
      if (player.id !== undefined && player.id !== null) {
        lookup[String(player.id)] = player;
      }
    });

    return lookup;
  }, [players]);

  const getPlayerName = (playerId: string) => {
    const player = playersById[playerId?.trim()];
    return player?.name || playerId || "Unknown Player";
  };

  const filteredMatches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return matches.filter((match) => {
      const matchStatus = String(match.status || "").toUpperCase();

      if (statusFilter !== "ALL" && matchStatus !== statusFilter) {
        return false;
      }

      if (!query) return true;

      const homePlayer = playersById[match.homePlayerId?.trim()];
      const awayPlayer = playersById[match.awayPlayerId?.trim()];

      const searchValues = [
        match.matchId,
        match.competitionId,
        match.homePlayerId,
        match.awayPlayerId,
        homePlayer?.name,
        awayPlayer?.name,
        homePlayer?.playerId,
        awayPlayer?.playerId,
      ];

      return searchValues.some((value) =>
        String(value || "").toLowerCase().includes(query),
      );
    });
  }, [matches, playersById, search, statusFilter]);

  const selectedMatches = useMemo(
    () => matches.filter((match) => selectedMatchIds.includes(match.matchId)),
    [matches, selectedMatchIds],
  );

  const visibleMatchIds = filteredMatches.map((match) => match.matchId);
  const allVisibleSelected =
    visibleMatchIds.length > 0 &&
    visibleMatchIds.every((matchId) => selectedMatchIds.includes(matchId));

  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatchIds((current) =>
      current.includes(matchId)
        ? current.filter((id) => id !== matchId)
        : [...current, matchId],
    );
  };

  const toggleVisibleMatches = () => {
    if (allVisibleSelected) {
      setSelectedMatchIds((current) =>
        current.filter((matchId) => !visibleMatchIds.includes(matchId)),
      );
      return;
    }

    setSelectedMatchIds((current) =>
      Array.from(new Set([...current, ...visibleMatchIds])),
    );
  };

  const downloadSelectedMatchesPDF = () => {
    if (selectedMatches.length === 0) {
      setError("Select at least one match to download.");
      return;
    }

    setError("");
    setNotice("");

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const lightGray: [number, number, number] = [225, 225, 225];
    const dark: [number, number, number] = [24, 24, 27];
    const gray: [number, number, number] = [113, 113, 122];
    const yellow: [number, number, number] = [250, 204, 21];

    autoTable(doc, {
      startY: 30,
      margin: { top: 30, right: 10, bottom: 14, left: 10 },
      head: [[
        "MATCH ID",
        "ROUND",
        "HOME PLAYER",
        "SCORE",
        "AWAY PLAYER",
        "DEADLINE",
        "COMPETITION",
        "STATUS",
      ]],
      body: selectedMatches.map((match) => {
        const completed = String(match.status).toUpperCase() === "COMPLETED";
        const score = completed
          ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
          : "—";

        return [
          match.matchId,
          String(match.round),
          `${getPlayerName(match.homePlayerId)}\n${match.homePlayerId}`,
          score,
          `${getPlayerName(match.awayPlayerId)}\n${match.awayPlayerId}`,
          formatDateTime(match.deadline),
          match.competitionId,
          getStatusLabel(match.status),
        ];
      }),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        textColor: dark,
        lineColor: lightGray,
        lineWidth: 0.2,
        cellPadding: 2.4,
        valign: "middle",
      },
      headStyles: {
        fillColor: [38, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [249, 249, 249],
      },
      columnStyles: {
        0: { cellWidth: 22, textColor: [210, 35, 80], fontStyle: "bold" },
        1: { cellWidth: 13, halign: "center" },
        2: { cellWidth: 44 },
        3: { cellWidth: 20, halign: "center", fontStyle: "bold" },
        4: { cellWidth: 44 },
        5: { cellWidth: 40 },
        6: { cellWidth: 34 },
        7: { cellWidth: 23, halign: "center" },
      },
      didDrawPage: () => {
        doc.setFillColor(...yellow);
        doc.rect(0, 0, pageWidth, 2.5, "F");
        doc.setTextColor(...dark);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("THRILL SEEKERS", 10, 12);
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.setFont("helvetica", "normal");
        doc.text("EFOOTBALL CLUB  •  SELECTED MATCHES", 10, 18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text(`${selectedMatches.length} MATCHES`, pageWidth - 10, 13, {
          align: "right",
        });
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray);
        doc.setFontSize(7);
        doc.text(
          `Generated ${new Date().toLocaleString()}`,
          pageWidth - 10,
          19,
          { align: "right" },
        );
      },
    });

    doc.save(`Thrill-Seekers-Selected-Matches-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`);
    setNotice(`${selectedMatches.length} selected match(es) downloaded as PDF.`);
  };

  const openChangeTime = (match: Match) => {
    setError("");
    setNotice("");
    setEditingMatchId(match.matchId);
    setNewDate(getLocalDateInput(match.deadline));
  };

  const cancelChangeTime = () => {
    setEditingMatchId(null);
    setNewDate("");
  };

  const saveMatchTime = async (match: Match) => {
    if (!newDate) {
      setError("Please select a new deadline date.");
      return;
    }

    if (String(match.status).toUpperCase() !== "SCHEDULED") {
      setError("Only scheduled matches can be rescheduled.");
      return;
    }

    try {
      setSavingTime(true);
      setError("");
      setNotice("");

      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${API_URL}/matches/${encodeURIComponent(match.matchId)}/change-time`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ newDate }),
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
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || `Failed to change match time (HTTP ${response.status}).`,
        );
      }

      const updatedMatch = data?.match as Match | undefined;
      const returnedDeadline = updatedMatch?.deadline || data?.deadline;

      setMatches((current) =>
        current.map((item) =>
          item.matchId === match.matchId
            ? {
                ...item,
                ...(updatedMatch || {}),
                deadline: returnedDeadline || item.deadline,
                status: updatedMatch?.status || data?.status || "RESCHEDULED",
              }
            : item,
        ),
      );

      setEditingMatchId(null);
      setNewDate("");
      setNotice(`${match.matchId} deadline date changed successfully.`);
    } catch (err) {
      console.error("Change match time error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to change match time.",
      );
    } finally {
      setSavingTime(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-9">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-yellow-400/5 blur-3xl" />
          <div className="relative">
            <button
              type="button"
              onClick={() => router.push("/superadmin")}
              className="mb-5 text-sm font-medium text-zinc-500 transition hover:text-white"
            >
              ← Back to Super Admin
            </button>

            <div className="mb-3 flex items-center gap-2 text-yellow-400">
              <CalendarClock size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">
                Super Admin Tools
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Match Management
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
              Search a player to see all of their matches, filter by status, select matches to download as a PDF, submit results, or change scheduled match dates.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">All matches</p>
                <p className="mt-1 text-2xl font-black">{matches.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Completed</p>
                <p className="mt-1 text-2xl font-black text-green-400">
                  {matches.filter((match) => String(match.status).toUpperCase() === "COMPLETED").length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Scheduled</p>
                <p className="mt-1 text-2xl font-black text-yellow-400">
                  {matches.filter((match) => String(match.status).toUpperCase() === "SCHEDULED").length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs text-zinc-500">Rescheduled</p>
                <p className="mt-1 text-2xl font-black text-orange-300">
                  {matches.filter((match) => String(match.status).toUpperCase() === "RESCHEDULED").length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {(error || notice) && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-2xl border p-4 ${
              error
                ? "border-red-500/20 bg-red-500/5 text-red-300"
                : "border-green-500/20 bg-green-500/5 text-green-300"
            }`}
          >
            {error ? <AlertCircle size={19} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={19} className="mt-0.5 shrink-0" />}
            <p className="flex-1 text-sm leading-6">{error || notice}</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                setNotice("");
              }}
              className="rounded-lg p-1 opacity-70 transition hover:opacity-100"
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <section className="mb-6 rounded-3xl border border-white/10 bg-zinc-900/50 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label htmlFor="player-search" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Search player or match
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  id="player-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Player name, THS ID, or match ID..."
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/30 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/40"
                />
              </div>
            </div>

            <div className="w-full lg:w-56">
              <label htmlFor="status-filter" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500">
                Match status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none focus:border-yellow-400/40"
              >
                <option value="ALL">All Matches</option>
                <option value="COMPLETED">Completed</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={toggleVisibleMatches}
              disabled={filteredMatches.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {allVisibleSelected ? <CheckSquare size={17} /> : <Square size={17} />}
              {allVisibleSelected ? "Deselect visible" : "Select visible matches"}
            </button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <span className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-400">
                {selectedMatchIds.length} selected
              </span>
              <button
                type="button"
                onClick={downloadSelectedMatchesPDF}
                disabled={selectedMatches.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <FileDown size={17} />
                Download Selected PDF
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50">
            <div className="text-center">
              <Loader2 size={28} className="mx-auto animate-spin text-yellow-400" />
              <p className="mt-3 text-sm text-zinc-500">Loading matches and players...</p>
            </div>
          </div>
        ) : error && matches.length === 0 ? (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-sm text-red-300">
            {error}
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 px-5 py-14 text-center">
            <Search size={27} className="mx-auto text-zinc-600" />
            <h2 className="mt-4 text-lg font-bold">No matches found</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Try another player name, THS ID, or match-status filter.
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <h2 className="text-lg font-bold">Matches</h2>
              <p className="text-xs text-zinc-500">
                Showing {filteredMatches.length} of {matches.length} matches
              </p>
            </div>

            {filteredMatches.map((match) => {
              const status = String(match.status || "").toUpperCase();
              const isCompleted = status === "COMPLETED";
              const isCancelled = status === "CANCELLED";
              const isSelected = selectedMatchIds.includes(match.matchId);
              const homeName = getPlayerName(match.homePlayerId);
              const awayName = getPlayerName(match.awayPlayerId);
              const isEditingTime = editingMatchId === match.matchId;

              return (
                <article
                  key={match.matchId}
                  className={`rounded-3xl border bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-4 transition sm:p-5 ${
                    isSelected ? "border-yellow-400/40" : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMatchSelection(match.matchId)}
                        className="mt-1 h-4 w-4 accent-yellow-400"
                        aria-label={`Select ${match.matchId}`}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-yellow-400">{match.matchId}</span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusClass(status)}`}>
                            {getStatusLabel(status)}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
                            Round {match.round}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-600">Competition: {match.competitionId}</p>
                      </div>
                    </label>
                    <div className="inline-flex items-center gap-2 text-xs text-zinc-500">
                      <Clock size={14} />
                      {formatDateTime(match.deadline)}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-5">
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-bold text-white sm:text-base">{homeName}</p>
                      <p className="mt-1 truncate text-xs text-zinc-600">{match.homePlayerId}</p>
                    </div>

                    <div className="min-w-[64px] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center">
                      {isCompleted ? (
                        <span className="text-sm font-black text-white">
                          {match.homeScore ?? 0} - {match.awayScore ?? 0}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold tracking-widest text-zinc-600">VS</span>
                      )}
                    </div>

                    <div className="min-w-0 text-right">
                      <p className="truncate text-sm font-bold text-white sm:text-base">{awayName}</p>
                      <p className="mt-1 truncate text-xs text-zinc-600">{match.awayPlayerId}</p>
                    </div>
                  </div>

                  {isEditingTime && (
                    <div className="mt-5 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4">
                      <label htmlFor={`new-date-${match.matchId}`} className="mb-2 block text-xs font-bold uppercase tracking-wider text-yellow-400">
                        New deadline date
                      </label>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          id={`new-date-${match.matchId}`}
                          type="date"
                          value={newDate}
                          onChange={(event) => setNewDate(event.target.value)}
                          className="h-11 rounded-xl border border-white/10 bg-black/50 px-3 text-sm text-white outline-none focus:border-yellow-400/40"
                        />
                        <p className="flex-1 text-xs leading-5 text-zinc-500">
                          The backend keeps the existing time of day and changes the date. This option is available for Scheduled matches.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => void saveMatchTime(match)}
                            disabled={savingTime || !newDate}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:opacity-50"
                          >
                            {savingTime ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelChangeTime}
                            disabled={savingTime}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
                          >
                            <X size={15} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
                    {!isCompleted && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => router.push(`/matches/${encodeURIComponent(match.matchId)}/result`)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
                      >
                        <CheckCircle2 size={16} />
                        Submit Match Result
                      </button>
                    )}

                    {status === "SCHEDULED" && !isEditingTime && (
                      <button
                        type="button"
                        onClick={() => openChangeTime(match)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400/10"
                      >
                        <CalendarClock size={16} />
                        Change Match Time
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleMatchSelection(match.matchId)}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        isSelected
                          ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300"
                          : "border-white/10 text-zinc-300 hover:bg-white/5"
                      }`}
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      {isSelected ? "Selected for PDF" : "Select for PDF"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
