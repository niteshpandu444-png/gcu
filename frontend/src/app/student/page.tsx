"use client";

import CandidateWorkspace from "@/components/CandidateWorkspace";
import PortfolioCredential from "@/components/PortfolioCredential";
import { Panel } from "@/components/ui";

export default function StudentPage() {
  return (
    <CandidateWorkspace roleLabel="Student">
      {({ active }) => (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              Contribution &amp; Recognition
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Your verified work, credential and portfolio evidence — AI-assisted work stays
              attributed to its human owner.
            </p>
          </div>
          {active[0] ? (
            <PortfolioCredential project={active[0].project} />
          ) : (
            <Panel className="px-5 py-6 text-sm text-zinc-500">
              Accept an invitation to start recording contributions.
            </Panel>
          )}
        </section>
      )}
    </CandidateWorkspace>
  );
}
