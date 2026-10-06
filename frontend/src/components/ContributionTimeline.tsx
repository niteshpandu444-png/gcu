import { contributions } from "@/data/mock";
import { Avatar, Panel, SectionHeader } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { IconCheck } from "@/components/icons";

export default function ContributionTimeline() {
  return (
    <Panel className="p-6">
      <SectionHeader
        title="Contribution Timeline"
        subtitle="Every contribution — human or AI — recorded in order"
        action={<span className="chip">{contributions.length} entries</span>}
      />

      <ol className="relative space-y-4 border-l border-white/10 pl-6 ml-3">
        {contributions.map((c) => (
          <li key={`${c.actor}-${c.timestamp}`} className="relative">
            {/* node */}
            <span
              className={`absolute top-4 -left-[31px] flex h-3 w-3 items-center justify-center rounded-full ring-4 ring-[#0b0f1a] ${
                c.type === "AI" ? "bg-violet-400" : "bg-emerald-400"
              }`}
              aria-hidden="true"
            />

            <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4 transition-colors hover:border-white/16">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={c.initials}
                    from={c.avatarFrom}
                    to={c.avatarTo}
                    size="sm"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{c.actor}</p>
                    <p className="text-xs text-zinc-400">{c.action}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge
                      label={c.type}
                      tone={c.type === "AI" ? "accent" : "neutral"}
                      dot={false}
                    />
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        c.verified
                          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                          : "border-amber-400/25 bg-amber-400/10 text-amber-300"
                      }`}
                    >
                      <IconCheck className="h-2.5 w-2.5" />
                      {c.verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">{c.timestamp}</span>
                </div>
              </div>

              {c.type === "AI" && c.owner ? (
                <p className="mt-3 border-t border-white/6 pt-2.5 text-xs text-zinc-400">
                  <span className="text-violet-300">AI contribution</span> · Human Owner:{" "}
                  <span className="font-medium text-zinc-200">{c.owner}</span> · reward share 0%
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
