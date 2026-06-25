import { ConditionBuilderPanel } from "@/components/prompt-builder/ConditionBuilderPanel"
import { EditableDataTable } from "@/components/prompt-builder/EditableDataTable"
import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import {
  useCanEditBlockContent,
  useCanEditBlockStructure,
  useIsAdminPreview,
  useIsPreviewMode,
} from "@/hooks/use-builder-editor-mode"
import {
  describeConditionRulesShort,
  hasConditions,
} from "@/lib/segment-conditions"
import {
  getSegmentText,
  isTermsTableSegment,
  normalizeTermsTableSegment,
  textSegmentToTable,
} from "@/lib/terms-segments"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BlockDisplayCondition, ConditionalSegment } from "@/types/prompt-builder"
import { segmentMatches } from "@/types/prompt-builder"
import { Filter, GitBranch, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  blockId: string
  segment: ConditionalSegment
  canRemove: boolean
  dense?: boolean
  /** When the T&C block uses the table variant, text segments render as tables. */
  termsVariant?: string
  /** Subtle highlight when this clause competes with another conditional clause. */
  isOverlapping?: boolean
}

function SegmentChrome({
  blockId,
  segment,
  canRemove,
  isConditional,
  conditionSummary,
  condition,
  setCondition,
  showConditionBanner = true,
  isOverlapping = false,
  children,
}: {
  blockId: string
  segment: ConditionalSegment
  canRemove: boolean
  isConditional: boolean
  conditionSummary: string
  condition: BlockDisplayCondition
  setCondition: (next: BlockDisplayCondition) => void
  showConditionBanner?: boolean
  isOverlapping?: boolean
  children: React.ReactNode
}) {
  const canEditStructure = useCanEditBlockStructure()
  const removeSegment = usePromptBuilderStore((s) => s.removeSegment)
  const [conditionOpen, setConditionOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      className={`group/segment relative w-full min-w-0 rounded-lg border px-1 py-1 transition-all ${
        isOverlapping
          ? "border-amber-200/80 bg-amber-50/45 ring-1 ring-inset ring-amber-100/90"
          : "border-transparent"
      } hover:border-blue-300 hover:bg-white hover:shadow-[0_4px_16px_-4px_rgba(37,99,235,0.18)] hover:ring-1 hover:ring-blue-100 ${
        isConditional && !isOverlapping
          ? "hover:border-amber-300 hover:ring-amber-100"
          : isConditional
            ? "hover:border-amber-300/90 hover:bg-amber-50/60 hover:ring-amber-100"
            : ""
      }`}
      title={
        isOverlapping
          ? "Competes with another conditional clause — first match in list order wins"
          : undefined
      }
    >
      {canEditStructure && (
        <div
          ref={menuRef}
          className="pointer-events-none absolute right-1 top-1 z-20 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/segment:opacity-100 group-focus-within/segment:opacity-100"
        >
          <div className="pointer-events-auto relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setConditionOpen((v) => !v)
              }}
              className={`flex items-center gap-1 rounded-md border bg-white px-1.5 py-0.5 text-[10px] font-medium shadow-sm ${
                isConditional
                  ? "border-amber-200 text-amber-800 hover:bg-amber-50"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="size-3" />
              {isConditional ? "Condition" : "Add condition"}
            </button>
            {conditionOpen && (
              <div className="pointer-events-auto absolute right-0 top-full z-30 mt-1">
                <ConditionBuilderPanel
                  title="Show content"
                  rules={condition}
                  onChange={(next) => {
                    setCondition(next)
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
              className="pointer-events-auto rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:bg-gray-50 hover:text-gray-600"
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
              className="pointer-events-auto rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Remove content"
              aria-label="Remove content"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      )}

      {isConditional && showConditionBanner && (
        <div className="mb-1.5 flex items-center gap-1.5">
          <GitBranch className="size-3 shrink-0 text-amber-600" aria-hidden />
          <span className="truncate text-[9px] font-medium text-amber-800">
            {conditionSummary}
          </span>
        </div>
      )}

      {children}
    </div>
  )
}

export function ConditionalSegmentCard({
  blockId,
  segment,
  canRemove,
  dense = true,
  termsVariant = "dense",
  isOverlapping = false,
}: Props) {
  const isPreview = useIsPreviewMode()
  const isAdminPreview = useIsAdminPreview()
  const canEdit = useCanEditBlockContent(blockId)
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const updateSegment = usePromptBuilderStore((s) => s.updateSegment)

  const condition = segment.condition
  const isConditional = hasConditions(condition)
  const conditionSummary = describeConditionRulesShort(condition)
  const isTableVariant = termsVariant === "table"
  const isTable =
    isTermsTableSegment(segment) ||
    (isTableVariant && !isTermsTableSegment(segment))
  const tableSegment = isTermsTableSegment(segment)
    ? normalizeTermsTableSegment(segment)
    : isTableVariant
      ? textSegmentToTable(segment as Extract<ConditionalSegment, { kind?: "text" }>)
      : null

  const setCondition = (next: BlockDisplayCondition) => {
    updateSegment(blockId, segment.id, { condition: next })
  }

  const persistTableUpdate = (
    patch: Partial<Pick<Extract<ConditionalSegment, { kind: "table" }>, "headers" | "rows">>,
  ) => {
    if (isTermsTableSegment(segment)) {
      updateSegment(
        blockId,
        segment.id,
        normalizeTermsTableSegment({ ...segment, ...patch }),
      )
      return
    }
    updateSegment(blockId, segment.id, {
      ...textSegmentToTable(segment as Extract<ConditionalSegment, { kind?: "text" }>),
      ...patch,
      headers: [],
    })
  }

  if (isPreview && !segmentMatches(segment, activeScenario)) return null

  if (isAdminPreview) {
    const conditionalBadge = isConditional ? (
      <div className="mb-1 flex items-center gap-1.5">
        <GitBranch className="size-3 shrink-0 text-amber-600" aria-hidden />
        <span className="text-[9px] font-medium text-amber-800">{conditionSummary}</span>
      </div>
    ) : null

    if (isTable && tableSegment) {
      return (
        <div>
          {conditionalBadge}
          <table className="w-full table-fixed border-collapse text-[10px]">
            <tbody>
              {tableSegment.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b border-gray-100">
                  <td className="py-1 pl-2 text-gray-800">{row[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    return (
      <div>
        {conditionalBadge}
        <p className="text-[10px] leading-relaxed text-gray-700">
          {getSegmentText(segment)}
        </p>
      </div>
    )
  }

  return (
    <SegmentChrome
      blockId={blockId}
      segment={segment}
      canRemove={canRemove}
      isConditional={isConditional}
      conditionSummary={conditionSummary}
      condition={condition}
      setCondition={setCondition}
      showConditionBanner={isTable}
      isOverlapping={isOverlapping}
    >
      {isTable && tableSegment ? (
        <EditableDataTable
          blockId={blockId}
          headers={tableSegment.headers}
          rows={tableSegment.rows}
          variant={tableSegment.tableVariant ?? "standard"}
          dense={dense}
          onHeadersChange={(headers) => persistTableUpdate({ headers })}
          onRowsChange={(rows) => persistTableUpdate({ rows })}
        />
      ) : (
        <div className="flex items-start gap-2">
          {isConditional && (
            <GitBranch
              className="mt-0.5 size-3 shrink-0 text-amber-600"
              aria-label={conditionSummary}
            />
          )}
          <InlineEditable
            blockId={blockId}
            value={getSegmentText(segment)}
            onChange={(text) => updateSegment(blockId, segment.id, { text })}
            readOnly={!canEdit}
            multiline
            width="full"
            placeholder="Enter terms content…"
            className="min-h-[2rem] min-w-0 flex-1 text-[10px] leading-relaxed text-gray-700"
          />
        </div>
      )}
    </SegmentChrome>
  )
}
