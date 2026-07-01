import {
  BarChart3,
  Box,
  ChevronDown,
  ClipboardList,
  Command,
  Database,
  Ellipsis,
  ExternalLink,
  FileText,
  HelpCircle,
  LayoutGrid,
  Rocket,
  ScrollText,
  Search,
  Settings,
  Shield,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import sidebarHeader from "@/assets/sidebar-header.png"

type NavItem = {
  label: string
  icon: LucideIcon
  badge?: string
  showChevron?: boolean
  href?: string
  children?: { label: string; href?: string }[]
}

const navItems: NavItem[] = [
  { label: "Quotes", icon: ClipboardList, showChevron: true, href: "/quotes" },
  { label: "Product Catalog", icon: Box, showChevron: true },
  { label: "Usages", icon: Zap, badge: "NEW", showChevron: true },
  { label: "Entitlements", icon: Shield, showChevron: true },
  { label: "Logs", icon: ScrollText, showChevron: true },
  { label: "RevenueStory", icon: BarChart3, showChevron: true },
  { label: "Classic Reports", icon: FileText, showChevron: true },
  { label: "Apps", icon: LayoutGrid, showChevron: true },
  {
    label: "Settings",
    icon: Settings,
    showChevron: true,
    children: [
      { label: "Configure Chargebee", href: "/" },
      { label: "Import & Export Data" },
      { label: "Team Members" },
      { label: "Chargebee Notifications" },
      { label: "Security" },
    ],
  },
]

function NavRow({
  label,
  icon: Icon,
  active = false,
  showChevron,
  badge,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active?: boolean
  showChevron?: boolean
  badge?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] leading-tight transition-colors ${
        active
          ? "bg-gray-100 font-semibold text-gray-900"
          : "font-normal text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon
        size={15}
        strokeWidth={1.75}
        aria-hidden
        className={`shrink-0 ${active ? "text-gray-900" : "text-gray-500"}`}
      />
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate">{label}</span>
        {badge && (
          <span className="shrink-0 rounded bg-[#1a3a5c] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            {badge}
          </span>
        )}
      </span>
      {showChevron && (
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden
          className="shrink-0 text-gray-400"
        />
      )}
    </button>
  )
}

function ChildNavRow({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full rounded-lg py-1.5 pl-9 pr-2.5 text-left text-[13px] leading-tight transition-colors ${
        active
          ? "bg-gray-100 font-semibold text-gray-900"
          : "font-normal text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      {label}
    </button>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isConfigureChargebeeActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/cpq") ||
    location.pathname.startsWith("/templates")

  return (
    <aside
      aria-label="Primary navigation"
      className="relative z-10 flex w-[248px] shrink-0 flex-col text-[13px] shadow-[4px_0_16px_rgba(15,23,42,0.08)]"
    >
      <div className="shrink-0 px-3 pb-3 pt-3">
        <img
          src={sidebarHeader}
          alt="Billing — cb-cpq-internal Test site"
          className="block w-full select-none"
          draggable={false}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div className="px-3 pb-1 pt-3">
        <button
          type="button"
          aria-label="Go to"
          className="flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          <Search size={15} strokeWidth={1.75} aria-hidden className="shrink-0" />
          <span className="flex-1 text-[13px]">Go to</span>
          <span className="flex shrink-0 items-center gap-px rounded border border-gray-200 px-1 py-0.5 text-[11px] leading-none text-gray-400">
            <Command size={10} strokeWidth={2} aria-hidden />
            <span>K</span>
          </span>
        </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-1">
        {navItems.map((item) => (
          <div key={item.label}>
            {item.children ? (
              <>
                <NavRow
                  label={item.label}
                  icon={item.icon}
                  showChevron={item.showChevron}
                />
                <div className="flex flex-col">
                  {item.children.map((child) => {
                    const isActive =
                      child.href === "/"
                        ? isConfigureChargebeeActive
                        : child.href === location.pathname

                    return (
                      <ChildNavRow
                        key={child.label}
                        label={child.label}
                        active={isActive}
                        onClick={
                          child.href ? () => navigate(child.href!) : undefined
                        }
                      />
                    )
                  })}
                </div>
              </>
            ) : (
              <NavRow
                label={item.label}
                icon={item.icon}
                badge={item.badge}
                showChevron={item.showChevron}
                active={
                  item.href
                    ? item.href === "/"
                      ? location.pathname === "/"
                      : location.pathname === item.href ||
                        location.pathname.startsWith(`${item.href}/`)
                    : false
                }
                onClick={item.href ? () => navigate(item.href!) : undefined}
              />
            )}
          </div>
        ))}
        </nav>

        <div className="border-t border-gray-200 px-3 py-3">
        <button
          type="button"
          className="mb-2 flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-left text-[13px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
        >
          <Database size={15} strokeWidth={1.75} className="shrink-0 text-gray-500" />
          <span className="truncate">Catalog Setup Assistant</span>
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-50"
        >
          <Rocket size={15} strokeWidth={1.75} className="shrink-0 text-gray-500" />
          <span className="flex-1 truncate">What&apos;s new</span>
          <ExternalLink size={14} strokeWidth={1.75} className="shrink-0 text-gray-400" />
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-1 py-2 text-left text-[13px] text-gray-700 transition-colors hover:bg-gray-50"
        >
          <HelpCircle size={15} strokeWidth={1.75} className="shrink-0 text-gray-500" />
          <span className="flex-1 truncate">Need Help?</span>
          <Ellipsis size={15} strokeWidth={1.75} className="shrink-0 text-gray-400" />
        </button>

        <button
          type="button"
          className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-1 py-2 text-left transition-colors hover:bg-gray-50"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#7c3aed] text-sm font-semibold text-white">
            A
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-gray-900">
              Aishwarya Nemi
            </span>
            <span className="block truncate text-[11px] text-gray-500">
              aishwarya@chargebee.com
            </span>
          </span>
          <Ellipsis size={15} strokeWidth={1.75} className="shrink-0 text-gray-400" />
        </button>
        </div>
      </div>
    </aside>
  )
}
