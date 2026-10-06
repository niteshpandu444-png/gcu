"use client";

import { currentUser } from "@/data/mock";
import { Avatar } from "@/components/ui";
import { IconBell, IconCheck, IconMenu } from "@/components/icons";

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/8 bg-[#070a12]/80 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open navigation"
        >
          <IconMenu />
        </button>
        <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1.5 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          <span className="text-xs text-zinc-400">
            Collaborative Research Ecosystem
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* notifications */}
        <button
          type="button"
          className="relative rounded-lg border border-white/10 bg-white/5 p-2.5 text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
          aria-label={`Notifications (${currentUser.notifications} unread)`}
        >
          <IconBell className="h-4 w-4" />
          {currentUser.notifications > 0 ? (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
              {currentUser.notifications}
            </span>
          ) : null}
        </button>

        {/* profile */}
        <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 py-1.5 pr-4 pl-2">
          <Avatar initials="AS" from="#34d399" to="#22d3ee" size="sm" />
          <div className="hidden leading-tight sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-zinc-100">
                {currentUser.name}
              </span>
              {currentUser.verified ? (
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"
                  title="Verified identity"
                >
                  <IconCheck className="h-2.5 w-2.5" />
                </span>
              ) : null}
            </div>
            <div className="text-[11px] text-zinc-500">
              {currentUser.role} · {currentUser.handle}
            </div>
          </div>
          <span className="rounded-md border border-indigo-400/30 bg-indigo-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-indigo-300">
            {currentUser.role}
          </span>
        </div>
      </div>
    </header>
  );
}
