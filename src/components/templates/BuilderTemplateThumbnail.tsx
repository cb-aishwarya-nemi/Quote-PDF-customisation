import { BLOCK_TYPE_LABELS } from "@/lib/derive-template-variables"
import type { BuilderBlock, BuilderTemplate } from "@/types/prompt-builder"

const BLOCK_ACCENT: Record<string, string> = {
  company_logo: "bg-[#012A38]",
  company_details: "bg-slate-400/70",
  quote_summary_header: "bg-blue-500/70",
  tcv_summary: "bg-[#012A38]",
  billed_to: "bg-violet-400/70",
  contract_details: "bg-amber-400/70",
  pricing: "bg-emerald-500/70",
  entitlements: "bg-cyan-500/70",
  terms: "bg-orange-400/60",
  signature: "bg-slate-500/60",
  ae_profile: "bg-indigo-400/70",
  custom_text: "bg-gray-400/60",
  custom_table: "bg-gray-400/60",
  custom_image: "bg-gray-400/60",
}

function MiniBlock({
  block,
  compact,
}: {
  block: BuilderBlock
  compact?: boolean
}) {
  const accent = BLOCK_ACCENT[block.type] ?? "bg-gray-400/60"

  if (compact) {
    return (
      <div className="rounded border border-gray-100 bg-white px-1.5 py-1">
        <div className={`mb-0.5 h-0.5 w-7 rounded-full ${accent}`} />
        <div className="space-y-0.5">
          <div className="h-0.5 w-full rounded-full bg-gray-200" />
          <div className="h-0.5 w-4/5 rounded-full bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded border border-gray-100 bg-white px-1.5 py-1">
      <div className={`mb-1 h-1 w-8 rounded-full ${accent}`} />
      <div className="space-y-0.5">
        <div className="h-0.5 w-full rounded-full bg-gray-200" />
        <div className="h-0.5 w-4/5 rounded-full bg-gray-100" />
      </div>
      <p className="mt-1 truncate text-[6px] font-medium uppercase tracking-wide text-gray-400">
        {BLOCK_TYPE_LABELS[block.type]}
      </p>
    </div>
  )
}

type Props = {
  template: BuilderTemplate
  compact?: boolean
  /** Fill parent preview area on template cards */
  fill?: boolean
}

export function BuilderTemplateThumbnail({ template, compact, fill }: Props) {
  const previewBlocks = template.blocks.slice(0, compact ? 4 : 5)
  const remaining = template.blocks.length - previewBlocks.length

  if (compact) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#eef0f3] to-[#e4e7eb] ${
          fill ? "p-3" : "rounded-xl p-4"
        }`}
      >
        <div
          className={`flex h-full max-h-full w-full flex-col overflow-hidden border border-gray-200/90 bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.22)] ${
            fill ? "max-w-[46%] rounded-md" : "max-w-[132px] rounded-lg"
          }`}
        >
          <div className="border-b border-gray-100 bg-gray-50/80 px-2 py-1">
            <div className="h-0.5 w-8 rounded-full bg-gray-300" />
          </div>
          <div className="flex-1 space-y-1 overflow-hidden p-1.5">
            {previewBlocks.map((block) => (
              <MiniBlock key={block.id} block={block} compact />
            ))}
            {remaining > 0 && (
              <p className="pt-0.5 text-center text-[7px] font-medium text-gray-400">
                +{remaining} block{remaining === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative aspect-[5/6] w-full overflow-hidden rounded-xl border border-gray-200/80 bg-gradient-to-b from-[#eef0f3] to-[#e4e7eb] p-3">
      <div className="mx-auto flex h-full w-full max-w-[148px] flex-col overflow-hidden rounded-lg border border-gray-200/90 bg-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.25)]">
        <div className="border-b border-gray-100 bg-gray-50/80 px-2 py-1">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        <div className="flex-1 space-y-1 overflow-hidden p-1.5">
          {previewBlocks.map((block) => (
            <MiniBlock key={block.id} block={block} />
          ))}
          {remaining > 0 && (
            <p className="pt-0.5 text-center text-[7px] font-medium text-gray-400">
              +{remaining} block{remaining === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
