import { rewards } from "@/data/mock";
import { Panel, ProgressBar, SectionHeader } from "@/components/ui";
import { IconCheck } from "@/components/icons";

const cardTone: Record<string, string> = {
  success: "border-emerald-400/25 from-emerald-400/8",
  info: "border-sky-400/25 from-sky-400/8",
  accent: "border-indigo-400/25 from-indigo-400/8",
  neutral: "border-white/8 from-white/[0.02]",
};

export default function RewardBreakdown() {
  return (
    <div className="space-y-5">
      {/* total card */}
      <Panel className="relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute -top-20 -left-10 h-56 w-56 rounded-full bg-emerald-500/12 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
              Milestone Reward
            </p>
            <p className="mt-1 text-sm text-zinc-400">{rewards.milestone}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-4xl font-bold text-white">{rewards.total}</p>
            <p className="mt-1 flex items-center justify-end gap-1.5 text-xs text-emerald-300">
              <IconCheck className="h-3 w-3" /> Escrow funded · split predefined by charter
            </p>
          </div>
        </div>
      </Panel>

      {/* split cards */}
      <Panel className="p-6">
        <SectionHeader
          title="Reward Split"
          subtitle="Percentages defined by charter rules, paid on milestone release"
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rewards.rows.map((row) => {
            const tone = cardTone[row.tone] ?? cardTone.neutral;
            const isAi = row.name === "AI";
            return (
              <div
                key={row.name}
                className={`rounded-xl border bg-gradient-to-b to-transparent p-5 ${tone} ${
                  isAi ? "opacity-70" : ""
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-white">{row.name}</p>
                  <span className="font-mono text-lg font-bold text-white">{row.amount}</span>
                </div>
                <p className="mt-1 font-mono text-xs text-zinc-500">{row.percent}% share</p>
                <ProgressBar
                  value={row.shareOf}
                  tone={row.tone === "success" ? "success" : "accent"}
                  className="mt-3"
                />
                {isAi ? (
                  <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
                    AI contributions are logged and attributed, never paid.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-indigo-400/20 bg-indigo-400/6 px-4 py-3">
          <span className="mt-0.5 text-indigo-300">ℹ</span>
          <p className="text-[13px] leading-relaxed text-indigo-100/90">{rewards.note}</p>
        </div>
      </Panel>
    </div>
  );
}
