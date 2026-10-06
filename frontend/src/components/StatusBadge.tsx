import type { Tone } from "@/data/mock";

const toneStyles: Record<Tone, string> = {
  success:
    "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  warning:
    "bg-amber-400/10 text-amber-300 border-amber-400/25",
  danger:
    "bg-red-400/10 text-red-300 border-red-400/25",
  info:
    "bg-sky-400/10 text-sky-300 border-sky-400/25",
  accent:
    "bg-indigo-400/10 text-indigo-300 border-indigo-400/25",
  neutral:
    "bg-zinc-400/10 text-zinc-300 border-zinc-400/25",
};

const dotStyles: Record<Tone, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-sky-400",
  accent: "bg-indigo-400",
  neutral: "bg-zinc-400",
};

export default function StatusBadge({
  label,
  tone = "neutral",
  dot = true,
  className = "",
}: {
  label: string;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${toneStyles[tone]} ${className}`}
    >
      {dot ? <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[tone]}`} /> : null}
      {label}
    </span>
  );
}
