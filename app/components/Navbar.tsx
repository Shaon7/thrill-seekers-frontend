"use client";

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
      // Clear all authentication data
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080808]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* =================================================
            LOGO
        ================================================== */}

        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() =>
            router.push(homePath)
          }
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 font-black text-black">
            TS
          </div>

          <div>
            <p className="font-bold tracking-tight">
              THRILL SEEKERS
            </p>

            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              eFootball Club
            </p>
          </div>
        </div>

        {/* =================================================
            DESKTOP NAVIGATION
        ================================================== */}

        <nav className="hidden items-center gap-7 lg:flex">

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
                  className={`text-sm font-medium transition ${
                    isActive
                      ? "text-yellow-400"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              );
            },
          )}

        </nav>

        {/* =================================================
            RIGHT SIDE
        ================================================== */}

        <div className="flex items-center gap-3">

          {/* Notification */}

          <button
            type="button"
            className="hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-300 transition hover:bg-white/10 sm:block"
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
                  (current) => !current,
                )
              }
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                userMenuOpen
                  ? "border-yellow-400/30 bg-zinc-800"
                  : "border-white/10 bg-zinc-900 hover:bg-zinc-800"
              }`}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-400 text-black">
                <User size={16} />
              </div>

              <span className="max-w-[140px] truncate text-sm font-medium">
                {displayName}
              </span>
            </button>

            {/* =================================================
                DESKTOP USER DROPDOWN
            ================================================== */}

            {userMenuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-48 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-1.5 shadow-2xl">

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
              MOBILE MENU
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen,
              )
            }
            className="rounded-xl border border-white/10 bg-white/5 p-2.5 lg:hidden"
          >
            {mobileMenuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>

        </div>
      </div>

      {/* ===================================================
          MOBILE NAVIGATION
      ==================================================== */}

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0c0c0c] px-4 py-4 lg:hidden">

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
                    className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                      isActive
                        ? "bg-yellow-400 text-black"
                        : "text-zinc-300 hover:bg-white/5"
                    }`}
                  >
                    {item}
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
              <LogOut size={18} />

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
