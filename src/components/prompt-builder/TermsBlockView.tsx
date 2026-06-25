import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { ConditionalSegmentCard } from "@/components/prompt-builder/ConditionalSegmentCard"
import { useCanEditBlockStructure, useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import { staticLabel, DEFAULT_LABELS } from "@/lib/block-static-labels"
import {
  analyzeTermsConditionalOverlap,
  createConditionalTableSegment,
  createConditionalTextSegment,
  createTableSegment,
  createTextSegment,
  findOverlappingTermsSegmentIds,
  resolveTermsSegmentsForScenario,
  TERMS_SEGMENT_DRAG_SOURCE,
} from "@/lib/terms-segments"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock, ConditionalSegment } from "@/types/prompt-builder"
import { PREVIEW_SCENARIOS } from "@/types/prompt-builder"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GitBranch, GripVertical, Plus, Table2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

type Props = {
  block: BuilderBlock
  onField?: (field: string, value: string) => void
}

type SortableSegmentProps = {
  blockId: string
  segment: ConditionalSegment
  canReorder: boolean
  canRemove: boolean
  dense: boolean
  termsVariant: string
  isOverlapping: boolean
}

function SortableTermsSegment({
  blockId,
  segment,
  canReorder,
  canRemove,
  dense,
  termsVariant,
  isOverlapping,
}: SortableSegmentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: segment.id,
    disabled: !canReorder,
    data: {
      source: TERMS_SEGMENT_DRAG_SOURCE,
      blockId,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-1 ${
        isDragging ? "relative z-10 opacity-90" : ""
      }`}
    >
      {canReorder && (
        <button
          type="button"
          className="mt-1 flex size-5 shrink-0 cursor-grab touch-none items-center justify-center text-gray-300 opacity-0 transition-all hover:text-gray-600 active:cursor-grabbing group-hover/terms-segments:opacity-100"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <ConditionalSegmentCard
          blockId={blockId}
          segment={segment}
          canRemove={canRemove}
          dense={dense}
          termsVariant={termsVariant}
          isOverlapping={isOverlapping}
        />
      </div>
    </div>
  )
}

export function TermsBlockView({ block, onField }: Props) {
  const isPreview = useIsPreviewMode()
  const canEditStructure = useCanEditBlockStructure()
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const ignoredValidationIssueIds = usePromptBuilderStore(
    (s) => s.ignoredValidationIssueIds,
  )
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const setField = onField ?? ((field, value) => updateBlockField(block.id, field, value))

  const c = block.content
  const blockVariant = String(c.variant ?? "dense")
  const isTableVariant = blockVariant === "table"
  const allSegments = (c.segments as ConditionalSegment[]) ?? []
  const segments = isPreview
    ? resolveTermsSegmentsForScenario(allSegments, activeScenario)
    : allSegments
  const sectionLabel = staticLabel(c, "sectionLabel", DEFAULT_LABELS.terms.sectionLabel)
  const canReorderSegments =
    canEditStructure && !isPreview && allSegments.length > 1

  const overlappingSegmentIds = useMemo(() => {
    if (isPreview) return new Set<string>()
    if (ignoredValidationIssueIds.includes("terms-conditional-overlap")) {
      return new Set<string>()
    }
    const overlap = analyzeTermsConditionalOverlap(allSegments, PREVIEW_SCENARIOS)
    if (!overlap.hasOverlap) return new Set<string>()
    return findOverlappingTermsSegmentIds(allSegments, PREVIEW_SCENARIOS)
  }, [allSegments, ignoredValidationIssueIds, isPreview])

  const addSegment = usePromptBuilderStore((s) => s.addSegment)
  const [addOpen, setAddOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!addOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAddOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [addOpen])

  const handleAdd = (segment: ConditionalSegment) => {
    addSegment(block.id, segment)
    setAddOpen(false)
  }

  const segmentList = (
    <div className="group/terms-segments space-y-3">
      {segments.map((seg) => (
        <SortableTermsSegment
          key={seg.id}
          blockId={block.id}
          segment={seg}
          canReorder={canReorderSegments}
          canRemove={allSegments.length > 1}
          dense={!isTableVariant}
          termsVariant={blockVariant}
          isOverlapping={overlappingSegmentIds.has(seg.id)}
        />
      ))}
    </div>
  )

  return (
    <div className="w-full min-w-0 space-y-2">
      <SectionLabel
        blockId={block.id}
        value={sectionLabel}
        onChange={(v) => setField("sectionLabel", v)}
        className={isTableVariant ? "" : "text-[9px] tracking-widest"}
      />

      {segments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-center">
          {isPreview ? (
            <p className="text-[12px] text-gray-500">
              No terms content for this scenario.
            </p>
          ) : (
            <>
              <InlineEditable
                blockId={block.id}
                value={String(
                  c.emptyHint ??
                    (isTableVariant
                      ? "No terms table yet."
                      : "No terms content yet."),
                )}
                onChange={(v) => setField("emptyHint", v)}
                className="text-[12px] text-gray-500"
              />
              <InlineEditable
                blockId={block.id}
                value={String(
                  c.emptySubhint ??
                    (isTableVariant
                      ? "Add a table — optionally scoped to region or payment terms."
                      : "Add paragraphs or tables — optionally scoped to region or payment terms."),
                )}
                onChange={(v) => setField("emptySubhint", v)}
                className="mt-1 text-[11px] text-gray-400"
              />
            </>
          )}
        </div>
      ) : canReorderSegments ? (
        <SortableContext
          items={allSegments.map((seg) => seg.id)}
          strategy={verticalListSortingStrategy}
        >
          {segmentList}
        </SortableContext>
      ) : (
        segmentList
      )}

      {canEditStructure && (
        <div ref={menuRef} className="relative pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setAddOpen((v) => !v)
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 py-2 text-[11px] font-medium text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700"
          >
            <Plus className="size-3.5" />
            Add content
          </button>

          {addOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
              {!isTableVariant && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAdd(createTextSegment("Add terms content here."))
                    }}
                    className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-gray-50"
                  >
                    <Plus className="mt-0.5 size-3.5 shrink-0 text-gray-500" />
                    <div>
                      <p className="text-[12px] font-medium text-gray-800">Paragraph</p>
                      <p className="text-[10px] text-gray-500">
                        Always included in the quote
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAdd(createConditionalTextSegment())
                    }}
                    className="mt-1 flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-amber-50/60"
                  >
                    <GitBranch className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-[12px] font-medium text-gray-800">
                        Conditional paragraph
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Shown only when a scenario matches
                      </p>
                    </div>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAdd(createTableSegment())
                }}
                className={`flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-gray-50 ${
                  !isTableVariant ? "mt-1" : ""
                }`}
              >
                <Table2 className="mt-0.5 size-3.5 shrink-0 text-gray-500" />
                <div>
                  <p className="text-[12px] font-medium text-gray-800">Table</p>
                  <p className="text-[10px] text-gray-500">
                    Always included in the quote
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleAdd(createConditionalTableSegment())
                }}
                className="mt-1 flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-amber-50/60"
              >
                <GitBranch className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-[12px] font-medium text-gray-800">
                    Conditional table
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Shown only when a scenario matches
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
