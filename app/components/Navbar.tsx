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

/* =====================================================
   NOTIFICATION
===================================================== */

interface Notification {
  id: number;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  read?: boolean;
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

  const [pendingPaymentCount, setPendingPaymentCount] =
    useState(0);

  /* =====================================================
     NOTIFICATION STATE
  ===================================================== */

  const [notificationOpen, setNotificationOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

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
  // LOAD NOTIFICATIONS
  // =====================================================

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const token =
          localStorage.getItem("access_token");

        if (!token) {
          setNotifications([]);
          setUnreadNotificationCount(0);
          return;
        }

        const response = await fetch(
          "https://thrill-seekers-backend-production.up.railway.app/notifications/my",
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
          setNotifications([]);
          return;
        }

        const data = await response.json();

        const notificationList: Notification[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];

        // Latest notifications first
        const sortedNotifications =
          [...notificationList].sort(
            (a, b) => {
              const dateA = a.createdAt
                ? new Date(a.createdAt).getTime()
                : 0;

              const dateB = b.createdAt
                ? new Date(b.createdAt).getTime()
                : 0;

              return dateB - dateA;
            },
          );

        // Only show the latest 5
        setNotifications(
          sortedNotifications.slice(0, 5),
        );
      } catch (error) {
        console.error(
          "Navbar notification loading error:",
          error,
        );
      }
    };

    const loadUnreadNotificationCount =
      async () => {
        try {
          const token =
            localStorage.getItem("access_token");

          if (!token) {
            setUnreadNotificationCount(0);
            return;
          }

          const response = await fetch(
            "https://thrill-seekers-backend-production.up.railway.app/notifications/unread-count",
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
            setUnreadNotificationCount(0);
            return;
          }

          const data = await response.json();

          setUnreadNotificationCount(
            Number(data?.count || 0),
          );
        } catch (error) {
          console.error(
            "Navbar unread notification count error:",
            error,
          );

          setUnreadNotificationCount(0);
        }
      };

    loadNotifications();
    loadUnreadNotificationCount();

    // Refresh notifications periodically
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadNotificationCount();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [userType, pathname]);

  // =====================================================
  // OPEN NOTIFICATION DROPDOWN
  // =====================================================

  const handleNotificationToggle = async () => {
    setNotificationOpen(
      (current) => !current,
    );
  };

  // =====================================================
  // MARK NOTIFICATION AS READ
  // =====================================================

  const handleMarkNotificationAsRead = async (
    notificationId: number,
  ) => {
    try {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      const response = await fetch(
        `https://thrill-seekers-backend-production.up.railway.app/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.error(
          "Failed to mark notification as read.",
        );
        return;
      }

      // Update notification locally
      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) =>
              notification.id === notificationId
                ? {
                    ...notification,
                    isRead: true,
                    read: true,
                  }
                : notification,
          ),
      );

      // Refresh unread count
      const countResponse =
        await fetch(
          "https://thrill-seekers-backend-production.up.railway.app/notifications/unread-count",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          },
        );

      if (countResponse.ok) {
        const countData =
          await countResponse.json();

        setUnreadNotificationCount(
          Number(countData?.count || 0),
        );
      }
    } catch (error) {
      console.error(
        "Mark notification as read error:",
        error,
      );
    }
  };

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const handleDeleteNotification = async (
    notificationId: number,
  ) => {
    try {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        return;
      }

      const response = await fetch(
        `https://thrill-seekers-backend-production.up.railway.app/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        console.error(
          "Failed to delete notification.",
        );
        return;
      }

      // Remove notification from dropdown
      setNotifications(
        (currentNotifications) =>
          currentNotifications.filter(
            (notification) =>
              notification.id !== notificationId,
          ),
      );

      // Refresh unread count
      const countResponse =
        await fetch(
          "https://thrill-seekers-backend-production.up.railway.app/notifications/unread-count",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          },
        );

      if (countResponse.ok) {
        const countData =
          await countResponse.json();

        setUnreadNotificationCount(
          Number(countData?.count || 0),
        );
      }
    } catch (error) {
      console.error(
        "Delete notification error:",
        error,
      );
    }
  };

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
      setNotifications([]);
      setUnreadNotificationCount(0);

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

  // =====================================================
  // NOTIFICATION READ STATUS
  // =====================================================

  const isNotificationRead = (
    notification: Notification,
  ) => {
    return (
      notification.isRead === true ||
      notification.read === true
    );
  };

  // =====================================================
  // NOTIFICATION TIME
  // =====================================================

  const formatNotificationTime = (
    createdAt?: string,
  ) => {
    if (!createdAt) {
      return "";
    }

    const date =
      new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString(
      undefined,
      {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      },
    );
  };

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

          <div className="relative flex h-[55] w-[55] shrink-0 items-center justify-center sm:h-[86px] sm:w-[82px] lg:h-[72px] lg:w-[72px]">

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

          <div className="mx-1 h-[58px] w-px bg-gradient-to-b from-transparent via-yellow-300/80 to-transparent sm:mx-2 sm:h-[64px] lg:mx-3 lg:h-[58px]" />

          {/* BRAND */}

          <div className="min-w-0 flex flex-col justify-center select-none">
  <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent font-black tracking-wider uppercase text-[18px] sm:text-[22px] lg:text-[24px] leading-tight drop-shadow-[0_2px_10px_rgba(234,179,8,0.2)]">
    THRILL
  </span>
  <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent font-extrabold tracking-[0.15em] uppercase text-[12px] sm:text-[14px] lg:text-[15px] leading-none opacity-90">
    SEEKERS
  </span>
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

          {/* =================================================
              DESKTOP NOTIFICATION
          ================================================== */}

          <div className="relative hidden sm:block">

            <button
              type="button"
              onClick={
                handleNotificationToggle
              }
              className="relative rounded-xl border border-yellow-400/15 bg-black/30 p-2.5 text-zinc-300 transition hover:border-yellow-400/30 hover:bg-yellow-400/10 hover:text-yellow-400"
            >

              <Bell size={18} />

              {/* UNREAD COUNT */}

              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.45)]">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}

            </button>

            {/* DESKTOP NOTIFICATION DROPDOWN */}

            {notificationOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] z-[60] w-[350px] overflow-hidden rounded-2xl border border-yellow-400/20 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">

                  <div>
                    <p className="text-sm font-bold text-white">
                      Notifications
                    </p>

                    <p className="text-[11px] text-zinc-500">
                      Recent notifications
                    </p>
                  </div>

                  {unreadNotificationCount > 0 && (
                    <span className="rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black text-black">
                      {unreadNotificationCount} unread
                    </span>
                  )}

                </div>

                {/* NOTIFICATIONS */}

                <div className="max-h-[390px] overflow-y-auto">

                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">

                      <Bell
                        size={26}
                        className="mx-auto mb-3 text-zinc-600"
                      />

                      <p className="text-sm text-zinc-400">
                        No notifications
                      </p>

                    </div>
                  ) : (
                    notifications.map(
                      (notification) => {
                        const read =
                          isNotificationRead(
                            notification,
                          );

                        return (
                          <div
                            key={notification.id}
                            className={`border-b border-white/5 px-4 py-3 transition ${
                              read
                                ? "bg-transparent"
                                : "bg-yellow-400/[0.04]"
                            }`}
                          >

                            <div className="flex gap-3">

                              {/* UNREAD DOT */}

                              <div className="pt-1.5">

                                {!read ? (
                                  <span className="block h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                                ) : (
                                  <span className="block h-2 w-2 rounded-full bg-zinc-700" />
                                )}

                              </div>

                              {/* CONTENT */}

                              <div className="min-w-0 flex-1">

                                <p className="text-sm font-semibold text-white">
                                  {notification.title ||
                                    "Notification"}
                                </p>

                                <p className="mt-1 break-words text-xs leading-5 text-zinc-400">
                                  {notification.message ||
                                    ""}
                                </p>

                                <p className="mt-1 text-[10px] text-zinc-600">
                                  {formatNotificationTime(
                                    notification.createdAt,
                                  )}
                                </p>

                                {/* OPTIONS */}

                                <div className="mt-2 flex items-center gap-3">

                                  {!read && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMarkNotificationAsRead(
                                          notification.id,
                                        )
                                      }
                                      className="text-[11px] font-semibold text-yellow-400 transition hover:text-yellow-300"
                                    >
                                      Mark as read
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteNotification(
                                        notification.id,
                                      )
                                    }
                                    className="text-[11px] font-semibold text-red-400 transition hover:text-red-300"
                                  >
                                    Delete
                                  </button>

                                </div>

                              </div>

                            </div>

                          </div>
                        );
                      },
                    )
                  )}

                </div>

              </div>
            )}

          </div>

          {/* =================================================
              MOBILE NOTIFICATION
              RIGHT OF THRILL SEEKERS
          ================================================== */}

          <div className="relative sm:hidden">

            <button
              type="button"
              onClick={
                handleNotificationToggle
              }
              className="relative flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[20px] border border-yellow-400/25 bg-black/35 text-yellow-100 shadow-[0_0_22px_rgba(250,204,21,0.08)] backdrop-blur-sm transition hover:border-yellow-400/45 hover:bg-yellow-400/10 hover:text-yellow-400"
            >

              <Bell
                size={23}
                strokeWidth={2}
              />

              {/* MOBILE UNREAD COUNT */}

              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-w-[19px] h-[19px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.45)]">
                  {unreadNotificationCount > 99
                    ? "99+"
                    : unreadNotificationCount}
                </span>
              )}

            </button>

            {/* MOBILE NOTIFICATION DROPDOWN */}

            {notificationOpen && (

                  <div className="fixed left-3 right-3 top-[112px] z-[60] w-auto max-w-none overflow-hidden rounded-2xl border border-yellow-400/20 bg-zinc-950/95 shadow-2xl backdrop-blur-xl">

                {/* HEADER */}

                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">

                  <div>
                    <p className="text-sm font-bold text-white">
                      Notifications
                    </p>

                    <p className="text-[11px] text-zinc-500">
                      Recent notifications
                    </p>
                  </div>

                  {unreadNotificationCount > 0 && (
                    <span className="rounded-full bg-yellow-400 px-2 py-1 text-[10px] font-black text-black">
                      {unreadNotificationCount} unread
                    </span>
                  )}

                </div>

                {/* NOTIFICATIONS */}

                <div className="max-h-[390px] overflow-y-auto">

                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">

                      <Bell
                        size={26}
                        className="mx-auto mb-3 text-zinc-600"
                      />

                      <p className="text-sm text-zinc-400">
                        No notifications
                      </p>

                    </div>
                  ) : (
                    notifications.map(
                      (notification) => {
                        const read =
                          isNotificationRead(
                            notification,
                          );

                        return (
                          <div
                            key={notification.id}
                            className={`border-b border-white/5 px-4 py-3 transition ${
                              read
                                ? "bg-transparent"
                                : "bg-yellow-400/[0.04]"
                            }`}
                          >

                            <div className="flex gap-3">

                              {/* UNREAD DOT */}

                              <div className="pt-1.5">

                                {!read ? (
                                  <span className="block h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.7)]" />
                                ) : (
                                  <span className="block h-2 w-2 rounded-full bg-zinc-700" />
                                )}

                              </div>

                              {/* CONTENT */}

                              <div className="min-w-0 flex-1">

                                <p className="text-sm font-semibold text-white">
                                  {notification.title ||
                                    "Notification"}
                                </p>

                                <p className="mt-1 break-words text-xs leading-5 text-zinc-400">
                                  {notification.message ||
                                    ""}
                                </p>

                                <p className="mt-1 text-[10px] text-zinc-600">
                                  {formatNotificationTime(
                                    notification.createdAt,
                                  )}
                                </p>

                                {/* OPTIONS */}

                                <div className="mt-2 flex items-center gap-3">

                                  {!read && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleMarkNotificationAsRead(
                                          notification.id,
                                        )
                                      }
                                      className="text-[11px] font-semibold text-yellow-400 transition hover:text-yellow-300"
                                    >
                                      Mark as read
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteNotification(
                                        notification.id,
                                      )
                                    }
                                    className="text-[11px] font-semibold text-red-400 transition hover:text-red-300"
                                  >
                                    Delete
                                  </button>

                                </div>

                              </div>

                            </div>

                          </div>
                        );
                      },
                    )
                  )}

                </div>

              </div>
            )}

          </div>

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