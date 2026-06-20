import {
  variantBlockLabel,
  variantBlocksForPreview,
  VariantMiniBlockVisual,
} from "@/components/templates/GeneratedVariantPreview"

type Props = {
  variantId: string
  compact?: boolean
}

export function VariantLayoutPreview({ variantId, compact }: Props) {
  const blocks = variantBlocksForPreview(variantId)

  return (
    <div
      className={`mx-auto overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.03] ${
        compact ? "w-full max-w-[120px]" : "w-[148px] shrink-0"
      }`}
      aria-hidden
    >
      {!compact && (
        <div className="border-b border-gray-100 bg-gray-50 px-2 py-1">
          <p className="text-[8px] font-medium uppercase tracking-wide text-gray-400">
            Layout preview
          </p>
        </div>
      )}
      <div className={`space-y-1 ${compact ? "p-1.5" : "space-y-1.5 p-2"}`}>
        {blocks.map((type) => (
          <div
            key={type}
            className="rounded border border-gray-100 bg-white px-1.5 py-1"
          >
            <p className="text-[7px] font-semibold uppercase tracking-wide text-gray-400">
              {variantBlockLabel(variantId, type)}
            </p>
            <div className="mt-0.5">
              <VariantMiniBlockVisual variantId={variantId} type={type} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
