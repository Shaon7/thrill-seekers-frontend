"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";

import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Lock,
  Gamepad2,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

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

export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();

  const playerId =
    typeof params?.playerId === "string" ? params.playerId : "";

  const [player, setPlayer] = useState<Player | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    deviceName: "",
    konamiId: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadPlayer = async () => {
      try {
        setLoading(true);
        setError("");

        const storedPlayer = localStorage.getItem("player");

        let localPlayer: Player | null = null;

        if (storedPlayer) {
          try {
            localPlayer = JSON.parse(storedPlayer);
          } catch (error) {
            console.error("Invalid stored player:", error);
          }
        }

        const finalPlayerId = playerId || localPlayer?.playerId || "";

        if (!finalPlayerId) {
          setError("Player ID could not be found.");
          setLoading(false);
          return;
        }

        if (localPlayer) {
          setPlayer(localPlayer);

          setFormData({
            name: localPlayer.name || "",
            password: "",
            deviceName: localPlayer.deviceName || "",
            konamiId: localPlayer.konamiId || "",
          });

          setLoading(false);
        }

        const token = localStorage.getItem("access_token");

        const response = await fetch(
          `https://thrill-seekers-backend-production.up.railway.app/player/${finalPlayerId}`,
          {
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {},
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load player profile.");
        }

        const latestPlayer: Player = await response.json();

        setPlayer(latestPlayer);

        setFormData({
          name: latestPlayer.name || "",
          password: "",
          deviceName: latestPlayer.deviceName || "",
          konamiId: latestPlayer.konamiId || "",
        });

        localStorage.setItem(
          "player",
          JSON.stringify(latestPlayer)
        );

        setLoading(false);
      } catch (error) {
        console.error("Edit profile loading error:", error);

        setError("Unable to load your profile.");
        setLoading(false);
      }
    };

    loadPlayer();
  }, [playerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!player) {
      setError("Player information is not available.");
      return;
    }

    if (!formData.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!formData.deviceName.trim()) {
      setError("Please enter your device name.");
      return;
    }

    if (!formData.konamiId.trim()) {
      setError("Please enter your KONAMI ID.");
      return;
    }

    if (
      formData.password.trim() &&
      formData.password.trim().length < 6
    ) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("access_token");

      const updateData: {
        name: string;
        deviceName: string;
        konamiId: string;
        password?: string;
      } = {
        name: formData.name.trim(),
        deviceName: formData.deviceName.trim(),
        konamiId: formData.konamiId.trim(),
      };

      /*
       * Only send password when the player
       * actually entered a new password.
       */
      if (formData.password.trim()) {
        updateData.password = formData.password.trim();
      }

      const response = await fetch(
        `https://thrill-seekers-backend-production.up.railway.app/player/${player.playerId}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",

            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        let message = "Failed to update profile.";

        try {
          const data = await response.json();

          if (Array.isArray(data?.message)) {
            message = data.message.join(", ");
          } else if (data?.message) {
            message = data.message;
          }
        } catch {
          // Keep default error message
        }

        throw new Error(message);
      }

      const updatedPlayer: Player = await response.json();

      setPlayer(updatedPlayer);

      setFormData({
        name: updatedPlayer.name || "",
        password: "",
        deviceName: updatedPlayer.deviceName || "",
        konamiId: updatedPlayer.konamiId || "",
      });

      localStorage.setItem(
        "player",
        JSON.stringify(updatedPlayer)
      );

      setSuccess("Profile updated successfully.");

      setTimeout(() => {
        router.push(`/player/profile/${updatedPlayer.playerId}`);
      }, 800);
    } catch (error) {
      console.error("Profile update error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <Navbar />

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2
              size={34}
              className="animate-spin text-yellow-400"
            />

            <p className="text-sm text-zinc-400">
              Loading profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen bg-[#080808] text-white">
        <Navbar />

        <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertCircle
              size={40}
              className="mx-auto mb-4 text-red-400"
            />

            <h2 className="text-xl font-bold">
              Profile Not Found
            </h2>

            <p className="mt-2 text-sm text-zinc-400">
              {error || "Unable to find this player."}
            </p>

            <button
              onClick={() => router.back()}
              className="mt-6 rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() =>
            router.push(`/player/profile/${player.playerId}`)
          }
          className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={17} />
          Back to Profile
        </button>

        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-yellow-400/10 via-zinc-900 to-zinc-950 p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-black shadow-lg shadow-yellow-400/10">
                <User size={30} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                  Account Settings
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Edit Profile
                </h1>

                <p className="mt-1 text-sm text-zinc-400">
                  Update your player information
                </p>
              </div>
            </div>

            <div className="w-fit rounded-xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                Player ID
              </p>

              <p className="mt-1 font-mono text-sm font-bold text-yellow-400">
                {player.playerId}
              </p>
            </div>
          </div>
        </section>

        {/* Messages */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-4">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-400"
            />

            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 px-4 py-4">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0 text-green-400"
            />

            <p className="text-sm text-green-300">
              {success}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Editable Information */}
            <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 sm:p-8 lg:col-span-2">
              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                  Editable Information
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Update your information
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Change your name, password, device or KONAMI ID.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-zinc-300"
                  >
                    Name
                  </label>

                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/50 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-zinc-300"
                  >
                    New Password
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave empty to keep current password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/50 focus:bg-white/[0.07]"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-zinc-600">
                    Leave this empty if you do not want to change your password.
                  </p>
                </div>

                {/* Device */}
                <div>
                  <label
                    htmlFor="deviceName"
                    className="mb-2 block text-sm font-medium text-zinc-300"
                  >
                    Device
                  </label>

                  <div className="relative">
                    <Smartphone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />

                    <input
                      id="deviceName"
                      name="deviceName"
                      type="text"
                      value={formData.deviceName}
                      onChange={handleChange}
                      placeholder="e.g. iPhone 15"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/50 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>

                {/* KONAMI ID */}
                <div>
                  <label
                    htmlFor="konamiId"
                    className="mb-2 block text-sm font-medium text-zinc-300"
                  >
                    KONAMI ID
                  </label>

                  <div className="relative">
                    <Gamepad2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                    />

                    <input
                      id="konamiId"
                      name="konamiId"
                      type="text"
                      value={formData.konamiId}
                      onChange={handleChange}
                      placeholder="Example: ASCV292298955"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/50 focus:bg-white/[0.07]"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Read-only Information */}
            <section className="rounded-3xl border border-white/10 bg-zinc-950/70 p-6 sm:p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400">
                  Protected Information
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  Account Details
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  These details cannot be changed.
                </p>
              </div>

              <div className="space-y-4">
                {/* Player ID */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                      <Shield size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">
                        Player ID
                      </p>

                      <p className="mt-1 truncate font-mono text-sm font-bold text-white">
                        {player.playerId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-zinc-400">
                      <Mail size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">
                        Gmail
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-white">
                        {player.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notice */}
                <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/5 p-4">
                  <p className="text-xs leading-5 text-zinc-400">
                    Your Player ID and Gmail are protected account
                    information and cannot be changed from this page.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(`/player/profile/${player.playerId}`)
              }
              disabled={saving}
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-7 py-3.5 text-sm font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}