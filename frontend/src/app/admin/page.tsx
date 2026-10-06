"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import SecurityOverview from "@/components/SecurityOverview";
import StatusBadge from "@/components/StatusBadge";
import { Panel, SectionHeader } from "@/components/ui";
import { api, clearSession, getStoredUser, restoreSession, type LedgerVerify, type ProjectOut } from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  // Parse the session ONCE — a fresh object every render would retrigger the
  // effect below on each render (infinite refetch loop).
  const [user] = useState(() => getStoredUser());
  const [projects, setProjects] = useState<ProjectOut[]>([]);
  const [verify, setVerify] = useState<LedgerVerify | null>(null);
  const [tamperDemo, setTamperDemo] = useState<LedgerVerify | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
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
        const list = await api.listProjects();
        setProjects(list);
        const first = list[0];
        if (first) {
          setVerify(await api.verifyLedger(first.id));
          setTamperDemo(await api.verifyLedger(first.id, true));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not reach the backend");
      }
    })();
  }, [user, router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rise flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300">
              Admin Console
            </span>
            <h1 className="mt-2 text-2xl font-bold text-white">Platform Security Overview</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Signed in as {user?.name} · identity, access, charter, AI logging and ledger health
              at a glance.
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

        <div className="grid gap-5 lg:grid-cols-2">
          <SecurityOverview />

          <Panel className="p-6">
            <SectionHeader
              title="Live Ledger Verification"
              subtitle="SHA-256 hash chain over lifecycle events"
              action={
                verify ? (
                  <StatusBadge
                    label={verify.valid ? "Ledger Verified" : "Ledger Invalid"}
                    tone={verify.valid ? "success" : "danger"}
                  />
                ) : null
              }
            />
            {verify ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4">
                  <p className="text-sm font-semibold text-emerald-300">
                    LEDGER VERIFIED {verify.valid ? "✓" : ""}
                  </p>
                  <p className="mt-1 text-xs text-emerald-200/80">
                    Chain integrity confirmed · {verify.entries_checked} entries checked
                  </p>
                </div>
                <div className="rounded-xl border border-red-400/25 bg-red-400/[0.07] p-4">
                  <p className="text-sm font-semibold text-red-300">
                    LEDGER INVALID ⚠ (simulated tamper)
                  </p>
                  <p className="mt-1 text-xs text-red-200/80">
                    TAMPERING DETECTED — broken at entry #{tamperDemo?.broken_at_entry ?? "?"} ·{" "}
                    {tamperDemo?.reason ?? "Hash mismatch"}
                  </p>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Demo toggle only: the second state is produced by the server&apos;s{" "}
                  <span className="font-mono">?tamper=true</span> verifier — no data is modified.
                </p>
              </div>
            ) : (
              <div className="h-32 animate-pulse rounded-xl border border-white/8 bg-white/[0.03]" />
            )}
          </Panel>
        </div>

        <Panel className="p-6">
          <SectionHeader
            title="Projects under supervision"
            subtitle="Charter, team and access state per project"
            action={<span className="chip">{projects.length} projects</span>}
          />
          <div className="space-y-1.5">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/6 bg-white/[0.025] px-3.5 py-2.5"
              >
                <span className="min-w-0 truncate text-sm text-zinc-300">
                  <span className="font-mono text-[11px] text-zinc-500">#{p.id}</span> {p.title}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <StatusBadge label={p.confidentiality} tone="warning" dot={false} />
                  <StatusBadge
                    label={p.team_state === "TEAM_FORMED" ? "Team Formed" : "Forming"}
                    tone={p.team_state === "TEAM_FORMED" ? "success" : "info"}
                    dot={false}
                  />
                  <a
                    href={`/projects/${p.id}`}
                    className="rounded-lg border border-white/12 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-white/30 hover:text-white"
                  >
                    Open
                  </a>
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
