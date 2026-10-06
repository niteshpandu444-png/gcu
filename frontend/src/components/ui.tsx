/** Small shared UI primitives used across the GCU interface. */

import type { ReactNode } from "react";
import type { Tone } from "@/data/mock";

export function Panel({
  children,
  className = "",
  strong = false,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={`panel ${strong ? "panel-strong" : ""} ${hover ? "panel-hover" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  value,
  tone = "accent",
  className = "",
}: {
  value: number;
  tone?: "accent" | "success" | "warning";
  className?: string;
}) {
  const bar =
    tone === "success"
      ? "from-emerald-400 to-teal-300"
      : tone === "warning"
        ? "from-amber-400 to-orange-400"
        : "from-indigo-500 to-cyan-400";
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-white/8 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full bg-gradient-to-r ${bar} transition-[width] duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Avatar({
  initials,
  from,
  to,
  size = "md",
}: {
  initials: string;
  from: string;
  to: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-1 ring-white/15`}
      style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

export function StatDelta({ text, tone }: { text: string; tone: Tone }) {
  const cls =
    tone === "success"
      ? "text-emerald-300"
      : tone === "warning"
        ? "text-amber-300"
        : tone === "danger"
          ? "text-red-300"
          : tone === "info"
            ? "text-sky-300"
            : tone === "neutral"
              ? "text-zinc-400"
              : "text-indigo-300";
  return <span className={`text-xs font-medium ${cls}`}>{text}</span>;
}
