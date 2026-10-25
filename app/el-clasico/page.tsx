"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Award,
  Check,
  ChevronDown,
  Download,
  LoaderCircle,
  RefreshCw,
  Radio,
  ShieldCheck,
  Trophy,
  Users,
  X,
} from "lucide-react";

const COMPETITION_ID = "Evenet-001";
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://thrill-seekers-backend-production.up.railway.app"
).replace(/\/$/, "");
const MOTM_STORAGE_KEY = `ths-el-clasico-motm-${COMPETITION_ID}`;
const REAL_MADRID_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg";
const BARCELONA_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg";

function loadClubLogo(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    // Request CORS permission so the logo can be included in downloadable canvases.
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

type EventPlayer = {
  id?: number;
  playerId: string;
  name: string;
  isAdmin?: boolean;
  deviceName?: string | null;
};

type EventMatch = {
  id?: number;
  matchId: string;
  competitionId?: string;
  homePlayerId?: string | null;
  awayPlayerId?: string | null;
  homePlayer?: EventPlayer | null;
  awayPlayer?: EventPlayer | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
  round?: number | null;
};

type ScoreDraft = { home: string; away: string };
type AssignmentDraft = { home: string; away: string };
type StoredUser = {
  playerId?: string;
  userType?: string;
  isAdmin?: boolean;
  player?: { playerId?: string; isAdmin?: boolean };
  user?: { playerId?: string; isAdmin?: boolean };
};

function getArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(record[key])) return record[key] as T[];
    }
  }
  return [];
}

function normalizeStatus(match: EventMatch) {
  return String(match.status || "SCHEDULED").toUpperCase();
}

// In this competition, the players were accidentally saved in the opposite
// home/away fields. Treat the raw away side as the intended Real Madrid side
// and the raw home side as the intended Barcelona side throughout this page.
// Scores are swapped too, so existing results remain attached to their players.
function normalizeStoredSides(match: EventMatch): EventMatch {
  return {
    ...match,
    homePlayerId: match.awayPlayerId,
    awayPlayerId: match.homePlayerId,
    homePlayer: match.awayPlayer,
    awayPlayer: match.homePlayer,
    homeScore: match.awayScore,
    awayScore: match.homeScore,
  };
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function playerPoints(matches: EventMatch[]) {
  return matches.reduce(
    (total, match) => {
      if (
        normalizeStatus(match) !== "COMPLETED" ||
        match.homeScore == null ||
        match.awayScore == null
      ) {
        return total;
      }
      if (match.homeScore > match.awayScore) total.realMadrid += 1;
      if (match.awayScore > match.homeScore) total.barcelona += 1;
      return total;
    },
    { realMadrid: 0, barcelona: 0 },
  );
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function downloadCanvas(canvas: HTMLCanvasElement, fileName: string) {
  const anchor = document.createElement("a");
  anchor.download = fileName;
  anchor.href = canvas.toDataURL("image/png");
  anchor.click();
}

async function drawScorecardImage(
  matches: EventMatch[],
  resolveName: (match: EventMatch, side: "home" | "away", index: number) => string,
  motm: EventPlayer | null,
): Promise<HTMLCanvasElement> {
  const [realMadridLogo, barcelonaLogo] = await Promise.all([
    loadClubLogo(REAL_MADRID_LOGO_URL),
    loadClubLogo(BARCELONA_LOGO_URL),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 1980;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create the scorecard image.");

  const bg = ctx.createLinearGradient(0, 0, 1200, 1580);
  bg.addColorStop(0, "#090a12");
  bg.addColorStop(1, "#111329");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(245, 190, 66, 0.06)";
  ctx.beginPath();
  ctx.arc(1070, 70, 190, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#f6c64a";
  ctx.font = "700 20px Arial, sans-serif";
  ctx.fillText("THRILL SEEKERS  •  EVENT NIGHT", 600, 48);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px Arial, sans-serif";
  ctx.fillText("EL CLÁSICO", 600, 115);
  ctx.fillStyle = "#a6a7bb";
  ctx.font = "500 18px Arial, sans-serif";
  ctx.fillText(`18 VS 18 FRIENDLY CHALLENGE  •  ${COMPETITION_ID}`, 600, 153);

  const totals = playerPoints(matches);
  roundedRect(ctx, 45, 183, 1110, 150, 22, "#17192b", "#2a2d45");
  ctx.textAlign = "center";
  ctx.fillStyle = "#f6c64a";
  ctx.font = "900 22px Arial, sans-serif";
  ctx.fillText("REAL MADRID", 290, 223);
  ctx.fillStyle = "#c8c9d8";
  ctx.font = "900 22px Arial, sans-serif";
  ctx.fillText("FC BARCELONA", 910, 223);
  // Real club crests sit inside the team points card. Keep an initials fallback
  // if a remote crest cannot be loaded.
  if (realMadridLogo) {
    ctx.drawImage(realMadridLogo, 105, 230, 58, 58);
  } else {
    roundedRect(ctx, 105, 230, 58, 58, 12, "#f4c542");
    ctx.fillStyle = "#11121a";
    ctx.font = "900 17px Arial, sans-serif";
    ctx.fillText("RM", 134, 265);
  }
  if (barcelonaLogo) {
    ctx.drawImage(barcelonaLogo, 1037, 230, 58, 58);
  } else {
    roundedRect(ctx, 1037, 230, 58, 58, 12, "#ececf2");
    ctx.fillStyle = "#11121a";
    ctx.font = "900 15px Arial, sans-serif";
    ctx.fillText("FCB", 1066, 265);
  }
  roundedRect(ctx, 208, 238, 164, 68, 12, "#ffffff");
  roundedRect(ctx, 828, 238, 164, 68, 12, "#c8102e");
  ctx.fillStyle = "#11121a";
  ctx.font = "900 48px Arial, sans-serif";
  ctx.fillText(String(totals.realMadrid), 290, 287);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(totals.barcelona), 910, 287);
  ctx.fillStyle = "#77798d";
  ctx.font = "900 34px Arial, sans-serif";
  ctx.fillText(":", 600, 284);

  ctx.textAlign = "left";
  ctx.fillStyle = "#a8a9bb";
  ctx.font = "700 15px Arial, sans-serif";
  ctx.fillText("MATCH", 66, 365);
  ctx.fillText("REAL MADRID", 150, 365);
  ctx.textAlign = "center";
  ctx.fillText("RESULT", 600, 365);
  ctx.textAlign = "right";
  ctx.fillText("BARCELONA", 1050, 365);

  const rowStart = 384;
  const rowHeight = 75;
  matches.slice(0, 18).forEach((match, index) => {
    const y = rowStart + index * rowHeight;
    roundedRect(ctx, 45, y, 1110, 64, 12, index % 2 ? "#171a2b" : "#202238", "#30334d");
    const homeIsMotm = Boolean(motm?.playerId && match.homePlayerId === motm.playerId);
    const awayIsMotm = Boolean(motm?.playerId && match.awayPlayerId === motm.playerId);
    if (homeIsMotm) {
      roundedRect(ctx, 140, y + 10, 350, 28, 6, "#3b301a", "#f6c64a");
    }
    if (awayIsMotm) {
      roundedRect(ctx, 710, y + 10, 350, 28, 6, "#3b301a", "#f6c64a");
    }
    ctx.fillStyle = "#f6c64a";
    ctx.font = "800 15px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(index + 1).padStart(2, "0"), 65, y + 39);
    ctx.fillStyle = homeIsMotm ? "#ffdc79" : "#ffffff";
    ctx.font = homeIsMotm ? "800 17px Arial, sans-serif" : "600 17px Arial, sans-serif";
    ctx.fillText(resolveName(match, "home", index).slice(0, 27), 150, y + 29);
    ctx.fillStyle = "#989aaf";
    ctx.font = "500 11px Arial, sans-serif";
    ctx.fillText(match.homePlayerId || "PLAYER NOT ASSIGNED", 150, y + 48);

    const completed = normalizeStatus(match) === "COMPLETED";
    const homeScore = completed && match.homeScore != null ? String(match.homeScore) : "–";
    const awayScore = completed && match.awayScore != null ? String(match.awayScore) : "–";
    roundedRect(ctx, 528, y + 15, 52, 38, 8, completed && match.homeScore! > match.awayScore! ? "#199b67" : "#c23d34");
    roundedRect(ctx, 620, y + 15, 52, 38, 8, completed && match.awayScore! > match.homeScore! ? "#199b67" : "#c23d34");
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 25px Arial, sans-serif";
    ctx.fillText(homeScore, 554, y + 42);
    ctx.fillText(awayScore, 646, y + 42);
    ctx.fillStyle = "#77798d";
    ctx.font = "700 15px Arial, sans-serif";
    ctx.fillText(":", 600, y + 40);

    ctx.textAlign = "right";
    ctx.fillStyle = awayIsMotm ? "#ffdc79" : "#ffffff";
    ctx.font = awayIsMotm ? "800 17px Arial, sans-serif" : "600 17px Arial, sans-serif";
    ctx.fillText(resolveName(match, "away", index).slice(0, 27), 1050, y + 29);
    ctx.fillStyle = "#989aaf";
    ctx.font = "500 11px Arial, sans-serif";
    ctx.fillText(match.awayPlayerId || "PLAYER NOT ASSIGNED", 1050, y + 48);
  });

  const motmY = rowStart + 18 * rowHeight + 4;
  if (motm) {
    roundedRect(ctx, 45, motmY, 1110, 58, 13, "#2a2317", "#7d612a");
    ctx.textAlign = "center";
    ctx.fillStyle = "#f6c64a";
    ctx.font = "900 13px Arial, sans-serif";
    ctx.fillText("MAN OF THE MATCH", 600, motmY + 21);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 20px Arial, sans-serif";
    ctx.fillText(`${motm.name}  •  ${motm.playerId}`, 600, motmY + 44);
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "#9698ad";
  ctx.font = "500 13px Arial, sans-serif";
  ctx.fillText("1 POINT FOR A WIN  •  0 POINTS FOR A DRAW  •  THRILL SEEKERS", 600, 1945);
  return canvas;
}

export default function ElClasicoPage() {
  const [matches, setMatches] = useState<EventMatch[]>([]);
  const [players, setPlayers] = useState<EventPlayer[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>({});
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [submittingMatch, setSubmittingMatch] = useState<string | null>(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [editingMatch, setEditingMatch] = useState<EventMatch | null>(null);
  const [assignmentDraft, setAssignmentDraft] = useState<AssignmentDraft>({ home: "", away: "" });
  const [motmDraft, setMotmDraft] = useState("");
  const [announcedMotmId, setAnnouncedMotmId] = useState("");
  const [savingMotm, setSavingMotm] = useState(false);

  const playersById = useMemo(() => {
    const result: Record<string, EventPlayer> = {};
    for (const player of players) {
      if (player.playerId) result[player.playerId] = player;
      if (player.id !== undefined && player.id !== null) result[String(player.id)] = player;
    }
    return result;
  }, [players]);

  const resolveName = useCallback((match: EventMatch, side: "home" | "away", index: number) => {
    const assignedPlayer = side === "home" ? match.homePlayer : match.awayPlayer;
    const assignedId = side === "home" ? match.homePlayerId : match.awayPlayerId;
    const lookedUp = assignedId ? playersById[String(assignedId)] : undefined;
    return assignedPlayer?.name || lookedUp?.name || assignedId ||
      (side === "home" ? `Real Madrid player ${String(index + 1).padStart(2, "0")}` : `Barcelona player ${String(index + 1).padStart(2, "0")}`);
  }, [playersById]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError("");
    const token = localStorage.getItem("access_token");
    const isSuperAdminSession = (localStorage.getItem("userType") || "").toLowerCase() === "superadmin";
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    try {
      const matchResponse = await fetch(
        `${API_BASE}/matches/competition/${encodeURIComponent(COMPETITION_ID)}`,
        { cache: "no-store", headers },
      );
      const matchPayload: unknown = await matchResponse.json().catch(() => ({}));
      if (!matchResponse.ok) {
        const message = (matchPayload as { message?: string | string[] })?.message;
        throw new Error(Array.isArray(message) ? message.join(", ") : message || `Could not load matches (${matchResponse.status}).`);
      }
      const loadedMatches = getArray<EventMatch>(matchPayload, ["matches", "data", "items"])
        .filter((match) => match.competitionId == null || match.competitionId === COMPETITION_ID)
        .map(normalizeStoredSides)
        .sort((a, b) => a.matchId.localeCompare(b.matchId));
      setMatches(loadedMatches);
      setDrafts((previous) => {
        const next = { ...previous };
        for (const match of loadedMatches) {
          if (!next[match.matchId]) {
            next[match.matchId] = {
              home: match.homeScore == null ? "" : String(match.homeScore),
              away: match.awayScore == null ? "" : String(match.awayScore),
            };
          }
        }
        return next;
      });
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load El Clásico matches.");
    }

    {
      try {
        const playersResponse = await fetch(`${API_BASE}/player`, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const playerPayload: unknown = await playersResponse.json().catch(() => ({}));
        if (playersResponse.ok) {
          const loadedPlayers = getArray<EventPlayer>(playerPayload, ["players", "data", "items"])
            .filter((player) => player.playerId && player.name);
          setPlayers(loadedPlayers);
        } else if (isSuperAdminSession) {
          const message = (playerPayload as { message?: string | string[] })?.message;
          setPageError(Array.isArray(message) ? message.join(", ") : message || "Could not load the player list.");
        }
      } catch {
        if (isSuperAdminSession) setPageError("Could not load the player list. Check your connection and refresh.");
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userType = (localStorage.getItem("userType") || "").toLowerCase();
    let storedUser: StoredUser | null = null;
    try {
      storedUser = JSON.parse(localStorage.getItem("player") || "null") as StoredUser | null;
    } catch {
      storedUser = null;
    }
    const superAdmin = userType === "superadmin" || storedUser?.userType?.toLowerCase() === "superadmin";
    setIsSuperAdmin(superAdmin);
    const savedMotm = localStorage.getItem(MOTM_STORAGE_KEY) || "";
    setAnnouncedMotmId(savedMotm);
    setMotmDraft(savedMotm);
    void loadData();
    // Initial identity is read only once; reload player data with these permissions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (announcedMotmId && !motmDraft) setMotmDraft(announcedMotmId);
  }, [announcedMotmId, motmDraft]);

  const totals = useMemo(() => playerPoints(matches), [matches]);
  const completedCount = useMemo(
    () => matches.filter((match) => normalizeStatus(match) === "COMPLETED").length,
    [matches],
  );

  const uniqueAssignedPlayers = useMemo(() => {
    const seen = new Set<string>();
    const assigned: Array<{ player: EventPlayer; team: "Real Madrid" | "Barcelona" }> = [];
    matches.forEach((match) => {
      if (match.homePlayerId && !seen.has(match.homePlayerId)) {
        const player = playersById[match.homePlayerId] || match.homePlayer;
        if (player?.playerId) {
          seen.add(player.playerId);
          assigned.push({ player, team: "Real Madrid" });
        }
      }
      if (match.awayPlayerId && !seen.has(match.awayPlayerId)) {
        const player = playersById[match.awayPlayerId] || match.awayPlayer;
        if (player?.playerId) {
          seen.add(player.playerId);
          assigned.push({ player, team: "Barcelona" });
        }
      }
    });
    return assigned;
  }, [matches, playersById]);

  const announcedMotm = playersById[announcedMotmId] || uniqueAssignedPlayers.find(({ player }) => player.playerId === announcedMotmId)?.player || null;

  const updateDraft = (matchId: string, side: "home" | "away", value: string) => {
    if (value !== "" && (!/^\d+$/.test(value) || Number(value) > 99)) return;
    setDrafts((previous) => ({
      ...previous,
      [matchId]: { ...(previous[matchId] || { home: "", away: "" }), [side]: value },
    }));
  };

  const submitResult = async (match: EventMatch) => {
    setNotice("");
    setPageError("");
    const draft = drafts[match.matchId] || { home: "", away: "" };
    if (draft.home === "" || draft.away === "") {
      setPageError("Enter both match scores before submitting.");
      return;
    }
    if (!match.homePlayerId || !match.awayPlayerId) {
      setPageError("Both players must be assigned before submitting this result.");
      return;
    }
    // Score submission is available to visitors too. Send the token when one
    // exists, but do not block an anonymous request on the frontend.
    const token = localStorage.getItem("access_token");
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) requestHeaders.Authorization = `Bearer ${token}`;

    setSubmittingMatch(match.matchId);
    try {
      const response = await fetch(`${API_BASE}/matches/${encodeURIComponent(match.matchId)}/result`, {
        method: "PATCH",
        headers: requestHeaders,
        body: JSON.stringify({ homeScore: Number(draft.away), awayScore: Number(draft.home) }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = (payload as { message?: string | string[] })?.message;
        if (response.status === 401 || response.status === 403) {
          throw new Error("The backend is still requiring login to submit results. Its match-result endpoint must allow public submissions.");
        }
        throw new Error(Array.isArray(message) ? message.join(", ") : message || `Could not submit result (${response.status}).`);
      }
      setNotice(`Result submitted for ${match.matchId}.`);
      setDrafts((previous) => ({ ...previous, [match.matchId]: { home: "", away: "" } }));
      await loadData();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not submit this result.");
    } finally {
      setSubmittingMatch(null);
    }
  };

  const openAssignment = (match: EventMatch) => {
    if (["COMPLETED", "CANCELLED"].includes(normalizeStatus(match))) {
      setPageError("Players cannot be changed after a match is completed or cancelled.");
      return;
    }
    setPageError("");
    setNotice("");
    setEditingMatch(match);
    setAssignmentDraft({ home: match.homePlayerId || "", away: match.awayPlayerId || "" });
  };

  const saveAssignment = async () => {
    if (!editingMatch) return;
    if (!assignmentDraft.home || !assignmentDraft.away) {
      setPageError("Choose one Real Madrid player and one Barcelona player.");
      return;
    }
    if (assignmentDraft.home === assignmentDraft.away) {
      setPageError("A player cannot be assigned to both sides of the same match.");
      return;
    }
    const token = localStorage.getItem("access_token");
    if (!token) {
      setPageError("Log in as Super Admin to assign players.");
      return;
    }
    setSavingAssignment(true);
    setPageError("");
    setNotice("");
    try {
      // Uses the existing generic match-update endpoint. No backend route is added.
      const response = await fetch(`${API_BASE}/matches/${encodeURIComponent(editingMatch.matchId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ homePlayerId: assignmentDraft.away, awayPlayerId: assignmentDraft.home }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = (payload as { message?: string | string[] })?.message;
        throw new Error(Array.isArray(message) ? message.join(", ") : message || `Could not assign players (${response.status}). Confirm your existing PATCH /matches/:matchId route supports player assignment.`);
      }
      setEditingMatch(null);
      setNotice(`Players assigned to ${editingMatch.matchId}.`);
      await loadData();
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not assign players.");
    } finally {
      setSavingAssignment(false);
    }
  };

  const playerOptionsForMatch = (match: EventMatch) => {
    const usedElsewhere = new Set<string>();
    for (const other of matches) {
      if (other.matchId === match.matchId) continue;
      if (other.homePlayerId) usedElsewhere.add(other.homePlayerId);
      if (other.awayPlayerId) usedElsewhere.add(other.awayPlayerId);
    }
    return players.filter((player) => !usedElsewhere.has(player.playerId) || player.playerId === match.homePlayerId || player.playerId === match.awayPlayerId);
  };

  const announceManOfTheMatch = () => {
    if (!isSuperAdmin) return;
    if (!motmDraft || !playersById[motmDraft]) {
      setPageError("Choose an assigned player to announce as Man of the Match.");
      return;
    }
    setSavingMotm(true);
    setPageError("");
    localStorage.setItem(MOTM_STORAGE_KEY, motmDraft);
    setAnnouncedMotmId(motmDraft);
    setNotice(`Man of the Match selected: ${playersById[motmDraft].name}.`);
    setSavingMotm(false);
  };

  const downloadScorecard = async () => {
    try {
      const canvas = await drawScorecardImage(matches, resolveName, announcedMotm);
      downloadCanvas(canvas, "El-Clasico-Scorecard.png");
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Could not download the scorecard image.");
    }
  };

  // Any visitor can submit a result; match fields and API availability still
  // determine whether a particular match can accept a score.
  const canSubmitResult = (_match: EventMatch) => true;

  const cardStatusClass = (status: string) => {
    if (status === "COMPLETED") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    if (status === "CANCELLED") return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    if (status === "RESCHEDULED") return "border-orange-300/20 bg-orange-300/10 text-orange-200";
    return "border-amber-300/20 bg-amber-300/10 text-amber-200";
  };

  return (
    <main className="min-h-screen bg-[#080910] text-white">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-48 top-24 h-96 w-96 rounded-full bg-amber-400/[0.06] blur-3xl" />
        <div className="absolute -right-48 top-80 h-96 w-96 rounded-full bg-rose-500/[0.05] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-3 pb-12 pt-6 sm:px-6 sm:pt-10">
        <header className="relative mb-7 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#17192a] via-[#10111c] to-[#211d18] px-4 py-8 text-center shadow-2xl shadow-black/30 sm:mb-9 sm:px-10 sm:py-12">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.28em] text-amber-200 sm:text-xs">
            <Trophy size={14} /> Thrill Seekers Event
          </p>
          <h1 className="text-3xl font-black uppercase tracking-[0.12em] sm:text-6xl">El Clásico</h1>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-300 sm:text-xs">12 vs 12</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-300 sm:text-xs">Friendly Challenge</span>
          </div>
        </header>

       <section aria-label="Team scorecard" className="mb-7 rounded-3xl border border-white/10 bg-[#11121e]/95 p-4 shadow-xl shadow-black/20 sm:mb-9 sm:p-7">
  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-8">
    <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:justify-end sm:gap-4">
      {/* Real Madrid Logo (Border and container frame removed) */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center p-1 sm:h-16 sm:w-16">
        <img src={REAL_MADRID_LOGO_URL} alt="Real Madrid crest" className="h-full w-full object-contain" />
      </div>
      <div className="text-center sm:text-right">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white sm:text-base">Real Madrid</p>
        <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">Home team · 18 players</p>
      </div>
    </div>
    <div className="flex items-center gap-1.5 sm:gap-3" aria-live="polite">
      <div className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-white px-3 text-2xl font-black tabular-nums text-[#15120a] shadow-lg shadow-amber-900/10 sm:h-[4.5rem] sm:min-w-[4.5rem] sm:text-4xl">{totals.realMadrid}</div>
      <span className="text-lg font-black text-zinc-600 sm:text-2xl">:</span>
      <div className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-[#c8102e] px-3 text-2xl font-black tabular-nums text-white shadow-lg shadow-rose-950/20 sm:h-[4.5rem] sm:min-w-[4.5rem] sm:text-4xl">{totals.barcelona}</div>
    </div>
    <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:justify-start sm:gap-4">
      {/* Barcelona Logo (Border and container frame removed) */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center p-1 sm:h-16 sm:w-16">
        <img src={BARCELONA_LOGO_URL} alt="FC Barcelona crest" className="h-full w-full object-contain" />
      </div>
      <div className="text-center sm:text-left">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white sm:text-base">Barcelona</p>
        <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">Away team · 18 players</p>
      </div>
    </div>
  </div>
  <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-4 text-[10px] text-zinc-400 sm:text-xs">
    <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-emerald-300" /> {completedCount} / 18 completed</span>
   
  </div>
  <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
    <button type="button" onClick={downloadScorecard} disabled={matches.length === 0} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-3 text-xs font-black text-[#161209] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm">
      <Download size={16} /> Download scorecard image
    </button>
    <button type="button" onClick={() => void loadData()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-zinc-200 transition hover:bg-white/[0.08] disabled:opacity-50 sm:text-sm">
      <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh matches
    </button>
  </div>
</section>

        {pageError && <div role="alert" className="mb-4 rounded-2xl border border-rose-400/25 bg-rose-500/[0.08] px-4 py-3 text-sm text-rose-200">{pageError}</div>}
        {notice && <div role="status" className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.07] px-4 py-3 text-sm text-emerald-200">{notice}</div>}

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-amber-300">The line-up</p>
            <h2 className="mt-1 text-xl font-black sm:text-2xl">Match cards <span className="text-zinc-500">({matches.length}/18)</span></h2>
            <p className="mt-1 text-xs text-zinc-500">Real Madrid on the left · Barcelona on the right</p>
          </div>
          {isSuperAdmin && <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200"><ShieldCheck size={13} /> Super Admin controls</span>}
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#11121e] p-10 text-center text-sm text-zinc-400"><LoaderCircle className="mx-auto mb-3 animate-spin" size={24} />Loading El Clásico…</div>
        ) : matches.length === 0 ? (
          <div className="rounded-2xl border border-amber-300/15 bg-[#11121e] p-7 text-center"><p className="font-bold text-white">No matches found yet.</p><p className="mt-2 text-sm text-zinc-400">Create the 18 matches with competition ID {COMPETITION_ID}, then refresh.</p></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {matches.map((match, index) => {
              const status = normalizeStatus(match);
              const completed = status === "COMPLETED";
              const cancelled = status === "CANCELLED";
              const live = ["LIVE", "IN_PROGRESS", "IN PROGRESS"].includes(status);
              const homeName = resolveName(match, "home", index);
              const awayName = resolveName(match, "away", index);
              const draft = drafts[match.matchId] || { home: "", away: "" };
              const hasPlayers = Boolean(match.homePlayerId && match.awayPlayerId);
              const allowedToSubmit = canSubmitResult(match);
              const homeWon = completed && match.homeScore != null && match.awayScore != null && match.homeScore > match.awayScore;
              const awayWon = completed && match.homeScore != null && match.awayScore != null && match.awayScore > match.homeScore;
              const homeIsMotm = Boolean(announcedMotmId && match.homePlayerId === announcedMotmId);
              const awayIsMotm = Boolean(announcedMotmId && match.awayPlayerId === announcedMotmId);
              return (
                <article key={match.matchId} className="group overflow-hidden rounded-2xl border border-white/[0.09] bg-[#11121e] shadow-lg shadow-black/10 transition hover:border-amber-300/20 hover:bg-[#141522]">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] font-bold text-zinc-300">{match.matchId}</span>
                      <span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider ${cardStatusClass(status)}`}>{status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 p-3 sm:gap-3 sm:p-4">
                    <div className={`min-w-0 rounded-xl border px-2.5 py-3 sm:px-3 ${homeWon ? "border-emerald-400/25 bg-emerald-400/[0.07]" : "border-amber-300/10 bg-[#1b1c2c]"}`}>
                      <div className="mb-2 flex items-center gap-2">
                        <img src={REAL_MADRID_LOGO_URL} alt="Real Madrid" className="h-8 w-8 shrink-0 object-contain" />
                      </div>
                      <p className={`min-h-[2.25rem] break-words text-xs font-semibold leading-snug sm:text-sm ${homeIsMotm ? "rounded-lg border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-amber-200 shadow-sm shadow-amber-900/20" : "text-white"}`}>
                        {homeIsMotm && <Award size={12} className="mr-1 inline-block text-amber-300" aria-label="Man of the Match" />}
                        {match.homePlayerId ? homeName : "Player not assigned"}
                      </p>
                      {match.homePlayerId && <p className="mt-1 truncate text-[10px] text-zinc-500">{match.homePlayerId}</p>}
                    </div>
                    <div className="flex min-w-[73px] flex-col items-center gap-2 sm:min-w-[86px]">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] shadow-sm ${live ? "border-rose-400/35 bg-rose-500/15 text-rose-300 shadow-rose-950/30" : "border-white/10 bg-white/[0.04] text-zinc-400 shadow-black/10"}`}
                        aria-label={live ? "Live match" : "Match result"}
                        title={live ? "Match is live" : "Match result panel"}
                      >
                        <Radio size={12} className={live ? "animate-pulse" : ""} />
                        {live ? "LIVE" : "RESULT"}
                      </span>
                      {completed && match.homeScore != null && match.awayScore != null ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`flex h-10 min-w-9 items-center justify-center rounded-lg px-2 text-lg font-black tabular-nums ${homeWon ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-200"}`}>{match.homeScore}</span>
                          <span className="text-zinc-600">:</span>
                          <span className={`flex h-10 min-w-9 items-center justify-center rounded-lg px-2 text-lg font-black tabular-nums ${awayWon ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-200"}`}>{match.awayScore}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input aria-label={`${match.matchId} Real Madrid score`} inputMode="numeric" type="number" min="0" max="99" value={draft.home} onChange={(event) => updateDraft(match.matchId, "home", event.target.value)} disabled={!allowedToSubmit || cancelled || !hasPlayers} className="h-10 w-10 rounded-lg border border-white/10 bg-[#090a12] text-center text-base font-black text-white outline-none transition focus:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-35" placeholder="–" />
                          <span className="text-zinc-600">:</span>
                          <input aria-label={`${match.matchId} Barcelona score`} inputMode="numeric" type="number" min="0" max="99" value={draft.away} onChange={(event) => updateDraft(match.matchId, "away", event.target.value)} disabled={!allowedToSubmit || cancelled || !hasPlayers} className="h-10 w-10 rounded-lg border border-white/10 bg-[#090a12] text-center text-base font-black text-white outline-none transition focus:border-amber-300/70 disabled:cursor-not-allowed disabled:opacity-35" placeholder="–" />
                        </div>
                      )}
                      <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-600">{completed ? (match.homeScore === match.awayScore ? "Draw" : "Full time") : cancelled ? "No result" : "Final score"}</span>
                    </div>
                    <div className={`min-w-0 rounded-xl border px-2.5 py-3 sm:px-3 ${awayWon ? "border-emerald-400/25 bg-emerald-400/[0.07]" : "border-rose-300/10 bg-[#1b1c2c]"}`}>
                      <div className="mb-2 flex items-center justify-end gap-2">
                        <img src={BARCELONA_LOGO_URL} alt="FC Barcelona" className="h-8 w-8 shrink-0 object-contain" />
                      </div>
                      <p className={`min-h-[2.25rem] break-words text-right text-xs font-semibold leading-snug sm:text-sm ${awayIsMotm ? "rounded-lg border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-amber-200 shadow-sm shadow-amber-900/20" : "text-white"}`}>
                        {match.awayPlayerId ? awayName : "Player not assigned"}
                        {awayIsMotm && <Award size={12} className="ml-1 inline-block text-amber-300" aria-label="Man of the Match" />}
                      </p>
                      {match.awayPlayerId && <p className="mt-1 truncate text-right text-[10px] text-zinc-500">{match.awayPlayerId}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-3 py-3 sm:px-4">
                    <p className="max-w-[70%] text-[10px] leading-relaxed text-zinc-500 sm:text-xs">{cancelled ? "This match is cancelled." : completed ? "Result recorded in the existing match system." : !hasPlayers ? "Waiting for Super Admin to assign both players." : "Anyone can enter and submit the final score."}</p>
                    <div className="flex flex-wrap justify-end gap-2">
                      {isSuperAdmin && <button type="button" onClick={() => openAssignment(match)} disabled={completed || cancelled} title={completed || cancelled ? "Players cannot be changed after a match is completed or cancelled" : "Choose players for this match"} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/25 bg-amber-300/[0.08] px-3 py-2 text-[10px] font-extrabold text-amber-200 transition hover:bg-amber-300/[0.15] disabled:cursor-not-allowed disabled:opacity-35 sm:text-xs"><Users size={14} /> Add players</button>}
                      {!completed && !cancelled && allowedToSubmit && <button type="button" onClick={() => void submitResult(match)} disabled={!hasPlayers || submittingMatch === match.matchId} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-300 px-3 py-2 text-[10px] font-black text-[#151209] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40 sm:text-xs">{submittingMatch === match.matchId ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}{submittingMatch === match.matchId ? "Submitting…" : "Submit result"}</button>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#171623] to-[#11121e] p-5 sm:mt-10 sm:p-7">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200"><Award size={22} /></div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-amber-300">Event award</p>
              <h2 className="mt-1 text-xl font-black">Man of the Match</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">The selected player will appear on the downloadable event scorecard.</p>
            </div>
          </div>

          {announcedMotm ? (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-yellow-600 text-sm font-black text-[#17130a]">{initials(announcedMotm.name)}</div>
              <div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-200">Man of the Match</p><p className="mt-1 break-words font-bold text-white">{announcedMotm.name}</p><p className="text-xs text-zinc-500">{announcedMotm.playerId}</p></div>
              <Trophy className="text-amber-300" size={25} />
            </div>
          ) : (
            <div className="mb-4 rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center text-sm text-zinc-500">Man of the Match has not been announced yet.</div>
          )}

          {isSuperAdmin ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block flex-1">
                <span className="sr-only">Choose Man of the Match</span>
                <select value={motmDraft} onChange={(event) => setMotmDraft(event.target.value)} className="w-full appearance-none rounded-xl border border-white/10 bg-[#090a12] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-amber-300/50">
                  <option value="">Choose Man of the Match</option>
                  {uniqueAssignedPlayers.map(({ player, team }) => <option key={`${team}-${player.playerId}`} value={player.playerId}>{team} — {player.name} ({player.playerId})</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              </label>
              <button type="button" onClick={announceManOfTheMatch} disabled={!motmDraft || savingMotm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-[#151209] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40">{savingMotm ? <LoaderCircle className="animate-spin" size={16} /> : <Award size={16} />} Announce Man of the Match</button>
            </div>
          ) : (
            <p className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-xs text-zinc-500">Man of the Match selection is managed by the Super Admin.</p>
          )}
          {isSuperAdmin && <p className="mt-3 text-[10px] leading-relaxed text-amber-100/60">Note: because the backend is being kept unchanged, this award is saved in this browser only. Shared server-side persistence would require backend/database support.</p>}
        </section>

        <footer className="mt-8 border-t border-white/[0.07] pt-5 text-center text-[10px] leading-relaxed text-zinc-600 sm:text-xs">
          Real Madrid win = 1 team point · Barcelona win = 1 team point · Draw = 0 points for both teams.
          <br />Match results use the existing Thrill Seekers backend endpoints.
        </footer>
      </div>

      {editingMatch && isSuperAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingAssignment) setEditingMatch(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="assignment-title" className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#11121e] shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between border-b border-white/[0.07] px-5 py-4 sm:px-6">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-amber-300">Match line-up</p><h2 id="assignment-title" className="mt-1 text-xl font-black">Add players</h2><p className="mt-1 text-xs text-zinc-500">{editingMatch.matchId} · choose one player for each team</p></div>
              <button type="button" onClick={() => setEditingMatch(null)} disabled={savingAssignment} aria-label="Close player selection" className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-200"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-[9px] font-black text-[#151209]">RM</span> Real Madrid player</span>
                <select value={assignmentDraft.home} onChange={(event) => setAssignmentDraft((current) => ({ ...current, home: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#090a12] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300/60">
                  <option value="">Choose Real Madrid player</option>
                  {playerOptionsForMatch(editingMatch).map((player) => <option key={player.playerId} value={player.playerId}>{player.name} ({player.playerId})</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-200"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-[8px] font-black text-white">FCB</span> Barcelona player</span>
                <select value={assignmentDraft.away} onChange={(event) => setAssignmentDraft((current) => ({ ...current, away: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-[#090a12] px-4 py-3 text-sm text-white outline-none transition focus:border-rose-300/50">
                  <option value="">Choose Barcelona player</option>
                  {playerOptionsForMatch(editingMatch).map((player) => <option key={player.playerId} value={player.playerId}>{player.name} ({player.playerId})</option>)}
                </select>
              </label>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-xs leading-relaxed text-zinc-500"><Users className="mr-1 inline" size={13} /> A player already assigned to another match is hidden from the other match selectors to help keep the lineup at 18 vs 18.</div>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setEditingMatch(null)} disabled={savingAssignment} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-40">Cancel</button>
                <button type="button" onClick={() => void saveAssignment()} disabled={savingAssignment || !assignmentDraft.home || !assignmentDraft.away || assignmentDraft.home === assignmentDraft.away} className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-[#151209] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40">{savingAssignment ? <LoaderCircle className="animate-spin" size={16} /> : <Check size={16} />} Save players</button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
