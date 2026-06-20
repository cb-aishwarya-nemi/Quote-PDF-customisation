import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { ConditionalSegmentCard } from "@/components/prompt-builder/ConditionalSegmentCard"
import { useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import { createId } from "@/lib/create-id"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import { createConditionRule } from "@/lib/segment-conditions"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock, ConditionalSegment } from "@/types/prompt-builder"
import { segmentMatches } from "@/types/prompt-builder"
import { GitBranch, Plus } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  block: BuilderBlock
  onField?: (field: string, value: string) => void
}

export function TermsBlockView({ block, onField }: Props) {
  const isPreview = useIsPreviewMode()
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const setField = onField ?? ((field, value) => updateBlockField(block.id, field, value))

  const c = block.content
  const allSegments = (c.segments as ConditionalSegment[]) ?? []
  const segments = isPreview
    ? allSegments.filter((seg) => segmentMatches(seg, activeScenario))
    : allSegments
  const variant = String(c.variant ?? "standard")
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

  const handleAdd = (conditional: boolean) => {
    const segment: ConditionalSegment = {
      id: createId("seg"),
      condition: conditional ? [createConditionRule("customer_region")] : null,
      text: conditional
        ? "Add region-specific terms here."
        : "Add terms content here.",
    }
    addSegment(block.id, segment)
    setAddOpen(false)
  }

  return (
    <div className="space-y-2">
      <SectionLabel
        value={sectionLabel}
        onChange={(v) => setField("sectionLabel", v)}
        className={variant === "legal" ? "text-[9px] tracking-widest" : ""}
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
                value={String(c.emptyHint ?? "No terms content yet.")}
                onChange={(v) => setField("emptyHint", v)}
                className="text-[12px] text-gray-500"
              />
              <InlineEditable
                value={String(
                  c.emptySubhint ??
                    "Add paragraphs — optionally scoped to region or payment terms.",
                )}
                onChange={(v) => setField("emptySubhint", v)}
                className="mt-1 text-[11px] text-gray-400"
              />
            </>
          )}
        </div>
      ) : variant === "legal" ? (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/30 p-4">
          {segments.map((seg, index) => (
            <div key={seg.id}>
              {index > 0 && <div className="mb-3 border-t border-gray-200" />}
              <ConditionalSegmentCard
                blockId={block.id}
                segment={seg}
                canRemove={allSegments.length > 1}
                variant="legal"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className={variant === "numbered" ? "space-y-3" : "space-y-2"}>
          {segments.map((seg, index) => (
            <div key={seg.id} className="flex gap-3">
              {variant === "numbered" && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
                  {index + 1}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <ConditionalSegmentCard
                  blockId={block.id}
                  segment={seg}
                  canRemove={allSegments.length > 1}
                  variant={variant === "numbered" ? "numbered" : "standard"}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isPreview && (
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleAdd(false)
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
                handleAdd(true)
              }}
              className="mt-1 flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-amber-50/60"
            >
              <GitBranch className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-[12px] font-medium text-gray-800">
                  Conditional paragraph
                </p>
                <p className="text-[10px] text-gray-500">
                  Shown only when a scenario matches — edit condition after adding
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
