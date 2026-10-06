import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import ProjectCard from "@/components/ProjectCard";
import SecurityOverview from "@/components/SecurityOverview";
import StatusBadge from "@/components/StatusBadge";
import { Panel } from "@/components/ui";
import { projectCards, stats } from "@/data/mock";
import { IconCheck } from "@/components/icons";

export default function DashboardPage() {
  const [featured, ...others] = projectCards;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-8">
        {/* hero */}
        <section className="rise relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-indigo-600/12 via-white/[0.02] to-transparent px-6 py-10 sm:px-10">
          <div
            className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="chip border-indigo-400/30 bg-indigo-400/10 text-indigo-300">
                  <span className="dot-live" /> Live workspace
                </span>
                <StatusBadge label="Verified platform" tone="success" />
              </div>
              <h1 className="text-gradient text-3xl font-bold tracking-tight sm:text-4xl">
                Collaborative Research Ecosystem
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
                Trusted research collaboration powered by AI, provenance and
                transparent rewards.
              </p>
            </div>
            <div className="hidden gap-6 sm:flex">
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-white">142</p>
                <p className="text-[11px] tracking-wider text-zinc-500 uppercase">
                  Ledger entries
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-emerald-300">100%</p>
                <p className="text-[11px] tracking-wider text-zinc-500 uppercase">
                  Chain verified
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* statistics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Statistics">
          {stats.map((stat, i) => (
            <div key={stat.label} className="rise" style={{ animationDelay: `${i * 60}ms` }}>
              <StatCard stat={stat} />
            </div>
          ))}
        </section>

        {/* projects + security */}
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
                Your Projects
              </h2>
              <span className="chip">{projectCards.length} total</span>
            </div>
            <ProjectCard project={featured} />
            <div className="grid gap-5 xl:grid-cols-2">
              {others.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <SecurityOverview />

            {/* rewards teaser */}
            <Panel className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
                  Next reward release
                </h2>
                <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                  <IconCheck className="h-3 w-3" /> Funded
                </span>
              </div>
              <p className="mt-4 font-mono text-3xl font-bold text-white">₹50,000</p>
              <p className="mt-1 text-xs text-zinc-500">
                Milestone 1 · Dataset &amp; Baseline
              </p>
              <div className="mt-4 space-y-2 border-t border-white/8 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Student A · 50%</span>
                  <span className="font-mono text-zinc-200">₹25,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Student B · 30%</span>
                  <span className="font-mono text-zinc-200">₹15,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Expert · 20%</span>
                  <span className="font-mono text-zinc-200">₹10,000</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>AI · 0%</span>
                  <span className="font-mono">₹0</span>
                </div>
              </div>
            </Panel>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
