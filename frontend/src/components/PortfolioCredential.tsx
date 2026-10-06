"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { Panel, SectionHeader } from "@/components/ui";
import { api, getStoredUser, type ProjectOut } from "@/lib/api";

interface ContributionRow {
  id?: number;
  actor_type?: string;
  action?: string;
  description?: string;
  artifact_id?: string | null;
  verified?: boolean;
  human_owner_id?: number | null;
  created_at?: string;
}

/**
 * P1 — non-monetary recognition record (visual, no W3C verifiable-credential
 * implementation): verified contributions rolled up into a credential,
 * portfolio evidence, recognition and co-authorship eligibility.
 */
export default function PortfolioCredential({ project }: { project: ProjectOut }) {
  const me = getStoredUser();
  const [rows, setRows] = useState<ContributionRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listContributions(project.id)
      .then((data) => setRows(data as unknown as ContributionRow[]))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load contributions"));
  }, [project.id]);

  const mine = rows.filter((r) => r.verified !== false);
  const artifacts = mine.map((r) => r.artifact_id).filter(Boolean) as string[];
  const credentialId = `GCU-CRED-${project.code ?? project.id}-${me?.id ?? 0}`;
  const isActive = project.team_state === "TEAM_FORMED" || project.can_view_confidential_brief;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="relative overflow-hidden p-6">
        <div
          className="pointer-events-none absolute -top-24 -right-12 h-52 w-52 rounded-full bg-emerald-600/15 blur-3xl"
          aria-hidden="true"
        />
        <SectionHeader
          title="Credential"
          subtitle="Non-monetary recognition for verified contributions"
          action={<StatusBadge label="Verified" tone="success" />}
        />
        <div className="relative rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
          <p className="text-[10px] font-semibold tracking-widest text-emerald-300 uppercase">
            GCU Verified Contribution Credential
          </p>
          <p className="mt-1.5 font-mono text-sm break-all text-white">{credentialId}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-zinc-500">Holder</p>
              <p className="text-zinc-200">{me?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Project</p>
              <p className="truncate text-zinc-200">{project.code ?? `#${project.id}`}</p>
            </div>
            <div>
              <p className="text-zinc-500">Verified contributions</p>
              <p className="font-mono text-emerald-300">{mine.length}</p>
            </div>
            <div>
              <p className="text-zinc-500">Recognition</p>
              <p className="text-zinc-200">Portfolio + transcript</p>
            </div>
          </div>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-2">
          <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
            Verified Contribution ✓
          </span>
          <span className="chip">Portfolio Evidence</span>
          <span className="chip">Recognition</span>
          <span
            className={`chip ${isActive ? "border-sky-400/30 bg-sky-400/10 text-sky-300" : ""}`}
          >
            Co-authorship: {isActive ? "Eligible" : "Pending team"}
          </span>
        </div>
      </Panel>

      <Panel className="p-6">
        <SectionHeader
          title="Portfolio Evidence"
          subtitle="Artifact-backed contributions on this project"
          action={<span className="chip">{rows.length} total</span>}
        />
        {error ? <p className="text-xs text-red-300">{error}</p> : null}
        {rows.length === 0 && !error ? (
          <p className="text-sm text-zinc-500">No contributions recorded yet.</p>
        ) : null}
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={`${r.id ?? i}`}
              className="flex items-start justify-between gap-3 rounded-lg border border-white/6 bg-white/[0.025] px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-200">
                  {String(r.action ?? "contribution")}
                  {r.description ? (
                    <span className="text-zinc-500"> — {String(r.description).slice(0, 64)}</span>
                  ) : null}
                </p>
                <p className="font-mono text-[11px] text-zinc-500">
                  {String(r.actor_type ?? "HUMAN")}
                  {r.artifact_id ? ` · ${String(r.artifact_id)}` : ""}
                </p>
              </div>
              <StatusBadge
                label={r.verified === false ? "Pending" : "Verified"}
                tone={r.verified === false ? "warning" : "success"}
                dot={false}
              />
            </li>
          ))}
        </ul>
        {artifacts.length > 0 ? (
          <p className="mt-3 text-[11px] text-zinc-500">
            Evidence hashes are mirrored in the tamper-evident ledger (ARTIFACT_SUBMITTED).
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
