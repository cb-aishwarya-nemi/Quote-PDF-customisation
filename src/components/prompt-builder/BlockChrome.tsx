import { ConditionBuilderPanel } from "@/components/prompt-builder/ConditionBuilderPanel"
import { VariantPicker } from "@/components/prompt-builder/VariantPicker"
import {
  describeConditionRulesShort,
  hasConditions,
  normalizeConditionRules,
} from "@/lib/segment-conditions"
import { BLOCK_VARIANTS, getVariantLabel } from "@/lib/block-variants"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BlockDisplayCondition, BuilderBlock } from "@/types/prompt-builder"
import {
  Filter,
  GripVertical,
  LayoutGrid,
  Trash2,
  X,
} from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

type Props = {
  block: BuilderBlock
  children: ReactNode
}

export function BlockChrome({ block, children }: Props) {
  const selectedBlockId = usePromptBuilderStore((s) => s.selectedBlockId)
  const setSelectedBlockId = usePromptBuilderStore((s) => s.setSelectedBlockId)
  const removeBlock = usePromptBuilderStore((s) => s.removeBlock)
  const setBlockDisplayCondition = usePromptBuilderStore(
    (s) => s.setBlockDisplayCondition,
  )

  const [conditionOpen, setConditionOpen] = useState(false)
  const [variantOpen, setVariantOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isSelected = selectedBlockId === block.id
  const variantId = String(block.content.variant ?? "classic")
  const variantLabel = getVariantLabel(block.type, variantId)
  const hasVariants = BLOCK_VARIANTS[block.type].length > 1
  const displayCondition = (block.content.displayCondition ??
    null) as BlockDisplayCondition
  const hasCondition = hasConditions(displayCondition)
  const conditionSummary = describeConditionRulesShort(displayCondition)

  useEffect(() => {
    if (!conditionOpen && !variantOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setConditionOpen(false)
        setVariantOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [conditionOpen, variantOpen])

  return (
    <div className="group/block relative">
      <button
        type="button"
        className="absolute -left-6 top-3 flex w-5 cursor-grab items-center justify-center text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover/block:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="size-4" />
      </button>

      <div
        ref={menuRef}
        className={`relative min-w-0 rounded-xl border bg-white transition-all ${
          isSelected
            ? "border-blue-400 ring-2 ring-blue-100"
            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
        onClick={() => setSelectedBlockId(block.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setSelectedBlockId(block.id)
        }}
        role="button"
        tabIndex={0}
      >
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover/block:opacity-100">
          {hasVariants && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setVariantOpen((v) => !v)
                  setConditionOpen(false)
                }}
                className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm hover:bg-gray-50"
              >
                <LayoutGrid className="size-3" />
                {variantLabel}
              </button>
              {variantOpen && (
                <div className="absolute right-0 top-full z-20 mt-1">
                  <VariantPicker
                    blockType={block.type}
                    activeVariantId={variantId}
                    onSelect={(id) => {
                      usePromptBuilderStore
                        .getState()
                        .setBlockVariant(block.id, id)
                      setVariantOpen(false)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setConditionOpen((v) => !v)
                setVariantOpen(false)
              }}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium shadow-sm ${
                hasCondition
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="size-3" />
              {hasCondition ? "Condition set" : "Add condition"}
            </button>
            {conditionOpen && (
              <div className="absolute right-0 top-full z-30 mt-1">
                <ConditionBuilderPanel
                  title="Show block when"
                  rules={normalizeConditionRules(displayCondition)}
                  onChange={(rules) => {
                    setBlockDisplayCondition(block.id, rules)
                  }}
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeBlock(block.id)
            }}
            className="rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete block"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        {hasCondition && (
          <div className="flex items-center gap-1 border-b border-amber-100 bg-amber-50/80 px-3 py-1">
            <Filter className="size-3 shrink-0 text-amber-600" />
            <span className="min-w-0 truncate text-[10px] font-medium text-amber-800">
              Shows when {conditionSummary}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setBlockDisplayCondition(block.id, null)
              }}
              className="ml-1 shrink-0 rounded p-0.5 text-amber-600 hover:bg-amber-100"
              aria-label="Remove condition"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
