import { ConditionBuilderPanel } from "@/components/prompt-builder/ConditionBuilderPanel"
import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { useCanEditBlockContent, useCanEditBlockStructure, useIsAdminPreview, useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import {
  describeConditionRulesShort,
  hasConditions,
  normalizeConditionRules,
} from "@/lib/segment-conditions"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BlockDisplayCondition, ConditionalSegment } from "@/types/prompt-builder"
import { segmentMatches } from "@/types/prompt-builder"
import { Filter, GitBranch, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  blockId: string
  segment: ConditionalSegment
  canRemove: boolean
  variant?: "standard" | "numbered" | "legal"
}

export function ConditionalSegmentCard({
  blockId,
  segment,
  canRemove,
  variant = "standard",
}: Props) {
  const isPreview = useIsPreviewMode()
  const isAdminPreview = useIsAdminPreview()
  const canEdit = useCanEditBlockContent(blockId)
  const canEditStructure = useCanEditBlockStructure()
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const updateSegment = usePromptBuilderStore((s) => s.updateSegment)
  const removeSegment = usePromptBuilderStore((s) => s.removeSegment)

  const [conditionOpen, setConditionOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const visible = isPreview && segmentMatches(segment, activeScenario)
  const condition = segment.condition
  const isConditional = hasConditions(condition)
  const conditionSummary = describeConditionRulesShort(condition)

  useEffect(() => {
    if (!conditionOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setConditionOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [conditionOpen])

  const setCondition = (next: BlockDisplayCondition) => {
    updateSegment(blockId, segment.id, { condition: next })
  }

  if (isPreview && !visible) return null

  if (isAdminPreview) {
    return (
      <div
        className={`leading-relaxed text-gray-700 ${
          variant === "legal" ? "text-[10px] leading-relaxed" : "text-[11px]"
        }`}
      >
        {segment.text}
      </div>
    )
  }

  return (
    <div
      className={`group/segment transition-all ${
        variant === "legal"
          ? "border-0 bg-transparent"
          : `rounded-lg border ${
              isConditional
                ? "border-amber-200 bg-amber-50/50"
                : variant === "numbered"
                  ? "border-gray-200 bg-white shadow-sm"
                  : "border-gray-200 bg-white"
            }`
      }`}
    >
      {variant !== "legal" ? (
        <div className="flex items-start gap-2 rounded-t-lg border-b border-gray-100/80 px-2.5 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            {isConditional ? (
              <GitBranch className="size-3 shrink-0 text-amber-600" />
            ) : null}
            <span
              className={`truncate text-[10px] font-medium ${
                isConditional ? "text-amber-800" : "text-gray-500"
              }`}
            >
              {isConditional ? conditionSummary : "Always shown"}
            </span>
          </div>

          <div
            ref={menuRef}
            className={`flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/segment:opacity-100 group-focus-within/segment:opacity-100 ${
              canEditStructure ? "" : "hidden"
            }`}
          >
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setConditionOpen((v) => !v)
                }}
                className={`flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                  isConditional
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter className="size-3" />
                {isConditional ? "Condition" : "Add condition"}
              </button>
              {conditionOpen && (
                <div className="absolute right-0 top-full z-30 mt-1">
                  <ConditionBuilderPanel
                    title="Show content when"
                    rules={normalizeConditionRules(condition)}
                    onChange={(rules) => {
                      setCondition(rules)
                    }}
                  />
                </div>
              )}
            </div>

            {isConditional && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setCondition(null)
                }}
                className="rounded border border-gray-200 bg-white p-0.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                title="Remove condition"
                aria-label="Remove condition"
              >
                <X className="size-3" />
              </button>
            )}

            {canRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeSegment(blockId, segment.id)
                }}
                className="rounded border border-gray-200 bg-white p-0.5 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                title="Remove content"
                aria-label="Remove content"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
        </div>
      ) : isConditional ? (
        <div className="mb-1 flex items-center gap-1.5 opacity-80">
          <GitBranch className="size-2.5 text-amber-600" />
          <span className="text-[9px] font-medium text-amber-800">
            {conditionSummary}
          </span>
        </div>
      ) : null}

      <div className={variant === "legal" ? "px-0 py-0" : "px-3 py-2"}>
        <InlineEditable
          blockId={blockId}
          value={segment.text}
          onChange={(text) => updateSegment(blockId, segment.id, { text })}
          readOnly={!canEdit}
          multiline
          placeholder="Enter terms content…"
          className={`min-h-[2.5rem] leading-relaxed text-gray-700 ${
            variant === "legal"
              ? "text-[10px] leading-relaxed"
              : "text-[11px]"
          }`}
        />
      </div>
    </div>
  )
}
