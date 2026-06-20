import { ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

type SettingsEntry = {
  title: string
  description?: string
  href?: string
}

const settingsEntries: SettingsEntry[] = [
  {
    title: "Chargebee CPQ",
    description:
      "Configure quotes, PDF templates, approval rules, selling rules, and eSignature for your sales team.",
    href: "/cpq",
  },
  {
    title: "Import & Export Data",
    description: "Bulk import and export customers, subscriptions, and invoices.",
  },
  {
    title: "Team Members",
    description: "Manage users, roles, and access permissions for your site.",
  },
  {
    title: "Chargebee Notifications",
    description: "Configure email and webhook notifications for billing events.",
  },
  {
    title: "Security",
    description: "SSO, API keys, audit logs, and security policies.",
  },
]

export function ConfigureChargebeePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 pb-16 pt-6">
      <h1 className="mb-6 text-[22px] font-semibold text-gray-900">
        Configure Chargebee
      </h1>

      <div className="w-full max-w-[720px] overflow-hidden rounded-lg border border-gray-200 bg-white">
        {settingsEntries.map((entry) => (
          <button
            key={entry.title}
            type="button"
            onClick={entry.href ? () => navigate(entry.href!) : undefined}
            className={`group flex w-full items-center gap-3 border-b border-gray-200 px-5 py-4 text-left last:border-b-0 ${
              entry.href
                ? "hover:bg-gray-50/80"
                : "cursor-default opacity-70"
            }`}
          >
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-gray-900">
                {entry.title}
              </h2>
              {entry.description && (
                <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-gray-500">
                  {entry.description}
                </p>
              )}
            </div>
            {entry.href && (
              <ChevronRight className="size-4 shrink-0 text-gray-300 transition-colors group-hover:text-gray-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
