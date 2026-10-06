"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { milestones, project, team, workspaceFiles, agentSessions } from "@/data/mock";
import { Panel, ProgressBar, SectionHeader } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import MemberCard from "@/components/MemberCard";
import MilestoneCard from "@/components/MilestoneCard";
import CharterPanel from "@/components/CharterPanel";
import AIChat, { AIScopingCard } from "@/components/AIChat";
import ContributionTimeline from "@/components/ContributionTimeline";
import IntegrityPanel from "@/components/IntegrityPanel";
import RewardBreakdown from "@/components/RewardBreakdown";
import LedgerTable from "@/components/LedgerTable";
import { IconFile, IconSpark } from "@/components/icons";

type TabId =
  | "overview"
  | "team"
  | "charter"
  | "milestones"
  | "workspace"
  | "ai"
  | "contributions"
  | "integrity"
  | "rewards"
  | "ledger";

const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "team", label: "Team" },
  { id: "charter", label: "Charter" },
  { id: "milestones", label: "Milestones" },
  { id: "workspace", label: "Workspace" },
  { id: "ai", label: "AI Research" },
  { id: "contributions", label: "Contributions" },
  { id: "integrity", label: "Integrity" },
  { id: "rewards", label: "Rewards" },
  { id: "ledger", label: "Ledger" },
];

/* ------------------------- tab panels ------------------------- */

function OverviewPanel() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Panel className="p-5 md:col-span-2">
        <SectionHeader title="Research Objective" />
        <p className="text-sm leading-relaxed text-zinc-300">{project.objective}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="chip">Fundus imaging</span>
          <span className="chip">Edge AI</span>
          <span className="chip">Quantisation</span>
          <span className="chip">Screening</span>
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader title="Confidentiality" />
        <StatusBadge label={project.confidentiality} tone="warning" />
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Sponsor methodology notes are HIGH sensitivity and restricted to
          approved members.
        </p>
      </Panel>

      <Panel className="p-5">
        <SectionHeader title="Funding" />
        <p className="font-mono text-3xl font-bold text-white">{project.funding}</p>
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Escrow funded for Milestone 1
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Release requires an approved expert review.
        </p>
      </Panel>

      <Panel className="p-5">
        <SectionHeader title="Milestone Progress" />
        <p className="text-sm text-zinc-400">
          <span className="font-mono text-lg font-bold text-white">1</span> of{" "}
          <span className="font-mono text-lg font-bold text-white">2</span> milestones funded
        </p>
        <ProgressBar value={50} className="mt-3" />
        <div className="mt-4 space-y-2">
          {milestones.map((m) => (
            <div key={m.index} className="flex items-center justify-between text-xs">
              <span className="truncate text-zinc-400">
                {m.index} · {m.title}
              </span>
              <StatusBadge label={m.status} tone={m.statusTone} dot={false} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader title="Project Health" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/12 text-emerald-300">
            ✓
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{project.health.label}</p>
            <p className="text-xs text-zinc-500">{project.health.detail}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 border-t border-white/8 pt-3 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Charter</span>
            <span className="text-emerald-300">Accepted v1.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Reviews open</span>
            <span className="text-zinc-300">2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Ledger</span>
            <span className="text-emerald-300">Verified</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function WorkspacePanel() {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Panel className="p-6 lg:col-span-3">
        <SectionHeader
          title="Project Files"
          subtitle="Shared artifacts visible to project members"
          action={<span className="chip">{workspaceFiles.length} files</span>}
        />
        <ul className="space-y-2">
          {workspaceFiles.map((f) => (
            <li
              key={f.name}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/[0.025] px-4 py-3 transition-colors hover:border-indigo-400/30"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-400/10 text-indigo-300">
                  <IconFile className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-zinc-200">{f.name}</p>
                  <p className="text-[11px] text-zinc-500">
                    {f.kind} · {f.updated}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-zinc-500">{f.size}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="p-6 lg:col-span-2">
        <SectionHeader
          title="Agent Sessions"
          subtitle="Recent project-scoped agent activity"
        />
        <ul className="space-y-3">
          {agentSessions.map((s, i) => (
            <li
              key={`${s.agent}-${i}`}
              className="rounded-lg border border-white/6 bg-white/[0.025] p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-[11px] text-violet-300">
                  <IconSpark className="h-3.5 w-3.5" />
                  {s.agent}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">{s.time}</span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-300">{s.action}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Owner: {s.owner}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ------------------------- tabs shell ------------------------- */

export default function ProjectTabs() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("tab");
  const valid = tabs.some((t) => t.id === initial);
  const [active, setActive] = useState<TabId>(
    valid && initial ? (initial as TabId) : "overview",
  );

  return (
    <div>
      {/* tab bar */}
      <div
        className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-white/8 bg-white/[0.03] p-1.5"
        role="tablist"
        aria-label="Project sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
              active === tab.id
                ? "bg-indigo-500/20 text-indigo-200 shadow-sm ring-1 ring-indigo-400/30"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* panels */}
      <div role="tabpanel" className="rise" key={active}>
        {active === "overview" ? <OverviewPanel /> : null}
        {active === "team" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {team.map((m) => (
              <MemberCard key={m.handle} member={m} />
            ))}
          </div>
        ) : null}
        {active === "charter" ? <CharterPanel /> : null}
        {active === "milestones" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                Escrow holds <span className="font-mono text-white">₹50,000</span> for
                Milestone 1 · release requires an approved review
              </p>
              <div className="flex gap-2">
                <span className="chip border-sky-400/30 bg-sky-400/10 text-sky-300">
                  Fund escrow
                </span>
                <span className="chip">Release (locked)</span>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {milestones.map((m) => (
                <MilestoneCard key={m.index} milestone={m} />
              ))}
            </div>
          </div>
        ) : null}
        {active === "workspace" ? <WorkspacePanel /> : null}
        {active === "ai" ? (
          <div className="grid gap-5 xl:grid-cols-5">
            <div className="min-w-0 xl:col-span-3">
              <AIChat />
            </div>
            <div className="min-w-0 xl:col-span-2">
              <AIScopingCard />
            </div>
          </div>
        ) : null}
        {active === "contributions" ? <ContributionTimeline /> : null}
        {active === "integrity" ? <IntegrityPanel /> : null}
        {active === "rewards" ? <RewardBreakdown /> : null}
        {active === "ledger" ? <LedgerTable /> : null}
      </div>
    </div>
  );
}
