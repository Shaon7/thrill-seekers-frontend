import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
}

export default function StatCard({
  icon,
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-zinc-900/70 p-4 transition duration-300 hover:-translate-y-1 hover:border-yellow-400/40 hover:bg-zinc-900 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
          {icon}
        </div>

        <div className="h-2 w-2 rounded-full bg-yellow-400/50 transition group-hover:bg-yellow-400" />
      </div>

      <p className="mt-5 text-2xl font-bold sm:text-3xl">{value}</p>

      <p className="mt-1 text-sm font-semibold text-zinc-300">
        {label}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {description}
      </p>
    </div>
  );
}
