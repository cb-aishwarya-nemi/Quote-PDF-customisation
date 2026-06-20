import { VariantLayoutPreview } from "@/components/templates/VariantLayoutPreview"
import { BusinessProfileSnapshot } from "@/components/templates/BusinessProfileSnapshot"
import type { BestMatchTemplate } from "@/mock/data"
import { mockBusinessProfile } from "@/mock/data"
import { Sparkles } from "lucide-react"

type Props = {
  match: BestMatchTemplate
  onUse: () => void
  onBrowseAll: () => void
}

function previewVariantIdForPreset(presetId: string): string {
  if (presetId === "preset-header-led") return "v2"
  if (presetId === "preset-standard") return "v1"
  return "v3"
}

export function BestMatchResultCard({ match, onUse, onBrowseAll }: Props) {
  const previewVariantId = previewVariantIdForPreset(match.presetId)

  return (
    <div className="overflow-hidden rounded-xl border-2 border-violet-200 bg-gradient-to-b from-violet-50/80 to-white">
      <div className="flex items-center gap-2 border-b border-violet-100 px-4 py-2.5">
        <Sparkles className="size-4 text-violet-600" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-violet-700">
          Best match for your business
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <VariantLayoutPreview variantId={previewVariantId} />
        </div>

        <div>
          <h3 className="text-[16px] font-semibold text-gray-900">{match.name}</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600">
            {match.matchSummary}
          </p>
          <div className="mt-3">
            <BusinessProfileSnapshot profile={mockBusinessProfile} compact />
          </div>
          <ul className="mt-3 space-y-1">
            {match.matchReasons.map((reason) => (
              <li
                key={reason}
                className="flex gap-2 text-[11px] leading-snug text-gray-600"
              >
                <span className="text-violet-400">·</span>
                {reason}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-1">
            {match.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-violet-100 px-4 py-3">
        <button
          type="button"
          onClick={onBrowseAll}
          className="text-[12px] font-medium text-gray-500 hover:text-gray-700"
        >
          Browse all recommendations
        </button>
        <button
          type="button"
          onClick={onUse}
          className="rounded-md bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800"
        >
          Use this template
        </button>
      </div>
    </div>
  )
}
