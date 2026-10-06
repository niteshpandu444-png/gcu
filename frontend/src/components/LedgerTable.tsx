"use client";

import { useState } from "react";
import { ledgerEntries, tamperedEntry, type LedgerEntry } from "@/data/mock";
import { Panel, SectionHeader } from "@/components/ui";
import { IconAlert, IconCheck } from "@/components/icons";

function statusChip(status: LedgerEntry["status"]) {
  if (status === "Verified")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
        <IconCheck className="h-2.5 w-2.5" /> Verified
      </span>
    );
  if (status === "Tampered")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[11px] font-semibold text-red-300">
        <IconAlert className="h-2.5 w-2.5" /> Tampered
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
      Pending
    </span>
  );
}

export default function LedgerTable() {
  const [invalid, setInvalid] = useState(false);

  const rows: LedgerEntry[] = invalid
    ? ledgerEntries.map((e) => (e.entry === tamperedEntry.entry ? tamperedEntry : e))
    : ledgerEntries;

  return (
    <div className="space-y-5">
      {/* status banner + demo toggle */}
      <Panel
        className={`relative overflow-hidden p-6 ${
          invalid ? "border-red-400/40" : "border-emerald-400/30"
        }`}
      >
        <div
          className={`pointer-events-none absolute -top-20 -right-10 h-56 w-56 rounded-full blur-3xl ${
            invalid ? "bg-red-600/20" : "bg-emerald-600/15"
          }`}
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ring-2 ${
                invalid
                  ? "bg-red-400/15 ring-red-400/40"
                  : "bg-emerald-400/15 ring-emerald-400/40"
              }`}
            >
              {invalid ? (
                <IconAlert className="h-6 w-6 text-red-300" />
              ) : (
                <IconCheck className="h-6 w-6 text-emerald-300" />
              )}
            </span>
            <div>
              <p
                className={`text-lg font-bold tracking-wide ${
                  invalid ? "text-red-300" : "text-emerald-300"
                }`}
              >
                {invalid ? "LEDGER INVALID" : "LEDGER VERIFIED"}
              </p>
              <p className="text-sm text-zinc-400">
                {invalid
                  ? "⚠ TAMPERING DETECTED — entry #0141 hash does not match the chain"
                  : "✓ Chain integrity confirmed — 142 entries verified"}
              </p>
            </div>
          </div>

          {/* visual-only demo switch */}
          <button
            type="button"
            onClick={() => setInvalid((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors ${
              invalid
                ? "border-red-400/40 bg-red-400/10 text-red-200 hover:bg-red-400/15"
                : "border-white/12 bg-white/5 text-zinc-300 hover:border-white/25 hover:text-white"
            }`}
            aria-pressed={invalid}
          >
            <span
              className={`relative h-4 w-7 rounded-full transition-colors ${
                invalid ? "bg-red-400/70" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                  invalid ? "left-3.5" : "left-0.5"
                }`}
              />
            </span>
            {invalid ? "Show invalid state" : "Simulate tampering (demo)"}
          </button>
        </div>
      </Panel>

      {/* table */}
      <Panel className="overflow-hidden">
        <div className="border-b border-white/8 px-5 py-4">
          <SectionHeader
            title="Audit Ledger"
            subtitle="Append-only hash chain of project events"
            action={
              <span className="chip font-mono text-[11px]">
                {invalid ? "1 mismatch" : "integrity: ok"}
              </span>
            }
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/8 text-[10px] tracking-wider text-zinc-500 uppercase">
                <th className="px-5 py-3 font-semibold">Entry</th>
                <th className="px-5 py-3 font-semibold">Actor</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Previous Hash</th>
                <th className="px-5 py-3 font-semibold">Current Hash</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {rows.map((row) => {
                const flagged = row.status === "Tampered";
                return (
                  <tr
                    key={row.entry}
                    className={`transition-colors hover:bg-white/[0.03] ${
                      flagged ? "bg-red-400/5" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-mono text-xs text-zinc-400">{row.entry}</td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-200">{row.actor}</td>
                    <td className="px-5 py-3 text-xs font-medium text-zinc-300">
                      {row.action}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs whitespace-nowrap text-zinc-500">
                      {row.timestamp}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">
                      {row.prevHash}
                    </td>
                    <td
                      className={`px-5 py-3 font-mono text-xs ${
                        flagged ? "text-red-300" : "text-zinc-500"
                      }`}
                    >
                      {row.currHash}
                      {flagged ? <span className="ml-1">✕</span> : null}
                    </td>
                    <td className="px-5 py-3">{statusChip(row.status)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
