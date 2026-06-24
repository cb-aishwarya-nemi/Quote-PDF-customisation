import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { ConditionalSegmentCard } from "@/components/prompt-builder/ConditionalSegmentCard"
import { useCanEditBlockStructure, useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import { staticLabel, DEFAULT_LABELS } from "@/lib/block-static-labels"
import {
  createConditionalTableSegment,
  createConditionalTextSegment,
  createTableSegment,
  createTextSegment,
} from "@/lib/terms-segments"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock, ConditionalSegment } from "@/types/prompt-builder"
import { segmentMatches } from "@/types/prompt-builder"
import { GitBranch, Plus, Table2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  block: BuilderBlock
  onField?: (field: string, value: string) => void
}

export function TermsBlockView({ block, onField }: Props) {
  const isPreview = useIsPreviewMode()
  const canEditStructure = useCanEditBlockStructure()
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const setField = onField ?? ((field, value) => updateBlockField(block.id, field, value))

  const c = block.content
  const blockVariant = String(c.variant ?? "dense")
  const isTableVariant = blockVariant === "table"
  const allSegments = (c.segments as ConditionalSegment[]) ?? []
  const segments = isPreview
    ? allSegments.filter((seg) => segmentMatches(seg, activeScenario))
    : allSegments
  const sectionLabel = staticLabel(c, "sectionLabel", DEFAULT_LABELS.terms.sectionLabel)

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
      ) : (
        <div className="space-y-3">
          {segments.map((seg) => (
            <ConditionalSegmentCard
              key={seg.id}
              blockId={block.id}
              segment={seg}
              canRemove={allSegments.length > 1}
              dense={!isTableVariant}
              termsVariant={blockVariant}
            />
          ))}
        </div>
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
