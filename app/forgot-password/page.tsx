"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

type Step = "EMAIL" | "VERIFY" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("EMAIL");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ==================================================
  // SEND VERIFICATION CODE
  // ==================================================

  const handleSendCode = async () => {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://thrill-seekers-backend-production.up.railway.app/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to send verification code."
        );
      }

      setMessage(
        data.message ||
          "Verification code has been sent."
      );

      setStep("VERIFY");
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

  // ==================================================
  // VERIFY CODE
  // ==================================================

  const handleVerifyCode = async () => {
    setError("");
    setMessage("");

    if (!code.trim()) {
      setError(
        "Please enter the verification code."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://thrill-seekers-backend-production.up.railway.app/auth/verify-reset-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            code: code.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Invalid verification code."
        );
      }

      setMessage(
        data.message ||
          "Verification code is valid."
      );

      setStep("RESET");
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

  // ==================================================
  // RESET PASSWORD
  // ==================================================

  const handleResetPassword = async () => {
    setError("");
    setMessage("");

    if (!newPassword) {
      setError(
        "Please enter your new password."
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Please confirm your new password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "https://thrill-seekers-backend-production.up.railway.app/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            code: code.trim(),
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset password."
        );
      }

      setStep("SUCCESS");

      setMessage(
        data.message ||
          "Password reset successfully."
      );
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

  // ==================================================
  // CURRENT STEP LABEL
  // ==================================================

  const getStepLabel = () => {
    switch (step) {
      case "EMAIL":
        return "Reset your password";

      case "VERIFY":
        return "Verify your identity";

      case "RESET":
        return "Create a new password";

      case "SUCCESS":
        return "Password updated";

      default:
        return "Forgot password";
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060606] text-white flex items-center justify-center px-4 py-10">

      {/* ==================================================
          ANIMATED BACKGROUND
      ================================================== */}

      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Yellow top glow */}
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
          CONTENT
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
            {/* Animated glow */}
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

            <div className="relative w-full h-full rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center shadow-2xl shadow-yellow-400/10 overflow-hidden">

              {/* Logo shine */}
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

          {/* Club Name */}
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
            }}
            className="text-zinc-500 mt-2 text-sm"
          >
            eFootball Club Portal
          </motion.p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-px w-10 bg-white/10" />

            <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">
              {getStepLabel()}
            </span>

            <div className="h-px w-10 bg-white/10" />
          </div>
        </motion.div>

        {/* ==================================================
            MAIN CARD
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

          {/* Top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 bg-yellow-400/10 blur-3xl pointer-events-none" />

          {/* Top border */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

          {/* ==================================================
              HEADING
          ================================================== */}

          <motion.div
            key={step}
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
            }}
            className="relative mb-7"
          >
            <h2 className="text-2xl font-bold">
              {step === "EMAIL" &&
                "Forgot your password?"}

              {step === "VERIFY" &&
                "Check your email"}

              {step === "RESET" &&
                "Set a new password"}

              {step === "SUCCESS" &&
                "You're all set!"}
            </h2>

            <p className="text-zinc-500 text-sm mt-2">
              {step === "EMAIL" &&
                "Enter your registered email to receive a verification code."}

              {step === "VERIFY" &&
                `Enter the 6-digit verification code sent to ${email}.`}

              {step === "RESET" &&
                "Create a new password for your account."}

              {step === "SUCCESS" &&
                "Your password has been successfully changed."}
            </p>
          </motion.div>

          {/* ==================================================
              ERROR
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
              SUCCESS / INFO
          ================================================== */}

          {message && step !== "SUCCESS" && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mb-5 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3"
            >
              <p className="text-sm text-green-400">
                {message}
              </p>
            </motion.div>
          )}

          {/* ==================================================
              STEP 1 — EMAIL
          ================================================== */}

          {step === "EMAIL" && (
            <motion.div
              key="email"
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.4,
              }}
            >
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter your registered email"
                autoComplete="email"
                className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-yellow-400/60 focus:ring-4 focus:ring-yellow-400/5 hover:border-white/20"
              />

              <motion.button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                whileHover={{
                  scale: loading ? 1 : 1.01,
                }}
                whileTap={{
                  scale: loading ? 1 : 0.985,
                }}
                className="group relative overflow-hidden w-full h-12 mt-6 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed text-black font-black tracking-wide transition shadow-xl shadow-yellow-400/10"
              >
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
                    ? "SENDING CODE..."
                    : "SEND CODE"}
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* ==================================================
              STEP 2 — VERIFY CODE
          ================================================== */}

          {step === "VERIFY" && (
            <motion.div
              key="verify"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.4,
              }}
            >
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Verification Code
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                  setCode(value);
                  setError("");
                }}
                placeholder="Enter 6-digit code"
                autoComplete="one-time-code"
                className="w-full h-12 px-4 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 outline-none text-center tracking-[0.45em] font-bold text-lg transition-all duration-200 focus:border-yellow-400/60 focus:ring-4 focus:ring-yellow-400/5 hover:border-white/20"
              />

              <motion.button
                type="button"
                onClick={handleVerifyCode}
                disabled={loading}
                whileHover={{
                  scale: loading ? 1 : 1.01,
                }}
                whileTap={{
                  scale: loading ? 1 : 0.985,
                }}
                className="group relative overflow-hidden w-full h-12 mt-6 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed text-black font-black tracking-wide transition shadow-xl shadow-yellow-400/10"
              >
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
                    ? "VERIFYING..."
                    : "VERIFY CODE"}
                </span>
              </motion.button>

              <button
                type="button"
                onClick={() => {
                  setStep("EMAIL");
                  setCode("");
                  setError("");
                  setMessage("");
                }}
                className="w-full mt-4 text-sm text-zinc-500 hover:text-yellow-400 transition-colors"
              >
                Change email
              </button>
            </motion.div>
          )}

          {/* ==================================================
              STEP 3 — RESET PASSWORD
          ================================================== */}

          {step === "RESET" && (
            <motion.div
              key="reset"
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.4,
              }}
            >
              {/* New Password */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  New Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    className="w-full h-12 px-4 pr-16 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-yellow-400/60 focus:ring-4 focus:ring-yellow-400/5 hover:border-white/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(
                        e.target.value
                      );
                      setError("");
                    }}
                    placeholder="Enter your password again"
                    autoComplete="new-password"
                    className="w-full h-12 px-4 pr-16 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-yellow-400/60 focus:ring-4 focus:ring-yellow-400/5 hover:border-white/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-yellow-400 hover:text-yellow-300 transition"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                whileHover={{
                  scale: loading ? 1 : 1.01,
                }}
                whileTap={{
                  scale: loading ? 1 : 0.985,
                }}
                className="group relative overflow-hidden w-full h-12 mt-6 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-400/50 disabled:cursor-not-allowed text-black font-black tracking-wide transition shadow-xl shadow-yellow-400/10"
              >
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
                    ? "RESETTING PASSWORD..."
                    : "RESET PASSWORD"}
                </span>
              </motion.button>
            </motion.div>
          )}

          {/* ==================================================
              SUCCESS
          ================================================== */}

          {step === "SUCCESS" && (
            <motion.div
              key="success"
              initial={{
                opacity: 0,
                scale: 0.95,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                duration: 0.5,
              }}
              className="text-center"
            >
              <motion.div
                initial={{
                  scale: 0,
                }}
                animate={{
                  scale: 1,
                }}
                transition={{
                  delay: 0.15,
                  duration: 0.45,
                  type: "spring",
                  stiffness: 180,
                }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-green-400/20 bg-green-400/10"
              >
                <span className="text-2xl text-green-400">
                  ✓
                </span>
              </motion.div>

              <p className="text-green-400 font-semibold">
                Password reset successfully.
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                You can now login with your new password.
              </p>

              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-12 mt-6 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black tracking-wide transition shadow-xl shadow-yellow-400/10"
              >
                GO TO LOGIN
              </Link>
            </motion.div>
          )}

          {/* ==================================================
              FOOTER LINK
          ================================================== */}

          {step !== "SUCCESS" && (
            <div className="flex items-center gap-4 mt-7 pt-7 border-t border-white/10">
              <div className="h-px bg-white/10 flex-1" />

              <Link
                href="/login"
                className="text-sm text-zinc-500 hover:text-yellow-400 transition-colors"
              >
                Back to Login
              </Link>

              <div className="h-px bg-white/10 flex-1" />
            </div>
          )}
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