"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { Panel, SectionHeader } from "@/components/ui";
import {
  api,
  clearSession,
  getStoredUser,
  restoreSession,
  type CharterOut,
  type MatchCandidate,
  type MemberOut,
  type MilestoneOut,
  type ProjectOut,
  type ScopeMilestone,
} from "@/lib/api";
import type { Tone } from "@/data/mock";

/* ------------------------------- helpers ------------------------------- */

function statusTone(status: string): Tone {
  if (status === "ACTIVE" || status === "APPROVED" || status === "RELEASED") return "success";
  if (status === "INVITED" || status === "DRAFT" || status === "FUNDED") return "info";
  if (status === "REJECTED" || status === "REVOKED") return "danger";
  return "neutral";
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  busy = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "danger" | "success";
  busy?: boolean;
}) {
  const styles = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-950/40 hover:brightness-110",
    success:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/40 hover:brightness-110",
    danger: "border border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20",
    ghost: "border border-white/12 bg-white/[0.04] text-zinc-300 hover:border-white/25 hover:text-white",
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {busy ? "Working…" : children}
    </button>
  );
}

function Stepper({ step, labels }: { step: number; labels: string[] }) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {labels.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                done
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40"
                  : active
                    ? "bg-indigo-500/25 text-indigo-200 ring-1 ring-indigo-400/50"
                    : "bg-white/5 text-zinc-500 ring-1 ring-white/10"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`text-xs font-semibold ${active ? "text-indigo-200" : done ? "text-zinc-300" : "text-zinc-500"}`}
            >
              {label}
            </span>
            {i < labels.length - 1 ? <span className="h-px w-6 bg-white/10" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function RecommendationCard({
  rec,
  onInvite,
  invited,
}: {
  rec: MatchCandidate;
  onInvite: () => void;
  invited: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{rec.name}</p>
          <p className="font-mono text-[11px] text-zinc-500">
            {rec.role} · user_id {rec.user_id}
          </p>
        </div>
        <span className="font-mono text-lg font-bold text-violet-300">{rec.score}%</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {rec.matched_skills.slice(0, 4).map((s) => (
          <span
            key={s}
            className="rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300"
          >
            ✓ {s}
          </span>
        ))}
      </div>
      <ul className="mt-2.5 space-y-1">
        {rec.reasons.slice(0, 5).map((r) => (
          <li key={r} className="text-[11px] text-zinc-400">
            {r}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onInvite}
        disabled={invited}
        className={`mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
          invited
            ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            : "bg-indigo-500/20 text-indigo-200 ring-1 ring-indigo-400/40 hover:bg-indigo-500/30"
        }`}
      >
        {invited ? "✓ Invited" : "Send invitation"}
      </button>
    </div>
  );
}

/* -------------------------------- page --------------------------------- */

const STEP_LABELS = ["Problem", "AI Scope", "AI Charter", "Approve", "AI Matching", "Invite"];

export default function SponsorPage() {
  const router = useRouter();
  // Parse the session once — stable identity for the whole mount.
  const [user] = useState(() => getStoredUser());

  const [projects, setProjects] = useState<ProjectOut[]>([]);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [members, setMembers] = useState<MemberOut[]>([]);
  const [charter, setCharter] = useState<CharterOut | null>(null);
  const [scope, setScope] = useState<ScopeMilestone[] | null>(null);
  const [scopeSource, setScopeSource] = useState<string>("");
  const [charterSource, setCharterSource] = useState<string>("");
  const [matchSkills, setMatchSkills] = useState<string[]>([]);
  const [expert, setExpert] = useState<MatchCandidate | null>(null);
  const [students, setStudents] = useState<MatchCandidate[]>([]);
  const [milestones, setMilestones] = useState<MilestoneOut[]>([]);
  const [rewards, setRewards] = useState<{ name: string; amount: number; status: string }[]>([]);
  const [teamState, setTeamState] = useState<string>("FORMING");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // new-problem form
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [brief, setBrief] = useState("");
  const [funding, setFunding] = useState("100000");

  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const list = await api.listProjects();
    setProjects(list);
    setProjectId((prev) => prev ?? (list[0]?.id ?? null));
    return list;
  }, []);

  const refreshProjectData = useCallback(async (pid: number) => {
    const [mem, ms, rw, proj] = await Promise.all([
      api.listMembers(pid),
      api.listMilestones(pid),
      api.getRewards(pid).catch(() => null),
      api.getProject(pid),
    ]);
    setMembers(mem);
    setMilestones(ms);
    setRewards(
      (rw?.rewards ?? []).map((r) => ({
        name: r.user_name ?? `user ${r.user_id}`,
        amount: r.amount,
        status: r.status,
      })),
    );
    setTeamState(proj.team_state);
    try {
      setCharter(await api.getCharter(pid));
    } catch {
      setCharter(null);
    }
  }, []);

  useEffect(() => {
    if (!getStoredUser()) {
      router.replace("/login");
      return;
    }
    (async () => {
      try {
        // GET /api/auth/me — validates the token before touching project data.
        if (!(await restoreSession())) {
          router.replace("/login");
          return;
        }
        const list = await load();
        if (list[0]) await refreshProjectData(list[0].id);
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setReady(true);
      }
    })();
  }, [load, refreshProjectData, router]);

  const selectProject = async (pid: number) => {
    setProjectId(pid);
    setScope(null);
    setExpert(null);
    setStudents([]);
    setError(null);
    setNotice(null);
    await refreshProjectData(pid).catch((e) => setError(errMsg(e)));
  };

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusyKey(key);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyKey(null);
    }
  };

  const step = useMemo(() => {
    if (!projectId) return 0;
    if (expert) return 5;
    if (charter?.status === "APPROVED") return 3;
    if (charter) return 3; // draft visible, approve next
    if (scope) return 2;
    if (scope === null && charter === null) return 1;
    return 1;
  }, [projectId, scope, charter, expert]);

  if (!ready) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-xl border border-white/8 bg-white/[0.03]" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* header */}
        <header className="rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="chip border-indigo-400/30 bg-indigo-400/10 text-indigo-300">
                Sponsor Console
              </span>
              {teamState === "TEAM_FORMED" ? (
                <StatusBadge label="Team Formed" tone="success" />
              ) : (
                <StatusBadge label="Team Forming" tone="info" />
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white">
              Problem → Charter → Matching → Team
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Signed in as {user?.name} · every AI action is logged with you as the human owner.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
            className="rounded-xl border border-white/12 px-4 py-2 text-xs font-semibold text-zinc-400 transition-colors hover:border-white/25 hover:text-white"
          >
            Sign out
          </button>
        </header>

        {/* status strip */}
        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            {notice}
          </p>
        ) : null}

        <Panel className="px-5 py-4">
          <Stepper step={step} labels={STEP_LABELS} />
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* ---- 1. create problem ---- */}
          <Panel className="p-6">
            <SectionHeader
              title="1 · Post a Problem"
              subtitle="Sponsor-authored problem statement — this seeds the project"
            />
            <div className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Problem title (e.g. Low-cost DR detection on edge devices)"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-400/60"
              />
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Public summary (visible to everyone)"
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-indigo-400/60"
              />
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                placeholder="Confidential brief (gated by membership + approved charter)"
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-amber-400/60"
              />
              <div className="flex items-center gap-3">
                <input
                  value={funding}
                  onChange={(e) => setFunding(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  className="w-40 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 font-mono text-sm text-zinc-200 outline-none focus:border-indigo-400/60"
                  aria-label="Funding amount"
                />
                <span className="text-xs text-zinc-500">funding (Rs, escrow-backed)</span>
              </div>
              <ActionButton
                busy={busyKey === "create"}
                disabled={!title.trim()}
                onClick={() =>
                  run("create", async () => {
                    const p = await api.createProject({
                      title: title.trim(),
                      public_summary: summary.trim(),
                      confidential_brief: brief.trim(),
                      funding: Number(funding || "0"),
                      confidentiality: "INTERNAL",
                    });
                    setTitle("");
                    setSummary("");
                    setBrief("");
                    const list = await load();
                    setProjects(list);
                    await selectProject(p.id);
                    // Set AFTER selectProject — project switches clear the banner.
                    setNotice(`Project #${p.id} created — ledger entry PROJECT_CREATED recorded.`);
                  })
                }
              >
                Create problem project
              </ActionButton>
            </div>

            {projects.length > 0 ? (
              <div className="mt-5 border-t border-white/8 pt-4">
                <p className="mb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                  Active project
                </p>
                <div className="space-y-1.5">
                  {projects.slice(0, 6).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => void selectProject(p.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                        p.id === projectId
                          ? "border-indigo-400/50 bg-indigo-500/10 text-indigo-100"
                          : "border-white/8 bg-white/[0.02] text-zinc-400 hover:border-white/20"
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-mono text-[10px] text-zinc-500">#{p.id}</span>{" "}
                        {p.title}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                        {p.team_state === "TEAM_FORMED" ? "TEAM ✓" : "—"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </Panel>

          {/* ---- 2/3. AI scope + charter ---- */}
          <Panel className="relative overflow-hidden p-6">
            <div
              className="pointer-events-none absolute -top-24 -right-12 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl"
              aria-hidden="true"
            />
            <SectionHeader
              title="2 · AI Scope & Charter"
              subtitle="Deterministic fallback works without an LLM key"
              action={
                charter ? (
                  <StatusBadge label={`Charter ${charter.status} v${charter.version}`} tone={statusTone(charter.status)} />
                ) : (
                  <StatusBadge label="No charter" tone="neutral" />
                )
              }
            />

            <div className="relative flex flex-wrap gap-2">
              <ActionButton
                busy={busyKey === "scope"}
                disabled={!projectId}
                variant="ghost"
                onClick={() =>
                  run("scope", async () => {
                    if (!projectId) return;
                    const res = await api.aiScope(projectId, title.trim() || "Low-cost detection of diabetic retinopathy from fundus images on edge devices");
                    setScope(res.milestones);
                    setScopeSource(res.source);
                    setNotice(`AI scope generated (${res.source}) — AI_SCOPE_GENERATION logged.`);
                  })
                }
              >
                ✦ Generate Scope
              </ActionButton>
              <ActionButton
                busy={busyKey === "charter"}
                disabled={!projectId}
                onClick={() =>
                  run("charter", async () => {
                    if (!projectId) return;
                    const res = await api.aiCharter(projectId, title.trim());
                    setCharter(res.charter);
                    setCharterSource(res.source);
                    setMatchSkills(res.required_skills);
                    setNotice(`Charter v${res.charter.version} drafted as DRAFT (${res.source}) — AI_CHARTER_GENERATION logged.`);
                  })
                }
              >
                ✦ Generate Charter
              </ActionButton>
              <ActionButton
                busy={busyKey === "approve"}
                disabled={!charter || charter.status === "APPROVED"}
                variant="success"
                onClick={() =>
                  run("approve", async () => {
                    if (!projectId) return;
                    const approved = await api.approveCharter(projectId);
                    setCharter(approved);
                    setNotice("Charter APPROVED by you — approval is human-only, AI cannot approve.");
                  })
                }
              >
                {charter?.status === "APPROVED" ? "✓ Charter approved" : "Approve charter"}
              </ActionButton>
            </div>

            {scope ? (
              <div className="relative mt-4 space-y-2">
                <p className="text-[11px] font-semibold tracking-wider text-violet-300 uppercase">
                  ✦ AI Generated Scope{" "}
                  <span className="font-mono text-zinc-500">({scopeSource})</span>
                </p>
                {scope.map((m, i) => (
                  <div key={m.title} className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-400/15 font-mono text-[10px] font-bold text-violet-300">
                        M{i + 1}
                      </span>
                      <span className="text-sm font-semibold text-white">{m.title}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.required_skills.map((s) => (
                        <span key={s} className="chip">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {charter ? (
              <div className="relative mt-4 rounded-xl border border-white/8 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">
                    Charter v{charter.version}{" "}
                    <span className="font-mono text-[11px] text-zinc-500">
                      {charterSource ? `(${charterSource})` : ""}
                    </span>
                  </p>
                  {charter.status === "APPROVED" ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                      ✓ Enforceable
                    </span>
                  ) : (
                    <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                      Awaiting sponsor approval
                    </span>
                  )}
                </div>
                <dl className="mt-3 space-y-2 text-xs">
                  {[
                    ["Scope", charter.scope],
                    ["Access rules", charter.access_rules],
                    ["AI rules", charter.ai_rules],
                    ["Reward rules", charter.reward_rules],
                    ["Dispute rules", charter.dispute_rules],
                  ].map(([label, body]) => (
                    <div key={label} className="rounded-lg border border-white/6 bg-white/[0.025] p-2.5">
                      <dt className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                        {label}
                      </dt>
                      <dd className="mt-0.5 line-clamp-3 text-zinc-300">{body}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </Panel>
        </div>

        {/* ---- 4/5. matching + invitations ---- */}
        <Panel className="p-6">
          <SectionHeader
            title="3 · AI Matching & Invitations"
            subtitle="Hard filters: EXPERT/STUDENT role · VERIFIED identity · zero conflicts. Recommendations never auto-invite."
            action={
              <ActionButton
                busy={busyKey === "match"}
                disabled={!projectId || charter?.status !== "APPROVED"}
                onClick={() =>
                  run("match", async () => {
                    if (!projectId) return;
                    const res = await api.aiMatch(projectId);
                    setMatchSkills(res.required_skills);
                    setExpert(res.recommended_expert);
                    setStudents(res.recommended_students);
                    await refreshProjectData(projectId);
                    setNotice("AI_TEAM_MATCHING logged — invite candidates to proceed.");
                  })
                }
              >
                ✦ Generate matching
              </ActionButton>
            }
          />

          {charter?.status !== "APPROVED" ? (
            <p className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
              Candidate matching and invitations require an APPROVED charter.
            </p>
          ) : null}

          {matchSkills.length > 0 ? (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-zinc-500">Required skills:</span>
              {matchSkills.map((s) => (
                <span key={s} className="chip border-violet-400/30 bg-violet-400/10 text-violet-200">
                  {s}
                </span>
              ))}
            </div>
          ) : null}

          {expert || students.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-4">
              {expert ? (
                <div>
                  <p className="mb-2 text-[11px] font-semibold tracking-wider text-sky-300 uppercase">
                    Recommended expert
                  </p>
                  <RecommendationCard
                    rec={expert}
                    invited={members.some((m) => m.user_id === expert.user_id)}
                    onInvite={() =>
                      run(`invite-${expert.user_id}`, async () => {
                        if (!projectId) return;
                        await api.invite(projectId, expert.user_id);
                        await refreshProjectData(projectId);
                        setNotice(`Invitation sent to ${expert.name} — they must review and accept the charter.`);
                      })
                    }
                  />
                </div>
              ) : null}
              <div className={expert ? "lg:col-span-3" : "lg:col-span-4"}>
                <p className="mb-2 text-[11px] font-semibold tracking-wider text-emerald-300 uppercase">
                  Recommended students
                </p>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {students.map((s) => (
                    <RecommendationCard
                      key={s.user_id}
                      rec={s}
                      invited={members.some((m) => m.user_id === s.user_id)}
                      onInvite={() =>
                        run(`invite-${s.user_id}`, async () => {
                          if (!projectId) return;
                          await api.invite(projectId, s.user_id);
                          await refreshProjectData(projectId);
                          setNotice(`Invitation sent to ${s.name}.`);
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* candidate status */}
          {members.length > 0 ? (
            <div className="mt-6 border-t border-white/8 pt-4">
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                Candidate status · {teamState === "TEAM_FORMED" ? "TEAM_FORMED" : "FORMING"}
              </p>
              <div className="space-y-1.5">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/6 bg-white/[0.025] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <span className="text-sm text-zinc-200">{m.user_name}</span>{" "}
                      <span className="font-mono text-[11px] text-zinc-500">
                        {m.role} · {m.user_email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.charter_version ? (
                        <span className="font-mono text-[10px] text-zinc-500">
                          charter v{m.charter_version}
                        </span>
                      ) : null}
                      <StatusBadge label={m.status} tone={statusTone(m.status)} dot={false} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>

        {/* ---- 6. milestones, escrow, rewards ---- */}
        <Panel className="p-6">
          <SectionHeader
            title="4 · Milestones · Escrow · Rewards"
            subtitle="Flow: Submit → Expert review APPROVED → fund escrow → release payouts"
            action={
              <span className="chip">
                AI share <span className="font-mono text-emerald-300">Rs 0</span>
              </span>
            }
          />

          {milestones.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No milestones yet — generate scope, then add milestones for this project.
            </p>
          ) : (
            <div className="space-y-2">
              {milestones.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{m.title}</p>
                    <p className="font-mono text-xs text-zinc-500">
                      Rs {m.reward.toLocaleString("en-IN")} ·{" "}
                      <span className="text-zinc-400">{m.status}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={m.status} tone={statusTone(m.status)} dot={false} />
                    <ActionButton
                      variant="ghost"
                      busy={busyKey === `fund-${m.id}`}
                      disabled={m.status === "RELEASED"}
                      onClick={() =>
                        run(`fund-${m.id}`, async () => {
                          if (!projectId) return;
                          await api.fundEscrow(projectId, m.id);
                          await refreshProjectData(projectId);
                          setNotice(`Escrow funded for “${m.title}” — PAYOUT_CREATED recorded.`);
                        })
                      }
                    >
                      Fund
                    </ActionButton>
                    <ActionButton
                      variant="success"
                      busy={busyKey === `release-${m.id}`}
                      disabled={m.status === "RELEASED"}
                      onClick={() =>
                        run(`release-${m.id}`, async () => {
                          if (!projectId) return;
                          await api.releaseEscrow(projectId, m.id);
                          await refreshProjectData(projectId);
                          setNotice(`Escrow released for “${m.title}” — ESCROW_RELEASED recorded.`);
                        })
                      }
                    >
                      Release
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rewards.length > 0 ? (
            <div className="mt-5 border-t border-white/8 pt-4">
              <p className="mb-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                Reward breakdown
              </p>
              <div className="space-y-1.5">
                {rewards.map((r, i) => (
                  <div
                    key={`${r.name}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-white/6 bg-white/[0.025] px-3.5 py-2 text-sm"
                  >
                    <span className="text-zinc-300">{r.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono text-emerald-300">
                        Rs {r.amount.toLocaleString("en-IN")}
                      </span>
                      <StatusBadge label={r.status} tone={statusTone(r.status)} dot={false} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    </AppShell>
  );
}
