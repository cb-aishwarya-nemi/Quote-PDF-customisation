import { Outlet } from "react-router-dom"
import { Info } from "lucide-react"
import { Sidebar } from "./Sidebar"

export function AppShell() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-center gap-2 bg-cb-test-banner px-4 py-1.5 text-[13px] text-cb-test-banner-text">
        <Info className="size-3.5 shrink-0" strokeWidth={2.5} />
        <span>Test site — Safe to simulate and experiment</span>
      </div>

      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#f5f7fa]">
          <div className="flex min-h-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
