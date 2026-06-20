import {
  BarChart3,
  Box,
  ChevronDown,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutGrid,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

type NavItem = {
  label: string
  icon?: React.ReactNode
  badge?: string
  href?: string
  children?: { label: string; href?: string }[]
}

const navItems: NavItem[] = [
  { label: "Product Catalog", icon: <Box className="size-4" /> },
  { label: "Usages", icon: <Zap className="size-4" />, badge: "NEW" },
  { label: "Entitlements", icon: <Shield className="size-4" /> },
  { label: "Logs", icon: <ScrollText className="size-4" /> },
  { label: "RevenueStory", icon: <BarChart3 className="size-4" /> },
  { label: "Classic Reports", icon: <FileText className="size-4" /> },
  { label: "Apps", icon: <LayoutGrid className="size-4" /> },
  {
    label: "Settings",
    icon: <Settings className="size-4" />,
    children: [
      { label: "Configure Chargebee", href: "/" },
      { label: "Import & Export Data" },
      { label: "Team Members" },
      { label: "Chargebee Notifications" },
      { label: "Security" },
    ],
  },
]

const footerItems = [
  { label: "Catalog Setup Assistant", icon: <Sparkles className="size-4" /> },
  { label: "What's new", icon: <Sparkles className="size-4" /> },
  { label: "Need Help?", icon: <HelpCircle className="size-4" /> },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isConfigureChargebeeActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/cpq") ||
    location.pathname.startsWith("/templates")

  return (
    <aside className="flex w-[220px] shrink-0 flex-col bg-cb-sidebar text-[13px] text-gray-300">
      <div className="border-b border-white/10 px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left text-white"
        >
          <span className="flex items-center gap-2 font-medium">
            <span className="flex size-5 items-center justify-center rounded bg-cb-orange text-[10px] font-bold text-white">
              C
            </span>
            Billing
          </span>
          <ChevronDown className="size-4 text-gray-400" />
        </button>

        <button
          type="button"
          className="mt-2 flex w-full items-center justify-between rounded px-1 py-1.5 text-left hover:bg-white/5"
        >
          <span className="truncate text-gray-200">cb-cpq-internal</span>
          <span className="shrink-0 rounded bg-cb-test-badge px-1.5 py-0.5 text-[10px] font-semibold text-gray-900">
            Test
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {navItems.map((item) => (
          <div key={item.label} className="mb-0.5">
            {item.children ? (
              <>
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-gray-300 hover:bg-white/5"
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className="size-3.5 text-gray-500" />
                </button>
                <div className="ml-2 border-l border-white/10 pl-2">
                  {item.children.map((child) => {
                    const isActive =
                      child.href === "/"
                        ? isConfigureChargebeeActive
                        : child.href === location.pathname

                    return (
                      <button
                        key={child.label}
                        type="button"
                        onClick={
                          child.href ? () => navigate(child.href!) : undefined
                        }
                        className={`mb-0.5 flex w-full rounded px-2.5 py-1.5 text-left ${
                          isActive
                            ? "bg-cb-sidebar-active font-medium text-white"
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                        }`}
                      >
                        {child.label}
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-gray-300 hover:bg-white/5"
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronRight className="size-3.5 text-gray-500" />
                {item.badge && (
                  <span className="rounded bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-2 py-2">
        {footerItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex w-full items-center gap-2.5 rounded px-2 py-2 text-gray-400 hover:bg-white/5 hover:text-gray-200"
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <button
          type="button"
          className="mt-1 flex w-full items-center gap-2.5 rounded px-2 py-2 hover:bg-white/5"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
            AN
          </span>
          <span className="text-left text-gray-200">Aishwarya Nemi</span>
        </button>
      </div>
    </aside>
  )
}
