"use client";

import { useState } from "react";
import { chat, scoping as scopingMock, project } from "@/data/mock";
import { Panel, SectionHeader } from "@/components/ui";
import { IconCheck, IconSend } from "@/components/icons";
import { api, getStoredUser } from "@/lib/api";

type Msg = {
  role: "user" | "assistant";
  author: string;
  text: string;
  time: string;
  sources?: string[];
};

const PROJECT_REF = "GCU-DEMO-001";

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : "Request failed";
  if (msg.includes("401")) return "Sign in first — the research agent needs an authenticated human owner (/login).";
  if (msg.includes("403")) return "Access denied: the project agent requires ACTIVE membership (and the charter gate) — accept your invitation first.";
  return msg;
}

export default function AIChat({ projectId = PROJECT_REF }: { projectId?: string }) {
  const me = getStoredUser();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>(chat.messages);
  const [busy, setBusy] = useState(false);
  const [owner, setOwner] = useState(chat.humanOwner);
  const [logged, setLogged] = useState(false);

  async function send() {
    const question = draft.trim();
    if (!question || busy) return;
    setDraft("");
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", author: "You", text: question, time: nowTime() },
      { role: "assistant", author: "Research Agent", text: "Searching the project knowledge base…", time: nowTime() },
    ]);

    try {
      const res = await api.aiResearch(projectId, question);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          author: "Research Agent",
          text: res.answer,
          time: nowTime(),
          sources: res.sources,
        };
        return next;
      });
      setOwner(String(res.human_owner_id ?? me?.name ?? chat.humanOwner));
      setLogged(true);
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          author: "Research Agent",
          text: `⚠ ${friendlyError(e)}`,
          time: nowTime(),
        };
        return next;
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* chat panel */}
      <Panel className="flex flex-col overflow-hidden">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 bg-white/[0.03] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-900/40">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4.5 w-4.5" aria-hidden="true">
                <path d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Research Agent</p>
              <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                <span className="dot-live" /> Online
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip font-mono">{chat.agentId}</span>
            <span className="chip">
              Owner: <span className="text-zinc-200">{owner}</span>
            </span>
          </div>
        </div>

        {/* messages */}
        <div className="max-h-[28rem] space-y-5 overflow-y-auto px-5 py-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col gap-2 ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                <span className={m.role === "user" ? "text-zinc-400" : "text-violet-300"}>
                  {m.author}
                </span>
                <span className="font-mono">{m.time}</span>
              </div>

              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-md border border-indigo-400/30 bg-indigo-500/15 text-indigo-50"
                    : "rounded-bl-md border border-white/8 bg-white/[0.04] text-zinc-200"
                }`}
              >
                {m.text}
              </div>

              {/* source chips for assistant messages */}
              {m.role === "assistant" && m.sources ? (
                <div className="flex flex-wrap items-center gap-1.5 px-1">
                  <span className="text-[11px] text-zinc-500">Sources:</span>
                  {m.sources.map((s) => (
                    <span
                      key={s}
                      className="rounded-md border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 font-mono text-[11px] text-cyan-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* composer */}
        <div className="border-t border-white/8 bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 focus-within:border-indigo-400/50">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Ask the research agent about this project…"
              className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
              aria-label="Message the research agent"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white transition-colors hover:bg-indigo-400 disabled:opacity-50"
              aria-label="Send message"
            >
              <IconSend className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-zinc-600">
            Retrieval is scoped to this project only · every action is logged with a human owner.
          </p>
        </div>
      </Panel>

      {/* action-logged strip */}
      <Panel className="flex flex-wrap items-center justify-between gap-4 border-emerald-400/25 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-zinc-400">
            Agent: <span className="font-mono text-zinc-200">{chat.agentId}</span>
          </span>
          <span className="text-zinc-400">
            Human Owner: <span className="font-medium text-zinc-200">{owner}</span>
          </span>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
          <IconCheck className="h-3.5 w-3.5" /> {logged ? "Action Logged (live)" : chat.status}
        </span>
      </Panel>
    </div>
  );
}

/** Scoping card shown alongside the chat on the AI Research tab. */
export function AIScopingCard() {
  const [milestones, setMilestones] = useState(scopingMock.milestones);
  const [source, setSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.aiScope(PROJECT_REF, `${project.title}. ${project.objective}`);
      setMilestones(
        res.milestones.map((m) => ({
          title: m.title,
          skills: m.required_skills,
          deliverable: m.deliverable,
        })),
      );
      setSource(res.source);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Scope generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="relative overflow-hidden p-6">
      <div
        className="pointer-events-none absolute -top-24 -right-12 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl"
        aria-hidden="true"
      />
      <SectionHeader
        title="AI Project Scoping"
        subtitle="Milestones drafted by the scoping agent, ready for charter review"
        action={
          <span className="chip font-mono text-[11px]">
            {source ? `${source} · just now` : scopingMock.generatedAt}
          </span>
        }
      />

      <p className="mb-4 text-xs font-semibold tracking-wider text-violet-300 uppercase">
        ✦ AI Generated Scope
      </p>

      <div className="relative space-y-3">
        {milestones.map((m, i) => (
          <div
            key={m.title}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-4 transition-colors hover:border-violet-400/40"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-400/15 font-mono text-[11px] font-bold text-violet-300">
                M{i + 1}
              </span>
              <h3 className="text-sm font-semibold text-white">{m.title}</h3>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Required skills</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {m.skills.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-3 border-t border-white/6 pt-2.5 text-xs text-zinc-400">
              <span className="text-zinc-500">Deliverable:</span> {m.deliverable}
            </p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void generate()}
        disabled={busy}
        className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
      >
        ✦ {busy ? "Generating…" : "Generate Project Scope"}
      </button>
      <p className="mt-2 text-center text-[11px] text-zinc-600">
        Calls POST /api/ai/scope · logged as AI_SCOPE_GENERATION.
      </p>
    </Panel>
  );
}
