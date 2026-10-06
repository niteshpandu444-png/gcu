import type { Milestone } from "@/data/mock";
import { Panel, ProgressBar } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { IconCheck } from "@/components/icons";

export default function MilestoneCard({ milestone }: { milestone: Milestone }) {
  return (
    <Panel hover className="flex flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-indigo-400/30 bg-indigo-400/10 font-mono text-xs font-bold text-indigo-300">
            {milestone.index}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">{milestone.title}</h3>
            <p className="mt-0.5 text-xs text-zinc-500">{milestone.detail}</p>
          </div>
        </div>
        <StatusBadge label={milestone.status} tone={milestone.statusTone} />
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
          <span>Progress</span>
          <span className="font-mono text-zinc-200">{milestone.progress}%</span>
        </div>
        <ProgressBar
          value={milestone.progress}
          tone={milestone.progress >= 70 ? "success" : "accent"}
        />
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/8 pt-4">
        <div>
          <p className="text-[10px] tracking-wider text-zinc-500 uppercase">Reward</p>
          <p className="mt-0.5 font-mono text-lg font-bold text-white">{milestone.reward}</p>
        </div>
        <div className="max-w-[55%] text-right">
          <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
            Acceptance criteria
          </p>
          <p className="mt-0.5 flex items-end justify-end gap-1.5 text-xs text-zinc-300">
            <IconCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
            {milestone.criteria}
          </p>
        </div>
      </div>
    </Panel>
  );
}
