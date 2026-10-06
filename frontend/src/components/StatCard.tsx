import type { Stat } from "@/data/mock";
import { Panel, StatDelta } from "@/components/ui";

const accentByLabel: Record<string, string> = {
  "Active Projects": "from-indigo-500/20 to-indigo-500/0 text-indigo-300",
  "Team Members": "from-sky-500/20 to-sky-500/0 text-sky-300",
  "AI Actions": "from-violet-500/20 to-violet-500/0 text-violet-300",
  "Verified Contributions": "from-emerald-500/20 to-emerald-500/0 text-emerald-300",
};

export default function StatCard({ stat }: { stat: Stat }) {
  const accent = accentByLabel[stat.label] ?? "from-indigo-500/20 to-indigo-500/0 text-indigo-300";
  return (
    <Panel hover className="relative overflow-hidden p-5">
      <div
        className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl ${accent}`}
        aria-hidden="true"
      />
      <p className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
        {stat.label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="font-mono text-3xl font-bold text-white">{stat.value}</span>
        <StatDelta text={stat.delta} tone={stat.deltaTone} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{stat.hint}</p>
    </Panel>
  );
}
