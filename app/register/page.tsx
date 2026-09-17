"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    deviceName: "",
    name: "",
    email: "",
    userId: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const [success, setSuccess] = useState(false);
  const [registeredPlayerId, setRegisteredPlayerId] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setSuccess(false);

    if (errors.submit) {
      setErrors((prev) => ({
        ...prev,
        submit: "",
      }));
    }
  };

  const handleKonamiIdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 13);

    setFormData((prev) => ({
      ...prev,
      userId: value,
    }));

    if (errors.userId) {
      setErrors((prev) => ({
        ...prev,
        userId: "",
      }));
    }

    setSuccess(false);

    if (errors.submit) {
      setErrors((prev) => ({
        ...prev,
        submit: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name
    if (!formData.name.trim()) {
      newErrors.name = "Your name is required.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Your name must be at least 2 characters.";
    } else if (
      !/^[a-zA-ZÀ-ÿ\s.'-]+$/.test(formData.name.trim())
    ) {
      newErrors.name = "Please enter a valid name.";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Device Name
    if (!formData.deviceName.trim()) {
      newErrors.deviceName = "Device name is required.";
    } else if (formData.deviceName.trim().length < 2) {
      newErrors.deviceName =
        "Device name must be at least 2 characters.";
    } else if (formData.deviceName.trim().length > 50) {
      newErrors.deviceName =
        "Device name must be less than 50 characters.";
    }

    // KONAMI User ID
    if (!formData.userId.trim()) {
      newErrors.userId = "KONAMI User ID is required.";
    } else if (
      !/^[A-Z]{4}\d{9}$/.test(formData.userId.trim())
    ) {
      newErrors.userId =
        "Enter a valid 13-character KONAMI User ID.";
    }

    // Password
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password =
        "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter.";
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one lowercase letter.";
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one number.";
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword =
        "Passwords do not match.";
    }

    // Terms
    if (!formData.terms) {
      newErrors.terms =
        "You must agree to the Terms & Conditions.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setSuccess(false);
    setRegisteredPlayerId("");

    setErrors((prev) => ({
      ...prev,
      submit: "",
    }));

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(
        "https://thrill-seekers-backend-production.up.railway.app/player",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            konamiId: formData.userId.trim(),
            deviceName: formData.deviceName.trim(),
          }),
        }
      );

      // Safely try to read the backend response.
      let data: any = {};

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        try {
          data = await response.json();
        } catch {
          data = {};
        }
      } else {
        try {
          const text = await response.text();

          if (text) {
            data = {
              message: text,
            };
          }
        } catch {
          data = {};
        }
      }

      // Backend rejected the registration
      if (!response.ok) {
        let message =
          "Registration failed. Please try again.";

        if (Array.isArray(data.message)) {
          message = data.message.join(", ");
        } else if (typeof data.message === "string") {
          message = data.message;
        } else if (typeof data.error === "string") {
          message = data.error;
        }

        throw new Error(message);
      }

      // Backend registration successful
      const playerId =
        data.playerId ||
        data.player?.playerId ||
        data.data?.playerId ||
        "";

      setRegisteredPlayerId(playerId);
      setSuccess(true);

      // Clear form after successful registration
      setFormData({
        deviceName: "",
        name: "",
        email: "",
        userId: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      // Make sure password fields are hidden again
      setShowPassword(false);
      setShowConfirmPassword(false);

      // Scroll to success message
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      let message =
        "Unable to complete registration.";

      if (error instanceof TypeError) {
        message =
          "Unable to connect to the server. Make sure the backend is running.";
      } else if (error instanceof Error) {
        message = error.message;
      }

      setErrors((prev) => ({
        ...prev,
        submit: message,
      }));

      setSuccess(false);
      setRegisteredPlayerId("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              THRILL{" "}
              <span className="text-cyan-400">
                SEEKERS
              </span>
            </h1>
          </Link>

          <p className="text-gray-400 mt-2 text-sm">
            Create your club account
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-[#0d1422] border border-white/10 rounded-2xl p-5 sm:p-7 shadow-2xl">
          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              Register
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Join the Thrill Seekers community
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4">
              <p className="text-green-400 text-sm font-semibold">
                Registration successful!
              </p>

              {registeredPlayerId && (
                <p className="text-green-400/90 text-sm mt-1">
                  Your Player ID:{" "}
                  <span className="font-bold text-white">
                    {registeredPlayerId}
                  </span>
                </p>
              )}

              <p className="text-green-400/70 text-xs mt-1">
                Your account has been created successfully & Sent Mail with user ID. 
              </p>
                
              <Link
                href="/login"
                className="inline-block mt-3 text-sm font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Go to Login →
              </Link>
            </div>
          )}

          {/* Registration Error */}
          {errors.submit && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4">
              <p className="text-red-400 text-sm font-semibold">
                Registration failed
              </p>

              <p className="text-red-400/90 text-sm mt-1">
                {errors.submit}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* Your Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Your Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
                className={`w-full rounded-xl bg-[#080d18] border px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition ${
                  errors.name
                    ? "border-red-500 focus:border-red-500"
                    : "border-white/10 focus:border-cyan-400"
                }`}
              />

              {errors.name && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                className={`w-full rounded-xl bg-[#080d18] border px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition ${
                  errors.email
                    ? "border-red-500 focus:border-red-500"
                    : "border-white/10 focus:border-cyan-400"
                }`}
              />

              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Device Name */}
            <div>
              <label
                htmlFor="deviceName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Device Name
              </label>

              <input
                id="deviceName"
                name="deviceName"
                type="text"
                value={formData.deviceName}
                onChange={handleChange}
                placeholder="e.g. iPhone 14"
                autoComplete="off"
                className={`w-full rounded-xl bg-[#080d18] border px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition ${
                  errors.deviceName
                    ? "border-red-500 focus:border-red-500"
                    : "border-white/10 focus:border-cyan-400"
                }`}
              />

              {errors.deviceName && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.deviceName}
                </p>
              )}
            </div>

            {/* KONAMI User ID */}
            <div>
              <label
                htmlFor="userId"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                KONAMI User ID
              </label>

              <input
                id="userId"
                name="userId"
                type="text"
                value={formData.userId}
                onChange={handleKonamiIdChange}
                placeholder="e.g. ASCV292298955"
                inputMode="text"
                autoComplete="off"
                maxLength={13}
                spellCheck={false}
                className={`w-full rounded-xl bg-[#080d18] border px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition uppercase ${
                  errors.userId
                    ? "border-red-500 focus:border-red-500"
                    : "border-white/10 focus:border-cyan-400"
                }`}
              />

              <p className="mt-2 text-xs text-gray-500">
                Example:{" "}
                <span className="text-gray-400">
                  (ASCV292298955)
                </span>
              </p>

              <p className="mt-1 text-xs text-gray-600">
                Format: 4 letters + 9 numbers
              </p>

              {errors.userId && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.userId}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className={`w-full rounded-xl bg-[#080d18] border px-4 py-3 pr-16 text-sm text-white placeholder-gray-600 outline-none transition ${
                    errors.password
                      ? "border-red-500 focus:border-red-500"
                      : "border-white/10 focus:border-cyan-400"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Minimum 8 characters, including uppercase,
                lowercase, and a number.
              </p>

              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirm Password
              </label>

              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  className={`w-full rounded-xl bg-[#080d18] border px-4 py-3 pr-16 text-sm text-white placeholder-gray-600 outline-none transition ${
                    errors.confirmPassword
                      ? "border-red-500 focus:border-red-500"
                      : "border-white/10 focus:border-cyan-400"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-cyan-400 cursor-pointer"
                />

                <span className="text-xs sm:text-sm text-gray-400 leading-5">
                  I agree to the{" "}
                  <span className="text-cyan-400">
                    Terms & Conditions
                  </span>{" "}
                  and club rules.
                </span>
              </label>

              {errors.terms && (
                <p className="mt-1.5 text-xs text-red-400">
                  {errors.terms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:bg-cyan-400/50 disabled:cursor-not-allowed text-[#061018] font-bold py-3.5 transition duration-200 shadow-lg shadow-cyan-400/10"
            >
              {isLoading
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-6">
          Thrill Seekers • eFootball Club
        </p>
      </div>
    </main>
  );
}
