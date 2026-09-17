"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Plus,
  X,
  Check,
  Users,
  WalletCards,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

import Navbar from "../components/Navbar";

const API_URL = "https://thrill-seekers-backend-production.up.railway.app";

type PaymentType = "DIVISION_FEE" | "FINE";

interface Player {
  id: number;
  playerId: string;
  name: string;
  email: string;
  deviceName: string;
  konamiId: string;
  isAdmin: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Division {
  id: number;
  divisionId: string;
  competitionId: string;
  NumberOfPlayer: number | null;
  season: number;
  phase: number;
  divisionNumber: number;
  name: string;
  status?: string;
  Status?: string;
  divisionStatus?: string;
  players?: Player[];
}

interface PaymentFormState {
  type: PaymentType;
  divisionId: string;
  amount: string;
}

const LEAGUE_NAMES: Record<number, string> = {
  1: "Thrill Seekers Premier League",
  2: "Thrill Seekers Championship",
  3: "Thrill Seekers League One",
};

const LEAGUE_FEES: Record<number, number> = {
  1: 50,
  2: 40,
  3: 30,
};

export default function PaymentManagePage() {
  const router = useRouter();

  const [players, setPlayers] = useState<Player[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedPlayerId, setExpandedPlayerId] =
    useState<string | null>(null);

  const [forms, setForms] = useState<
    Record<string, PaymentFormState>
  >({});

  const [submittingPlayerId, setSubmittingPlayerId] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState("");

  // =====================================================
  // AUTHENTICATED REQUEST
  // =====================================================

  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const token = localStorage.getItem("access_token");

    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(options.headers || {}),
      },
      cache: "no-store",
    });
  };

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("access_token");
        const userType =
          localStorage.getItem("userType")?.toLowerCase() || "";

        /*
         * Frontend protection.
         * Backend must also protect these endpoints.
         */
        if (!token || userType !== "superadmin") {
          router.replace("/login");
          return;
        }

        const [playersResponse, divisionsResponse] =
          await Promise.all([
            authenticatedFetch(`${API_URL}/player`),
            authenticatedFetch(`${API_URL}/divisions`),
          ]);

        if (!playersResponse.ok) {
          throw new Error("Failed to load players.");
        }

        if (!divisionsResponse.ok) {
          throw new Error("Failed to load divisions.");
        }

        const playersData = await playersResponse.json();
        const divisionsData = await divisionsResponse.json();

        const playerList = Array.isArray(playersData)
          ? playersData
          : [];

        const divisionList = Array.isArray(divisionsData)
          ? divisionsData
          : [];

        setPlayers(playerList);

        /*
         * We use the three actual league names in the UI.
         * Sort by division number.
         */
        const sortedDivisions = [...divisionList]
          .filter((division) => {
            return LEAGUE_NAMES[division.divisionNumber];
          })
          .sort(
            (a, b) =>
              a.divisionNumber - b.divisionNumber
          );

        setDivisions(sortedDivisions);
      } catch (err) {
        console.error("Payment management error:", err);

        if (err instanceof TypeError) {
          setError(
            "Unable to connect to the backend. Make sure the NestJS server is running."
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Something went wrong.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  // =====================================================
  // OPEN PAYMENT FORM
  // =====================================================

  const handleAddPayment = (playerId: string) => {
    setSuccessMessage("");
    setError("");

    if (expandedPlayerId === playerId) {
      setExpandedPlayerId(null);
      return;
    }

    setExpandedPlayerId(playerId);

    setForms((previous) => ({
      ...previous,
      [playerId]: {
        type: "DIVISION_FEE",
        divisionId: "",
        amount: "",
      },
    }));
  };

  // =====================================================
  // CANCEL
  // =====================================================

  const handleCancel = (playerId: string) => {
    setExpandedPlayerId(null);

    setForms((previous) => {
      const next = { ...previous };
      delete next[playerId];
      return next;
    });

    setError("");
    setSuccessMessage("");
  };

  // =====================================================
  // CHANGE PAYMENT TYPE
  // =====================================================

  const handlePaymentTypeChange = (
    playerId: string,
    type: PaymentType
  ) => {
    setForms((previous) => ({
      ...previous,
      [playerId]: {
        type,
        divisionId: "",
        amount: "",
      },
    }));
  };

  // =====================================================
  // CHANGE DIVISION
  // =====================================================

  const handleDivisionChange = (
    playerId: string,
    divisionId: string
  ) => {
    const selectedDivision = divisions.find(
      (division) =>
        String(division.id) === divisionId
    );

    const amount = selectedDivision
      ? LEAGUE_FEES[selectedDivision.divisionNumber] ?? 0
      : 0;

    setForms((previous) => ({
      ...previous,
      [playerId]: {
        ...(previous[playerId] || {
          type: "DIVISION_FEE",
          divisionId: "",
          amount: "",
        }),
        divisionId,
        amount:
          amount > 0 ? String(amount) : "",
      },
    }));
  };

  // =====================================================
  // CHANGE FINE AMOUNT
  // =====================================================

  const handleFineAmountChange = (
    playerId: string,
    amount: string
  ) => {
    setForms((previous) => ({
      ...previous,
      [playerId]: {
        ...(previous[playerId] || {
          type: "FINE",
          divisionId: "",
          amount: "",
        }),
        amount,
      },
    }));
  };

  // =====================================================
  // CREATE PAYMENT
  // =====================================================

  const handleConfirm = async (
    player: Player
  ) => {
    try {
      setError("");
      setSuccessMessage("");

      const form = forms[player.playerId];

      if (!form) {
        return;
      }

      if (form.type === "DIVISION_FEE") {
        if (!form.divisionId) {
          setError(
            "Please select a league."
          );
          return;
        }

        if (!form.amount) {
          setError(
            "Unable to determine the division fee."
          );
          return;
        }
      }

      if (form.type === "FINE") {
        const amount = Number(form.amount);

        if (!form.amount || amount <= 0) {
          setError(
            "Please enter a valid fine amount."
          );
          return;
        }
      }

      setSubmittingPlayerId(player.playerId);

      let response: Response;

      if (form.type === "DIVISION_FEE") {
        const selectedDivision = divisions.find(
          (division) =>
            String(division.id) ===
            form.divisionId
        );

        if (!selectedDivision) {
          throw new Error(
            "Selected league was not found."
          );
        }

        /*
         * Expected backend endpoint:
         * POST /payments/division-fee
         */
        response = await authenticatedFetch(
          `${API_URL}/payments/division-fee`,
          {
            method: "POST",
            body: JSON.stringify({
              playerId: player.playerId,
              divisionId:
                selectedDivision.divisionId,
              divisionNumber:
                selectedDivision.divisionNumber,
            }),
          }
        );
      } else {
        /*
         * Existing backend endpoint:
         * POST /payments/fine
         */
        response = await authenticatedFetch(
          `${API_URL}/payments/fine`,
          {
            method: "POST",
            body: JSON.stringify({
              playerId: player.playerId,
              amount: Number(form.amount),
            }),
          }
        );
      }

      let responseData: any = null;

      try {
        responseData = await response.json();
      } catch {
        //
      }

      if (!response.ok) {
        const message =
          typeof responseData?.message ===
          "string"
            ? responseData.message
            : "Failed to create payment.";

        throw new Error(message);
      }

      setSuccessMessage(
        `Payment created for ${player.name}. It is now pending.`
      );

      setExpandedPlayerId(null);

      setForms((previous) => {
        const next = { ...previous };
        delete next[player.playerId];
        return next;
      });
    } catch (err) {
      console.error(
        "Create payment error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to create payment."
      );
    } finally {
      setSubmittingPlayerId(null);
    }
  };

  // =====================================================
  // FORMAT LEAGUE NAME
  // =====================================================

  const getLeagueName = (
    division: Division
  ) => {
    return (
      LEAGUE_NAMES[
        division.divisionNumber
      ] || division.name
    );
  };

  // =====================================================
  // FORMAT PAYMENT TYPE
  // =====================================================

  const getPaymentTypeLabel = (
    type: PaymentType
  ) => {
    return type === "DIVISION_FEE"
      ? "Division Fee"
      : "Fine";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <Navbar />

        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
          <div className="flex items-center gap-3 text-zinc-400">
            <Loader2
              className="animate-spin text-yellow-400"
              size={22}
            />
            Loading players...
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 shadow-2xl sm:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />

            <div className="relative">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldCheck
                      size={18}
                      className="text-yellow-400"
                    />

                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                      SuperAdmin
                    </p>
                  </div>

                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    Payment Management
                  </h1>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                    Create division fees or fines
                    for players. Newly created
                    payments will appear as pending.
                  </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                    <Users size={20} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-600">
                      Total Players
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      {players.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{error}</span>
          </div>
        )}

        {/* ================================================= */}
        {/* SUCCESS */}
        {/* ================================================= */}

        {successMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-400/20 bg-green-400/10 px-4 py-3 text-sm text-green-400">
            <Check
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{successMessage}</span>
          </div>
        )}

        {/* ================================================= */}
        {/* PLAYERS HEADER */}
        {/* ================================================= */}

        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Players
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Add Payment
              </h2>
            </div>
          </div>

          {/* ================================================= */}
          {/* PLAYER LIST */}
          {/* ================================================= */}

          <div className="space-y-4">
            {players.map((player) => {
              const isExpanded =
                expandedPlayerId ===
                player.playerId;

              const form =
                forms[player.playerId];

              const isSubmitting =
                submittingPlayerId ===
                player.playerId;

              return (
                <div
                  key={player.playerId}
                  className={`overflow-hidden rounded-3xl border bg-gradient-to-br from-zinc-900 via-zinc-950 to-black transition-all duration-300 ${
                    isExpanded
                      ? "border-yellow-400/30 shadow-[0_0_35px_rgba(250,204,21,0.05)]"
                      : "border-white/10 hover:border-yellow-400/20"
                  }`}
                >
                  {/* PLAYER CARD */}
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-yellow-400">
                          <CreditCard size={22} />
                        </div>

                        <div>
                          <h3 className="text-lg font-bold">
                            {player.name}
                          </h3>

                          <p className="mt-1 text-sm text-zinc-500">
                            Player ID:{" "}
                            <span className="text-zinc-400">
                              {player.playerId}
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleAddPayment(
                            player.playerId
                          )
                        }
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
                          isExpanded
                            ? "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"
                            : "bg-yellow-400 text-black hover:bg-yellow-300"
                        }`}
                      >
                        {isExpanded ? (
                          <>
                            <X size={17} />
                            Close
                          </>
                        ) : (
                          <>
                            <Plus size={17} />
                            Add Payment
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ================================================= */}
                  {/* EXPANDED PAYMENT FORM */}
                  {/* ================================================= */}

                  {isExpanded && form && (
                    <div className="border-t border-white/10 bg-black/20 px-5 pb-6 pt-5 sm:px-6">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-yellow-400">
                            <WalletCards size={19} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold">
                              Create Payment
                            </p>

                            <p className="text-xs text-zinc-600">
                              For {player.name}
                            </p>
                          </div>
                        </div>

                        {/* PAYMENT TYPE */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                              Payment Type
                            </label>

                            <select
                              value={form.type}
                              onChange={(event) =>
                                handlePaymentTypeChange(
                                  player.playerId,
                                  event.target
                                    .value as PaymentType
                                )
                              }
                              className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-400/40"
                            >
                              <option value="DIVISION_FEE">
                                Division Fee
                              </option>

                              <option value="FINE">
                                Fine
                              </option>
                            </select>
                          </div>

                          {/* DIVISION */}
                          {form.type ===
                            "DIVISION_FEE" && (
                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                League
                              </label>

                              <select
                                value={
                                  form.divisionId
                                }
                                onChange={(event) =>
                                  handleDivisionChange(
                                    player.playerId,
                                    event.target
                                      .value
                                  )
                                }
                                className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-yellow-400/40"
                              >
                                <option value="">
                                  Select League
                                </option>

                                {divisions.map(
                                  (division) => (
                                    <option
                                      key={
                                        division.id
                                      }
                                      value={
                                        division.id
                                      }
                                    >
                                      {getLeagueName(
                                        division
                                      )}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* ================================================= */}
                        {/* AMOUNT */}
                        {/* ================================================= */}

                        <div className="mt-4">
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Amount
                          </label>

                          <div className="relative">
                            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                              ৳
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={form.amount}
                              readOnly={
                                form.type ===
                                "DIVISION_FEE"
                              }
                              onChange={(event) => {
                                if (
                                  form.type ===
                                  "FINE"
                                ) {
                                  handleFineAmountChange(
                                    player.playerId,
                                    event.target
                                      .value
                                  );
                                }
                              }}
                              placeholder={
                                form.type ===
                                "FINE"
                                  ? "Enter fine amount"
                                  : "Select a league"
                              }
                              className={`w-full rounded-2xl border border-white/10 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition focus:border-yellow-400/40 ${
                                form.type ===
                                "DIVISION_FEE"
                                  ? "cursor-not-allowed text-zinc-400"
                                  : ""
                              }`}
                            />
                          </div>

                          {form.type ===
                            "DIVISION_FEE" &&
                            form.divisionId && (
                              <p className="mt-2 text-xs text-zinc-600">
                                Amount is automatically
                                set according to the
                                selected league.
                              </p>
                            )}
                        </div>

                        {/* ================================================= */}
                        {/* SELECTED PAYMENT SUMMARY */}
                        {/* ================================================= */}

                        {form.amount && (
                          <div className="mt-5 rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.04] p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-zinc-600">
                                  Payment
                                </p>

                                <p className="mt-1 text-sm font-semibold text-zinc-300">
                                  {getPaymentTypeLabel(
                                    form.type
                                  )}
                                </p>
                              </div>

                              <p className="text-xl font-black text-yellow-400">
                                ৳
                                {Number(
                                  form.amount
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* ================================================= */}
                        {/* ACTION BUTTONS */}
                        {/* ================================================= */}

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              handleCancel(
                                player.playerId
                              )
                            }
                            disabled={
                              isSubmitting
                            }
                            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleConfirm(
                                player
                              )
                            }
                            disabled={
                              isSubmitting
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={17}
                                  className="animate-spin"
                                />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Check size={17} />
                                Confirm
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ================================================= */}
          {/* EMPTY STATE */}
          {/* ================================================= */}

          {players.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-10 text-center">
              <Users
                size={32}
                className="mx-auto text-zinc-600"
              />

              <h3 className="mt-4 text-lg font-bold">
                No Players Found
              </h3>

              <p className="mt-2 text-sm text-zinc-600">
                There are no players available.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
