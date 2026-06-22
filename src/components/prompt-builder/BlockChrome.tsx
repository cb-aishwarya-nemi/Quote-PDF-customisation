import { ConditionBuilderPanel } from "@/components/prompt-builder/ConditionBuilderPanel"
import { HeaderBackgroundControls } from "@/components/prompt-builder/HeaderBackgroundControls"
import { VariantPicker } from "@/components/prompt-builder/VariantPicker"
import { useBlockLayoutHints } from "@/hooks/use-block-layout-hints"
import { useCanEditBlockStructure, useIsSalesMode, useIsTemplateEditMode } from "@/hooks/use-builder-editor-mode"
import { isBlockLocked } from "@/lib/block-lock"
import {
  describeConditionRulesShort,
  hasConditions,
  normalizeConditionRules,
} from "@/lib/segment-conditions"
import { BLOCK_VARIANTS, getVariantLabel } from "@/lib/block-variants"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BlockDisplayCondition, BuilderBlock } from "@/types/prompt-builder"
import { Filter, GripVertical, LayoutGrid, Lock, Trash2, TriangleAlert, Unlock, X } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode, type HTMLAttributes } from "react"

type Props = {
  block: BuilderBlock
  children: ReactNode
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
  isDragging?: boolean
}

export function BlockChrome({
  block,
  children,
  dragHandleProps,
  isDragging,
}: Props) {
  const selectedBlockId = usePromptBuilderStore((s) => s.selectedBlockId)
  const setSelectedBlockId = usePromptBuilderStore((s) => s.setSelectedBlockId)
  const removeBlock = usePromptBuilderStore((s) => s.removeBlock)
  const setBlockDisplayCondition = usePromptBuilderStore(
    (s) => s.setBlockDisplayCondition,
  )
  const setBlockLocked = usePromptBuilderStore((s) => s.setBlockLocked)

  const isTemplateEdit = useIsTemplateEditMode()
  const isSales = useIsSalesMode()
  const canEditStructure = useCanEditBlockStructure()

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
  const isLocked = isBlockLocked(block.content)
  const layoutHints = useBlockLayoutHints(block.id)
  const hasLayoutHint = isTemplateEdit && layoutHints.length > 0

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

  const showAdminControls = canEditStructure

  return (
    <div className={`group/block relative ${isDragging ? "opacity-95" : ""}`}>
      {showAdminControls && dragHandleProps && (
        <button
          type="button"
          className="absolute left-0 top-3 flex w-5 -translate-x-full cursor-grab items-center justify-center pr-1 text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover/block:opacity-100 active:cursor-grabbing"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          {...dragHandleProps}
        >
          <GripVertical className="size-4" />
        </button>
      )}

      <div
        ref={menuRef}
        className={`relative min-w-0 rounded-xl border bg-white transition-all ${
          isSelected
            ? "border-blue-400 ring-2 ring-blue-100"
            : hasLayoutHint
              ? "border-amber-300 ring-2 ring-amber-100"
              : isLocked && isSales
                ? "border-slate-300 bg-slate-50/40"
                : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        }`}
        onClick={() => setSelectedBlockId(block.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter") setSelectedBlockId(block.id)
        }}
        role="button"
        tabIndex={0}
      >
        {showAdminControls && (
          <div className="pointer-events-none absolute right-2 top-2 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover/block:opacity-100 group-focus-within/block:opacity-100">
            {hasVariants && (
              <div className="relative pointer-events-auto">
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
                  <div className="pointer-events-auto absolute right-0 top-full z-20 mt-1">
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

            <div className="group/condition relative pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setConditionOpen((v) => !v)
                  setVariantOpen(false)
                }}
                className={`rounded-md border p-1 shadow-sm ${
                  hasCondition
                    ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100/80"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                aria-label={hasCondition ? "Condition set" : "Add condition"}
              >
                <Filter className="size-3.5" />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max max-w-[240px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium leading-snug text-slate-700 shadow-md group-hover/condition:block"
              >
                {hasCondition
                  ? `Shows when ${conditionSummary}`
                  : "Add condition"}
              </span>
              {conditionOpen && (
                <div className="pointer-events-auto absolute right-0 top-full z-30 mt-1">
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

            {block.type === "quote_summary_header" && (
              <div className="pointer-events-auto">
                <HeaderBackgroundControls block={block} />
              </div>
            )}

            <div className="group/lock relative pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setBlockLocked(block.id, !isLocked)
                }}
                className={`rounded-md border p-1 shadow-sm ${
                  isLocked
                    ? "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
                aria-label={isLocked ? "Unlock block" : "Lock block"}
              >
                {isLocked ? (
                  <Lock className="size-3.5" />
                ) : (
                  <Unlock className="size-3.5" />
                )}
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max max-w-[240px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium leading-snug text-slate-700 shadow-md group-hover/lock:block"
              >
                {isLocked
                  ? "Locked for Sales at quote creation"
                  : "Lock — Sales cannot edit at quote creation"}
              </span>
            </div>

            <div className="group/delete relative pointer-events-auto">
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
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-md group-hover/delete:block"
              >
                Delete block
              </span>
            </div>
          </div>
        )}

        {!isLocked && hasCondition && (
          <div
            className={`flex items-center gap-1 border-b border-amber-100/90 bg-amber-50/35 px-3 py-0.5 ${
              hasLayoutHint ? "" : "rounded-t-xl"
            }`}
          >
            <Filter className="size-2.5 shrink-0 text-amber-500/80" strokeWidth={2} />
            <span className="min-w-0 flex-1 truncate text-[9px] leading-tight text-amber-800/85">
              Shows when {conditionSummary}
            </span>
            {isTemplateEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setBlockDisplayCondition(block.id, null)
                }}
                className="shrink-0 rounded p-0.5 text-amber-500/70 opacity-0 transition-opacity hover:bg-amber-100/60 hover:text-amber-700 group-hover/block:opacity-100"
                aria-label="Remove condition"
              >
                <X className="size-2.5" />
              </button>
            )}
          </div>
        )}

        {hasLayoutHint && (
          <div
            className={`flex items-start gap-1.5 border-b border-amber-200 bg-amber-50 px-3 py-1.5 ${
              !isLocked && hasCondition ? "" : "rounded-t-xl"
            }`}
          >
            <TriangleAlert className="mt-px size-3 shrink-0 text-amber-600" />
            <div className="min-w-0 space-y-0.5">
              {layoutHints.map((hint) => (
                <p
                  key={hint.issueId}
                  className="text-[10px] font-medium leading-snug text-amber-900"
                >
                  {hint.canvasMessage}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
