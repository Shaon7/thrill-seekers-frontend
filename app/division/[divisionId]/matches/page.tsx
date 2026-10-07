"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import Navbar from "../../../components/Navbar";
import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();
}
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Trophy,
  UserPlus,
  Users,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  X,
  Download,
} from "lucide-react";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type MatchStatus =
  | "SCHEDULED"
  | "RESCHEDULED"
  | "COMPLETED"
  | "CANCELLED";

type Player = {
  id: number;
  playerId: string;
  name: string;
  email?: string;
  konamiId?: string;
  deviceName?: string;
  isAdmin?: boolean;
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
  createdAt?: string;
  updatedAt?: string;
};

export default function MatchesPage() {
  const params = useParams();

  const router = useRouter();

  const divisionId =
    params.divisionId as string;

  const [division, setDivision] =
    useState<Division | null>(null);

  const [matches, setMatches] =
    useState<Match[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [userType, setUserType] =
    useState("");

  const [storedPlayer, setStoredPlayer] =
    useState<Player | null>(null);

  const [
    expandedRounds,
    setExpandedRounds,
  ] = useState<number[]>([]);

  const [
    changingTimeMatchId,
    setChangingTimeMatchId,
  ] = useState<string | null>(null);

  const [
    newMatchDate,
    setNewMatchDate,
  ] = useState("");

  const [savingTime, setSavingTime] =
    useState(false);

  // =====================================================
  // LOAD USER + DATA
  // =====================================================

  useEffect(() => {
    const storedUserType =
      localStorage.getItem("userType");

    setUserType(
      storedUserType?.toLowerCase() || "",
    );

    try {
      const player = JSON.parse(
        localStorage.getItem("player") ||
          "null",
      );

      setStoredPlayer(player);
    } catch {
      setStoredPlayer(null);
    }

    if (divisionId) {
      loadData();
    }
  }, [divisionId]);

  // =====================================================
  // LOAD DIVISION + MATCHES
  // =====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      /*
       * Load division first.
       */
      const divisionResponse =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/divisions/${divisionId}`,
          {
            method: "GET",

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

            cache: "no-store",
          },
        );

      if (!divisionResponse.ok) {
        let message =
          "Failed to load division.";

        try {
          const data =
            await divisionResponse.json();

          if (
            typeof data?.message ===
            "string"
          ) {
            message = data.message;
          }
        } catch {
          //
        }

        throw new Error(message);
      }

      const divisionData: Division =
        await divisionResponse.json();

      /*
       * Load only matches for this division.
       */
      const matchesResponse =
        await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/matches/competition/${divisionData.competitionId}`,
          {
            method: "GET",

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

            cache: "no-store",
          },
        );

      if (!matchesResponse.ok) {
        let message =
          "Failed to load matches.";

        try {
          const data =
            await matchesResponse.json();

          if (
            typeof data?.message ===
            "string"
          ) {
            message = data.message;
          }
        } catch {
          //
        }

        throw new Error(message);
      }

      const matchesData: Match[] =
        await matchesResponse.json();

      const sortedMatches = [
        ...matchesData,
      ].sort((a, b) => {
        if (a.round !== b.round) {
          return a.round - b.round;
        }

        return a.id - b.id;
      });

      setDivision(divisionData);

      setMatches(sortedMatches);

      /*
       * Open first round automatically.
       */
      const roundList = [
        ...new Set(
          sortedMatches.map(
            (match) => match.round,
          ),
        ),
      ];

      if (roundList.length > 0) {
        setExpandedRounds([
          roundList[0],
        ]);
      }
    } catch (error) {
      console.error(
        "Matches page error:",
        error,
      );

      if (
        error instanceof TypeError
      ) {
        setError(
          "Unable to connect to the backend. Make sure the NestJS server is running.",
        );
      } else if (
        error instanceof Error
      ) {
        setError(error.message);
      } else {
        setError(
          "Something went wrong while loading matches.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GROUP MATCHES BY ROUND
  // =====================================================

  const matchesByRound =
    useMemo(() => {
      const grouped: Record<
        number,
        Match[]
      > = {};

      matches.forEach((match) => {
        if (!grouped[match.round]) {
          grouped[match.round] = [];
        }

        grouped[match.round].push(match);
      });

      return grouped;
    }, [matches]);

  const rounds =
    useMemo(() => {
      return Object.keys(
        matchesByRound,
      )
        .map(Number)
        .sort((a, b) => a - b);
    }, [matchesByRound]);

  // =====================================================
  // USER
  // =====================================================

  const isSuperAdmin =
    userType === "superadmin";

  const currentPlayerId =
    storedPlayer?.playerId;

  // =====================================================
  // RESULT PERMISSION
  // =====================================================

  const canSubmitMatch = (
    match: Match,
  ) => {
    /*
     * SuperAdmin can submit any match.
     */
    if (isSuperAdmin) {
      return true;
    }

    if (
      userType === "player" &&
      storedPlayer?.isAdmin === true
    ) {
      return true;
    }

    /*
     * Logged-in player's own match.
     */
    const isOwnMatch =
      match.homePlayerId ===
        currentPlayerId ||
      match.awayPlayerId ===
        currentPlayerId;

    /*
     * Admin can also submit matches
     * specifically assigned to them.
     */
    const isAssignedAdmin =
      userType === "player" &&
      storedPlayer?.isAdmin === true &&
      match.assignedAdminId ===
        currentPlayerId;

    return (
      isOwnMatch ||
      isAssignedAdmin
    );
  };

  // =====================================================
  // GET PLAYER
  // =====================================================

  const getPlayer = (
    playerId: string,
  ) => {
    return division?.players?.find(
      (player) =>
        player.playerId ===
        playerId,
    );
  };

  // =====================================================
  // GET ASSIGNED ADMIN
  // =====================================================

  const getAssignedAdmin = (
    assignedAdminId: string | null,
  ) => {
    if (!assignedAdminId) {
      return null;
    }

    return division?.players?.find(
      (player) =>
        player.playerId ===
          assignedAdminId &&
        player.isAdmin === true,
    );
  };

  // =====================================================
  // FORMAT DEADLINE
  // =====================================================

  const formatDeadline = (
    deadline: string,
  ) => {
    const date =
      new Date(deadline);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "Invalid deadline";
    }

    return date.toLocaleString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  // =====================================================
  // FORMAT ROUND DATE
  // =====================================================

  const formatRoundDate = (
    roundMatches: Match[],
  ) => {
    if (!roundMatches.length) {
      return "";
    }

    const date =
      new Date(
        roundMatches[0]
          .deadline,
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    return date.toLocaleDateString(
      undefined,
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
  };


  //fixture feint logo

  const loadFixtureLogo =
  (): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();

      img.src = "/icon.png";

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        resolve(null);
      };
    });
  };

  // =====================================================
  // DOWNLOAD ROUND FIXTURE
  // =====================================================

  const downloadRoundFixture = async (
  round: number,
  roundMatches: Match[],
) => {
  if (
    !division ||
    roundMatches.length === 0
  ) {
    return;
  }

  try {
    // ===================================================
    // PDF
    // ===================================================

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [260, 205],
    });

    const pageWidth =
      doc.internal.pageSize.getWidth();

    const pageHeight =
      doc.internal.pageSize.getHeight();

    // ===================================================
    // CLEAN / CLASSIC DESIGN
    // ===================================================

    const black: [number, number, number] = [
      18,
      18,
      18,
    ];

    const darkGray: [number, number, number] = [
      55,
      55,
      55,
    ];

    const gray: [number, number, number] = [
      115,
      115,
      115,
    ];

    const lightGray: [number, number, number] = [
      238,
      238,
      238,
    ];

    const softGray: [number, number, number] = [
      248,
      248,
      248,
    ];

    const accent: [number, number, number] = [
      205,
      25,
      75,
    ];

    const white: [number, number, number] = [
      255,
      255,
      255,
    ];

    // Classic green for winner
    const winnerGreen: [number, number, number] = [
      34,
      120,
      70,
    ];

    // Soft classic green background
    const winnerGreenSoft: [number, number, number] = [
      235,
      246,
      239,
    ];

    // Clean white page
    doc.setFillColor(
      ...white,
    );

    doc.rect(
      0,
      0,
      pageWidth,
      pageHeight,
      "F",
    );

    // ===================================================
    // TOP ACCENT
    // ===================================================

    doc.setFillColor(
      ...accent,
    );

    doc.rect(
      0,
      0,
      pageWidth,
      4,
      "F",
    );

    // ===================================================
    // HEADER
    // ===================================================

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(22);

    doc.setTextColor(
      ...black,
    );

    doc.text(
      "THRILL SEEKERS",
      10,
      18,
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      ...gray,
    );

    doc.text(
      "EFOOTBALL CLUB",
      10,
      24,
    );

    // Right-side document label
    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(8);

    doc.setTextColor(
      ...accent,
    );

    doc.text(
      "MATCH FIXTURE",
      pageWidth - 10,
      17,
      {
        align: "right",
      },
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7);

    doc.setTextColor(
      ...gray,
    );

    doc.text(
      `ROUND ${round}`,
      pageWidth - 10,
      23,
      {
        align: "right",
      },
    );

    // Thin divider
    doc.setDrawColor(
      ...lightGray,
    );

    doc.setLineWidth(0.5);

    doc.line(
      10,
      30,
      pageWidth - 10,
      30,
    );

    // ===================================================
    // DIVISION / SEASON TITLE
    // ===================================================

    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(15);

    doc.setTextColor(
      ...black,
    );

    doc.text(
      division.name ||
        `Division ${division.divisionNumber}`,
      10,
      41,
    );

    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(8);

    doc.setTextColor(
      ...gray,
    );

    doc.text(
      `Season ${division.season}-${division.season + 1}  •  Phase ${division.phase}`,
      10,
      47,
    );

    // Accent underline
    doc.setFillColor(
      ...accent,
    );

    doc.rect(
      10,
      51,
      34,
      1.5,
      "F",
    );

    // ===================================================
    // ROUND SUMMARY
    // ===================================================

    const completedCount =
      roundMatches.filter(
        (match) =>
          match.status ===
          "COMPLETED",
      ).length;

    doc.setFillColor(
      ...softGray,
    );

    doc.roundedRect(
      10,
      56,
      pageWidth - 20,
      21,
      2.5,
      2.5,
      "F",
    );

    // Left vertical accent
    doc.setFillColor(
      ...accent,
    );

    doc.roundedRect(
      10,
      56,
      2,
      21,
      1,
      1,
      "F",
    );

    // Round
    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(11);

    doc.setTextColor(
      ...black,
    );

    doc.text(
      `ROUND ${round}`,
      18,
      66,
    );

    // Deadline
    doc.setFont(
      "helvetica",
      "normal",
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      ...gray,
    );

    doc.text(
      `Deadline: ${formatDeadline(
        roundMatches[0].deadline,
      )}`,
      58,
      66,
    );

    // Total matches
    doc.setFont(
      "helvetica",
      "bold",
    );

    doc.setFontSize(7.5);

    doc.setTextColor(
      ...darkGray,
    );

    doc.text(
      `TOTAL MATCHES  ${roundMatches.length}`,
      pageWidth - 18,
      63,
      {
        align: "right",
      },
    );

    // Completed matches
    const summaryColor =
      completedCount ===
      roundMatches.length
        ? winnerGreen
        : darkGray;

    doc.setTextColor(
      ...summaryColor,
    );

    doc.text(
      `COMPLETED  ${completedCount}`,
      pageWidth - 18,
      70,
      {
        align: "right",
      },
    );

    // ===================================================
    // WATERMARK LOGO
    // ===================================================

    const fixtureLogo =
      await loadFixtureLogo();

    // ===================================================
    // MATCH DATA
    // ===================================================

    const tableRows =
      roundMatches.map(
        (match, index) => {
          const homePlayer =
            getPlayer(
              match.homePlayerId,
            );

          const awayPlayer =
            getPlayer(
              match.awayPlayerId,
            );

          const homeName =
            homePlayer?.name ||
            match.homePlayerId;

          const awayName =
            awayPlayer?.name ||
            match.awayPlayerId;

          const isCompleted =
            match.status ===
            "COMPLETED";

          const hasScore =
            isCompleted &&
            match.homeScore !== null &&
            match.awayScore !== null;

          const homeWon =
            hasScore &&
            match.homeScore! >
              match.awayScore!;

          const awayWon =
            hasScore &&
            match.awayScore! >
              match.homeScore!;

          const formattedStatus =
            match.status
              ? match.status
                  .toLowerCase()
                  .replace(
                    /^./,
                    (letter) =>
                      letter.toUpperCase(),
                  )
              : "";

          return {
            row: [
              String(index + 1),

              match.matchId,

              homeName,

              hasScore
                ? String(
                    match.homeScore,
                  )
                : "",

              hasScore
                ? String(
                    match.awayScore,
                  )
                : "",

              awayName,

              formatDeadline(
                match.deadline,
              ),

              formattedStatus,
            ],

            homeWon,

            awayWon,

            isCompleted,
          };
        },
      );

    // ===================================================
    // TABLE
    // ===================================================

    autoTable(doc, {
      startY: 79,

      margin: {
        left: 10,
        right: 10,
      },

      head: [
        [
          "#",
          "MATCH ID",
          "HOME",
          "H",
          "A",
          "AWAY",
          "DEADLINE",
          "STATUS",
        ],
      ],

      body: tableRows.map(
        (item) => item.row,
      ),

      theme: "plain",

      styles: {
        font: "helvetica",
        fontSize: 8.5,
        cellPadding: 2.5,
        valign: "middle",
        lineWidth: 0.2,
        lineColor:
          lightGray,
        textColor:
          black,
        fillColor:
          false,
        overflow:
          "ellipsize",
        minCellHeight:
          8.5,
      },

      headStyles: {
        fontStyle:
          "bold",
        fontSize: 8,
        textColor:
          white,
        fillColor:
          false,
        halign:
          "center",
        valign:
          "middle",
        cellPadding: 3,
      },

      columnStyles: {
        // #
        0: {
          cellWidth: 10,
          halign:
            "center",
          fontStyle:
            "bold",
        },

        // MATCH ID
        1: {
          cellWidth: 28,
          fontStyle:
            "bold",
        },

        // HOME
        2: {
          cellWidth: 48,
          fontSize: 8.0,
          fontStyle:
            "bold",
          halign:
            "right",
          overflow:
            "ellipsize",
        },

        // HOME SCORE
        3: {
          cellWidth: 9,
          halign:
            "right",
          fontStyle:
            "bold",
        },

        // AWAY SCORE
        4: {
          cellWidth: 9,
          halign:
            "left",
          fontStyle:
            "bold",
        },

        // AWAY
        5: {
          cellWidth: 48,
          fontSize: 8.0,
          fontStyle:
            "bold",
          halign:
            "left",
          overflow:
            "ellipsize",
        },

        // DEADLINE
        6: {
          cellWidth: 56,
          halign:
            "center",
        },

        // STATUS
        7: {
          cellWidth: 38,
          halign:
            "center",
          fontStyle:
            "bold",
          overflow:
            "ellipsize",
        },
      },

      // Watermark centered specifically between HOME and AWAY columns
      didDrawPage: () => {
        if (fixtureLogo) {
          doc.saveGraphicsState();
          doc.setGState(
            doc.GState({
              opacity: 0.11,
            }),
          );

          const logoSize = 65;
          // Offset to center between HOME, H, A, AWAY columns (Columns 2 - 5)
          const logoX = 72.5; 
          const logoY = 95;

          doc.addImage(
            fixtureLogo,
            "PNG",
            logoX,
            logoY,
            logoSize,
            logoSize,
          );

          doc.restoreGraphicsState();
        }
      },

      // =================================================
      // ROW DESIGN
      // =================================================

      willDrawCell:
        (data) => {
          // -------------------------------------------------
          // HEADER
          // -------------------------------------------------

          if (
            data.section ===
            "head"
          ) {
            doc.setFillColor(
              ...black,
            );

            doc.roundedRect(
              data.cell.x +
                0.5,
              data.cell.y +
                0.8,
              data.cell.width -
                1,
              data.cell.height -
                1.6,
              1.5,
              1.5,
              "F",
            );

            return;
          }

          const rowInfo =
            tableRows[
              data.row.index
            ];

          // -------------------------------------------------
          // ROW BACKGROUND
          // -------------------------------------------------

          if (
            data.section ===
              "body" &&
            data.column.index ===
              0
          ) {
            const tableLeft = 10;

            const tableWidth =
              pageWidth - 20;

            doc.setFillColor(
              data.row.index %
                2 ===
                0
                ? 248
                : 255,
              data.row.index %
                2 ===
                0
                ? 248
                : 255,
              data.row.index %
                2 ===
                0
                ? 248
                : 255,
            );

            doc.saveGraphicsState();
            doc.setGState(
              doc.GState({
                opacity: 0.65,
              }),
            );

            doc.roundedRect(
              tableLeft,
              data.cell.y +
                0.5,
              tableWidth,
              data.row.height -
                1,
              2,
              2,
              "F",
            );

            doc.restoreGraphicsState();

            // Bottom separator
            doc.setDrawColor(
              ...lightGray,
            );

            doc.setLineWidth(
              0.25,
            );

            doc.line(
              tableLeft + 2,
              data.cell.y +
                data.row.height,
              tableLeft +
                tableWidth -
                2,
              data.cell.y +
                data.row.height,
            );
          }

          // -------------------------------------------------
          // MATCH NUMBER BADGE
          // -------------------------------------------------

          if (
            data.section ===
              "body" &&
            data.column.index ===
              0
          ) {
            doc.setFillColor(
              ...black,
            );

            doc.roundedRect(
              data.cell.x +
                1.5,
              data.cell.y + 2,
              data.cell.width -
                3,
              data.cell.height -
                4,
              1.5,
              1.5,
              "F",
            );

            data.cell.styles.textColor =
              white;
          }

          // -------------------------------------------------
          // HOME WINNER
          // -------------------------------------------------

          if (
            rowInfo?.homeWon &&
            data.section ===
              "body" &&
            (
              data.column.index ===
                2 ||
              data.column.index ===
                3
            )
          ) {
            doc.setFillColor(
              ...winnerGreenSoft,
            );

            doc.roundedRect(
              data.cell.x + 1,
              data.cell.y + 1,
              data.cell.width -
                2,
              data.cell.height -
                2,
              1.5,
              1.5,
              "F",
            );
          }

          // -------------------------------------------------
          // AWAY WINNER
          // -------------------------------------------------

          if (
            rowInfo?.awayWon &&
            data.section ===
              "body" &&
            (
              data.column.index ===
                4 ||
              data.column.index ===
                5
            )
          ) {
            doc.setFillColor(
              ...winnerGreenSoft,
            );

            doc.roundedRect(
              data.cell.x + 1,
              data.cell.y + 1,
              data.cell.width -
                2,
              data.cell.height -
                2,
              1.5,
              1.5,
              "F",
            );
          }
        },

      // =================================================
      // TEXT / WINNER COLORS
      // =================================================

      didParseCell:
        (data) => {
          const rowInfo =
            tableRows[
              data.row.index
            ];

          // -------------------------------------------------
          // MATCH ID
          // -------------------------------------------------

          if (
            data.section ===
              "body" &&
            data.column.index ===
              1
          ) {
            data.cell.styles.textColor =
              accent;
          }

          // -------------------------------------------------
          // HOME WINNER
          // -------------------------------------------------

          if (
            rowInfo?.homeWon &&
            data.section ===
              "body" &&
            (
              data.column.index ===
                2 ||
              data.column.index ===
                3
            )
          ) {
            data.cell.styles.textColor =
              winnerGreen;

            data.cell.styles.fontStyle =
              "bold";
          }

          // -------------------------------------------------
          // AWAY WINNER
          // -------------------------------------------------

          if (
            rowInfo?.awayWon &&
            data.section ===
              "body" &&
            (
              data.column.index ===
                4 ||
              data.column.index ===
                5
            )
          ) {
            data.cell.styles.textColor =
              winnerGreen;

            data.cell.styles.fontStyle =
              "bold";
          }

          // -------------------------------------------------
          // SCORES
          // -------------------------------------------------

          if (
            data.section ===
              "body" &&
            (
              data.column.index ===
                3 ||
              data.column.index ===
                4
            )
          ) {
            data.cell.styles.fontSize =
              9.5;

            data.cell.styles.fontStyle =
              "bold";
          }

          // -------------------------------------------------
          // STATUS
          // -------------------------------------------------

          if (
            data.section ===
              "body" &&
            data.column.index ===
              7
          ) {
            data.cell.styles.textColor =
              black;

            data.cell.styles.fontStyle =
              "normal";

            data.cell.styles.halign =
              "center";
          }
        },
    });

    // ===================================================
    // FOOTER
    // ===================================================

    const pageCount =
      doc.getNumberOfPages();

    for (
      let page = 1;
      page <= pageCount;
      page++
    ) {
      doc.setPage(page);

      doc.setDrawColor(
        ...lightGray,
      );

      doc.setLineWidth(
        0.35,
      );

      doc.line(
        10,
        pageHeight - 20,
        pageWidth - 10,
        pageHeight - 20,
      );

      doc.setFont(
        "helvetica",
        "bold",
      );

      doc.setFontSize(7);

      doc.setTextColor(
        ...black,
      );

      doc.text(
        "THRILL SEEKERS",
        10,
        pageHeight - 14,
      );

      doc.setFont(
        "helvetica",
        "normal",
      );

      doc.setTextColor(
        ...gray,
      );

      doc.text(
        `Efootball Club  •  Round ${round}`,
        pageWidth / 2,
        pageHeight - 14,
        {
          align: "center",
        },
      );

      doc.text(
        `Completed ${completedCount}/${roundMatches.length}`,
        pageWidth - 10,
        pageHeight - 14,
        {
          align: "right",
        },
      );

      doc.setFillColor(
        ...accent,
      );

      doc.rect(
        10,
        pageHeight - 8,
        pageWidth - 20,
        1,
        "F",
      );
    }

    // ===================================================
    // FILE NAME
    // ===================================================

    const safeDivisionName =
      (
        division.name ||
        `Division-${division.divisionNumber}`
      )
        .replace(
          /[^a-z0-9]+/gi,
          "-",
        )
        .replace(
          /^-+|-+$/g,
          "",
        );

    // ===================================================
    // CONVERT PDF → PNG
    // ===================================================

    const pdfData =
      doc.output(
        "arraybuffer",
      );

    const pdf =
      await pdfjsLib
        .getDocument({
          data: pdfData,
        })
        .promise;

    // ===================================================
    // RENDER ALL PDF PAGES
    // ===================================================

    const renderScale = 3;

    const renderedPages:
      HTMLCanvasElement[] =
      [];

    let totalHeight = 0;

    let maxWidth = 0;

    for (
      let pageNumber = 1;
      pageNumber <=
      pdf.numPages;
      pageNumber++
    ) {
      const page =
        await pdf.getPage(
          pageNumber,
        );

      const viewport =
        page.getViewport({
          scale: renderScale,
        });

      const canvas =
        document.createElement(
          "canvas",
        );

      const context =
        canvas.getContext(
          "2d",
        );

      if (!context) {
        throw new Error(
          "Unable to create canvas.",
        );
      }

      canvas.width =
        Math.ceil(
          viewport.width,
        );

      canvas.height =
        Math.ceil(
          viewport.height,
        );

      await page.render({
        canvas,
        canvasContext:
          context,
        viewport,
      }).promise;

      renderedPages.push(
        canvas,
      );

      totalHeight +=
        canvas.height;

      maxWidth = Math.max(
        maxWidth,
        canvas.width,
      );
    }

    // ===================================================
    // COMBINE PAGES INTO ONE IMAGE
    // ===================================================

    const finalCanvas =
      document.createElement(
        "canvas",
      );

    finalCanvas.width =
      maxWidth;

    finalCanvas.height =
      totalHeight;

    const finalContext =
      finalCanvas.getContext(
        "2d",
      );

    if (!finalContext) {
      throw new Error(
        "Unable to create final canvas.",
      );
    }

    finalContext.fillStyle =
      "white";

    finalContext.fillRect(
      0,
      0,
      finalCanvas.width,
      finalCanvas.height,
    );

    let currentY = 0;

    for (
      const pageCanvas of renderedPages
    ) {
      finalContext.drawImage(
        pageCanvas,
        0,
        currentY,
      );

      currentY +=
        pageCanvas.height;
    }

    // ===================================================
    // DOWNLOAD PNG
    // ===================================================

    const imageBlob =
      await new Promise<Blob | null>(
        (resolve) => {
          finalCanvas.toBlob(
            (blob) =>
              resolve(blob),
            "image/png",
            1,
          );
        },
      );

    if (!imageBlob) {
      throw new Error(
        "Failed to create fixture image.",
      );
    }

    const imageUrl =
      URL.createObjectURL(
        imageBlob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href =
      imageUrl;

    link.download =
      `${safeDivisionName}-Round-${round}-Fixture.png`;

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    URL.revokeObjectURL(
      imageUrl,
    );
  } catch (error) {
    console.error(
      "Fixture image generation failed:",
      error,
    );
  }
};    
  

//end pdf
  // =====================================================
  // GET DATE FOR DATE INPUT
  // =====================================================

  const getDateInputValue = (
    deadline: string,
  ) => {
    const date =
      new Date(deadline);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "";
    }

    const year =
      date.getFullYear();

    const month = String(
      date.getMonth() + 1,
    ).padStart(2, "0");

    const day = String(
      date.getDate(),
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // =====================================================
  // CHANGE MATCH TIME
  // =====================================================

  const openChangeTime = (
    match: Match,
  ) => {
    /*
     * Only SCHEDULED matches can
     * be rescheduled.
     */
    if (
      match.status !==
      "SCHEDULED"
    ) {
      return;
    }

    setChangingTimeMatchId(
      match.matchId,
    );

    setNewMatchDate(
      getDateInputValue(
        match.deadline,
      ),
    );

    setError("");
  };

  // =====================================================
  // CLOSE CHANGE TIME
  // =====================================================

  const closeChangeTime = () => {
    setChangingTimeMatchId(
      null,
    );

    setNewMatchDate("");
  };

  // =====================================================
  // SAVE NEW MATCH DATE
  // =====================================================

  const handleChangeTime =
    async (
      match: Match,
    ) => {
      /*
       * A match can only be
       * rescheduled once.
       */
      if (
        match.status !==
        "SCHEDULED"
      ) {
        setError(
          "This match can no longer be rescheduled.",
        );

        return;
      }

      if (!newMatchDate) {
        setError(
          "Please select a date.",
        );

        return;
      }

      try {
        setSavingTime(true);
        setError("");

        const token =
          localStorage.getItem(
            "access_token",
          );

        if (!token) {
          router.push("/login");
          return;
        }

        const response =
          await fetch(
            `https://thrill-seekers-backend-production.up.railway.app/matches/${match.matchId}/change-time`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                newDate:
                  newMatchDate,
              }),
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
            Array.isArray(
              data?.message,
            )
              ? data.message.join(
                  ", ",
                )
              : data?.message ||
                  `Failed to change match date. HTTP ${response.status}`,
          );
        }

        closeChangeTime();

        await loadData();
      } catch (error) {
        console.error(
          "Change match time error:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to change match date.",
        );
      } finally {
        setSavingTime(false);
      }
    };

  // =====================================================
  // TOGGLE ROUND
  // =====================================================

  const toggleRound = (
    round: number,
  ) => {
    setExpandedRounds(
      (current) => {
        if (
          current.includes(
            round,
          )
        ) {
          return current.filter(
            (item) =>
              item !== round,
          );
        }

        return [
          ...current,
          round,
        ];
      },
    );
  };

  // =====================================================
  // MATCH STATS
  // =====================================================

  const completedMatches =
    matches.filter(
      (match) =>
        match.status ===
        "COMPLETED",
    ).length;

  const scheduledMatches =
    matches.filter(
      (match) =>
        match.status ===
        "SCHEDULED",
    ).length;

  const rescheduledMatches =
    matches.filter(
      (match) =>
        match.status ===
        "RESCHEDULED",
    ).length;

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

        {/* ==================================================
            BACK
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/division",
            )
          }
          className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-white"
        >
          <ArrowLeft
            size={17}
          />

          Back to Division
        </button>

        {/* ==================================================
            HEADER
        ================================================== */}

        {!loading &&
          division && (
            <section className="mb-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 shadow-2xl sm:p-8">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div className="min-w-0">

                  <div className="mb-3 flex items-center gap-2 text-yellow-400">

                    <Trophy
                      size={19}
                    />

                    <span className="text-xs font-bold uppercase tracking-[0.2em]">
                      Division Matches
                    </span>

                  </div>

                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
                    {division.name}
                  </h1>

                </div>

                {/* STATS */}

                <div className="grid grid-cols-3 gap-2 sm:gap-3">

                  <MiniStat
                    icon={
                      <Users
                        size={17}
                      />
                    }
                    value={
                      division
                        .players
                        ?.length ||
                      0
                    }
                    label="Players"
                  />

                  <MiniStat
                    icon={
                      <CalendarDays
                        size={
                          17
                        }
                      />
                    }
                    value={
                      rounds.length
                    }
                    label="Rounds"
                  />

                  <MiniStat
                    icon={
                      <CheckCircle2
                        size={
                          17
                        }
                      />
                    }
                    value={
                      matches.length
                    }
                    label="Matches"
                  />

                </div>

              </div>

              {/* MATCH PROGRESS */}

              {matches.length >
                0 && (
                <div className="mt-6 border-t border-white/10 pt-5">

                  <div className="flex items-center justify-between text-xs">

                    <span className="text-zinc-500">
                      Match Progress
                    </span>

                    <span className="font-semibold text-zinc-300">
                      {
                        completedMatches
                      }{" "}
                      /{" "}
                      {
                        matches.length
                      }
                    </span>

                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">

                    <div
                      className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                      style={{
                        width: `${
                          matches.length >
                          0
                            ? (completedMatches /
                                matches.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />

                  </div>

                  <div className="mt-2 flex justify-between text-[10px] text-zinc-600">

                    <span>
                      {
                        scheduledMatches
                      }{" "}
                      scheduled
                    </span>

                    <span>
                      {
                        rescheduledMatches
                      }{" "}
                      rescheduled
                    </span>

                    <span>
                      {
                        completedMatches
                      }{" "}
                      completed
                    </span>

                  </div>

                </div>
              )}

            </section>
          )}

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading && (
          <section className="flex min-h-[350px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/50">

            <div className="flex flex-col items-center gap-3">

              <Loader2
                size={30}
                className="animate-spin text-yellow-400"
              />

              <p className="text-sm text-zinc-500">
                Loading matches...
              </p>

            </div>

          </section>
        )}

        {/* ==================================================
            ERROR
        ================================================== */}

        {!loading &&
          error && (
            <section className="mb-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-5 sm:p-6">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={22}
                  className="mt-0.5 shrink-0 text-red-400"
                />

                <div>

                  <h2 className="font-semibold text-red-400">
                    Unable to load matches
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-red-400/80">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={
                      loadData
                    }
                    className="mt-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                  >
                    Try Again
                  </button>

                </div>

              </div>

            </section>
          )}

        {/* ==================================================
            EMPTY
        ================================================== */}

        {!loading &&
          !error &&
          division &&
          matches.length ===
            0 && (
            <section className="rounded-3xl border border-white/10 bg-zinc-900/50 p-10 text-center sm:p-14">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/5">

                <CalendarDays
                  size={28}
                  className="text-yellow-400"
                />

              </div>

              <h2 className="mt-5 text-xl font-bold">
                No Matches Yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Matches have not been
                generated for this
                division yet.
              </p>

            </section>
          )}

        {/* ==================================================
            ROUNDS
        ================================================== */}

        {!loading &&
          !error &&
          division &&
          rounds.length > 0 && (
            <section>

              <div className="mb-5">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-400">
                  Schedule
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  All Rounds
                </h2>

              </div>

              <div className="space-y-4">

                {rounds.map(
                  (round) => {
                    const roundMatches =
                      matchesByRound[
                        round
                      ] || [];

                    const expanded =
                      expandedRounds.includes(
                        round,
                      );

                    const roundCompleted =
                      roundMatches.every(
                        (match) =>
                          match.status ===
                          "COMPLETED",
                      );

                    return (
                      <section
                        key={round}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/60 shadow-xl"
                      >

                        {/* ROUND HEADER */}

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            toggleRound(
                              round,
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key ===
                                "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();

                              toggleRound(
                                round,
                              );
                            }
                          }}
                          className="w-full cursor-pointer text-left"
                        >

                          <div className="p-4 sm:p-6">

                            <div className="flex items-center justify-between gap-4">

                              <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-400/20 bg-yellow-400/10 text-sm font-black text-yellow-400 sm:h-13 sm:w-13 sm:text-base">
                                  {round}
                                </div>

                                <div className="min-w-0">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h3 className="text-base font-bold sm:text-lg">
                                      Round{" "}
                                      {round}
                                    </h3>

                                    {roundCompleted && (
                                      <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-green-400">
                                        Completed
                                      </span>
                                    )}

                                  </div>

                                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">

                                    <span>
                                      {formatRoundDate(
                                        roundMatches,
                                      )}
                                    </span>

                                    <span>
                                      {
                                        roundMatches.length
                                      }{" "}
                                      matches
                                    </span>

                                  </div>

                                </div>

                              </div>

                              <div className="flex shrink-0 items-center gap-2">

                                {/* DOWNLOAD FIXTURE */}

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    downloadRoundFixture(
                                      round,
                                      roundMatches,
                                    );
                                  }}
                                  className="flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-bold text-yellow-400 transition hover:bg-yellow-400/20"
                                  title={`Download Round ${round} Fixture`}
                                >
                                  <Download
                                    size={15}
                                  />

                                  <span className="hidden sm:inline">
                                    Download Fixture
                                  </span>
                                </button>

                                {/* DEADLINE */}

                                <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] text-zinc-500 sm:block">
                                  Deadline{" "}
                                  {formatDeadline(
                                    roundMatches[0]
                                      .deadline,
                                  )}
                                </div>

                                {/* EXPAND / COLLAPSE */}

                                <div className="rounded-xl border border-white/10 p-2 text-zinc-500">

                                  {expanded ? (
                                    <ChevronUp
                                      size={18}
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={18}
                                    />
                                  )}

                                </div>

                              </div>

                            </div>

                          </div>

                        </div>

                        {/* ROUND MATCHES */}

                        {expanded && (
                          <div className="border-t border-white/10">

                            <div className="divide-y divide-white/5">

                              {roundMatches.map(
                                (
                                  match,
                                  matchIndex,
                                ) => {
                                  const homePlayer =
                                    getPlayer(
                                      match.homePlayerId,
                                    );

                                  const awayPlayer =
                                    getPlayer(
                                      match.awayPlayerId,
                                    );

                                  const assignedAdmin =
                                    getAssignedAdmin(
                                      match.assignedAdminId,
                                    );

                                  return (
                                    <MatchCard
                                      key={
                                        match.matchId
                                      }
                                      match={
                                        match
                                      }
                                      matchNumber={
                                        matchIndex +
                                        1
                                      }
                                      homePlayer={
                                        homePlayer
                                      }
                                      awayPlayer={
                                        awayPlayer
                                      }
                                      assignedAdmin={
                                        assignedAdmin
                                      }
                                      canSubmitResult={
                                        canSubmitMatch(
                                          match,
                                        )
                                      }
                                      isSuperAdmin={
                                        isSuperAdmin
                                      }
                                      changingTimeMatchId={
                                        changingTimeMatchId
                                      }
                                      newMatchDate={
                                        newMatchDate
                                      }
                                      savingTime={
                                        savingTime
                                      }
                                      onOpenChangeTime={
                                        openChangeTime
                                      }
                                      onCloseChangeTime={
                                        closeChangeTime
                                      }
                                      onDateChange={
                                        setNewMatchDate
                                      }
                                      onChangeTime={
                                        handleChangeTime
                                      }
                                      router={
                                        router
                                      }
                                    />
                                  );
                                },
                              )}

                            </div>

                          </div>
                        )}

                      </section>
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

/* ================================================== */
/* MINI STAT */
/* ================================================== */

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center sm:px-5 sm:py-4">

      <div className="flex justify-center text-yellow-400">
        {icon}
      </div>

      <p className="mt-1.5 text-lg font-black sm:text-xl">
        {value}
      </p>

      <p className="text-[9px] uppercase tracking-wider text-zinc-600 sm:text-[10px]">
        {label}
      </p>

    </div>
  );
}

/* ================================================== */
/* MATCH CARD */
/* ================================================== */

function MatchCard({
  match,
  matchNumber,
  homePlayer,
  awayPlayer,
  assignedAdmin,
  canSubmitResult,
  isSuperAdmin,
  changingTimeMatchId,
  newMatchDate,
  savingTime,
  onOpenChangeTime,
  onCloseChangeTime,
  onDateChange,
  onChangeTime,
  router,
}: {
  match: Match;
  matchNumber: number;
  homePlayer?: Player;
  awayPlayer?: Player;
  assignedAdmin?: Player | null;
  canSubmitResult: boolean;
  isSuperAdmin: boolean;
  changingTimeMatchId: string | null;
  newMatchDate: string;
  savingTime: boolean;
  onOpenChangeTime: (
    match: Match,
  ) => void;
  onCloseChangeTime: () => void;
  onDateChange: (
    value: string,
  ) => void;
  onChangeTime: (
    match: Match,
  ) => void;
  router: ReturnType<
    typeof useRouter
  >;
}) {
  const isCompleted =
    match.status ===
    "COMPLETED";

  const isCancelled =
    match.status ===
    "CANCELLED";

  const isRescheduled =
    match.status ===
    "RESCHEDULED";

  const isChangingTime =
    changingTimeMatchId ===
    match.matchId;

  const adminName =
    assignedAdmin?.name ||
    "Not Assigned";

  // =====================================================
  // DATE PICKER
  // =====================================================

  const dateInputRef =
    useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    if (
      savingTime ||
      !dateInputRef.current
    ) {
      return;
    }

    try {
      dateInputRef.current.showPicker();
    } catch {
      dateInputRef.current.focus();
    }
  };

  return (
    <article className="p-4 sm:p-6">

      {/* ==================================================
          MATCH TOP
      ================================================== */}

      <div className="flex items-center justify-between gap-3">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-400">
            Match {matchNumber}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            {isCompleted
              ? "Final Result"
              : isCancelled
              ? "Cancelled"
              : isRescheduled
              ? "Rescheduled Match"
              : "Scheduled Match"}
          </p>

        </div>

        <StatusBadge
          status={match.status}
        />

      </div>

      {/* ==================================================
          PLAYERS + SCORE
      ================================================== */}

      <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4 sm:mt-5 sm:p-5">

        <div className="grid grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_110px_minmax(0,1fr)] sm:gap-5">

          {/* HOME */}

          <PlayerDisplay
            player={homePlayer}
            alignment="right"
          />

          {/* SCORE */}

          <div className="flex min-w-0 items-center justify-center">

            {isCompleted ? (
              <div className="flex items-center justify-center gap-1.5 sm:gap-3">

                <span className="w-7 text-center text-2xl font-black text-white sm:w-9 sm:text-3xl">
                  {match.homeScore}
                </span>

                <span className="text-xs font-bold text-zinc-700 sm:text-base">
                  -
                </span>

                <span className="w-7 text-center text-2xl font-black text-white sm:w-9 sm:text-3xl">
                  {match.awayScore}
                </span>

              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 sm:h-12 sm:w-12">

                <span className="text-[9px] font-black tracking-wider text-zinc-600 sm:text-xs">
                  VS
                </span>

              </div>
            )}

          </div>

          {/* AWAY */}

          <PlayerDisplay
            player={awayPlayer}
            alignment="left"
          />

        </div>

        {/* ==================================================
            ASSIGNED ADMIN
        ================================================== */}

        <div className="mt-4 flex justify-center border-t border-white/5 pt-3">

          <div className="flex items-center gap-1.5">

            <ShieldCheck
              size={12}
              className={
                assignedAdmin
                  ? "text-yellow-400"
                  : "text-zinc-600"
              }
            />

            <span className="text-[9px] uppercase tracking-wider text-zinc-600 sm:text-[10px]">
              Admin:
            </span>

            <span
              className={
                assignedAdmin
                  ? "text-[10px] font-semibold text-zinc-400 sm:text-xs"
                  : "text-[10px] font-medium text-zinc-600 sm:text-xs"
              }
            >
              {adminName}
            </span>

          </div>

        </div>

      </div>

      {/* ==================================================
          DEADLINE
      ================================================== */}

      <div className="mt-4 flex flex-col items-start justify-between gap-2 text-xs sm:flex-row sm:items-center">

        <div className="flex items-center gap-2 text-zinc-500">

          <Clock size={14} />

          <span>
            Deadline:
          </span>

          <span className="font-semibold text-zinc-300">
            {formatDateTime(
              match.deadline,
            )}
          </span>

        </div>

      </div>

      {/* ==================================================
          ACTIONS
      ================================================== */}

      {(canSubmitResult ||
        isSuperAdmin) && (
        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">

          {/* SUBMIT RESULT */}

          {canSubmitResult &&
            !isCompleted &&
            !isCancelled && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/matches/${match.matchId}/result`,
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 sm:w-auto"
              >
                <CheckCircle2
                  size={16}
                />

                Submit Match Result
              </button>
            )}

          {/* SUPERADMIN */}

          {isSuperAdmin && (
            <>
              {/* CHANGE TIME
                  ONLY SCHEDULED MATCHES
               */}

              {match.status ===
                "SCHEDULED" && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenChangeTime(
                      match,
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400/20 sm:w-auto"
                >
                  <Clock size={15} />

                  Change Time
                </button>
              )}

              {/* ADD ADMIN
                  ONLY WHEN MATCH IS NOT
                  COMPLETED/CANCELLED
               */}

              {!isCompleted &&
                !isCancelled && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/matches/${match.matchId}/admin`,
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  <UserPlus
                    size={15}
                  />

                  Add Admin
                </button>
              )}

            </>
          )}

        </div>
      )}

      {/* ==================================================
          CHANGE TIME CARD
      ================================================== */}

      {isChangingTime && (
        <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 p-4 sm:p-5">

          <div className="mb-4 flex items-start justify-between gap-3">

            <div>

              <h4 className="text-sm font-bold text-white sm:text-base">
                Change Match Time
              </h4>

              <p className="mt-1 text-[10px] leading-5 text-zinc-500 sm:text-xs">
                Select a new date. The
                current time will remain
                unchanged.
              </p>

            </div>

            <button
              type="button"
              onClick={
                onCloseChangeTime
              }
              disabled={
                savingTime
              }
              className="rounded-lg border border-white/10 p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">

            {/* DATE */}

            <div className="flex-1">

              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-600 sm:text-xs">
                New Date
              </label>

              <div
                className="relative cursor-pointer"
                onClick={
                  openDatePicker
                }
              >

                <CalendarDays
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                />

                <input
                  ref={dateInputRef}
                  type="date"
                  value={
                    newMatchDate
                  }
                  onChange={(e) =>
                    onDateChange(
                      e.target.value,
                    )
                  }
                  onClick={
                    openDatePicker
                  }
                  onFocus={
                    openDatePicker
                  }
                  disabled={
                    savingTime
                  }
                  className="h-12 w-full cursor-pointer rounded-xl border border-white/10 bg-black/30 pl-10 pr-12 text-sm text-white outline-none transition focus:border-yellow-400/50 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

            </div>

            {/* CANCEL */}

            <button
              type="button"
              onClick={
                onCloseChangeTime
              }
              disabled={
                savingTime
              }
              className="h-12 rounded-xl border border-white/10 px-5 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            {/* SAVE */}

            <button
              type="button"
              onClick={() =>
                onChangeTime(
                  match,
                )
              }
              disabled={
                savingTime ||
                !newMatchDate
              }
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingTime ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Saving...
                </>
              ) : (
                "Save Date"
              )}
            </button>

          </div>

        </div>
      )}

    </article>
  );
}

/* ================================================== */
/* PLAYER DISPLAY */
/* ================================================== */

function PlayerDisplay({
  player,
  alignment,
}: {
  player?: Player;
  alignment:
    | "left"
    | "right";
}) {
  return (
    <div
      className={`min-w-0 ${
        alignment === "right"
          ? "text-right"
          : "text-left"
      }`}
    >

      <p className="truncate text-[11px] font-bold text-white sm:text-base">
        {player?.name ||
          "Unknown Player"}
      </p>

      <p className="mt-1 truncate text-[8px] font-medium text-zinc-600 sm:text-xs">
        {player?.playerId ||
          "Unknown ID"}
      </p>

    </div>
  );
}

/* ================================================== */
/* STATUS */
/* ================================================== */

function StatusBadge({
  status,
}: {
  status: MatchStatus;
}) {
  if (
    status ===
    "COMPLETED"
  ) {
    return (
      <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-green-400">
        Completed
      </span>
    );
  }

  if (
    status ===
    "RESCHEDULED"
  ) {
    return (
      <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-orange-400">
        Rescheduled
      </span>
    );
  }

  if (
    status ===
    "CANCELLED"
  ) {
    return (
      <span className="rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
        Cancelled
      </span>
    );
  }

  return (
    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-yellow-400">
      Scheduled
    </span>
  );
}

/* ================================================== */
/* DATE FORMAT */
/* ================================================== */

function formatDateTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return date.toLocaleString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}