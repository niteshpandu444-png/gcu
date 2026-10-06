import type { Member } from "@/data/mock";
import { Avatar, Panel, ProgressBar } from "@/components/ui";
import StatusBadge from "@/components/StatusBadge";
import { IconCheck } from "@/components/icons";

export default function MemberCard({ member }: { member: Member }) {
  return (
    <Panel hover className="flex flex-col p-5">
      <div className="flex items-start gap-3.5">
        <Avatar initials={member.initials} from={member.avatarFrom} to={member.avatarTo} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-white">{member.name}</p>
            {member.verified ? (
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"
                title="Verified identity"
              >
                <IconCheck className="h-2.5 w-2.5" />
              </span>
            ) : null}
          </div>
          <p className="font-mono text-[11px] tracking-wide text-zinc-500">{member.handle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusBadge label={member.role} tone={member.roleTone} dot={false} />
            {member.status ? (
              <StatusBadge
                label={member.status}
                tone={member.status === "Invited" ? "neutral" : "success"}
                dot={false}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {member.skills.map((skill) => (
          <span key={skill} className="chip">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 border-t border-white/8 pt-3.5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-400">
          <span>Contribution</span>
          <span className="font-mono text-zinc-200">{member.contribution}%</span>
        </div>
        <ProgressBar
          value={member.contribution}
          tone={member.contribution >= 30 ? "success" : "accent"}
        />
      </div>
    </Panel>
  );
}
