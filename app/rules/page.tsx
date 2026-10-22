"use client";

import { useState, type ReactNode } from "react";
import Navbar from "../components/Navbar";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Download,
  FileText,
  Gamepad2,
  Info,
  ShieldCheck,
  Users,
  Video,
  XCircle,
  type LucideIcon,
} from "lucide-react";

type BulletRule = {
  text: string;
};

type ImportantRule = {
  number: number;
  title: string;
  description: string;
  bullets?: BulletRule[];
  icon: LucideIcon;
};

type OtherRule = {
  number: number;
  title: string;
  icon: LucideIcon;
  bullets: BulletRule[];
};

const importantRules: ImportantRule[] = [
  {
    number: 1,
    title: "Match Time Slots",
    description:
      "All matches must be played within one of the following three time slots:",
    icon: Clock,
  },
  {
    number: 2,
    title: "Choose & Confirm Schedule",
    description: "",
    bullets: [
      { text: "After the schedule is announced, both players must select one of the three available time slots." },
      { text: "Both players must confirm the time." },
      { text: "Playing outside the designated time slots is not allowed without admin approval." },
    ],
    icon: CalendarDays,
  },
  {
    number: 3,
    title: "Video Evidence Mandatory",
    description:
      "For every win or draw, players must submit a video which includes:",
    bullets: [
      { text: "Device Name" },
      { text: "Game Settings" },
      { text: "Game User ID" },
    ],
    icon: Video,
  },
  {
    number: 4,
    title: "No Time Limit for Result Submission",
    description:
      "There is no Deadline + 30 minutes rule. Results must be submitted according to the rules below.",
    icon: XCircle,
  },
];

const otherRules: OtherRule[] = [
  {
    number: 5,
    title: "Failure to Provide Video Evidence",
    icon: Video,
    bullets: [
      { text: "If a player fails to provide the required video evidence, the opponent will get a 1-goal advantage and a rematch." },
      { text: "If it is found that the video was not provided intentionally, the opponent will get an automatic win." },
    ],
  },
  {
    number: 6,
    title: "Late Response",
    icon: XCircle,
    bullets: [
      { text: "Any player who responds after the match deadline will receive an automatic loss. The opponent will be awarded an automatic win." },
    ],
  },
  {
    number: 7,
    title: "Schedule Disputes",
    icon: CalendarClock,
    bullets: [
      { text: "Both players are responsible for selecting and confirming their match time." },
      { text: "If players cannot agree on a time slot, they must inform the admin before the match deadline." },
      { text: "The admin will review the situation and determine the appropriate outcome." },
    ],
  },
];

const additionalNotes = [
  {
    title: "Be respectful",
    description: "Maintain fair play and sportsmanship at all times.",
    icon: Gamepad2,
  },
  {
    title: "Use official channels",
    description:
      "Communicate with your opponent and the admin through the official league platform only.",
    icon: Users,
  },
  {
    title: "Follow the rules",
    description: "Any violation may result in penalties or disqualification.",
    icon: ShieldCheck,
  },
  {
    title: "Final decision",
    description:
      "In situations not covered by these rules, the league administrator has the final authority to determine the outcome.",
    icon: CheckCircle2,
  },
];

const timeSlots = [
  { label: "Slot 1", time: "10:00 PM – 11:00 PM", color: "bg-rose-500" },
  { label: "Slot 2", time: "11:00 PM – 12:00 AM", color: "bg-amber-400 text-slate-950" },
  { label: "Slot 3", time: "12:00 AM – 12:30 AM", color: "bg-teal-400 text-slate-950" },
];

const posterCanvasWidth = 1024;
const posterCanvasHeight = 1536;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill?: string | CanvasGradient | CanvasPattern,
  stroke?: string,
  lineWidth = 1,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  font: string,
  color: string,
) {
  ctx.font = font;
  ctx.fillStyle = color;
  const paragraphs = text.split("\n");
  let currentY = y;

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(testLine).width > maxWidth) {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  }
  return currentY;
}

function drawPosterBullet(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  color = "#e6edf3",
  bulletColor = "#23e6cf",
  fontSize = 15,
  lineHeight = 20,
) {
  ctx.beginPath();
  ctx.arc(x + 4, y - 5, 4, 0, Math.PI * 2);
  ctx.fillStyle = bulletColor;
  ctx.fill();
  return wrapCanvasText(
    ctx,
    text,
    x + 17,
    y,
    width - 17,
    lineHeight,
    `${fontSize}px Arial, sans-serif`,
    color,
  ) + 3;
}

function drawPosterNumber(ctx: CanvasRenderingContext2D, number: number, x: number, y: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, 15, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "#061019";
  ctx.font = "bold 17px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), x, y + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawPosterSectionHeader(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  title: string,
  subtitle: string,
  theme: "rose" | "teal",
) {
  const color = theme === "rose" ? "#f43f66" : "#11d9cb";
  const gradient = ctx.createLinearGradient(x, y, x + width * 0.55, y);
  if (theme === "rose") {
    gradient.addColorStop(0, "#f72e5d");
    gradient.addColorStop(1, "#b90d40");
  } else {
    gradient.addColorStop(0, "#08bdbd");
    gradient.addColorStop(1, "#12d6c7");
  }
  roundedRect(ctx, x, y, width, 64, 14, gradient);
  ctx.fillStyle = theme === "rose" ? "#111722" : "#031219";
  ctx.font = "bold 30px Arial, sans-serif";
  ctx.fillText(title.toUpperCase(), x + 28, y + 39);
  ctx.fillStyle = "#d5e2e9";
  ctx.font = "11px Arial, sans-serif";
  ctx.fillText(subtitle.toUpperCase(), x + width + 18, y + 37);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + width + 18, y + 50);
  ctx.lineTo(972, y + 50);
  ctx.stroke();
}

function createRulesPoster(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = posterCanvasWidth;
  canvas.height = posterCanvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Unable to create rules poster canvas.");

  const bg = "#03101a";
  const panel = "rgba(3, 15, 25, 0.93)";
  const text = "#edf4f8";
  const muted = "#b3c0cb";
  const rose = "#fa315d";
  const teal = "#18e2cf";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#073d3e";
  ctx.beginPath();
  ctx.moveTo(-70, 150);
  ctx.lineTo(145, -65);
  ctx.moveTo(-25, 185);
  ctx.lineTo(180, -20);
  ctx.moveTo(870, 1600);
  ctx.lineTo(1090, 1380);
  ctx.moveTo(920, 1600);
  ctx.lineTo(1110, 1410);
  ctx.stroke();
  ctx.strokeStyle = "#0b6866";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-30, 135);
  ctx.lineTo(115, -10);
  ctx.moveTo(908, 1565);
  ctx.lineTo(1060, 1413);
  ctx.stroke();

  // Brand/header
  // Simple vector crown so the downloaded poster has the same club identity.
  ctx.strokeStyle = "#f3f7fa";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(165, 56);
  ctx.lineTo(173, 34);
  ctx.lineTo(188, 48);
  ctx.lineTo(203, 27);
  ctx.lineTo(219, 48);
  ctx.lineTo(235, 34);
  ctx.lineTo(242, 56);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(169, 61);
  ctx.lineTo(239, 61);
  ctx.stroke();
  for (const point of [[173, 32], [203, 25], [235, 32]]) {
    ctx.beginPath();
    ctx.arc(point[0], point[1], 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f3f7fa";
    ctx.fill();
  }
  ctx.fillStyle = text;
  ctx.font = "bold italic 41px Arial, sans-serif";
  ctx.fillText("THRILL SEEKERS", 58, 86);
  ctx.fillStyle = "#c5d2da";
  ctx.font = "15px Arial, sans-serif";
  ctx.fillText("E F O O T B A L L   C L U B", 100, 120);
  ctx.strokeStyle = "#f0f3f6";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(365, 57);
  ctx.lineTo(365, 139);
  ctx.stroke();
  ctx.fillStyle = text;
  ctx.font = "bold 25px Arial, sans-serif";
  ctx.fillText("MATCH RESULT SUBMISSION &", 408, 75);
  ctx.fillStyle = teal;
  ctx.font = "bold 34px Arial, sans-serif";
  ctx.fillText("SCHEDULING RULES", 408, 119);
  ctx.fillStyle = "#b7c6d0";
  ctx.font = "13px Arial, sans-serif";
  ctx.fillText("O F F I C I A L   C L U B   R U L E S", 409, 148);
  ctx.save();
  ctx.translate(894, 93);
  ctx.rotate(-0.16);
  ctx.fillStyle = "#8b9ca9";
  ctx.font = "italic bold 22px Arial, sans-serif";
  ctx.fillText("PLAY", 0, 0);
  ctx.fillText("COMPETE", -3, 24);
  ctx.fillText("GROW", 14, 48);
  ctx.restore();
  ctx.strokeStyle = teal;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(897, 160);
  ctx.quadraticCurveTo(933, 145, 976, 138);
  ctx.stroke();

  // Important rules panel
  roundedRect(ctx, 25, 220, 974, 453, 20, panel, "#733047", 1.5);
  drawPosterSectionHeader(ctx, 25, 217, 442, "Important Rules", "Please read carefully", "rose");
  const starts = [50, 291, 532, 773];
  const width = 205;
  const separators = [280, 521, 762];
  ctx.strokeStyle = "#6e3e55";
  ctx.lineWidth = 1.1;
  for (const x of separators) {
    ctx.beginPath();
    ctx.moveTo(x, 315);
    ctx.lineTo(x, 649);
    ctx.stroke();
  }

  // Rule 1
  drawPosterNumber(ctx, 1, starts[0] + 15, 359, rose);
  wrapCanvasText(ctx, "MATCH TIME SLOTS", starts[0] + 39, 366, width - 42, 21, "bold 17px Arial, sans-serif", text);
  wrapCanvasText(ctx, "All matches must be played within one of the following three time slots.", starts[0], 411, width, 22, "15px Arial, sans-serif", muted);
  roundedRect(ctx, starts[0], 509, width, 125, 14, "#0c1b29", "#294252", 1.3);
  const slotColors = [rose, "#f3bd36", teal];
  const slotLabels = ["Slot 1", "Slot 2", "Slot 3"];
  const slotTimes = ["10:00 PM – 11:00 PM", "11:00 PM – 12:00 AM", "12:00 AM – 12:30 AM"];
  for (let i = 0; i < 3; i++) {
    roundedRect(ctx, starts[0] + 12, 523 + i * 35, 65, 25, 7, slotColors[i]);
    ctx.fillStyle = i === 1 || i === 2 ? "#061019" : "#ffffff";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(slotLabels[i], starts[0] + 44, 540 + i * 35);
    ctx.textAlign = "left";
    ctx.fillStyle = text;
    ctx.font = "12.5px Arial, sans-serif";
    ctx.fillText(slotTimes[i], starts[0] + 84, 540 + i * 35);
  }

  // Rule 2
  drawPosterNumber(ctx, 2, starts[1] + 15, 359, rose);
  let y = wrapCanvasText(ctx, "CHOOSE & CONFIRM SCHEDULE", starts[1] + 39, 356, width - 40, 20, "bold 16px Arial, sans-serif", text) + 15;
  y = drawPosterBullet(ctx, "After the schedule is announced, both players must select one of the three available time slots.", starts[1], y, width, text, rose, 14, 19);
  y = drawPosterBullet(ctx, "Both players must confirm the time.", starts[1], y, width, text, rose, 14, 19);
  drawPosterBullet(ctx, "Playing outside the designated time slots is not allowed without admin approval.", starts[1], y, width, text, rose, 14, 19);

  // Rule 3
  drawPosterNumber(ctx, 3, starts[2] + 15, 359, rose);
  y = wrapCanvasText(ctx, "VIDEO EVIDENCE MANDATORY", starts[2] + 39, 356, width - 40, 20, "bold 16px Arial, sans-serif", text) + 15;
  y = wrapCanvasText(ctx, "For every win or draw, players must submit a video which includes:", starts[2], y, width, 20, "14px Arial, sans-serif", muted) + 8;
  for (const item of ["Device Name", "Game Settings", "Game User ID"]) {
    ctx.beginPath();
    ctx.arc(starts[2] + 9, y - 5, 8, 0, Math.PI * 2);
    ctx.fillStyle = teal;
    ctx.fill();
    ctx.strokeStyle = "#07352f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(starts[2] + 5, y - 5);
    ctx.lineTo(starts[2] + 8, y - 1);
    ctx.lineTo(starts[2] + 14, y - 10);
    ctx.stroke();
    ctx.fillStyle = text;
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText(item, starts[2] + 28, y);
    y += 26;
  }
  wrapCanvasText(ctx, "The video must be clear, authentic and unedited.", starts[2], y + 7, width, 19, "14px Arial, sans-serif", muted);

  // Rule 4
  drawPosterNumber(ctx, 4, starts[3] + 15, 359, rose);
  wrapCanvasText(ctx, "NO TIME LIMIT FOR RESULT SUBMISSION", starts[3] + 39, 356, width - 40, 20, "bold 16px Arial, sans-serif", text);
  wrapCanvasText(ctx, "There is no Deadline + 30 minutes rule. Results must be submitted according to the rules below.", starts[3], 414, width, 22, "14px Arial, sans-serif", muted);

  // Other rules panel
  roundedRect(ctx, 25, 706, 974, 468, 20, panel, "#087e80", 1.5);
  drawPosterSectionHeader(ctx, 25, 703, 365, "Other Rules", "Additional terms & conditions", "teal");
  const otherRows = [
    { y: 805, number: 5, title: "FAILURE TO PROVIDE VIDEO EVIDENCE", bullets: ["If a player fails to provide the required video evidence, the opponent will get a 1-goal advantage and a rematch.", "If it is found that the video was not provided intentionally, the opponent will get an automatic win."] },
    { y: 920, number: 6, title: "LATE RESPONSE", bullets: ["Any player who responds after the match deadline will receive an automatic loss. The opponent will be awarded an automatic win."] },
    { y: 1020, number: 7, title: "SCHEDULE DISPUTES", bullets: ["Both players are responsible for selecting and confirming their match time.", "If players cannot agree on a time slot, they must inform the admin before the match deadline.", "The admin will review the situation and determine the appropriate outcome."] },
  ];
  for (const row of otherRows) {
    roundedRect(ctx, 50, row.y, 74, 75, 13, "#071924", "#125b62", 1.5);
    ctx.fillStyle = teal;
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(row.number === 5 ? "▶" : row.number === 6 ? "×" : "◷", 87, row.y + 47);
    ctx.textAlign = "left";
    drawPosterNumber(ctx, row.number, 168, row.y + 25, teal);
    wrapCanvasText(ctx, row.title, 201, row.y + 20, 190, 20, "bold 17px Arial, sans-serif", text);
    let bulletY = row.y + 17;
    for (const bullet of row.bullets) {
      bulletY = drawPosterBullet(ctx, bullet, 415, bulletY, 545, muted, teal, 14, 18);
    }
    if (row.number !== 7) {
      ctx.strokeStyle = "#334653";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(48, row.y + (row.number === 5 ? 98 : 88));
      ctx.lineTo(976, row.y + (row.number === 5 ? 98 : 88));
      ctx.stroke();
    }
  }

  // Additional notes panel
  roundedRect(ctx, 25, 1190, 974, 262, 20, panel, "#344a5a", 1.5);
  ctx.fillStyle = "#a9bdcb";
  ctx.beginPath();
  ctx.arc(65, 1231, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#091523";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("i", 65, 1239);
  ctx.textAlign = "left";
  ctx.fillStyle = "#dce6ee";
  ctx.font = "bold 22px Arial, sans-serif";
  ctx.fillText("ADDITIONAL NOTES", 96, 1238);
  ctx.strokeStyle = "#40515e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(49, 1263);
  ctx.lineTo(687, 1263);
  ctx.moveTo(341, 1276);
  ctx.lineTo(341, 1428);
  ctx.moveTo(705, 1276);
  ctx.lineTo(705, 1428);
  ctx.stroke();

  const notePositions = [
    { x: 55, y: 1298 },
    { x: 372, y: 1298 },
    { x: 55, y: 1384 },
    { x: 372, y: 1384 },
  ];
  for (let i = 0; i < additionalNotes.length; i++) {
    const note = additionalNotes[i];
    const position = notePositions[i];
    ctx.fillStyle = teal;
    ctx.font = "bold 16px Arial, sans-serif";
    ctx.fillText(note.title, position.x, position.y);
    wrapCanvasText(ctx, note.description, position.x, position.y + 25, 245, 18, "13px Arial, sans-serif", muted);
  }
  ctx.save();
  ctx.translate(833, 1333);
  ctx.rotate(-0.12);
  ctx.fillStyle = teal;
  ctx.font = "italic bold 28px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("GOOD LUCK", 0, 0);
  ctx.fillText("TO ALL PLAYERS", 0, 35);
  ctx.strokeStyle = teal;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-85, 53);
  ctx.lineTo(100, 53);
  ctx.stroke();
  ctx.restore();
  ctx.textAlign = "left";
  ctx.fillStyle = "#718596";
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.fillText("THRILL SEEKERS", 750, 1413);
  ctx.font = "10px Arial, sans-serif";
  ctx.fillText("EFOOTBALL CLUB", 750, 1430);

  // Footer
  ctx.strokeStyle = "#526571";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(150, 1481);
  ctx.lineTo(285, 1481);
  ctx.moveTo(735, 1481);
  ctx.lineTo(870, 1481);
  ctx.stroke();
  ctx.fillStyle = "#6e9eaa";
  ctx.font = "13px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("T H R I L L   S E E K E R S     ×     E F O O T B A L L   C L U B", 512, 1486);
  ctx.textAlign = "left";

  return canvas;
}

export default function RulesPage() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadRulesPoster = async () => {
    setIsDownloading(true);

    // Open synchronously from the click on iOS, where blob downloads are unreliable.
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const openedTab = isIOS ? window.open("about:blank", "_blank") : null;

    try {
      const canvas = createRulesPoster();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result);
          else reject(new Error("Could not create the PNG image."));
        }, "image/png", 1);
      });

      const imageUrl = URL.createObjectURL(blob);
      if (isIOS) {
        if (openedTab && !openedTab.closed) {
          openedTab.location.href = imageUrl;
        } else {
          const fallbackLink = document.createElement("a");
          fallbackLink.href = imageUrl;
          fallbackLink.target = "_blank";
          fallbackLink.rel = "noopener noreferrer";
          document.body.appendChild(fallbackLink);
          fallbackLink.click();
          fallbackLink.remove();
        }
      } else {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = "Thrill-Seekers-Match-Rules.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      // Keep the object URL alive so the browser can finish opening/saving it.
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 60_000);
    } catch (error) {
      if (openedTab && !openedTab.closed) openedTab.close();
      console.error("Rules poster generation failed:", error);
      alert("Could not create the rules poster. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030c15] text-white">
      <Navbar />

      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 -top-16 h-80 w-80 rotate-45 border-[14px] border-teal-900/40" />
        <div className="absolute -left-12 -top-10 h-80 w-80 rotate-45 border-[7px] border-teal-700/30" />
        <div className="absolute -bottom-44 -right-32 h-96 w-96 rotate-45 border-[14px] border-teal-900/40" />
        <div className="absolute -bottom-40 -right-28 h-96 w-96 rotate-45 border-[7px] border-teal-700/30" />
        <div className="absolute left-1/2 top-28 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-8 grid grid-cols-1 items-center gap-5 border-b border-white/10 pb-6 lg:grid-cols-[310px_1fr_135px] lg:gap-8">
          <div className="flex items-center gap-4">
            <div className="shrink-0 text-white">
              <Crown size={44} strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-3xl font-black italic leading-none tracking-tight sm:text-4xl">THRILL SEEKERS</div>
              <div className="mt-3 text-[10px] tracking-[0.38em] text-slate-300 sm:text-xs">EFOOTBALL CLUB</div>
            </div>
          </div>

          <div className="border-l-0 pl-0 lg:border-l lg:border-white/70 lg:pl-8">
            <p className="text-lg font-black uppercase leading-tight tracking-wide sm:text-2xl">
              Match Result Submission &
            </p>
            <h1 className="mt-1 text-2xl font-black uppercase leading-tight tracking-wide text-teal-300 sm:text-4xl">
              Scheduling Rules
            </h1>
            <p className="mt-2 text-[10px] uppercase tracking-[0.34em] text-slate-400 sm:text-xs">Official Club Rules</p>
          </div>

          <div className="hidden -rotate-6 text-right text-xl font-black italic leading-tight text-slate-400 lg:block">
            PLAY<br />COMPETE<br />GROW
            <div className="ml-auto mt-2 h-1 w-20 -rotate-12 rounded-full bg-teal-400" />
          </div>
        </header>

        <section className="mb-7 overflow-hidden rounded-2xl border border-rose-400/60 bg-[#04101b]/95 shadow-[0_15px_55px_rgba(0,0,0,0.28)]">
          <SectionBanner title="Important Rules" subtitle="Please read carefully" tone="rose" icon={<AlertTriangle size={24} />} />
          <div className="grid grid-cols-1 gap-0 divide-y divide-rose-400/25 p-4 sm:grid-cols-2 sm:p-5 sm:divide-y-0 xl:grid-cols-4 xl:p-6">
            {importantRules.map((rule, index) => {
              const RuleIcon = rule.icon;
              return (
                <article key={rule.number} className={`min-w-0 py-4 sm:px-4 sm:py-3 xl:px-5 xl:py-2 ${index > 0 ? "xl:border-l xl:border-rose-400/35" : ""}`}>
                  <RuleIcon className="mb-4 text-rose-400" size={34} strokeWidth={2.1} />
                  <div className="mb-3 flex items-start gap-2.5">
                    <NumberBadge number={rule.number} tone="rose" />
                    <h2 className="pt-0.5 text-sm font-extrabold uppercase leading-snug sm:text-base">{rule.title}</h2>
                  </div>
                  {rule.description && <p className="mb-3 text-sm leading-6 text-slate-200">{rule.description}</p>}
                  {rule.number === 1 && (
                    <div className="mt-4 space-y-2 rounded-xl border border-slate-700/70 bg-slate-800/70 p-3">
                      {timeSlots.map((slot) => (
                        <div key={slot.label} className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <span className={`min-w-[58px] rounded-md px-2 py-1 text-center font-extrabold ${slot.color}`}>{slot.label}</span>
                          <span className="text-slate-100">{slot.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {rule.bullets && (
                    rule.number === 3 ? (
                      <>
                        <ul className="mt-3 space-y-2">
                          {rule.bullets.map((bullet) => (
                            <li key={bullet.text} className="flex items-center gap-2 text-sm text-slate-200">
                              <CheckCircle2 size={19} className="shrink-0 fill-teal-400 text-teal-400 [&>path]:stroke-slate-950" />
                              <span>{bullet.text}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 text-sm leading-6 text-slate-200">The video must be clear, authentic and unedited.</p>
                      </>
                    ) : (
                      <ul className="space-y-2.5">
                        {rule.bullets.map((bullet) => (
                          <li key={bullet.text} className="flex gap-2 text-sm leading-5 text-slate-200">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-400" />
                            <span>{bullet.text}</span>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-7 overflow-hidden rounded-2xl border border-teal-400/60 bg-[#04101b]/95 shadow-[0_15px_55px_rgba(0,0,0,0.28)]">
          <SectionBanner title="Other Rules" subtitle="Additional terms & conditions" tone="teal" icon={<FileText size={24} />} />
          <div className="px-4 sm:px-6">
            {otherRules.map((rule, index) => {
              const RuleIcon = rule.icon;
              return (
                <article key={rule.number} className={`grid grid-cols-1 gap-4 py-5 sm:grid-cols-[76px_36px_minmax(175px,0.8fr)_minmax(0,2fr)] sm:items-start sm:gap-4 ${index > 0 ? "border-t border-slate-700/80" : ""}`}>
                  <div className={`flex h-16 w-16 items-center justify-center rounded-xl border ${rule.number === 6 ? "border-rose-500/60 text-rose-400" : "border-teal-400/50 text-teal-300"} bg-slate-900/70`}>
                    <RuleIcon size={32} />
                  </div>
                  <div className="hidden pt-1 sm:block"><NumberBadge number={rule.number} tone="teal" /></div>
                  <div className="flex items-start gap-3 sm:block">
                    <div className="pt-0.5 sm:hidden"><NumberBadge number={rule.number} tone="teal" /></div>
                    <h2 className="pt-1 text-sm font-extrabold uppercase leading-snug sm:pr-2 sm:text-base">{rule.title}</h2>
                  </div>
                  <ul className="space-y-1.5 text-sm leading-6 text-slate-200 sm:pt-1">
                    {rule.bullets.map((bullet) => (
                      <li key={bullet.text} className="flex gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
                        <span>{highlightRuleText(bullet.text)}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-7 rounded-2xl border border-slate-600/80 bg-[#06111d]/95 p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3 border-b border-slate-700/80 pb-4">
            <div className="rounded-full bg-slate-500/80 p-2 text-slate-950"><Info size={20} /></div>
            <h2 className="text-lg font-black uppercase tracking-wide text-slate-200 sm:text-xl">Additional Notes</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,2fr)_minmax(220px,0.9fr)]">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {additionalNotes.map((note) => {
                const NoteIcon = note.icon;
                return (
                  <div key={note.title} className="flex gap-3.5">
                    <NoteIcon className="mt-0.5 shrink-0 text-teal-300" size={28} />
                    <div>
                      <h3 className="text-sm font-bold text-teal-300 sm:text-base">{note.title}</h3>
                      <p className="mt-1 text-sm leading-5 text-slate-300">{note.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col items-center justify-center border-t border-slate-700 pt-5 text-center md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <p className="rotate-[-5deg] text-2xl font-black italic uppercase leading-tight text-teal-300 sm:text-3xl">Good luck<br />to all players</p>
              <div className="mt-3 h-1 w-36 rotate-[-8deg] rounded-full bg-teal-300" />
              <div className="mt-5 flex items-center gap-2 text-xs font-bold tracking-[0.24em] text-slate-500">
                <Gamepad2 size={25} /> THRILL SEEKERS
              </div>
              <span className="mt-1 text-[10px] tracking-[0.3em] text-slate-600">EFOOTBALL CLUB</span>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-center gap-4 py-3 text-center text-[10px] font-medium tracking-[0.22em] text-teal-100/60 sm:gap-8 sm:text-xs sm:tracking-[0.35em]">
          <span className="hidden h-px w-20 bg-slate-600 sm:block" />
          <span>THRILL SEEKERS <span className="px-2 text-teal-300">×</span> EFOOTBALL CLUB</span>
          <span className="hidden h-px w-20 bg-slate-600 sm:block" />
        </footer>

        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => void downloadRulesPoster()}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 rounded-xl border border-teal-300/40 bg-teal-300/10 px-5 py-3 text-sm font-bold text-teal-200 transition hover:bg-teal-300/20 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            <Download size={17} />
            {isDownloading ? "Preparing poster…" : "Download Rules Poster (PNG)"}
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">On iPhone or iPad, the poster opens in a new tab. Touch and hold the image to save it.</p>
      </div>
    </main>
  );
}

function SectionBanner({
  title,
  subtitle,
  tone,
  icon,
}: {
  title: string;
  subtitle: string;
  tone: "rose" | "teal";
  icon: ReactNode;
}) {
  const isRose = tone === "rose";
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-4 sm:px-6 ${isRose ? "border-rose-400/50 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700" : "border-teal-300/50 bg-gradient-to-r from-teal-600 via-teal-500 to-teal-400"}`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${isRose ? "bg-rose-300 text-slate-950" : "bg-teal-300 text-slate-950"}`}>{icon}</div>
      <h2 className="text-xl font-black uppercase tracking-wide text-white sm:text-2xl">{title}</h2>
      <p className={`ml-0 text-[10px] font-semibold uppercase tracking-[0.22em] sm:ml-2 sm:text-xs ${isRose ? "text-rose-100" : "text-teal-950/80"}`}>{subtitle}</p>
      <div className={`hidden h-px min-w-8 flex-1 sm:block ${isRose ? "bg-rose-200/70" : "bg-teal-900/50"}`} />
    </div>
  );
}

function NumberBadge({ number, tone }: { number: number; tone: "rose" | "teal" }) {
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${tone === "rose" ? "bg-rose-500 text-white" : "bg-teal-300 text-slate-950"}`}>
      {number}
    </span>
  );
}

function highlightRuleText(text: string) {
  const phrases = ["1-goal advantage", "a rematch", "automatic win", "automatic loss", "admin"];
  const escaped = phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, index) =>
    phrases.some((phrase) => phrase.toLowerCase() === part.toLowerCase()) ? (
      <strong key={`${part}-${index}`} className="font-bold text-teal-200">{part}</strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}
