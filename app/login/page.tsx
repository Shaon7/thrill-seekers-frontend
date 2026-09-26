"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!login.trim() || !password.trim()) {
      setError("Please enter your email/user ID and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://thrill-seekers-backend-production.up.railway.app/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            login: login.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid player ID/email or password"
        );
      }

      // ==================================================
      // SAVE AUTHENTICATION INFORMATION
      // ==================================================

      // Save JWT access token
      localStorage.setItem(
        "access_token",
        data.access_token
      );

      // Save user type
      if (data.userType) {
        localStorage.setItem(
          "userType",
          data.userType
        );
      }

      // Save player information
      if (data.player) {
        localStorage.setItem(
          "player",
          JSON.stringify(data.player)
        );
      }

      // Save SuperAdmin information
      if (data.superAdmin) {
        localStorage.setItem(
          "superAdmin",
          JSON.stringify(data.superAdmin)
        );
      }

      // ==================================================
      // REDIRECT BASED ON USER TYPE
      // ==================================================

      if (
        data.userType?.toLowerCase() ===
        "superadmin"
      ) {
        router.push("/superadmin");
      } else {
        router.push("/home");
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060606] text-white flex items-center justify-center px-4 py-10">

      {/* ==================================================
          ANIMATED BACKGROUND
      ================================================== */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Top yellow glow */}
        <motion.div
          className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-yellow-400/10 blur-[120px]"
          animate={{
            scale: [1, 1.12, 1],
            opacity: [0.3, 0.55, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Left cyan glow */}
        <motion.div
          className="absolute left-[-180px] top-1/3 w-[350px] h-[350px] rounded-full bg-cyan-400/10 blur-[110px]"
          animate={{
            x: [0, 45, 0],
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Right yellow glow */}
        <motion.div
          className="absolute right-[-180px] bottom-1/4 w-[350px] h-[350px] rounded-full bg-yellow-400/10 blur-[110px]"
          animate={{
            x: [0, -45, 0],
            y: [0, 30, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "45px 45px",
          }}
        />
      </div>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="relative z-10 w-full max-w-md">

        {/* ==================================================
            BRAND
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: -25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
            ease: "easeOut",
          }}
          className="text-center mb-8"
        >

          {/* Logo */}
          <motion.div
            animate={{
              y: [0, -6, 0],
              rotate: [0, 1.5, 0, -1.5, 0],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative mx-auto mb-5 w-20 h-20"
          >
            {/* Animated glow behind logo */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.45, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-3xl bg-yellow-400/20 blur-xl"
            />

            {/* Logo box */}
            <div className="relative w-full h-full rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center shadow-2xl shadow-yellow-400/10 overflow-hidden">

              {/* Small animated shine */}
              <motion.div
                className="absolute inset-y-0 -left-12 w-10 bg-white/10 skew-x-[-20deg]"
                animate={{
                  x: ["0%", "500%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: "easeInOut",
                }}
              />

              <Image
                src="/icon.png"
                alt="Thrill Seekers"
                width={58}
                height={58}
                priority
                className="relative z-10 object-contain"
              />
            </div>
          </motion.div>

          {/* Animated Club Name */}
          <motion.h1
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
              duration: 0.6,
            }}
            className="text-3xl sm:text-4xl font-black tracking-tight"
          >
            <motion.span
              animate={{
                textShadow: [
                  "0 0 0px rgba(250,204,21,0)",
                  "0 0 18px rgba(250,204,21,0.35)",
                  "0 0 0px rgba(250,204,21,0)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              THRILL
            </motion.span>{" "}

            <motion.span
              className="text-yellow-400 inline-block"
              animate={{
                y: [0, -2, 0, 2, 0],
                letterSpacing: [
                  "0em",
                  "0.025em",
                  "0em",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              SEEKERS
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.35,
              duration: 0.6,
            }}
            className="text-zinc-500 mt-2 text-sm"
          >
            eFootball Club Portal
          </motion.p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-px w-10 bg-white/10" />

            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">
              Welcome back
            </span>

            <div className="h-px w-10 bg-white/10" />
          </div>
        </motion.div>

        {/* ==================================================
            LOGIN CARD
        ================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 35,
            scale: 0.97,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.7,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-950/95 to-black/95 p-6 sm:p-8 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >

          {/* Top yellow glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-yellow-400/10 blur-3xl pointer-events-none" />

          {/* Top border accent */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

          {/* Heading */}
          <div className="relative mb-7">
            <h2 className="text-2xl font-bold text-white">
              Welcome back, Champion
            </h2>

            <p className="text-zinc-500 text-sm mt-2">
              Login to access your club account
            </p>
          </div>

          {/* ==================================================
              ERROR MESSAGE
          ================================================== */}

          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-red-400 shadow-lg shadow-red-400/40" />

                <p className="text-sm text-red-400 leading-5">
                  {error}
                </p>
              </div>
            </motion.div>
          )}

          {/* ==================================================
              EMAIL / USER ID
          ================================================== */}

          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email / User ID
            </label>

            <div className="relative">
              <input
                type="text"
                value={login}
                onChange={(e) =>
                  setLogin(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                placeholder="Enter your email or user ID"
                autoComplete="username"
                className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-yellow-400/60 focus:ring-4 focus:ring-yellow-400/5 hover:border-white/20"
              />

              {login && (
                <motion.div
                  initial={{
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
                />
              )}
            </div>
          </div>

          {/* ==================================================
              PASSWORD
          ================================================== */}

          <div className="mb-3">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                className="w-full h-12 px-4 pr-16 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-yellow-400/60 focus:ring-4 focus:ring-yellow-400/5 hover:border-white/20"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition"
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* ==================================================
              FORGOT PASSWORD
          ================================================== */}

          <div className="flex justify-end mb-6">
            <a
              href="/forgot-password"
              className="text-sm text-zinc-500 hover:text-yellow-400 transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* ==================================================
              LOGIN BUTTON
          ================================================== */}

          <motion.button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            whileHover={{
              scale: loading ? 1 : 1.01,
            }}
            whileTap={{
              scale: loading ? 1 : 0.985,
            }}
            className="group relative overflow-hidden w-full h-12 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed text-black font-black tracking-wide transition shadow-xl shadow-yellow-400/10"
          >
            {/* Animated button shine */}
            {!loading && (
              <motion.div
                className="absolute inset-y-0 -left-20 w-16 bg-white/30 skew-x-[-20deg]"
                animate={{
                  x: ["0%", "700%"],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  repeatDelay: 2,
                  ease: "easeInOut",
                }}
              />
            )}

            <span className="relative z-10">
              {loading
                ? "LOGGING IN..."
                : "LOGIN"}
            </span>
          </motion.button>

          {/* ==================================================
              DIVIDER
          ================================================== */}

          <div className="flex items-center gap-4 my-7">
            <div className="h-px bg-white/10 flex-1" />

            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-yellow-400/60" />

              <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-700">
                THRILL SEEKERS FC
              </span>

              <div className="h-1 w-1 rounded-full bg-yellow-400/60" />
            </div>

            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* ==================================================
              REGISTER
          ================================================== */}

          <motion.p
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 0.7,
            }}
            className="text-center text-sm text-zinc-500"
          >
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors"
            >
              Register
            </a>
          </motion.p>
        </motion.div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <motion.p
          initial={{
            opacity: 0,
          }}
          animate={{
            opacity: 1,
          }}
          transition={{
            delay: 0.9,
          }}
          className="text-center text-xs text-zinc-700 mt-6"
        >
          © 2026 Thrill Seekers FC. All rights reserved.
        </motion.p>
      </div>
    </main>
  );
}