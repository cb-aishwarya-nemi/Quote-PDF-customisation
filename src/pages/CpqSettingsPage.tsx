import { ArrowLeft, AlertCircle, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"

type SettingsRow = {
  title: string
  description?: string
  href?: string
}

const configRows: SettingsRow[] = [
  {
    title: "Quote form builder",
    description:
      "Customize the quote form, add custom fields, and control product and pricing configurations for the quotes you send to customers.",
  },
  {
    title: "Quote PDF templates",
    description:
      "Create and manage PDF layouts for quotes. Set routing rules so the right template is applied automatically based on deal attributes like region, payment terms, and contract length.",
    href: "/templates",
  },
  {
    title: "Approval rules for Quotes",
  },
  {
    title: "Selling rules",
    description:
      "Automate pricing, discounts, and validations to reduce errors, accelerate quote creation, and ensure deal consistency.",
  },
  {
    title: "Quote eSignature",
    description: "Configure and manage eSignature for quotes.",
  },
]

function SettingsCard({
  title,
  description,
  externalLink,
}: SettingsRow & { externalLink?: boolean }) {
  return (
    <button
      type="button"
      className="group w-full rounded-lg border border-gray-200 bg-white px-5 py-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-50/50"
    >
      <div className="flex items-center gap-1.5">
        <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
        {externalLink && (
          <ExternalLink className="size-3.5 text-gray-400 group-hover:text-gray-600" />
        )}
      </div>
      {description && (
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-gray-500">
          {description}
        </p>
      )}
    </button>
  )
}

function SettingsRowItem({
  title,
  description,
  href,
}: SettingsRow) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={href ? () => navigate(href) : undefined}
      className="group w-full border-b border-gray-200 px-5 py-4 text-left last:border-b-0 hover:bg-gray-50/50"
    >
      <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-gray-500">
          {description}
        </p>
      )}
    </button>
  )
}

export function CpqSettingsPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-8 pb-16 pt-6">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="size-3.5" />
        Configure Chargebee
      </button>

      <h1 className="mb-6 text-[22px] font-semibold text-gray-900">
        Chargebee CPQ
      </h1>

      <div className="w-full max-w-[720px] space-y-4">
        <SettingsCard
          title="General Setting"
          description="Set the basic configuration such as quote number sequencing, taxes, signature, note and more."
          externalLink
        />

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {configRows.map((row) => (
            <SettingsRowItem key={row.title} {...row} />
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-cb-disable-border border-t-[3px] bg-cb-disable-bg">
          <div className="flex items-start gap-3 px-5 py-4">
            <AlertCircle
              className="mt-0.5 size-5 shrink-0 text-cb-disable-text"
              strokeWidth={2}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-cb-disable-text">
                Disable Chargebee CPQ Quote?
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-cb-disable-text/80">
                All the quote settings will be disabled and you will no longer
                be able to create quotes.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded border border-cb-disable-btn bg-white px-4 py-1.5 text-[13px] font-medium text-cb-disable-btn hover:bg-cb-disable-bg"
            >
              Disable
            </button>
          </div>
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between pt-12">
        <div className="flex gap-4 text-[12px] text-gray-400">
          <button type="button" className="hover:text-gray-600">
            Privacy
          </button>
          <button type="button" className="hover:text-gray-600">
            Terms
          </button>
        </div>
      </footer>

      <button
        type="button"
        aria-label="Help"
        className="fixed bottom-6 right-6 flex size-12 items-center justify-center rounded-full bg-[#1a8a5c] shadow-lg transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 24 24" className="size-6 text-white" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm2.07-7.75c-.9.58-1.57 1.35-1.57 2.25h-2c0-1.5 1.11-2.83 2.7-3.5 1.04-.52 1.3-1.15 1.3-1.75 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.35-.87 2.5-2.43 3.25z" />
        </svg>
      </button>
    </div>
  )
}
