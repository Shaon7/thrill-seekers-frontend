"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import {
  CreditCard,
  Loader2,
  WalletCards,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

const API_URL = "https://thrill-seekers-backend-production.up.railway.app";

// =====================================================
// CLUB bKASH NUMBER
// =====================================================

const BKASH_NUMBER = "01522117898";

type Payment = {
  id: number;
  playerId: string;
  divisionId: string;
  amount: string | number;
  paymentType:
    | "DIVISION_FEE"
    | "FINE";
  status:
    | "PENDING"
    | "PAID"
    | "REJECTED";
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
  deviceName?: string;
  konamiId?: string;
  isAdmin?: boolean;
};

type PaymentTab =
  | "PENDING"
  | "COMPLETED";

export default function PlayerPaymentsPage() {
  const router = useRouter();

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [activeTab, setActiveTab] =
    useState<PaymentTab>("PENDING");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // Payment currently expanded
  const [expandedPaymentId, setExpandedPaymentId] =
    useState<number | null>(null);

  // Transaction ID input for each payment
  const [transactionIds, setTransactionIds] =
    useState<Record<number, string>>({});

  // Submission loading
  const [submittingPaymentId, setSubmittingPaymentId] =
    useState<number | null>(null);

  // Copy state
  const [copiedPaymentId, setCopiedPaymentId] =
    useState<number | null>(null);

  // =====================================================
  // LOAD PLAYER + PAYMENTS
  // =====================================================

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      // -----------------------------------------------
      // GET TOKEN
      // -----------------------------------------------

      const token =
        localStorage.getItem(
          "access_token",
        );

      if (!token) {
        router.push("/login");
        return;
      }

      // -----------------------------------------------
      // GET LOGGED-IN PLAYER
      // -----------------------------------------------

      const storedPlayer =
        localStorage.getItem(
          "player",
        );

      if (!storedPlayer) {
        throw new Error(
          "Player information was not found. Please login again.",
        );
      }

      let loggedInPlayer: Player;

      try {
        loggedInPlayer =
          JSON.parse(
            storedPlayer,
          );
      } catch {
        throw new Error(
          "Invalid player information. Please login again.",
        );
      }

      if (
        !loggedInPlayer?.playerId
      ) {
        throw new Error(
          "Player ID was not found. Please login again.",
        );
      }

      setPlayer(
        loggedInPlayer,
      );

      // -----------------------------------------------
      // GET MY PAYMENTS
      // -----------------------------------------------

      const response =
        await fetch(
          `${API_URL}/payments/my`,
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
              `Failed to load payments. HTTP ${response.status}`;

        throw new Error(
          message,
        );
      }

      const paymentData: Payment[] =
        Array.isArray(data)
          ? data
          : Array.isArray(
              data?.data,
            )
            ? data.data
            : [];

      setPayments(
        paymentData,
      );
    } catch (error) {
      console.error(
        "Payments page error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load payments.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [router]);

  // =====================================================
  // FILTER
  // =====================================================

  /*
   * Both PENDING and REJECTED payments are treated
   * as payments that still need player action.
   */
  const pendingPayments =
    useMemo(
      () =>
        payments.filter(
          (payment) =>
            payment.status ===
              "PENDING" ||
            payment.status ===
              "REJECTED",
        ),
      [payments],
    );

  const completedPayments =
    useMemo(
      () =>
        payments.filter(
          (payment) =>
            payment.status ===
            "PAID",
        ),
      [payments],
    );

  const displayedPayments =
    activeTab === "PENDING"
      ? pendingPayments
      : completedPayments;

  // =====================================================
  // HELPERS
  // =====================================================

  const formatPaymentType = (
    type: Payment["paymentType"],
  ) => {
    if (
      type ===
      "DIVISION_FEE"
    ) {
      return "Division Fee";
    }

    return "Fine";
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
      return "Unknown date";
    }

    return date.toLocaleDateString(
      undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
  };

  const formatAmount = (
    amount: string | number,
  ) => {
    const number =
      Number(amount);

    if (
      Number.isNaN(number)
    ) {
      return "৳0.00";
    }

    return `৳${number.toFixed(2)}`;
  };

  // =====================================================
  // CHECK WHETHER CURRENT SUBMISSION IS ACTIVE
  // =====================================================

  /*
   * A REJECTED payment must NOT be treated as submitted.
   * It needs to be submitted again.
   */
  const isPaymentSubmitted = (
    payment: Payment,
  ) => {
    return (
      payment.status ===
        "PENDING" &&
      Boolean(
        payment.transactionId,
      ) &&
      Boolean(
        payment.senderBkashNumber,
      )
    );
  };

  // =====================================================
  // TOGGLE PAYMENT FORM
  // =====================================================

  const togglePaymentForm = (
    paymentId: number,
  ) => {
    setError("");

    setExpandedPaymentId(
      (current) =>
        current === paymentId
          ? null
          : paymentId,
    );
  };

  // =====================================================
  // COPY BKASH NUMBER
  // =====================================================

  const copyBkashNumber = async (
    paymentId: number,
  ) => {
    try {
      await navigator.clipboard.writeText(
        BKASH_NUMBER,
      );

      setCopiedPaymentId(
        paymentId,
      );

      setTimeout(() => {
        setCopiedPaymentId(
          (current) =>
            current ===
            paymentId
              ? null
              : current,
        );
      }, 2000);
    } catch (error) {
      console.error(
        "Copy bKash number error:",
        error,
      );

      setError(
        "Unable to copy the bKash number. Please copy it manually.",
      );
    }
  };

  // =====================================================
  // SUBMIT / RESUBMIT PAYMENT
  // =====================================================

  const submitPayment = async (
    payment: Payment,
  ) => {
    const transactionId =
      (
        transactionIds[
          payment.id
        ] || ""
      ).trim();

    if (!transactionId) {
      setError(
        "Please enter your transaction ID.",
      );

      return;
    }

    try {
      setSubmittingPaymentId(
        payment.id,
      );

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
          `${API_URL}/payments/${payment.id}/submit`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              senderBkashNumber:
                BKASH_NUMBER,
              transactionId:
                transactionId,
            }),
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
              `Failed to submit payment. HTTP ${response.status}`;

        throw new Error(
          message,
        );
      }

      /*
       * Keep the same card and change it back
       * to submitted/pending state.
       *
       * Rejection reason is cleared because the
       * player has now submitted a new payment.
       */
      setPayments(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              payment.id
                ? {
                    ...item,
                    senderBkashNumber:
                      BKASH_NUMBER,
                    transactionId:
                      transactionId,
                    status:
                      "PENDING",
                    rejectionReason:
                      null,
                  }
                : item,
          ),
      );

      // Close expanded form
      setExpandedPaymentId(
        null,
      );

      // Clear input
      setTransactionIds(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            payment.id
          ];

          return next;
        },
      );

      setError("");
    } catch (error) {
      console.error(
        "Submit payment error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit payment.",
      );
    } finally {
      setSubmittingPaymentId(
        null,
      );
    }
  };

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
              Loading your payments...
            </p>

          </div>

        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE ERROR
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
            PAGE HEADER
        ================================================== */}

        <section className="mb-8">

          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">

            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-black">
                  <CreditCard
                    size={23}
                  />
                </div>

                <div>

                  <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                    PLAYER PAYMENTS
                  </p>

                  <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                    My Payments
                  </h1>

                </div>

              </div>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400">

                View and manage your payment records
                {player?.name
                  ? " for "
                  : "."}

                {player?.name && (
                  <span className="font-semibold text-white">
                    {player.name}
                  </span>
                )}

                {player?.name && "."}

              </p>

              {player?.playerId && (
                <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2">

                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                    Player ID
                  </span>

                  <span className="text-sm font-semibold text-zinc-300">
                    {player.playerId}
                  </span>

                </div>
              )}

            </div>

          </div>

        </section>

        {/* ==================================================
            PAGE ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <p className="text-sm leading-6 text-red-400">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* ==================================================
            TABS
        ================================================== */}

        <section className="mb-6">

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-2 sm:flex-row">

            {/* PENDING */}

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "PENDING",
                )
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                activeTab ===
                "PENDING"
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >

              <Clock3
                size={17}
              />

              Pending Payment

              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab ===
                  "PENDING"
                    ? "bg-black/10 text-black"
                    : "bg-white/5 text-zinc-500"
                }`}
              >
                {
                  pendingPayments.length
                }
              </span>

            </button>

            {/* COMPLETED */}

            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "COMPLETED",
                )
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
                activeTab ===
                "COMPLETED"
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >

              <CheckCircle2
                size={17}
              />

              Completed Payment

              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab ===
                  "COMPLETED"
                    ? "bg-black/10 text-black"
                    : "bg-white/5 text-zinc-500"
                }`}
              >
                {
                  completedPayments.length
                }
              </span>

            </button>

          </div>

        </section>

        {/* ==================================================
            PAYMENTS
        ================================================== */}

        {displayedPayments.length ===
        0 ? (
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-10 text-center">

            <WalletCards
              size={38}
              className="mx-auto text-zinc-600"
            />

            <h2 className="mt-4 text-lg font-semibold text-zinc-300">

              {activeTab ===
              "PENDING"
                ? "No pending payments"
                : "No completed payments"}

            </h2>

            <p className="mt-2 text-sm text-zinc-600">

              {activeTab ===
              "PENDING"
                ? "You currently have no payment waiting for submission."
                : "You have not completed any payments yet."}

            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {displayedPayments.map(
              (payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  formatDate={
                    formatDate
                  }
                  formatAmount={
                    formatAmount
                  }
                  formatPaymentType={
                    formatPaymentType
                  }
                  onMakePayment={() =>
                    togglePaymentForm(
                      payment.id,
                    )
                  }
                  expanded={
                    expandedPaymentId ===
                    payment.id
                  }
                  transactionId={
                    transactionIds[
                      payment.id
                    ] || ""
                  }
                  setTransactionId={(
                    value,
                  ) =>
                    setTransactionIds(
                      (current) => ({
                        ...current,
                        [payment.id]:
                          value,
                      }),
                    )
                  }
                  onCopyNumber={() =>
                    copyBkashNumber(
                      payment.id,
                    )
                  }
                  copied={
                    copiedPaymentId ===
                    payment.id
                  }
                  onConfirm={() =>
                    submitPayment(
                      payment,
                    )
                  }
                  onCancel={() =>
                    setExpandedPaymentId(
                      null,
                    )
                  }
                  submitting={
                    submittingPaymentId ===
                    payment.id
                  }
                  isPendingTab={
                    activeTab ===
                    "PENDING"
                  }
                />
              ),
            )}

          </div>
        )}

      </div>
    </main>
  );
}

// ======================================================
// PAYMENT CARD
// ======================================================

function PaymentCard({
  payment,
  formatDate,
  formatAmount,
  formatPaymentType,
  onMakePayment,
  expanded,
  transactionId,
  setTransactionId,
  onCopyNumber,
  copied,
  onConfirm,
  onCancel,
  submitting,
  isPendingTab,
}: {
  payment: Payment;

  formatDate: (
    value: string,
  ) => string;

  formatAmount: (
    amount: string | number,
  ) => string;

  formatPaymentType: (
    type: Payment["paymentType"],
  ) => string;

  onMakePayment: () => void;

  expanded: boolean;

  transactionId: string;

  setTransactionId: (
    value: string,
  ) => void;

  onCopyNumber: () => void;

  copied: boolean;

  onConfirm: () => void;

  onCancel: () => void;

  submitting: boolean;

  isPendingTab: boolean;
}) {
  const isPaid =
    payment.status ===
    "PAID";

  /*
   * Important:
   * REJECTED is intentionally treated as a
   * payment that needs another submission.
   */
  const isRejected =
    payment.status ===
    "REJECTED";

  /*
   * A submitted payment means:
   * status is PENDING + transaction details exist.
   *
   * A REJECTED payment is NOT considered submitted,
   * even if it still contains its old transaction ID.
   */
  const submitted =
    payment.status ===
      "PENDING" &&
    Boolean(
      payment.transactionId,
    ) &&
    Boolean(
      payment.senderBkashNumber,
    );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 transition hover:border-yellow-400/20 hover:bg-zinc-900 sm:p-6">

      {/* ==================================================
          TOP ROW
      ================================================== */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        <div className="flex flex-wrap items-center gap-2">

          {isPaid ? (
            <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              Paid
            </span>
          ) : submitted ? (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              Submitted
            </span>
          ) : (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              Pending
            </span>
          )}

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {formatPaymentType(
              payment.paymentType,
            )}
          </span>

        </div>

        <span className="text-xs text-zinc-600">
          #{payment.id}
        </span>

      </div>

      {/* ==================================================
          PAYMENT MAIN
      ================================================== */}

      <div className="grid grid-cols-[1fr_auto] items-center gap-4">

        <div>

          <p className="text-base font-bold text-white sm:text-lg">
            {formatPaymentType(
              payment.paymentType,
            )}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Division{" "}
            {payment.divisionId ||
              "—"}
          </p>

        </div>

        <div className="text-right">

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Amount
          </p>

          <p className="mt-1 text-2xl font-black text-yellow-400">
            {formatAmount(
              payment.amount,
            )}
          </p>

        </div>

      </div>

      {/* ==================================================
          DETAILS
      ================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Created
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {formatDate(
              payment.createdAt,
            )}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Transaction ID
          </p>

          <p className="mt-1 break-all text-xs text-zinc-400">
            {payment.transactionId ||
              "Not submitted"}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            bKash Number
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {payment.senderBkashNumber ||
              "Not submitted"}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Status
          </p>

          <p
            className={`mt-1 text-xs font-semibold ${
              isPaid
                ? "text-green-400"
                : "text-yellow-400"
            }`}
          >
            {submitted
              ? "SUBMITTED"
              : isRejected
                ? "PENDING"
                : payment.status}
          </p>

        </div>

      </div>

      {/* ==================================================
          REJECTION REASON
      ================================================== */}

      {isPendingTab &&
        isRejected &&
        payment.rejectionReason && (
          <div className="mt-5 rounded-2xl border border-red-400/10 bg-red-400/5 px-4 py-4">

            <div className="flex items-start gap-3">

              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div>

                <p className="text-sm font-semibold text-red-400">
                  Payment Rejected
                </p>

                <p className="mt-1 text-xs leading-5 text-red-300">
                  {payment.rejectionReason}
                </p>

                <p className="mt-2 text-xs text-red-400/60">
                  Please make the payment again and
                  submit a new transaction ID.
                </p>

              </div>

            </div>

          </div>
        )}

      {/* ==================================================
          SUBMITTED MESSAGE
      ================================================== */}

      {isPendingTab &&
        submitted &&
        !isPaid && (
          <div className="mt-5 rounded-2xl border border-yellow-400/10 bg-yellow-400/5 px-4 py-4">

            <div className="flex items-start gap-3">

              <Clock3
                size={18}
                className="mt-0.5 shrink-0 text-yellow-400"
              />

              <div>

                <p className="text-sm font-semibold text-yellow-400">
                  Payment submitted
                </p>

                <p className="mt-1 text-xs leading-5 text-yellow-400/70">
                  Please wait for confirmation.
                </p>

              </div>

            </div>

          </div>
        )}

      {/* ==================================================
          VERIFIED
      ================================================== */}

      {isPaid &&
        payment.verifiedAt && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-400/10 bg-green-400/5 px-4 py-3">

            <CheckCircle2
              size={16}
              className="text-green-400"
            />

            <p className="text-xs text-green-400">
              Verified on{" "}
              {formatDate(
                payment.verifiedAt,
              )}
            </p>

          </div>
        )}

      {/* ==================================================
          PAYMENT FORM
      ================================================== */}

      {isPendingTab &&
        !submitted &&
        (payment.status ===
          "PENDING" ||
          payment.status ===
            "REJECTED") && (
          <div className="mt-5 border-t border-white/10 pt-5">

            {!expanded ? (
              <button
                type="button"
                onClick={
                  onMakePayment
                }
                className="w-full rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 sm:w-auto sm:px-6"
              >
                {isRejected
                  ? "Make Payment Again"
                  : "Make Payment"}
              </button>
            ) : (
              <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-5">

                {/* -----------------------------------------
                    BKASH INSTRUCTION
                ----------------------------------------- */}

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-400">
                    Payment Instructions
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    Send Money to this Account
                  </p>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Send{" "}
                    <span className="font-semibold text-white">
                      {formatAmount(
                        payment.amount,
                      )}
                    </span>{" "}
                    to the bKash number below, then
                    enter the new transaction number.
                  </p>

                </div>

                {/* -----------------------------------------
                    BKASH NUMBER
                ----------------------------------------- */}

                <div className="mt-4">

                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    bKash Number
                  </p>

                  <div className="flex items-center gap-2">

                    <div className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3">

                      <p className="text-base font-bold tracking-wide text-white">
                        {BKASH_NUMBER}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={
                        onCopyNumber
                      }
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition hover:border-yellow-400/30 hover:bg-yellow-400/10 hover:text-yellow-400"
                      title="Copy bKash number"
                    >
                      {copied ? (
                        <Check
                          size={19}
                          className="text-green-400"
                        />
                      ) : (
                        <Copy
                          size={19}
                        />
                      )}
                    </button>

                  </div>

                  {copied && (
                    <p className="mt-2 text-xs text-green-400">
                      bKash number copied.
                    </p>
                  )}

                </div>

                {/* -----------------------------------------
                    TRANSACTION ID
                ----------------------------------------- */}

                <div className="mt-5">

                  <label
                    htmlFor={`transaction-${payment.id}`}
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-zinc-600"
                  >
                    Transaction ID
                  </label>

                  <input
                    id={`transaction-${payment.id}`}
                    type="text"
                    value={
                      transactionId
                    }
                    onChange={(
                      event,
                    ) =>
                      setTransactionId(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Enter your transaction ID"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/30"
                  />

                </div>

                {/* -----------------------------------------
                    ACTIONS
                ----------------------------------------- */}

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={
                      onCancel
                    }
                    disabled={
                      submitting
                    }
                    className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      onConfirm
                    }
                    disabled={
                      submitting ||
                      !transactionId.trim()
                    }
                    className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting
                      ? "Submitting..."
                      : "Confirm Payment"}
                  </button>

                </div>

              </div>
            )}

          </div>
        )}

      {/* ==================================================
          DISABLED BUTTON AFTER SUBMISSION
      ================================================== */}

      {isPendingTab &&
        submitted && (
          <div className="mt-5 border-t border-white/10 pt-4">

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-zinc-600 sm:w-auto sm:px-6"
            >
              Payment Submitted
            </button>

          </div>
        )}

    </div>
  );
}