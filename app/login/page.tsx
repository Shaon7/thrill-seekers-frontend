"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <main className="min-h-screen bg-[#05070d] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo / Club Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 mb-5">
            <span className="text-2xl font-black text-white">
              TS
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-widest text-white">
            THRILL SEEKERS
          </h1>

          <p className="text-gray-500 mt-2 text-sm">
            eFootball Club Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0c1019] border border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl">

          {/* Heading */}
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white">
              Welcome back, Champion
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              Login to access your club account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Email / User ID */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email / User ID
            </label>

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
              className="w-full h-12 px-4 rounded-xl bg-[#080b12] border border-white/10 text-white placeholder:text-gray-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
                className="w-full h-12 px-4 pr-16 rounded-xl bg-[#080b12] border border-white/10 text-white placeholder:text-gray-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition"
              >
                {showPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-end mb-6">
            <a
              href="/forgot-password"
              className="text-sm text-blue-400 hover:text-blue-300 transition"
            >
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold tracking-wide transition shadow-lg shadow-blue-600/20"
          >
            {loading
              ? "LOGGING IN..."
              : "LOGIN"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="h-px bg-white/10 flex-1" />


            <div className="h-px bg-white/10 flex-1" />
          </div>


          {/* Register */}
          <p className="text-center text-sm text-gray-500 mt-7">
            Don't have an account?{" "}
            <a
              href="/register"
              className="text-blue-400 hover:text-blue-300 font-semibold transition"
            >
              Register
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700 mt-6">
          © 2026 Thrill Seekers FC. All rights reserved.
        </p>

      </div>
    </main>
  );
}
