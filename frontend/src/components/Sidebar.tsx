"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { navItems } from "@/data/mock";
import { navIcons } from "@/components/icons";

function isActive(href: string, pathname: string, tab: string | null): boolean {
  const [path, query] = href.split("?");
  const targetTab = query ? new URLSearchParams(query).get("tab") : null;
  if (path === "/") return pathname === "/";
  if (pathname !== path) return false;
  return targetTab === null || targetTab === tab;
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-white/8 bg-black/25 backdrop-blur-xl">
      {/* brand */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-900/50">
          G
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-widest text-white">GCU</div>
          <div className="text-[10px] tracking-wide text-zinc-500 uppercase">
            Research Ecosystem
          </div>
        </div>
      </div>

      <div className="mx-5 mb-2 h-px bg-white/8" />

      {/* nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {navItems.map((item) => {
          const Icon = navIcons[item.icon];
          const active = isActive(item.href, pathname, tab);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-indigo-500/15 text-indigo-200 border border-indigo-400/30"
                  : "text-zinc-400 border border-transparent hover:bg-white/5 hover:text-zinc-100"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-indigo-300" : "text-zinc-500 group-hover:text-zinc-300"}`} />
              <span className="font-medium">{item.label}</span>
              {active ? (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* footer card */}
      <div className="m-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          System operational
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-400">
          Ledger verified · 142 entries · chain intact
        </p>
      </div>
    </aside>
  );
}
