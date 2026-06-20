import { VariantLayoutPreview } from "@/components/templates/VariantLayoutPreview"
import { variantBlockLabel, variantBlocksForPreview } from "@/components/templates/GeneratedVariantPreview"
import type { GeneratedVariant } from "@/mock/data"

type Props = {
  variant: GeneratedVariant
  index: number
}

export function GeneratedVariantResultCard({ variant, index }: Props) {
  const sections = variantBlocksForPreview(variant.id).map((type) =>
    variantBlockLabel(variant.id, type),
  )

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-3">
        <VariantLayoutPreview variantId={variant.id} compact />
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-medium text-violet-600">
          Variant {index + 1}
        </p>
        <h3 className="mt-0.5 text-[13px] font-semibold leading-snug text-gray-900">
          {variant.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
          {variant.sourceNote}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {variant.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>

        <ul className="mt-2.5 space-y-0.5 border-t border-gray-100 pt-2">
          {sections.map((label) => (
            <li key={label} className="flex gap-1 text-[10px] text-gray-500">
              <span className="text-gray-300">·</span>
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
