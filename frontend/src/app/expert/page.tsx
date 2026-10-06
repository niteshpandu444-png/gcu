"use client";

import { useEffect, useState } from "react";
import CandidateWorkspace, { type WorkspaceCtx } from "@/components/CandidateWorkspace";
import StatusBadge from "@/components/StatusBadge";
import { Panel, SectionHeader } from "@/components/ui";
import { api, type MilestoneOut, type RewardRow } from "@/lib/api";
import type { Tone } from "@/data/mock";

function tone(status: string): Tone {
  if (status === "APPROVED" || status === "RELEASED" || status === "ACTIVE") return "success";
  if (status === "FUNDED" || status === "SUBMITTED" || status === "UNDER_REVIEW") return "info";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

function ReviewConsole({ ctx }: { ctx: WorkspaceCtx }) {
  // Selector for candidates on several teams: defaults to the newest active
  // project; no effect needed — an unknown selection falls back to active[0].
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const target =
    ctx.active.find((a) => a.project.id === selectedId) ?? ctx.active[0];
  const [milestones, setMilestones] = useState<MilestoneOut[]>([]);
  const [rewards, setRewards] = useState<RewardRow[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    api.listMilestones(target.project.id).then(setMilestones).catch(() => setMilestones([]));
    api
      .getRewards(target.project.id)
      .then((r) => setRewards(r.rewards))
      .catch(() => setRewards([]));
  }, [target]);

  if (!target) {
    return (
      <Panel className="px-5 py-6 text-sm text-zinc-500">
        Join a team (accept an invitation) to review its milestones.
      </Panel>
    );
  }

  const pid = target.project.id;

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusyKey(key);
    setError(null);
    setNotice(null);
    try {
      await fn();
      const [ms, rw] = await Promise.all([
        api.listMilestones(pid),
        api.getRewards(pid).catch(() => null),
      ]);
      setMilestones(ms);
      setRewards(rw?.rewards ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <Panel className="p-6">
      <SectionHeader
        title="Review Console"
        subtitle="Flow: milestone submitted → expert review → APPROVED → escrow release"
        action={<span className="chip font-mono text-[11px]">{target.project.code ?? `#${target.project.id}`}</span>}
      />

      {ctx.active.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {ctx.active.map((a) => (
            <button
              key={a.project.id}
              type="button"
              onClick={() => setSelectedId(a.project.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                target.project.id === a.project.id
                  ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
                  : "border-white/8 bg-white/[0.03] text-zinc-400 hover:border-white/25"
              }`}
            >
              #{a.project.id} · {a.project.title.slice(0, 32)}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
          {notice}
        </p>
      ) : null}

      <div className="space-y-2">
        {milestones.length === 0 ? (
          <p className="text-sm text-zinc-500">No milestones on this project yet.</p>
        ) : null}
        {milestones.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{m.title}</p>
              <p className="font-mono text-xs text-zinc-500">
                Rs {m.reward.toLocaleString("en-IN")} · {m.status}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label={m.status} tone={tone(m.status)} dot={false} />
              <button
                type="button"
                disabled={busyKey === `ap-${m.id}`}
                onClick={() =>
                  void act(`ap-${m.id}`, async () => {
                    await api.createReview(pid, {
                      milestone_id: m.id,
                      decision: "APPROVED",
                      comment: "Reviewed against charter acceptance criteria.",
                    });
                    setNotice(`Review APPROVED for “${m.title}” — REVIEW_APPROVED recorded.`);
                  })
                }
                className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/40 transition-colors hover:bg-emerald-500/30 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyKey === `rj-${m.id}`}
                onClick={() =>
                  void act(`rj-${m.id}`, async () => {
                    await api.createReview(pid, {
                      milestone_id: m.id,
                      decision: "REJECTED",
                      comment: "Needs revision before acceptance.",
                    });
                    setNotice(`Review REJECTED for “${m.title}”.`);
                  })
                }
                className="rounded-lg border border-red-400/40 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-400/20 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {rewards.length > 0 ? (
        <div className="mt-5 border-t border-white/8 pt-4">
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            Reward split (charter-defined · AI = Rs 0)
          </p>
          <div className="space-y-1.5">
            {rewards.map((r, i) => (
              <div
                key={`${r.user_id}-${i}`}
                className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.025] px-3.5 py-2 text-sm"
              >
                <span className="text-zinc-300">{r.user_name ?? `user ${r.user_id}`}</span>
                <span className="flex items-center gap-3">
                  <span className="font-mono text-emerald-300">
                    Rs {r.amount.toLocaleString("en-IN")}
                  </span>
                  <StatusBadge label={r.status} tone={tone(r.status)} dot={false} />
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Panel>
  );
}

export default function ExpertPage() {
  return (
    <CandidateWorkspace roleLabel="Expert">
      {(ctx) => <ReviewConsole ctx={ctx} />}
    </CandidateWorkspace>
  );
}
