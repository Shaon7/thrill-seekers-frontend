"use client";

import Image from "next/image";

import {
  Menu,
  Bell,
  User,
  X,
  LogOut,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import logo from "../icon.png";

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

interface Payment {
  id: number;
  playerId: string;
  divisionId: string;
  amount: string | number;
  paymentType: "DIVISION_FEE" | "FINE";
  status: "PENDING" | "PAID" | "REJECTED";
  senderBkashNumber?: string | null;
  transactionId?: string | null;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  verifiedBy?: string | null;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [userMenuOpen, setUserMenuOpen] =
    useState(false);

  const [player, setPlayer] =
    useState<Player | null>(null);

  const [userType, setUserType] =
    useState("");

  const [homePath, setHomePath] =
    useState("/home");

  const [pendingPaymentCount, setPendingPaymentCount] =
    useState(0);

  // =====================================================
  // NAVIGATION ITEMS
  // =====================================================

  const navItems = [
    "Home",
    "Tournaments",
    "Divisions",
    "Players",
    "Matches",
    "Payments",
    "Profile",
  ];

  // =====================================================
  // LOAD LOGIN INFORMATION
  // =====================================================

  useEffect(() => {
    const loadUserInformation = () => {
      try {
        const type =
          localStorage
            .getItem("userType")
            ?.toLowerCase() || "";

        setUserType(type);

        // -----------------------------------------------
        // HOME ROUTE
        // -----------------------------------------------

        if (type === "superadmin") {
          setHomePath("/superadmin");
        } else {
          setHomePath("/home");
        }

        // -----------------------------------------------
        // PLAYER INFORMATION
        // -----------------------------------------------

        const storedPlayer =
          localStorage.getItem("player");

        if (!storedPlayer) {
          setPlayer(null);
          return;
        }

        const loggedInPlayer: Player =
          JSON.parse(storedPlayer);

        if (loggedInPlayer?.playerId) {
          setPlayer(loggedInPlayer);
        }
      } catch (error) {
        console.error(
          "Navbar user loading error:",
          error,
        );

        setPlayer(null);
      }
    };

    loadUserInformation();

    window.addEventListener(
      "storage",
      loadUserInformation,
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadUserInformation,
      );
    };
  }, []);

  // =====================================================
  // LOAD PENDING PAYMENTS
  // =====================================================

  useEffect(() => {
    const loadPendingPayments = async () => {
      try {
        // Super Admin does not use /payments/my
        if (userType === "superadmin") {
          setPendingPaymentCount(0);
          return;
        }

        const token =
          localStorage.getItem("access_token");

        if (!token) {
          setPendingPaymentCount(0);
          return;
        }

        const response = await fetch(
          "https://thrill-seekers-backend-production.up.railway.app/payments/my",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          setPendingPaymentCount(0);
          return;
        }

        const data = await response.json();

        const payments: Payment[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const pendingCount =
          payments.filter(
            (payment) =>
              payment.status === "PENDING",
          ).length;

        setPendingPaymentCount(pendingCount);
      } catch (error) {
        console.error(
          "Navbar payment loading error:",
          error,
        );

        setPendingPaymentCount(0);
      }
    };

    if (userType !== "superadmin") {
      loadPendingPayments();

      const interval = setInterval(
        loadPendingPayments,
        10000,
      );

      return () => {
        clearInterval(interval);
      };
    }

    setPendingPaymentCount(0);
  }, [userType, pathname]);

  // =====================================================
  // ROUTES
  // =====================================================

  const routes: Record<string, string> = {
    Home: homePath,

    Tournaments: "/tournaments",

    Divisions: "/division",

    Players:
      userType === "superadmin"
        ? "/superadmin/players"
        : "/players",

    Matches: `/player/${
      player?.playerId || "THS-0012"
    }/matches`,

    Payments:
      userType === "superadmin"
        ? "/payments"
        : `/player/${
            player?.playerId || "THS-0012"
          }/payments`,

    Profile: `/player/profile/${
      player?.playerId || "THS-0012"
    }`,
  };

  // =====================================================
  // CHECK ACTIVE ROUTE
  // =====================================================

  const isRouteActive = (
    item: string,
  ) => {
    const route = routes[item];

    if (!route) {
      return false;
    }

    // Home
    if (item === "Home") {
      return pathname === route;
    }

    // Division and nested division pages
    if (item === "Divisions") {
      return (
        pathname === "/division" ||
        pathname.startsWith("/division/")
      );
    }

    // Tournaments and nested tournament pages
    if (item === "Tournaments") {
      return (
        pathname === "/tournaments" ||
        pathname.startsWith("/tournaments/")
      );
    }

    // Players and nested player pages
    if (item === "Players") {
      return (
        pathname === "/players" ||
        pathname.startsWith("/players/") ||
        pathname === "/superadmin/players" ||
        pathname.startsWith(
          "/superadmin/players/",
        )
      );
    }

    // Matches and nested match pages
    if (item === "Matches") {
      return (
        pathname.startsWith("/player/") &&
        pathname.endsWith("/matches")
      );
    }

    // Payments
    if (item === "Payments") {
      return (
        pathname === "/payments" ||
        (
          pathname.startsWith("/player/") &&
          pathname.endsWith("/payments")
        )
      );
    }

    // Profile and dynamic profile pages
    if (item === "Profile") {
      return pathname.startsWith(
        "/player/profile/",
      );
    }

    return pathname === route;
  };

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (
    item: string,
  ) => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);

    const route =
      routes[item];

    if (route) {
      router.push(route);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    const token =
      localStorage.getItem(
        "access_token",
      );

    try {
      if (token) {
        await fetch(
          "https://thrill-seekers-backend-production.up.railway.app/auth/logout",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },
        );
      }
    } catch (error) {
      console.error(
        "Logout request failed:",
        error,
      );
    } finally {
      localStorage.removeItem(
        "player",
      );

      localStorage.removeItem(
        "superAdmin",
      );

      localStorage.removeItem(
        "access_token",
      );

      localStorage.removeItem(
        "userType",
      );

      setPlayer(null);
      setUserType("");
      setMobileMenuOpen(false);
      setUserMenuOpen(false);
      setPendingPaymentCount(0);

      window.location.href =
        "https://thrillseekers.vercel.app/";
    }
  };

  // =====================================================
  // DISPLAY NAME
  // =====================================================

  const displayName =
    userType === "superadmin"
      ? "SuperAdmin"
      : player?.name || "Player";

  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-yellow-400/30 bg-black">

      {/* =================================================
          BACKGROUND EFFECT
      ================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Main glow */}

        <div className="absolute -left-24 -top-20 h-56 w-56 rounded-full bg-yellow-400/10 blur-3xl" />

        <div className="absolute left-[28%] -top-16 h-40 w-40 rounded-full bg-yellow-300/10 blur-3xl" />

        <div className="absolute right-[-70px] top-[-70px] h-60 w-60 rounded-full bg-yellow-400/10 blur-3xl" />

        {/* Gold light streak 1 */}

        <div className="absolute -left-20 top-8 h-[2px] w-[48%] rotate-[-13deg] bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent blur-[1px]" />

        {/* Gold light streak 2 */}

        <div className="absolute left-[-30px] top-[68px] h-[2px] w-[45%] rotate-[-13deg] bg-gradient-to-r from-transparent via-yellow-400/80 to-transparent blur-[1px]" />

        {/* Gold light streak 3 */}

        <div className="absolute right-[-80px] top-[72px] h-[2px] w-[52%] rotate-[-12deg] bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent blur-[1px]" />

        {/* Gold light streak 4 */}

        <div className="absolute right-[3%] bottom-[18px] h-[2px] w-[42%] rotate-[-13deg] bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent blur-[1px]" />

        {/* Tiny light points */}

        <div className="absolute left-[31%] top-5 h-1.5 w-1.5 rounded-full bg-yellow-300/70 blur-[1px]" />

        <div className="absolute right-[30%] top-10 h-1 w-1 rounded-full bg-yellow-300/80 blur-[1px]" />

        <div className="absolute left-[48%] bottom-6 h-1 w-1 rounded-full bg-yellow-300/60 blur-[1px]" />

        <div className="absolute right-[17%] bottom-10 h-1.5 w-1.5 rounded-full bg-yellow-300/60 blur-[1px]" />
      </div>

      {/* =================================================
          MAIN NAVBAR
      ================================================== */}

      <div className="relative mx-auto flex min-h-[112px] max-w-7xl items-center justify-between px-4 sm:min-h-[122px] sm:px-6 lg:min-h-[96px] lg:px-8">

        {/* =================================================
            LOGO + BRAND
        ================================================== */}

        <div
          className="flex min-w-0 cursor-pointer items-center"
          onClick={() =>
            router.push(homePath)
          }
        >

          {/* LOGO */}

          <div className="relative flex h-[55] w-[55] shrink-0 items-center justify-center sm:h-[86px] sm:w-[86px] lg:h-[72px] lg:w-[72px]">

            <div className="absolute inset-2 rounded-full bg-yellow-400/10 blur-xl" />

            <Image
              src={logo}
              alt="Thrill Seekers"
              width={96}
              height={96}
              priority
              className="relative h-full w-full object-contain drop-shadow-[0_0_16px_rgba(250,204,21,0.32)]"
            />

          </div>

          {/* VERTICAL DIVIDER */}

          <div className="mx-3 h-[58px] w-px bg-gradient-to-b from-transparent via-yellow-300/80 to-transparent sm:mx-4 sm:h-[64px] lg:mx-5 lg:h-[58px]" />

          {/* BRAND */}

          <div className="min-w-0">

            <p className="whitespace-nowrap text-[17px] font-black leading-none tracking-[-0.02em] text-yellow-400 sm:text-[25px] lg:text-[22px]">
              THRILL SEEKERS
            </p>

            <p className="mt-2 whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.42em] text-yellow-100/75 sm:text-[10px] lg:text-[9px]">
              EFOOTBALL CLUB
            </p>

          </div>

        </div>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================== */}

        <nav className="hidden items-center gap-6 xl:flex">

          {navItems.map(
            (item) => {
              const isActive =
                isRouteActive(item);

              return (
                <button
                  key={item}
                  onClick={() =>
                    handleNavigation(item)
                  }
                  className={`relative py-2 text-sm font-semibold transition ${
                    isActive
                      ? "text-yellow-400"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >

                  <span className="inline-flex items-center gap-2">
                    {item}

                    {/* PENDING PAYMENT BADGE */}

                    {item === "Payments" &&
                      userType !== "superadmin" &&
                      pendingPaymentCount > 0 && (
                        <span className="flex min-w-[20px] h-[20px] items-center justify-center rounded-full bg-yellow-400 px-1.5 text-[10px] font-black text-black shadow-[0_0_10px_rgba(250,204,21,0.35)]">
                          {pendingPaymentCount}
                        </span>
                      )}
                  </span>

                  {isActive && (
                    <span className="absolute -bottom-2 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                  )}

                </button>
              );
            },
          )}

        </nav>

        {/* =================================================
            RIGHT SIDE
        ================================================== */}

        <div className="flex items-center gap-2 sm:gap-3">

          {/* Notification */}

          <button
            type="button"
            className="hidden rounded-xl border border-yellow-400/15 bg-black/30 p-2.5 text-zinc-300 transition hover:border-yellow-400/30 hover:bg-yellow-400/10 hover:text-yellow-400 sm:block"
          >
            <Bell size={18} />
          </button>

          {/* =================================================
              DESKTOP USER
          ================================================== */}

          <div className="relative hidden sm:block">

            <button
              type="button"
              onClick={() =>
                setUserMenuOpen(
                  (current) =>
                    !current,
                )
              }
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                userMenuOpen
                  ? "border-yellow-400/30 bg-yellow-400/10"
                  : "border-white/10 bg-black/25 hover:border-yellow-400/25 hover:bg-yellow-400/5"
              }`}
            >

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.3)]">
                <User size={16} />
              </div>

              <span className="max-w-[140px] truncate text-sm font-medium text-white">
                {displayName}
              </span>

            </button>

            {/* =================================================
                DESKTOP USER DROPDOWN
            ================================================== */}

            {userMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-visible rounded-2xl border border-yellow-400/15 bg-zinc-950/95 p-1.5 shadow-2xl backdrop-blur-xl">

                <button
                  type="button"
                  onClick={
                    handleLogout
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                >

                  <LogOut
                    size={17}
                  />

                  <span>
                    Logout
                  </span>

                </button>

              </div>
            )}

          </div>

          {/* =================================================
              MOBILE MENU BUTTON
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen,
              )
            }
            className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[20px] border border-yellow-400/25 bg-black/35 text-yellow-100 shadow-[0_0_22px_rgba(250,204,21,0.08)] backdrop-blur-sm transition hover:border-yellow-400/45 hover:bg-yellow-400/10 hover:text-yellow-400 lg:hidden sm:h-[60px] sm:w-[60px]"
          >

            {mobileMenuOpen ? (
              <X
                size={29}
                strokeWidth={2}
              />
            ) : (
              <Menu
                size={29}
                strokeWidth={2}
              />
            )}

          </button>

        </div>
      </div>

      {/* =================================================
          MOBILE NAVIGATION
      ================================================== */}

      {mobileMenuOpen && (
        <div className="relative border-t border-yellow-400/15 bg-black/95 px-4 py-4 backdrop-blur-xl lg:hidden">

          <nav className="mx-auto flex max-w-7xl flex-col gap-2">

            {navItems.map(
              (item) => {
                const isActive =
                  isRouteActive(item);

                return (
                  <button
                    key={item}
                    onClick={() =>
                      handleNavigation(item)
                    }
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      isActive
                        ? "border-yellow-400/25 bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.12)]"
                        : "border-white/5 text-zinc-300 hover:border-yellow-400/15 hover:bg-yellow-400/5 hover:text-yellow-400"
                    }`}
                  >

                    <span className="flex items-center justify-between">
                      <span>
                        {item}
                      </span>

                      {/* PENDING PAYMENT BADGE */}

                      {item === "Payments" &&
                        userType !== "superadmin" &&
                        pendingPaymentCount > 0 && (
                          <span
                            className={`flex min-w-[21px] h-[21px] items-center justify-center rounded-full px-1.5 text-[10px] font-black ${
                              isActive
                                ? "bg-black/10 text-black"
                                : "bg-yellow-400 text-black"
                            }`}
                          >
                            {pendingPaymentCount}
                          </span>
                        )}
                    </span>

                  </button>
                );
              },
            )}

            {/* Logout */}

            <div className="my-2 border-t border-white/10" />

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >

              <LogOut
                size={18}
              />

              <span>
                Logout
              </span>

            </button>

          </nav>

        </div>
      )}

    </header>
  );
}