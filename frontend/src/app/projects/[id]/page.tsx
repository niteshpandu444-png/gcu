import { Suspense } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import ProjectTabs from "@/components/ProjectTabs";
import StatusBadge from "@/components/StatusBadge";
import { project } from "@/data/mock";
import { IconChevron } from "@/components/icons";

export default function ProjectDetailsPage() {
  // Static demo: every route renders the mock demo project.
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <IconChevron className="h-3 w-3 rotate-180" />
          Dashboard
        </Link>

        {/* header */}
        <header className="rise relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -top-24 -right-12 h-64 w-64 rounded-full bg-indigo-600/18 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] tracking-wider text-zinc-500">
                  {project.id}
                </span>
                <StatusBadge label={project.status} tone={project.statusTone} />
                <StatusBadge label={project.confidentiality} tone="warning" dot={false} />
              </div>
              <h1 className="mt-3 max-w-3xl text-xl leading-snug font-bold text-white sm:text-2xl">
                {project.title}
              </h1>
              <p className="mt-3 text-sm text-zinc-400">
                Sponsor:{" "}
                <span className="font-medium text-zinc-200">{project.sponsor}</span>
                <span className="text-zinc-500"> · {project.sponsorOrg}</span>
              </p>
            </div>

            <div className="flex shrink-0 gap-6 border-t border-white/8 pt-4 lg:border-t-0 lg:pt-0">
              <div>
                <p className="text-[10px] tracking-wider text-zinc-500 uppercase">Funding</p>
                <p className="mt-1 font-mono text-2xl font-bold text-white">
                  {project.funding}
                </p>
              </div>
              <div>
                <p className="text-[10px] tracking-wider text-zinc-500 uppercase">Created</p>
                <p className="mt-1 font-mono text-sm text-zinc-300">{project.createdAt}</p>
              </div>
            </div>
          </div>
        </header>

        {/* tabs */}
        <Suspense
          fallback={
            <div className="h-64 animate-pulse rounded-xl border border-white/8 bg-white/[0.03]" />
          }
        >
          <ProjectTabs />
        </Suspense>
      </div>
    </AppShell>
  );
}
