"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  CreditCard,
  Loader2,
  ShieldCheck,
  WalletCards,
  XCircle,
} from "lucide-react";

import Navbar from "@/app/components/Navbar";

const API_URL = "https://thrill-seekers-backend-production.up.railway.app";

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

type Tab =
  | "SUBMITTED"
  | "PENDING"
  | "COMPLETED";

export default function SuperAdminPaymentsPage() {
  const [payments, setPayments] =
    useState<Payment[]>([]);

  const [activeTab, setActiveTab] =
    useState<Tab>("SUBMITTED");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<number | null>(null);

  const [rejectingPayment, setRejectingPayment] =
    useState<Payment | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  // =====================================================
  // LOAD PAYMENTS
  // =====================================================

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again.",
        );
      }

      const response =
        await fetch(
          `${API_URL}/payments`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
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

      setPayments(
        Array.isArray(data)
          ? data
          : [],
      );
    } catch (err) {
      console.error(
        "SuperAdmin payments error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payments.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchPayments();
  }, []);

  // =====================================================
  // FILTER PAYMENTS
  // =====================================================

  const submittedPayments =
    useMemo(() => {
      return payments.filter(
        (payment) =>
          payment.status ===
            "PENDING" &&
          Boolean(
            payment.transactionId,
          ) &&
          Boolean(
            payment.senderBkashNumber,
          ),
      );
    }, [payments]);

  const pendingPayments =
    useMemo(() => {
      return payments.filter(
        (payment) =>
          payment.status ===
            "PENDING" &&
          !payment.transactionId &&
          !payment.senderBkashNumber,
      );
    }, [payments]);

  const completedPayments =
    useMemo(() => {
      return payments.filter(
        (payment) =>
          payment.status ===
          "PAID",
      );
    }, [payments]);

  const displayedPayments =
    activeTab === "SUBMITTED"
      ? submittedPayments
      : activeTab === "PENDING"
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
      "en-GB",
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
  // CONFIRM PAYMENT
  // =====================================================

  const confirmPayment = async (
    payment: Payment,
  ) => {
    try {
      setActionLoading(
        payment.id,
      );

      setError("");

      const token =
        localStorage.getItem(
          "access_token",
        );

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again.",
        );
      }

      const response =
        await fetch(
          `${API_URL}/payments/${payment.id}/verify`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
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
              `Failed to confirm payment. HTTP ${response.status}`;

        throw new Error(
          message,
        );
      }

      await fetchPayments();

      setActiveTab(
        "COMPLETED",
      );
    } catch (err) {
      console.error(
        "Confirm payment error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to confirm payment.",
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================================
  // OPEN REJECT
  // =====================================================

  const openRejectModal = (
    payment: Payment,
  ) => {
    setRejectingPayment(
      payment,
    );

    setRejectionReason("");

    setError("");
  };

  // =====================================================
  // CLOSE REJECT
  // =====================================================

  const closeRejectModal = () => {
    if (
      actionLoading !== null
    ) {
      return;
    }

    setRejectingPayment(
      null,
    );

    setRejectionReason("");
  };

  // =====================================================
  // REJECT PAYMENT
  // =====================================================

  const rejectPayment =
    async () => {
      if (
        !rejectingPayment
      ) {
        return;
      }

      const reason =
        rejectionReason.trim();

      if (!reason) {
        setError(
          "Please enter a rejection reason.",
        );

        return;
      }

      try {
        setActionLoading(
          rejectingPayment.id,
        );

        setError("");

        const token =
          localStorage.getItem(
            "access_token",
          );

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again.",
          );
        }

        const response =
          await fetch(
            `${API_URL}/payments/${rejectingPayment.id}/reject`,
            {
              method: "PATCH",

              headers: {
                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                rejectionReason:
                  reason,
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
                `Failed to reject payment. HTTP ${response.status}`;

          throw new Error(
            message,
          );
        }

        setRejectingPayment(
          null,
        );

        setRejectionReason("");

        await fetchPayments();

        // Stay on Submitted tab because rejected
        // payments are intentionally not shown
        // in the three main tabs.
        setActiveTab(
          "SUBMITTED",
        );
      } catch (err) {
        console.error(
          "Reject payment error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to reject payment.",
        );
      } finally {
        setActionLoading(
          null,
        );
      }
    };

  // =====================================================
  // TABS
  // =====================================================

  const tabs = [
    {
      key: "SUBMITTED" as Tab,
      label: "Submitted Payment",
      description:
        "Waiting for confirmation",
      count:
        submittedPayments.length,
      icon: Clock3,
    },
    {
      key: "PENDING" as Tab,
      label: "Pending Payment",
      description:
        "Awaiting player submission",
      count:
        pendingPayments.length,
      icon: WalletCards,
    },
    {
      key: "COMPLETED" as Tab,
      label: "Completed Payment",
      description:
        "Confirmed payments",
      count:
        completedPayments.length,
      icon: CheckCircle2,
    },
  ];

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      {/* =================================================
          BACKGROUND GLOW
      ================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-8">

            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-yellow-400/5 blur-3xl" />

            <div className="relative">

              <div className="flex items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                    <ShieldCheck
                      size={25}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                      SUPERADMIN
                    </p>

                    <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                      Payment Management
                    </h1>
                  </div>

                </div>

                <div className="hidden items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex">
                  <CreditCard
                    size={22}
                    className="text-zinc-400"
                  />
                </div>

              </div>

              <p className="mt-5 max-w-2xl text-sm leading-6 text-zinc-400">
                Review player payment
                submissions and confirm or
                reject submitted payments.
              </p>

              {/* SUMMARY */}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    Submitted
                  </p>

                  <p className="mt-2 text-2xl font-black text-yellow-400">
                    {
                      submittedPayments.length
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    Pending
                  </p>

                  <p className="mt-2 text-2xl font-black text-orange-400">
                    {
                      pendingPayments.length
                    }
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                    Completed
                  </p>

                  <p className="mt-2 text-2xl font-black text-green-400">
                    {
                      completedPayments.length
                    }
                  </p>
                </div>

              </div>

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
                  Payment request failed
                </p>

                <p className="mt-1 text-sm leading-6 text-red-400/80">
                  {error}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            TABS
        ================================================= */}

        <section className="mb-6">

          <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-zinc-900/60 p-2 sm:flex-row">

            {tabs.map((tab) => {
              const active =
                activeTab ===
                tab.key;

              const Icon =
                tab.icon;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      tab.key,
                    )
                  }
                  className={`flex flex-1 items-center justify-between rounded-xl px-4 py-4 text-left transition ${
                    active
                      ? "bg-yellow-400 text-black"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <Icon
                      size={18}
                    />

                    <div>

                      <p className="text-sm font-bold">
                        {tab.label}
                      </p>

                      <p
                        className={`mt-0.5 text-[11px] ${
                          active
                            ? "text-black/60"
                            : "text-zinc-600"
                        }`}
                      >
                        {
                          tab.description
                        }
                      </p>

                    </div>

                  </div>

                  <span
                    className={`min-w-8 rounded-full px-2 py-1 text-center text-xs font-bold ${
                      active
                        ? "bg-black/10 text-black"
                        : "bg-white/5 text-zinc-500"
                    }`}
                  >
                    {tab.count}
                  </span>

                </button>
              );
            })}

          </div>

        </section>

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
              Loading payments...
            </p>

          </div>
        ) : displayedPayments.length ===
          0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10 text-center sm:p-12">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">

              {activeTab ===
              "SUBMITTED" ? (
                <Clock3
                  size={25}
                  className="text-zinc-600"
                />
              ) : activeTab ===
                "PENDING" ? (
                <WalletCards
                  size={25}
                  className="text-zinc-600"
                />
              ) : (
                <CheckCircle2
                  size={25}
                  className="text-zinc-600"
                />
              )}

            </div>

            <h2 className="mt-5 text-lg font-semibold text-zinc-300">

              {activeTab ===
              "SUBMITTED"
                ? "No Submitted Payments"
                : activeTab ===
                    "PENDING"
                  ? "No Pending Payments"
                  : "No Completed Payments"}

            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">

              {activeTab ===
              "SUBMITTED"
                ? "No player payment is currently waiting for confirmation."
                : activeTab ===
                    "PENDING"
                  ? "No payment is currently waiting for player submission."
                  : "No payments have been confirmed yet."}

            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {displayedPayments.map(
              (payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  activeTab={
                    activeTab
                  }
                  actionLoading={
                    actionLoading ===
                    payment.id
                  }
                  formatPaymentType={
                    formatPaymentType
                  }
                  formatDate={
                    formatDate
                  }
                  formatAmount={
                    formatAmount
                  }
                  onConfirm={() =>
                    confirmPayment(
                      payment,
                    )
                  }
                  onReject={() =>
                    openRejectModal(
                      payment,
                    )
                  }
                />
              ),
            )}

          </div>
        )}

      </div>

      {/* =================================================
          REJECT MODAL
      ================================================= */}

      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black shadow-2xl">

            <div className="p-6 sm:p-7">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10">

                  <XCircle
                    size={21}
                    className="text-red-400"
                  />

                </div>

                <div>

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-400">
                    Payment Action
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Reject Payment
                  </h2>

                </div>

              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">

                <p className="text-xs text-zinc-600">
                  Payment
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  #
                  {
                    rejectingPayment.id
                  }{" "}
                  •{" "}
                  {
                    rejectingPayment.playerId
                  }
                </p>

                <p className="mt-1 text-sm text-yellow-400">
                  {formatAmount(
                    rejectingPayment.amount,
                  )}
                </p>

              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-400">
                Enter the reason this payment
                is being rejected.
              </p>

              <textarea
                value={
                  rejectionReason
                }
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value,
                  )
                }
                placeholder="Enter rejection reason..."
                rows={4}
                className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/30"
              />

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    closeRejectModal
                  }
                  disabled={
                    actionLoading !==
                    null
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    rejectPayment
                  }
                  disabled={
                    !rejectionReason.trim() ||
                    actionLoading !==
                      null
                  }
                  className="rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading !==
                  null
                    ? "Rejecting..."
                    : "Confirm Reject"}
                </button>

              </div>

            </div>

          </div>
        </div>
      )}
    </main>
  );
}

// ======================================================
// PAYMENT CARD
// ======================================================

function PaymentCard({
  payment,
  activeTab,
  actionLoading,
  formatPaymentType,
  formatDate,
  formatAmount,
  onConfirm,
  onReject,
}: {
  payment: Payment;
  activeTab: Tab;
  actionLoading: boolean;
  formatPaymentType: (
    type: Payment["paymentType"],
  ) => string;
  formatDate: (
    value: string,
  ) => string;
  formatAmount: (
    amount: string | number,
  ) => string;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const isSubmitted =
    activeTab ===
    "SUBMITTED";

  const isPending =
    activeTab ===
    "PENDING";

  const isCompleted =
    activeTab ===
    "COMPLETED";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-5 transition hover:border-yellow-400/20 sm:p-6">

      {/* ==================================================
          TOP
      ================================================== */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        <div className="flex flex-wrap items-center gap-2">

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            {formatPaymentType(
              payment.paymentType,
            )}
          </span>

          {isSubmitted && (
            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-400">
              SUBMITTED
            </span>
          )}

          {isPending && (
            <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-400">
              PENDING
            </span>
          )}

          {isCompleted && (
            <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-green-400">
              PAID
            </span>
          )}

        </div>

        <span className="text-xs text-zinc-600">
          #{payment.id}
        </span>

      </div>

      {/* ==================================================
          MAIN
      ================================================== */}

      <div className="grid grid-cols-[1fr_auto] items-center gap-4">

        <div>

          <p className="text-lg font-bold text-white">
            {formatPaymentType(
              payment.paymentType,
            )}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Player ID:{" "}
            {payment.playerId}
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
            Division
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {payment.divisionId ||
              "—"}
          </p>
        </div>

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
            bKash Number
          </p>

          <p className="mt-1 break-all text-xs text-zinc-400">
            {payment.senderBkashNumber ||
              "Not submitted"}
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

      </div>

      {/* ==================================================
          COMPLETED
      ================================================== */}

      {payment.status ===
        "PAID" &&
        payment.verifiedAt && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-400/10 bg-green-400/5 px-4 py-3">

            <CheckCircle2
              size={16}
              className="text-green-400"
            />

            <p className="text-xs text-green-400">
              Confirmed on{" "}
              {formatDate(
                payment.verifiedAt,
              )}
            </p>

          </div>
        )}

      {/* ==================================================
          ACTIONS
      ================================================== */}

      {isSubmitted && (
        <div className="mt-5 border-t border-white/10 pt-4">

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* CONFIRM */}

            <button
              type="button"
              disabled={
                actionLoading
              }
              onClick={
                onConfirm
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <CheckCircle2
                size={17}
              />

              {actionLoading
                ? "Processing..."
                : "Confirm"}

            </button>

            {/* REJECT */}

            <button
              type="button"
              disabled={
                actionLoading
              }
              onClick={
                onReject
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm font-bold text-red-400 transition hover:border-red-400/30 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <XCircle
                size={17}
              />

              Reject

            </button>

          </div>

        </div>
      )}

      {/* ==================================================
          PENDING MESSAGE
      ================================================== */}

      {isPending && (
        <div className="mt-5 rounded-2xl border border-orange-400/10 bg-orange-400/5 px-4 py-3">

          <div className="flex items-center gap-2">

            <Clock3
              size={16}
              className="text-orange-400"
            />

            <p className="text-xs text-orange-400">
              Waiting for player payment
              submission.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}
