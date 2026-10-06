import { securityChecks } from "@/data/mock";
import { Panel, SectionHeader } from "@/components/ui";
import { IconCheck } from "@/components/icons";

export default function SecurityOverview() {
  return (
    <Panel className="p-6">
      <SectionHeader
        title="Security & Trust"
        subtitle="Platform-wide assurance checks for this workspace"
      />
      <ul className="space-y-3">
        {securityChecks.map((check) => (
          <li
            key={check.label}
            className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/[0.025] px-3.5 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  check.ok
                    ? "bg-emerald-400/15 text-emerald-300"
                    : "bg-amber-400/15 text-amber-300"
                }`}
              >
                {check.ok ? <IconCheck className="h-3.5 w-3.5" /> : <span className="text-xs">!</span>}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-100">{check.label}</p>
                <p className="truncate text-xs text-zinc-500">{check.detail}</p>
              </div>
            </div>
            <span
              className={`shrink-0 text-[10px] font-bold tracking-wider uppercase ${
                check.ok ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {check.ok ? "Pass" : "Check"}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
