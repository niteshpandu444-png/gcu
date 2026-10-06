"use client";

import { Suspense, useState, type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

/** Sidebar reads useSearchParams — needs a Suspense boundary when prerendered. */
function SidebarFallback() {
  return (
    <div className="h-full w-64 border-r border-white/8 bg-black/25 backdrop-blur-xl" />
  );
}

/**
 * App chrome: fixed sidebar (desktop) + slide-in drawer (small screens) + topbar.
 * Page content is passed through as children.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* desktop sidebar */}
      <div className="sticky top-0 hidden h-screen lg:block">
        <Suspense fallback={<SidebarFallback />}>
          <Sidebar />
        </Suspense>
      </div>

      {/* mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0">
            <Suspense fallback={<SidebarFallback />}>
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
            </Suspense>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setDrawerOpen((v) => !v)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
