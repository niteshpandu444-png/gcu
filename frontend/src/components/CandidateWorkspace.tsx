"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import { Panel } from "@/components/ui";
import {
  api,
  clearSession,
  getStoredUser,
  restoreSession,
  type CharterOut,
  type MemberOut,
  type ProjectOut,
} from "@/lib/api";
import type { Tone } from "@/data/mock";

export type ProjectCtx = {
  project: ProjectOut;
  membership: MemberOut | null;
  charter: CharterOut | null;
};

export type WorkspaceCtx = {
  all: ProjectCtx[];
  invited: ProjectCtx[];
  active: ProjectCtx[];
  refresh: () => Promise<void>;
};

function tone(status: string): Tone {
  if (status === "ACTIVE" || status === "APPROVED") return "success";
  if (status === "INVITED" || status === "DRAFT") return "info";
  if (status === "REJECTED" || status === "REVOKED") return "danger";
  return "neutral";
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "Something went wrong";
}

const CHARTER_SECTIONS: [string, keyof CharterOut][] = [
  ["Scope", "scope"],
  ["Access rules", "access_rules"],
  ["IP ownership", "ip_rules"],
  ["AI rules", "ai_rules"],
  ["Reward rules", "reward_rules"],
  ["Dispute rules", "dispute_rules"],
  ["Confidentiality", "confidentiality_rules"],
  ["Commercialisation", "commercialisation_rules"],
];

/**
 * Candidate-side lifecycle UI (expert / student):
 * invitations → read charter → ACCEPT / REJECT → confidential brief
 * LOCKED → ACCESS GRANTED. Role-specific extras render below via children.
 */
export default function CandidateWorkspace({
  roleLabel,
  children,
}: {
  roleLabel: string;
  children?: (ctx: WorkspaceCtx) => ReactNode;
}) {
  const router = useRouter();
  // Parse the session ONCE — a fresh object every render would retrigger the
  // load effect on each render (infinite refresh loop).
  const [me] = useState(() => getStoredUser());
  const [items, setItems] = useState<ProjectCtx[]>([]);
  const [ready, setReady] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!me) return;
    const projects = await api.listProjects();
    const withMembership: ProjectCtx[] = [];
    for (const p of projects) {
      try {
        const members = await api.listMembers(p.id);
        const membership = members.find((m) => m.user_id === me.id) ?? null;
        if (!membership) continue;
        const detail = await api.getProject(p.id);
        let charter: CharterOut | null = null;
        try {
          charter = await api.getCharter(p.id);
        } catch {
          charter = null;
        }
        withMembership.push({ project: detail, membership, charter });
      } catch {
        /* skip projects the candidate cannot read */
      }
    }
    setItems(withMembership);
  }, [me]);

  useEffect(() => {
    if (!me) {
      router.replace("/login");
      return;
    }
    // Defer the fetch pass so the effect body stays side-effect free.
    const t = setTimeout(() => {
      restoreSession()
        .then((u) => {
          // GET /api/auth/me — stale tokens bounce back to /login.
          if (!u) {
            router.replace("/login");
            return;
          }
          return refresh();
        })
        .catch((e) => setError(errMsg(e)))
        .finally(() => setReady(true));
    }, 0);
    return () => clearTimeout(t);
  }, [me, refresh, router]);

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

  const invited = items.filter((i) => i.membership?.status === "INVITED");
  const active = items.filter((i) => i.membership?.status === "ACTIVE");
  const declined = items.filter(
    (i) => i.membership && (i.membership.status === "REJECTED" || i.membership.status === "LEFT"),
  );

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
              <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                {roleLabel} Workspace
              </span>
              <StatusBadge
                label={active.length > 0 ? "On a team" : "Candidate"}
                tone={active.length > 0 ? "success" : "info"}
              />
            </div>
            <h1 className="mt-2 text-2xl font-bold text-white">
              {me?.name}{" "}
              <span className="font-mono text-base text-zinc-500">· {me?.email}</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Review invitations and the charter before you join — acceptance records the exact
              charter version you signed.
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

        {/* --------- invitations --------- */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              Project Invitations
            </h2>
            <span className="chip">{invited.length} pending</span>
          </div>

          {invited.length === 0 ? (
            <Panel className="px-5 py-6 text-sm text-zinc-500">
              No pending invitations. When a sponsor invites you, it appears here with the project
              charter for review.
            </Panel>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {invited.map(({ project, charter, membership }) => (
                <Panel key={project.id} className="relative overflow-hidden p-5">
                  <div
                    className="pointer-events-none absolute -top-20 -right-10 h-44 w-44 rounded-full bg-indigo-600/15 blur-3xl"
                    aria-hidden="true"
                  />
                  <div className="relative">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-zinc-500">
                        {project.code ?? `#${project.id}`}
                      </span>
                      <StatusBadge label={project.confidentiality} tone="warning" dot={false} />
                      <StatusBadge label={membership?.status ?? "INVITED"} tone="info" dot={false} />
                    </div>
                    <h3 className="mt-2 text-base leading-snug font-semibold text-white">
                      {project.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-zinc-400">{project.public_summary}</p>
                    <p className="mt-2 font-mono text-sm text-emerald-300">
                      Funding Rs {project.funding.toLocaleString("en-IN")}
                    </p>

                    {/* charter preview — must be read before accepting */}
                    <div className="mt-4 rounded-xl border border-white/8 bg-black/25 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold tracking-wider text-violet-300 uppercase">
                          {charter ? `Charter v${charter.version}` : "Charter"}
                        </p>
                        {charter ? (
                          <StatusBadge label={charter.status} tone={tone(charter.status)} dot={false} />
                        ) : null}
                      </div>
                      {charter ? (
                        <dl className="mt-2.5 space-y-1.5">
                          {CHARTER_SECTIONS.filter(([, key]) =>
                            String(charter[key] ?? "").trim().length > 0,
                          ).map(([label, key]) => (
                            <div key={label} className="text-xs">
                              <dt className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">
                                {label}
                              </dt>
                              <dd className="line-clamp-2 text-zinc-300">
                                {String(charter[key])}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="mt-2 text-xs text-zinc-500">Charter unavailable.</p>
                      )}
                    </div>

                    {/* confidential brief preview: LOCKED until accepted */}
                    <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                      <span aria-hidden="true">🔒</span> Confidential Brief — LOCKED. Accept the
                      charter to unlock.
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        disabled={busyKey === `accept-${project.id}` || charter?.status !== "APPROVED"}
                        onClick={() =>
                          run(`accept-${project.id}`, async () => {
                            if (!me) return;
                            await api.acceptInvite(project.id, me.id);
                            await refresh();
                            setNotice(
                              `Accepted invitation to project #${project.id} — membership is now ACTIVE and the brief is unlocked.`,
                            );
                          })
                        }
                        className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ✓ ACCEPT
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === `reject-${project.id}`}
                        onClick={() =>
                          run(`reject-${project.id}`, async () => {
                            if (!me) return;
                            await api.rejectInvite(project.id, me.id);
                            await refresh();
                            setNotice(
                              `Invitation to project #${project.id} declined — no confidential access was granted.`,
                            );
                          })
                        }
                        className="flex-1 rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-400/20 disabled:opacity-50"
                      >
                        ✕ REJECT
                      </button>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          )}

          {declined.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {declined.map((d) => (
                <span key={d.project.id} className="chip border-red-400/25 bg-red-400/10 text-red-300">
                  Declined: {d.project.title.slice(0, 48)}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {/* --------- my workspace / brief access --------- */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              My Workspace
            </h2>
            <span className="chip">{active.length} active</span>
          </div>

          {active.length === 0 ? (
            <Panel className="px-5 py-6 text-sm text-zinc-500">
              You are not on an active team yet — accept an invitation to unlock the private
              workspace.
            </Panel>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {active.map(({ project, membership, charter }) => {
                const unlocked =
                  project.can_view_confidential_brief && Boolean(project.confidential_brief);
                return (
                  <Panel key={project.id} className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-zinc-500">
                        {project.code ?? `#${project.id}`}
                      </span>
                      <StatusBadge label="ACTIVE" tone="success" dot={false} />
                      {charter ? (
                        <span className="chip font-mono text-[10px]">
                          signed charter v{membership?.charter_version ?? charter.version}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-2 text-base leading-snug font-semibold text-white">
                      {project.title}
                    </h3>

                    {unlocked ? (
                      <>
                        <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                          <span aria-hidden="true">🔓</span> Confidential Brief — ACCESS GRANTED ✓
                        </div>
                        <p className="mt-2.5 rounded-xl border border-white/8 bg-black/25 p-3.5 text-sm leading-relaxed whitespace-pre-line text-zinc-300">
                          {project.confidential_brief}
                        </p>
                      </>
                    ) : (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
                        <span aria-hidden="true">🔒</span> Confidential Brief — LOCKED (charter gate
                        not satisfied)
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href={`/projects/${project.id}`}
                        className="rounded-xl bg-indigo-500/20 px-3.5 py-2 text-xs font-semibold text-indigo-200 ring-1 ring-indigo-400/40 transition-colors hover:bg-indigo-500/30"
                      >
                        Open workspace →
                      </a>
                      <a
                        href={`/projects/${project.id}?tab=ai`}
                        className="rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/25"
                      >
                        Ask the research agent
                      </a>
                      <a
                        href={`/projects/${project.id}?tab=ledger`}
                        className="rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-white/25"
                      >
                        View ledger
                      </a>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </section>

        {/* --------- role-specific extras --------- */}
        {children ? children({ all: items, invited, active, refresh }) : null}
      </div>
    </AppShell>
  );
}
