import { integrity } from "@/data/mock";
import { Panel } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { IconAlert } from "@/components/icons";

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#integrityGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
        />
        <defs>
          <linearGradient id="integrityGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-4xl font-bold text-white">{integrity.score}%</span>
        <span className="text-[10px] tracking-widest text-zinc-500 uppercase">Similarity</span>
      </div>
    </div>
  );
}

export default function IntegrityPanel() {
  return (
    <div className="space-y-5">
      {/* headline verdict */}
      <Panel className="relative overflow-hidden border-amber-400/30 p-6">
        <div
          className="pointer-events-none absolute -top-20 -right-8 h-56 w-56 rounded-full bg-amber-500/12 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center gap-6 sm:flex-row">
          <ScoreRing score={integrity.score} />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col items-center gap-2 sm:flex-row">
              <StatusBadge label={integrity.risk + " risk"} tone="danger" />
              <StatusBadge label={integrity.verdict} tone="warning" />
            </div>
            <h2 className="mt-3 text-xl font-bold text-white">
              {integrity.status}
            </h2>
            <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-zinc-400">
              Similarity score of {integrity.score}% was detected between artifact
              <span className="font-mono text-zinc-300"> ART-009 </span>
              and a submitted contribution. The hash chain itself is intact — this is a
              content-level flag routed to the expert reviewer.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="chip border-amber-400/30 bg-amber-400/10 text-amber-300">
                <IconAlert className="h-3 w-3" /> Expert review queued
              </span>
              <span className="chip">Artifact: ART-009</span>
              <span className="chip">Compared: 12 artifacts</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* supporting panels */}
      <div className="grid gap-4 md:grid-cols-3">
        {integrity.panels.map((p) => (
          <Panel key={p.title} hover className="p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                {p.title}
              </p>
              <StatusBadge label={p.value} tone={p.tone} dot={false} />
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-zinc-400">{p.detail}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
