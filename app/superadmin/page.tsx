"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  Users,
  ShieldCheck,
  Trophy,
  GitBranch,
  Swords,
  Table2,
  BarChart3,
  Settings,
  UserPlus,
  ArrowRight,
  LogOut,
  Shield,
  DollarSign,
} from "lucide-react";

interface SuperAdmin {
  name?: string;
  email?: string;
  role?: string;
}

export default function Home() {
  const [admin, setAdmin] = useState<SuperAdmin | null>(null);

  useEffect(() => {
    // Get logged-in user information
    const storedUser =
      localStorage.getItem("user") ||
      localStorage.getItem("admin") ||
      localStorage.getItem("superadmin");

    if (storedUser) {
      try {
        setAdmin(JSON.parse(storedUser));
      } catch {
        setAdmin(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("superadmin");
    localStorage.removeItem("player");

    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">

        {/* ================================================ */}
        {/* SUPERADMIN HERO */}
        {/* ================================================ */}

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 sm:p-10">

          {/* Background decoration */}
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-yellow-400/10 blur-3xl" />

          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-yellow-500/5 blur-3xl" />

          <div className="relative">

            {/* Admin label */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10">
                <Shield
                  size={17}
                  className="text-yellow-400"
                />
              </div>

              <span className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
                SUPERADMIN PANEL
              </span>
            </div>

            {/* Welcome */}
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Welcome back,{" "}
              <span className="text-yellow-400">
                {admin?.name || "SuperAdmin"}
              </span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              Manage players, administrators, competitions, divisions,
              matches and the complete Thrill Seekers platform from one place.
            </p>

            {/* Admin information */}
            <div className="mt-6 flex flex-wrap items-center gap-3">

              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2">
                <ShieldCheck
                  size={16}
                  className="text-yellow-400"
                />

                <span className="text-sm font-semibold text-yellow-400">
                  Super Administrator
                </span>
              </div>

              {admin?.email && (
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400">
                  {admin.email}
                </div>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut size={15} />
                Logout
              </button>

            </div>
          </div>
        </section>


        {/* ================================================ */}
        {/* OVERVIEW */}
        {/* ================================================ */}

        <section className="mb-10">

          <div className="mb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
              ADMIN OVERVIEW
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Platform management
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Quickly access every important part of the system.
            </p>
          </div>


          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

            <OverviewCard
              icon={<Users size={21} />}
              label="Players"
              value="Manage"
              href="/players"
            />

            <OverviewCard
              icon={<ShieldCheck size={21} />}
              label="Admins"
              value="Manage"
              href="/admins"
            />

            <OverviewCard
              icon={<DollarSign size={21} />}
              label="Payment"
              value="Manage"
              href="/payment-management"
            />

            <OverviewCard
              icon={<Swords size={21} />}
              label="Matches"
              value="Manage"
              href="/matches"
            />

          </div>
        </section>


        {/* ================================================ */}
        {/* MANAGEMENT */}
        {/* ================================================ */}

        <section className="mb-10">

          <div className="mb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
              MANAGEMENT
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Manage your platform
            </h2>
          </div>


          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            <ManagementCard
              icon={<Users size={24} />}
              title="Players"
              description="View, search and manage all registered players."
              href="/players"
            />

            <ManagementCard
              icon={<UserPlus size={24} />}
              title="Administrators"
              description="Create and manage administrators and their access."
              href="/admins"
            />

            <ManagementCard
              icon={<Trophy size={24} />}
              title="Competitions"
              description="Create and manage competitions and tournaments."
              href="/competitions"
            />

            <ManagementCard
              icon={<GitBranch size={24} />}
              title="Divisions"
              description="Manage competition divisions and player groups."
              href="/divisions"
            />

            <ManagementCard
              icon={<Swords size={24} />}
              title="Matches"
              description="View and manage scheduled and completed matches."
              href="/matches"
            />

            <ManagementCard
              icon={<Table2 size={24} />}
              title="Point Tables"
              description="View and manage competition standings."
              href="/point-table"
            />

            <ManagementCard
              icon={<BarChart3 size={24} />}
              title="Reports & Statistics"
              description="View platform statistics and competition reports."
              href="/reports"
            />

            <ManagementCard
              icon={<Settings size={24} />}
              title="System Settings"
              description="Configure platform settings and administration."
              href="/settings"
            />

            <ManagementCard
              icon={<ShieldCheck size={24} />}
              title="Admin Permissions"
              description="Control administrator roles and permissions."
              href="/admin-permissions"
            />

          </div>
        </section>


        {/* ================================================ */}
        {/* QUICK ACTIONS */}
        {/* ================================================ */}

        <section>

          <div className="mb-5">
            <p className="text-xs font-semibold tracking-[0.2em] text-yellow-400">
              QUICK ACTIONS
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Frequently used actions
            </h2>
          </div>


          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <QuickAction
              title="Add Player"
              description="Register a new player"
              href="/players/create"
            />

            <QuickAction
              title="Add Admin"
              description="Create a new administrator"
              href="/admins/create"
            />

            <QuickAction
              title="Create Competition"
              description="Start a new tournament"
              href="/competitions/create"
            />

          </div>

        </section>

      </div>
    </main>
  );
}


/* ================================================== */
/* OVERVIEW CARD */
/* ================================================== */

function OverviewCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/10 bg-zinc-900/60 p-5 transition hover:-translate-y-1 hover:border-yellow-400/30 hover:bg-zinc-900"
    >
      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400 transition group-hover:bg-yellow-400 group-hover:text-black">
          {icon}
        </div>

        <ArrowRight
          size={18}
          className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-yellow-400"
        />

      </div>

      <p className="mt-5 text-sm font-medium text-zinc-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-white">
        {value}
      </p>

    </Link>
  );
}


/* ================================================== */
/* MANAGEMENT CARD */
/* ================================================== */

function ManagementCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-yellow-400/30 hover:bg-zinc-900"
    >

      {/* Hover glow */}
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-yellow-400/0 blur-2xl transition group-hover:bg-yellow-400/10" />

      <div className="relative">

        <div className="flex items-start justify-between">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-yellow-400/10 bg-yellow-400/10 text-yellow-400 transition group-hover:bg-yellow-400 group-hover:text-black">
            {icon}
          </div>

          <ArrowRight
            size={18}
            className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-yellow-400"
          />

        </div>

        <h3 className="mt-5 text-lg font-bold">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          {description}
        </p>

      </div>

    </Link>
  );
}


/* ================================================== */
/* QUICK ACTION */
/* ================================================== */

function QuickAction({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:border-yellow-400/20 hover:bg-yellow-400/5"
    >

      <div>
        <p className="font-semibold text-white">
          {title}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          {description}
        </p>
      </div>

      <ArrowRight
        size={18}
        className="text-zinc-600 transition group-hover:translate-x-1 group-hover:text-yellow-400"
      />

    </Link>
  );
}


