import Link from "next/link";
import type { ProjectSummary } from "@/data/mock";
import { Panel, ProgressBar } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { IconChevron, IconLayers, IconWorkspace } from "@/components/icons";

export default function ProjectCard({ project }: { project: ProjectSummary }) {
  const featured = project.id === "GCU-DEMO-001";
  return (
    <Panel hover className={`relative overflow-hidden p-6 ${featured ? "panel-strong" : ""}`}>
      {featured ? (
        <div
          className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-indigo-600/25 blur-3xl"
          aria-hidden="true"
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] tracking-wider text-zinc-500">
              {project.id}
            </span>
            <StatusBadge label={project.status} tone={project.statusTone} />
          </div>
          <h3 className="mt-2 text-base leading-snug font-semibold text-white">
            {project.title}
          </h3>
        </div>
        <Link
          href="/projects/1"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-indigo-400/40 hover:text-white"
        >
          Open
          <IconChevron className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="relative mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
          <span>Progress</span>
          <span className="font-mono text-zinc-300">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} />
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-white/8 pt-4">
        <div>
          <p className="text-[10px] tracking-wider text-zinc-500 uppercase">Funding</p>
          <p className="mt-1 font-mono text-sm font-semibold text-white">{project.funding}</p>
        </div>
        <div>
          <p className="text-[10px] tracking-wider text-zinc-500 uppercase">Team</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
            <IconLayers className="h-3.5 w-3.5 text-zinc-500" />
            {project.members} members
          </p>
        </div>
        <div>
          <p className="text-[10px] tracking-wider text-zinc-500 uppercase">Milestones</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white">
            <IconWorkspace className="h-3.5 w-3.5 text-zinc-500" />
            {project.milestones}
          </p>
        </div>
      </div>
    </Panel>
  );
}
