"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/app/components/Navbar";

import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  Loader2,
  ShieldCheck,
} from "lucide-react";

/* =========================================================
   API
========================================================= */

const API_URL =
  "https://thrill-seekers-backend-production.up.railway.app";

/* =========================================================
   TYPES
========================================================= */

type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "REJECTED";

type PaymentType =
  | "DIVISION_FEE"
  | "FINE";

type Payment = {
  id: number;
  playerId: string;
  divisionId: string;
  amount: string | number;

  paymentType: PaymentType;

  status: PaymentStatus;

  senderBkashNumber?: string | null;

  transactionId?: string | null;

  rejectionReason?: string | null;

  verifiedAt?: string | null;

  createdAt: string;

  verifiedBy?: string | null;
};

type Player = {
  id: number;
  playerId: string;
  name: string;
  email?: string;
  phone?: string;
  deviceName?: string;
  konamiId?: string;
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

  status?: string | null;

  Status?: string | null;

  divisionStatus?: string | null;

  players?: Player[];
};

type PaymentTableRow = {
  playerId: string;
  playerName: string;

  amount: string | number;

  status: PaymentStatus;

  transactionId?: string | null;

  createdAt: string;
};

/* =========================================================
   HELPERS
========================================================= */

const normalizeStatus = (
  division: Division,
) => {
  return String(
    division.Status ??
      division.status ??
      division.divisionStatus ??
      "",
  )
    .trim()
    .toUpperCase();
};

const formatAmount = (
  amount: string | number,
) => {
  const numericAmount =
    Number(amount);

  if (
    Number.isNaN(
      numericAmount,
    )
  ) {
    return "৳0.00";
  }

  return `৳${numericAmount.toFixed(
    2,
  )}`;
};

const formatDate = (
  value: string,
) => {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
};

/* =========================================================
   PAGE
========================================================= */

export default function PaymentStatusPage() {
  const router = useRouter();

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [divisions, setDivisions] =
    useState<Division[]>([]);

  const [playerNames, setPlayerNames] =
    useState<Record<string, string>>(
      {},
    );

  /*
   * No division is open initially.
   * User must click a league manually.
   */
  const [expandedDivision, setExpandedDivision] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [downloadingDivision, setDownloadingDivision] =
    useState<string | null>(null);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      if (!token) {
        router.push("/login");
        return;
      }

      const headers: HeadersInit = {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      };

      /*
       * Load payments + divisions together.
       */
      const [
        paymentsResponse,
        divisionsResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/payments`,
          {
            method: "GET",
            headers,
            cache: "no-store",
          },
        ),

        fetch(
          `${API_URL}/divisions`,
          {
            method: "GET",
            headers,
            cache: "no-store",
          },
        ),
      ]);

      /* =================================================
         PAYMENTS
      ================================================= */

      let paymentsData: any = [];

      try {
        paymentsData =
          await paymentsResponse.json();
      } catch {
        paymentsData = [];
      }

      if (
        !paymentsResponse.ok
      ) {
        const message =
          Array.isArray(
            paymentsData?.message,
          )
            ? paymentsData.message.join(
                ", ",
              )
            : paymentsData?.message ||
              `Failed to load payments. HTTP ${paymentsResponse.status}`;

        throw new Error(
          message,
        );
      }

      const loadedPayments: Payment[] =
        Array.isArray(
          paymentsData,
        )
          ? paymentsData
          : [];

      /*
       * Only division-fee payments
       * belong in league payment status.
       *
       * Fines are not included.
       */
      const divisionPayments =
        loadedPayments.filter(
          (payment) =>
            payment.paymentType ===
            "DIVISION_FEE",
        );

      setPayments(
        divisionPayments,
      );

      /* =================================================
         DIVISIONS
      ================================================= */

      let divisionsData: any = [];

      try {
        divisionsData =
          await divisionsResponse.json();
      } catch {
        divisionsData = [];
      }

      if (
        !divisionsResponse.ok
      ) {
        const message =
          Array.isArray(
            divisionsData?.message,
          )
            ? divisionsData.message.join(
                ", ",
              )
            : divisionsData?.message ||
              `Failed to load divisions. HTTP ${divisionsResponse.status}`;

        throw new Error(
          message,
        );
      }

      const loadedDivisions: Division[] =
        Array.isArray(
          divisionsData,
        )
          ? divisionsData
          : Array.isArray(
              divisionsData?.data,
            )
            ? divisionsData.data
            : [];

      /*
       * Sort newest season/phase first,
       * then Division 1, Division 2, etc.
       */
      const sortedDivisions =
        [...loadedDivisions].sort(
          (a, b) => {
            if (
              b.season !==
              a.season
            ) {
              return (
                b.season -
                a.season
              );
            }

            if (
              b.phase !==
              a.phase
            ) {
              return (
                b.phase -
                a.phase
              );
            }

            return (
              a.divisionNumber -
              b.divisionNumber
            );
          },
        );

      setDivisions(
        sortedDivisions,
      );

      /* =================================================
         PLAYER NAME LOOKUP
      ================================================= */

      const nameMap: Record<
        string,
        string
      > = {};

      /*
       * First use players returned
       * inside divisions.
       */
      sortedDivisions.forEach(
        (division) => {
          division.players?.forEach(
            (player) => {
              if (
                player?.playerId
              ) {
                nameMap[
                  player.playerId
                ] =
                  player.name ||
                  "Unknown Player";
              }
            },
          );
        },
      );

      /*
       * Find any payment player IDs
       * whose names were not returned
       * through divisions.
       */
      const missingPlayerIds =
        Array.from(
          new Set(
            divisionPayments
              .map(
                (payment) =>
                  payment.playerId,
              )
              .filter(
                (playerId) =>
                  !nameMap[playerId],
              ),
          ),
        );

      /*
       * Fallback to existing
       * /player/:playerId endpoint.
       */
      if (
        missingPlayerIds.length >
        0
      ) {
        const results =
          await Promise.allSettled(
            missingPlayerIds.map(
              async (
                playerId,
              ) => {
                const response =
                  await fetch(
                    `${API_URL}/player/${playerId}`,
                    {
                      method: "GET",
                      headers,
                      cache: "no-store",
                    },
                  );

                if (
                  !response.ok
                ) {
                  throw new Error(
                    `Failed to load player ${playerId}`,
                  );
                }

                const player =
                  await response.json();

                return {
                  playerId,
                  name:
                    player?.name ||
                    "Unknown Player",
                };
              },
            ),
          );

        results.forEach(
          (result) => {
            if (
              result.status ===
              "fulfilled"
            ) {
              nameMap[
                result.value
                  .playerId
              ] =
                result.value.name;
            }
          },
        );
      }

      setPlayerNames(
        nameMap,
      );
    } catch (err) {
      console.error(
        "Payment status page error:",
        err,
      );

      if (
        err instanceof Error
      ) {
        setError(
          err.message,
        );
      } else {
        setError(
          "Unable to load payment status.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     GROUP PAYMENT DATA BY DIVISION
  ======================================================= */

  const paymentsByDivision =
    useMemo(() => {
      const result: Record<
        string,
        PaymentTableRow[]
      > = {};

      divisions.forEach(
        (division) => {
          /*
           * Filter payment records
           * belonging to this league.
           */
          const divisionPaymentRows =
            payments.filter(
              (payment) =>
                payment.divisionId ===
                division.divisionId,
            );

          /*
           * Normally there should be
           * one division-fee payment
           * per player.
           *
           * In case duplicate records
           * exist, keep the latest one
           * for each player.
           */
          const latestByPlayer =
            new Map<
              string,
              Payment
            >();

          divisionPaymentRows.forEach(
            (payment) => {
              const current =
                latestByPlayer.get(
                  payment.playerId,
                );

              if (
                !current
              ) {
                latestByPlayer.set(
                  payment.playerId,
                  payment,
                );
                return;
              }

              const currentTime =
                new Date(
                  current.createdAt,
                ).getTime();

              const newTime =
                new Date(
                  payment.createdAt,
                ).getTime();

              if (
                newTime >=
                currentTime
              ) {
                latestByPlayer.set(
                  payment.playerId,
                  payment,
                );
              }
            },
          );

          const rows: PaymentTableRow[] =
            Array.from(
              latestByPlayer.values(),
            )
              .map(
                (payment) => ({
                  playerId:
                    payment.playerId,

                  playerName:
                    playerNames[
                      payment.playerId
                    ] ||
                    division.players?.find(
                      (player) =>
                        player.playerId ===
                        payment.playerId,
                    )?.name ||
                    "Unknown Player",

                  amount:
                    payment.amount,

                  status:
                    payment.status,

                  transactionId:
                    payment.transactionId,

                  createdAt:
                    payment.createdAt,
                }),
              )
              .sort(
                (a, b) => {
                  return a.playerId.localeCompare(
                    b.playerId,
                  );
                },
              );

          result[
            division.divisionId
          ] = rows;
        },
      );

      return result;
    }, [
      divisions,
      payments,
      playerNames,
    ]);

  /* =======================================================
     TOGGLE DIVISION
  ======================================================= */

  const toggleDivision = (
    divisionId: string,
  ) => {
    setExpandedDivision(
      (current) =>
        current ===
        divisionId
          ? null
          : divisionId,
    );
  };

  /* =======================================================
     MOBILE-SAFE IMAGE DOWNLOAD
  ======================================================= */

  const downloadDivisionImage =
    async (
      division: Division,
    ) => {
      const rows =
        paymentsByDivision[
          division.divisionId
        ] || [];

      if (
        rows.length === 0
      ) {
        return;
      }

      try {
        setDownloadingDivision(
          division.divisionId,
        );

        /*
         * =================================================
         * CANVAS SIZE
         * =================================================
         */

        const scale = 2;

        const canvas =
          document.createElement(
            "canvas",
          );

        const width =
          1400;

        const headerHeight =
          250;

        const tableHeaderHeight =
          75;

        const rowHeight =
          72;

        const footerHeight =
          100;

        const height =
          headerHeight +
          tableHeaderHeight +
          rows.length *
            rowHeight +
          footerHeight;

        canvas.width =
          width * scale;

        canvas.height =
          height * scale;

        const context =
          canvas.getContext(
            "2d",
          );

        if (!context) {
          throw new Error(
            "Unable to create image canvas.",
          );
        }

        /*
         * Draw using high-resolution
         * canvas coordinates.
         */
        context.scale(
          scale,
          scale,
        );

        /* =================================================
           COLORS
        ================================================= */

        const white =
          "#ffffff";

        const black =
          "#121212";

        const gray =
          "#737373";

        const lightGray =
          "#eeeeee";

        const softGray =
          "#f8f8f8";

        const accent =
          "#cd194b";

        const pendingYellow =
          "#b77900";

        const paidGreen =
          "#227846";

        const rejectedRed =
          "#c24141";

        /* =================================================
           WHITE BACKGROUND
        ================================================= */

        context.fillStyle =
          white;

        context.fillRect(
          0,
          0,
          width,
          height,
        );

        /* =================================================
           TOP ACCENT
        ================================================= */

        context.fillStyle =
          accent;

        context.fillRect(
          0,
          0,
          width,
          8,
        );

        /* =================================================
           HEADER
        ================================================= */

        context.fillStyle =
          black;

        context.font =
          "bold 42px Arial";

        context.fillText(
          "THRILL SEEKERS",
          60,
          65,
        );

        context.fillStyle =
          gray;

        context.font =
          "18px Arial";

        context.fillText(
          "EFOOTBALL CLUB",
          60,
          95,
        );

        context.fillStyle =
          accent;

        context.font =
          "bold 20px Arial";

        context.textAlign =
          "right";

        context.fillText(
          "PAYMENT STATUS",
          width - 60,
          60,
        );

        context.textAlign =
          "left";

        /* =================================================
           DIVISION TITLE
        ================================================= */

        context.fillStyle =
          black;

        context.font =
          "bold 30px Arial";

        const divisionTitle =
          division.name ||
          `Division ${division.divisionNumber}`;

        context.fillText(
          divisionTitle,
          60,
          155,
        );

        context.fillStyle =
          gray;

        context.font =
          "18px Arial";

        context.fillText(
          `${division.divisionId}  •  Season ${division.season}-${division.season + 1}  •  Phase ${division.phase}`,
          60,
          188,
        );

        /*
         * Accent underline.
         */
        context.fillStyle =
          accent;

        context.fillRect(
          60,
          210,
          80,
          5,
        );

        /* =================================================
           TABLE
        ================================================= */

        const tableX =
          60;

        const tableY =
          headerHeight;

        const tableWidth =
          width - 120;

        /*
         * Column widths
         *
         * #       70
         * THS ID  180
         * NAME    460
         * AMOUNT  180
         * STATUS  180
         * TX ID   remaining
         */

        const colNumber =
          70;

        const colPlayerId =
          190;

        const colName =
          440;

        const colAmount =
          180;

        const colStatus =
          180;

        const colTransaction =
          tableWidth -
          colNumber -
          colPlayerId -
          colName -
          colAmount -
          colStatus;

        const columns = [
          colNumber,
          colPlayerId,
          colName,
          colAmount,
          colStatus,
          colTransaction,
        ];

        /* =================================================
           TABLE HEADER
        ================================================= */

        context.fillStyle =
          black;

        context.fillRect(
          tableX,
          tableY,
          tableWidth,
          tableHeaderHeight,
        );

        context.fillStyle =
          white;

        context.font =
          "bold 18px Arial";

        context.textAlign =
          "left";

        const headerLabels = [
          "#",
          "THS ID",
          "PLAYER NAME",
          "AMOUNT",
          "STATUS",
          "TRANSACTION ID",
        ];

        let headerX =
          tableX;

        headerLabels.forEach(
          (
            label,
            index,
          ) => {
            context.fillText(
              label,
              headerX + 18,
              tableY + 47,
            );

            headerX +=
              columns[index];
          },
        );

        /* =================================================
           TABLE ROWS
        ================================================= */

        rows.forEach(
          (row, index) => {
            const y =
              tableY +
              tableHeaderHeight +
              index *
                rowHeight;

            /*
             * Alternating background.
             */
            context.fillStyle =
              index % 2 === 0
                ? softGray
                : white;

            context.fillRect(
              tableX,
              y,
              tableWidth,
              rowHeight,
            );

            /*
             * Bottom separator.
             */
            context.strokeStyle =
              lightGray;

            context.lineWidth =
              1;

            context.beginPath();

            context.moveTo(
              tableX,
              y +
                rowHeight,
            );

            context.lineTo(
              tableX +
                tableWidth,
              y +
                rowHeight,
            );

            context.stroke();

            /* ---------------------------------------------
               #
            --------------------------------------------- */

            context.fillStyle =
              black;

            context.font =
              "bold 17px Arial";

            context.fillText(
              String(
                index + 1,
              ),
              tableX + 18,
              y + 44,
            );

            /* ---------------------------------------------
               THS ID
            --------------------------------------------- */

            context.fillStyle =
              accent;

            context.font =
              "bold 17px Arial";

            context.fillText(
              row.playerId,
              tableX +
                columns[0] +
                18,
              y + 44,
            );

            /* ---------------------------------------------
               PLAYER NAME
            --------------------------------------------- */

            context.fillStyle =
              black;

            context.font =
              "bold 17px Arial";

            context.fillText(
              row.playerName,
              tableX +
                columns[0] +
                columns[1] +
                18,
              y + 44,
            );

            /* ---------------------------------------------
               AMOUNT
            --------------------------------------------- */

            context.fillStyle =
              black;

            context.font =
              "bold 17px Arial";

            context.fillText(
              formatAmount(
                row.amount,
              ),
              tableX +
                columns[0] +
                columns[1] +
                columns[2] +
                18,
              y + 44,
            );

            /* ---------------------------------------------
               STATUS
            --------------------------------------------- */

            const statusX =
              tableX +
              columns[0] +
              columns[1] +
              columns[2] +
              columns[3];

            if (
              row.status ===
              "PAID"
            ) {
              context.fillStyle =
                paidGreen;
            } else if (
              row.status ===
              "PENDING"
            ) {
              context.fillStyle =
                pendingYellow;
            } else {
              context.fillStyle =
                rejectedRed;
            }

            context.font =
              "bold 17px Arial";

            context.fillText(
              row.status,
              statusX + 18,
              y + 44,
            );

            /* ---------------------------------------------
               TRANSACTION ID
            --------------------------------------------- */

            const transactionX =
              statusX +
              columns[4];

            context.fillStyle =
              gray;

            context.font =
              "16px Arial";

            context.fillText(
              row.transactionId ||
                "—",
              transactionX + 18,
              y + 44,
            );
          },
        );

        /* =================================================
           FOOTER
        ================================================= */

        const footerY =
          tableY +
          tableHeaderHeight +
          rows.length *
            rowHeight +
          35;

        context.strokeStyle =
          lightGray;

        context.lineWidth =
          1;

        context.beginPath();

        context.moveTo(
          60,
          footerY,
        );

        context.lineTo(
          width - 60,
          footerY,
        );

        context.stroke();

        context.fillStyle =
          black;

        context.font =
          "bold 16px Arial";

        context.textAlign =
          "left";

        context.fillText(
          "THRILL SEEKERS",
          60,
          footerY + 40,
        );

        context.fillStyle =
          gray;

        context.font =
          "15px Arial";

        context.textAlign =
          "center";

        context.fillText(
          `Payment Status  •  ${division.divisionId}`,
          width / 2,
          footerY + 40,
        );

        context.textAlign =
          "right";

        context.fillText(
          `Total Players: ${rows.length}`,
          width - 60,
          footerY + 40,
        );

        context.textAlign =
          "left";

        /* =================================================
           CONVERT CANVAS TO PNG
        ================================================= */

        const imageBlob =
          await new Promise<Blob | null>(
            (resolve) => {
              canvas.toBlob(
                (blob) =>
                  resolve(blob),
                "image/png",
                1,
              );
            },
          );

        if (!imageBlob) {
          throw new Error(
            "Failed to create payment image.",
          );
        }

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

        const fileName =
          `${safeDivisionName || division.divisionId}-Payment-Status.png`;

        /* =================================================
           MOBILE-SAFE DOWNLOAD
        ================================================= */

        const file =
          new File(
            [imageBlob],
            fileName,
            {
              type:
                "image/png",
            },
          );

        /*
         * iOS / Android:
         *
         * Use native share sheet when
         * the browser supports sharing
         * files. On iPhone this gives
         * the user "Save Image" / Files /
         * Photos options.
         */
        const navigatorWithShare =
          navigator as Navigator & {
            canShare?: (
              data: ShareData,
            ) => boolean;

            share?: (
              data: ShareData,
            ) => Promise<void>;
          };

        if (
          navigatorWithShare.share &&
          navigatorWithShare.canShare &&
          navigatorWithShare.canShare({
            files: [file],
          })
        ) {
          try {
            await navigatorWithShare.share(
              {
                files: [file],
                title:
                  `${divisionTitle} Payment Status`,
              },
            );

            return;
          } catch (
            shareError
          ) {
            /*
             * User may close the share
             * sheet. Fall through to the
             * normal download method.
             */
            console.log(
              "Native share cancelled or unavailable:",
              shareError,
            );
          }
        }

        /*
         * Desktop / Android fallback.
         */
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
          fileName;

        document.body.appendChild(
          link,
        );

        link.click();

        link.remove();

        /*
         * Do not immediately revoke on
         * some mobile browsers.
         */
        setTimeout(() => {
          URL.revokeObjectURL(
            imageUrl,
          );
        }, 1000);
      } catch (err) {
        console.error(
          "Payment image generation failed:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to create payment image.",
        );
      } finally {
        setDownloadingDivision(
          null,
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">

            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-yellow-400/5 blur-3xl" />

            <div className="relative">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                  <ShieldCheck
                    size={25}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                    THRILL SEEKERS
                  </p>

                  <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                    Payment Status
                  </h1>
                </div>

              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400">
                View payment status separately for
                each league and download the league
                payment list as an image.
              </p>

            </div>
          </div>
        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-4">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>

                <p className="text-sm font-semibold text-red-400">
                  Payment status request failed
                </p>

                <p className="mt-1 text-sm leading-6 text-red-400/80">
                  {error}
                </p>

              </div>

            </div>
          </div>
        )}

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-12 text-center">

            <Loader2
              size={34}
              className="mx-auto animate-spin text-yellow-400"
            />

            <p className="mt-4 text-sm text-zinc-400">
              Loading payment status...
            </p>

          </div>
        ) : divisions.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-12 text-center">

            <CreditCard
              size={38}
              className="mx-auto text-zinc-600"
            />

            <h2 className="mt-5 text-lg font-semibold text-zinc-300">
              No Leagues Found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
              There are currently no league divisions
              available for payment status.
            </p>

          </div>
        ) : (
          <div className="space-y-5">

            {divisions.map(
              (division) => {
                const expanded =
                  expandedDivision ===
                  division.divisionId;

                const rows =
                  paymentsByDivision[
                    division.divisionId
                  ] || [];

                const paidCount =
                  rows.filter(
                    (row) =>
                      row.status ===
                      "PAID",
                  ).length;

                const pendingCount =
                  rows.filter(
                    (row) =>
                      row.status ===
                      "PENDING",
                  ).length;

                const rejectedCount =
                  rows.filter(
                    (row) =>
                      row.status ===
                      "REJECTED",
                  ).length;

                const status =
                  normalizeStatus(
                    division,
                  );

                return (
                  <section
                    key={
                      division.divisionId
                    }
                    className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black"
                  >

                    {/* =========================================
                        LEAGUE HEADER
                    ========================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        toggleDivision(
                          division.divisionId,
                        )
                      }
                      className="w-full text-left"
                    >
                      <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-400">
                              {division.divisionId}
                            </span>

                            {status ===
                              "ACTIVE" && (
                              <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-green-400">
                                ACTIVE
                              </span>
                            )}

                          </div>

                          <h2 className="mt-3 text-xl font-black text-white sm:text-2xl">
                            {division.name ||
                              `Division ${division.divisionNumber}`}
                          </h2>

                          <p className="mt-1 text-xs text-zinc-600">
                            Season{" "}
                            {division.season}
                            -
                            {division.season +
                              1}
                            {" • "}
                            Phase{" "}
                            {division.phase}
                          </p>

                        </div>

                        <div className="flex items-center gap-3">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-xl border border-green-400/10 bg-green-400/5 px-3 py-2 text-xs font-semibold text-green-400">
                              Paid{" "}
                              {paidCount}
                            </span>

                            <span className="rounded-xl border border-yellow-400/10 bg-yellow-400/5 px-3 py-2 text-xs font-semibold text-yellow-400">
                              Pending{" "}
                              {pendingCount}
                            </span>

                            {rejectedCount >
                              0 && (
                              <span className="rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs font-semibold text-red-400">
                                Rejected{" "}
                                {
                                  rejectedCount
                                }
                              </span>
                            )}

                          </div>

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400">
                            {expanded ? (
                              <ChevronUp
                                size={19}
                              />
                            ) : (
                              <ChevronDown
                                size={19}
                              />
                            )}
                          </div>

                        </div>

                      </div>
                    </button>

                    {/* =========================================
                        TABLE
                    ========================================= */}

                    {expanded && (
                      <div className="border-t border-white/10">

                        {/* =====================================
                            TOP DOWNLOAD BAR
                        ===================================== */}

                        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                          <div>
                            <p className="text-sm font-bold text-white">
                              Payment Status
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {rows.length} player
                              {rows.length ===
                              1
                                ? ""
                                : "s"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              downloadDivisionImage(
                                division,
                              )
                            }
                            disabled={
                              rows.length ===
                                0 ||
                              downloadingDivision ===
                                division.divisionId
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {downloadingDivision ===
                            division.divisionId ? (
                              <>
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                                Creating Image...
                              </>
                            ) : (
                              <>
                                <Download
                                  size={17}
                                />
                                Download Image
                              </>
                            )}
                          </button>

                        </div>

                        {rows.length ===
                        0 ? (
                          <div className="p-10 text-center sm:p-12">

                            <CreditCard
                              size={34}
                              className="mx-auto text-zinc-700"
                            />

                            <h3 className="mt-4 text-base font-semibold text-zinc-400">
                              No Payment Records
                            </h3>

                            <p className="mt-2 text-sm text-zinc-700">
                              No division-fee payment
                              records are available
                              for this league.
                            </p>

                          </div>
                        ) : (
                          <div className="overflow-x-auto">

                            <table className="w-full min-w-[760px] border-collapse">

                              <thead>
                                <tr className="bg-white/[0.03]">

                                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600 sm:px-6">
                                    #
                                  </th>

                                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                                    THS ID
                                  </th>

                                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                                    Player Name
                                  </th>

                                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                                    Amount
                                  </th>

                                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                                    Status
                                  </th>

                                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                                    Transaction ID
                                  </th>

                                  <th className="px-5 py-4 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                                    Date
                                  </th>

                                </tr>
                              </thead>

                              <tbody>

                                {rows.map(
                                  (
                                    row,
                                    index,
                                  ) => (
                                    <tr
                                      key={`${division.divisionId}-${row.playerId}`}
                                      className="border-t border-white/5 transition hover:bg-white/[0.025]"
                                    >

                                      <td className="px-5 py-4 text-sm font-bold text-zinc-500 sm:px-6">
                                        {index +
                                          1}
                                      </td>

                                      {/* THS ID LEFT OF NAME */}
                                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-yellow-400">
                                        {row.playerId}
                                      </td>

                                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-white">
                                        {row.playerName}
                                      </td>

                                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-zinc-300">
                                        {formatAmount(
                                          row.amount,
                                        )}
                                      </td>

                                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold">

                                        {row.status ===
                                        "PAID" ? (
                                          <span className="text-green-400">
                                            PAID
                                          </span>
                                        ) : row.status ===
                                          "PENDING" ? (
                                          <span className="text-yellow-400">
                                            PENDING
                                          </span>
                                        ) : (
                                          <span className="text-red-400">
                                            REJECTED
                                          </span>
                                        )}

                                      </td>

                                      <td className="max-w-[220px] break-all px-5 py-4 text-sm text-zinc-500">
                                        {row.transactionId ||
                                          "—"}
                                      </td>

                                      <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-600">
                                        {formatDate(
                                          row.createdAt,
                                        )}
                                      </td>

                                    </tr>
                                  ),
                                )}

                              </tbody>

                            </table>

                          </div>
                        )}

                      </div>
                    )}

                  </section>
                );
              },
            )}

          </div>
        )}

      </div>
    </main>
  );
}