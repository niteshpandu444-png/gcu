import { charter } from "@/data/mock";
import { Panel, SectionHeader } from "@/components/ui";
import { IconCheck } from "@/components/icons";

const sectionIcons = ["◎", "⌾", "©", "⚙", "₹", "▦", "⇄"];

export default function CharterPanel() {
  return (
    <div className="space-y-5">
      {/* accepted banner — visually strong */}
      <Panel className="relative overflow-hidden border-emerald-400/30 p-6">
        <div
          className="pointer-events-none absolute -top-20 -left-10 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 ring-2 ring-emerald-400/40">
              <IconCheck className="h-6 w-6 text-emerald-300" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">✓ Charter Accepted</p>
              <p className="text-sm text-zinc-400">
                {charter.version} · {charter.acceptedBy}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] tracking-wider text-zinc-500 uppercase">Signed at</p>
            <p className="font-mono text-sm text-emerald-300">{charter.acceptedAt}</p>
          </div>
        </div>
      </Panel>

      {/* sections */}
      <Panel className="p-6">
        <SectionHeader
          title={charter.version}
          subtitle="Agreed rules governing scope, access, IP, AI use and rewards"
          action={
            <span className="chip border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
              <IconCheck className="h-3 w-3" /> Active
            </span>
          }
        />
        <div className="grid gap-3 md:grid-cols-2">
          {charter.sections.map((section, i) => (
            <div
              key={section.title}
              className="rounded-xl border border-white/6 bg-white/[0.025] p-4 transition-colors hover:border-indigo-400/30"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-400/10 text-xs text-indigo-300">
                  {sectionIcons[i % sectionIcons.length]}
                </span>
                <h3 className="text-xs font-bold tracking-wider text-zinc-200 uppercase">
                  {section.title}
                </h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{section.body}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
