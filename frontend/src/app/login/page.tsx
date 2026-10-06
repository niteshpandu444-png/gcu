"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, roleHome, setSession } from "@/lib/api";
import { Panel } from "@/components/ui";
import { IconCheck } from "@/components/icons";

const DEMO_ACCOUNTS = [
  { label: "Sponsor", email: "sponsor-001@gcu.demo", tone: "from-indigo-500 to-violet-600" },
  { label: "Expert", email: "expert-001@gcu.demo", tone: "from-sky-500 to-cyan-600" },
  { label: "Student A", email: "student-001@gcu.demo", tone: "from-emerald-500 to-teal-600" },
  { label: "Student B", email: "student-002@gcu.demo", tone: "from-amber-500 to-orange-600" },
  { label: "Student C", email: "student-003@gcu.demo", tone: "from-zinc-500 to-zinc-600" },
  { label: "Admin", email: "admin-001@gcu.demo", tone: "from-fuchsia-500 to-pink-600" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("sponsor-001@gcu.demo");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(targetEmail?: string) {
    const mail = (targetEmail ?? email).trim();
    setError(null);
    setBusy(true);
    try {
      const res = await api.login(mail, password || "password123");
      setSession(res.access_token, res.user);
      router.push(roleHome(res.user.role));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[46rem] -translate-x-1/2 rounded-full bg-indigo-600/18 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        {/* brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-black text-white shadow-xl shadow-indigo-950/50 ring-1 ring-white/15">
            GCU
          </div>
          <h1 className="text-gradient text-2xl font-bold tracking-tight">
            Collaborative Research Ecosystem
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Sign in to continue to your research workspace.
          </p>
        </div>

        <Panel className="p-6 sm:p-7">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-indigo-400/60"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold tracking-wide text-zinc-400 uppercase">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-zinc-200 outline-none transition-colors focus:border-indigo-400/60"
                required
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/50 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* demo accounts */}
          <div className="mt-6 border-t border-white/8 pt-5">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
              <IconCheck className="h-3 w-3 text-emerald-400" /> Demo accounts · password
              <span className="font-mono text-zinc-400">password123</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword("password123");
                    void submit(acc.email);
                  }}
                  disabled={busy}
                  className="group flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:border-indigo-400/40 hover:bg-indigo-500/10 disabled:opacity-60"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${acc.tone} text-[10px] font-bold text-white`}
                  >
                    {acc.label.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-zinc-200">
                      {acc.label}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-zinc-500">
                      {acc.email}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <p className="mt-5 text-center text-[11px] text-zinc-600">
          Role routing: SPONSOR → /sponsor · EXPERT → /expert · STUDENT → /student · ADMIN → /admin
        </p>
      </div>
    </main>
  );
}
