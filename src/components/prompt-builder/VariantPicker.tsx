import { VariantPreviewThumb } from "@/components/prompt-builder/variants/VariantPreviewThumb"
import { BLOCK_VARIANTS } from "@/lib/block-variants"
import type { BuilderBlockType } from "@/types/prompt-builder"
import { Check } from "lucide-react"

type Props = {
  blockType: BuilderBlockType
  activeVariantId: string
  onSelect: (variantId: string) => void
}

export function VariantPicker({
  blockType,
  activeVariantId,
  onSelect,
}: Props) {
  const variants = BLOCK_VARIANTS[blockType]

  return (
    <div className="w-72 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
      <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Layout variants
      </p>
      <div className="space-y-1">
        {variants.map((v) => {
          const selected = v.id === activeVariantId
          return (
            <button
              key={v.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onSelect(v.id)
              }}
              className={`flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                selected
                  ? "border-cb-orange/60 bg-cb-orange/[0.06]"
                  : "border-transparent hover:bg-gray-50"
              }`}
            >
              <VariantPreviewThumb
                blockType={blockType}
                variantId={v.id}
                selected={selected}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold text-gray-900">
                    {v.label}
                  </span>
                  {selected && (
                    <Check
                      className="size-3.5 shrink-0 text-cb-orange"
                      strokeWidth={2.5}
                    />
                  )}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
                  {v.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
