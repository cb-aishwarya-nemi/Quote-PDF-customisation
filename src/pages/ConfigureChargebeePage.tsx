import {
  CONFIGURE_CHARGEBEE_SECTIONS,
  type ConfigureSettingItem,
} from "@/data/configure-chargebee-settings"
import { ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

function NewBadge() {
  return (
    <span className="shrink-0 rounded bg-[#1a3a5c] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
      NEW
    </span>
  )
}

function SettingRow({
  item,
  onNavigate,
}: {
  item: ConfigureSettingItem
  onNavigate: (href: string) => void
}) {
  const Icon = item.icon
  const clickable = Boolean(item.href)

  return (
    <button
      type="button"
      onClick={item.href ? () => onNavigate(item.href!) : undefined}
      className={`group flex w-full items-start gap-3 border-b border-gray-200 px-5 py-4 text-left last:border-b-0 ${
        clickable ? "cursor-pointer hover:bg-gray-50/80" : "cursor-default"
      }`}
    >
      {Icon && (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[15px] font-semibold text-gray-900">{item.title}</h3>
          {item.badge === "NEW" && <NewBadge />}
        </div>
        {item.description && (
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-gray-500">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        {item.meta && (
          <span className="max-w-[220px] truncate text-right text-[13px] text-gray-500">
            {item.meta}
          </span>
        )}
        <ChevronRight
          className={`size-4 shrink-0 text-gray-300 ${
            clickable ? "transition-colors group-hover:text-gray-500" : ""
          }`}
        />
      </div>
    </button>
  )
}

export function ConfigureChargebeePage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 pb-16 pt-6">
      <div className="max-w-[1080px]">
        <h1 className="text-[22px] font-semibold text-gray-900">
          Configure Chargebee
        </h1>
        <p className="mt-1 text-[14px] text-gray-600">
          Set up how you manage subscriptions, customers, taxes, and more.
        </p>

        <button
          type="button"
          className="group mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-700"
        >
          Discover ways to make the most of your billing
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
            <h2 className="text-[15px] font-semibold text-gray-900">Get Started</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
              Set up your essentials like business profile, plans, subscriptions,
              payment gateways, and more.
            </p>
            <button
              type="button"
              className="mt-4 rounded border border-blue-600 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide text-blue-600 transition-colors hover:bg-blue-50"
            >
              Read docs
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
            <h2 className="text-[15px] font-semibold text-gray-900">
              Introducing Chargebee CPQ
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
              Configure rules and create a robust and dynamic pricing and quoting
              system that adapts to your needs. Explore everything you can do
              with Chargebee CPQ.
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-gray-200">
          {CONFIGURE_CHARGEBEE_SECTIONS.map((section) => (
            <section
              key={section.title}
              className="grid gap-6 py-8 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10"
            >
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold text-gray-900">
                  {section.title}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
                  {section.description}
                </p>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {section.items.map((item) => (
                  <SettingRow
                    key={item.title}
                    item={item}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-8 flex gap-4 text-[12px] text-gray-400">
          <button type="button" className="hover:text-gray-600">
            Privacy
          </button>
          <button type="button" className="hover:text-gray-600">
            Terms
          </button>
        </footer>
      </div>
    </div>
  )
}
