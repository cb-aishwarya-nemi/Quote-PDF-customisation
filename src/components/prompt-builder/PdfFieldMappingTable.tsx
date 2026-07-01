import { PdfMappingSectionThumbnail } from "@/components/prompt-builder/PdfMappingSectionPreview"
import { PdfVariablePicker } from "@/components/prompt-builder/PdfVariablePicker"
import {
  groupMappingsForReview,
  mappingNeedsUserInput,
  resolveMappingVariableId,
  summarizeMappingCoverage,
  type PdfFieldMapping,
} from "@/lib/pdf-field-mappings"
import { getVariableCategoryPillClass, mergeFieldToken } from "@/lib/merge-field-html"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { TemplateVariableCategory } from "@/types/prompt-builder"
import {
  AlertCircle,
  ArrowRight,
  CircleCheck,
  Info,
  Pencil,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react"
import { useEffect, useState } from "react"

const THUMBNAIL_COLUMN_WIDTH_CLASS = "w-[68px]"

function VariablePill({
  category,
  variableKey,
  variableLabel,
}: {
  category: TemplateVariableCategory
  variableKey: string
  variableLabel: string
}) {
  return (
    <span
      className={`${getVariableCategoryPillClass(category)} truncate`}
      title={`${variableLabel} · ${mergeFieldToken(variableKey)}`}
    >
      {mergeFieldToken(variableKey)}
    </span>
  )
}

function MappingRow({
  mapping,
  variableId,
  onSelectBlock,
  showBlockLabel = false,
}: {
  mapping: PdfFieldMapping
  variableId: string
  onSelectBlock: (blockId: string) => void
  showBlockLabel?: boolean
}) {
  const remapPdfFieldMapping = usePromptBuilderStore((s) => s.remapPdfFieldMapping)
  const setPdfMappingFeedback = usePromptBuilderStore((s) => s.setPdfMappingFeedback)
  const isUnmapped = mapping.status === "unmapped"
  const needsUserInput = mappingNeedsUserInput(mapping)
  const [isEditing, setIsEditing] = useState(isUnmapped)

  useEffect(() => {
    if (isUnmapped) {
      setIsEditing(true)
      return
    }
    if (mapping.feedback === "down") {
      setIsEditing(true)
      return
    }
    setIsEditing(false)
  }, [isUnmapped, mapping.feedback])

  const rowClass = needsUserInput
    ? "bg-amber-50/70"
    : mapping.feedback === "up"
      ? "bg-emerald-50/20"
      : ""

  const pdfDisplayText = mapping.pdfExcerpt.trim()
  const hasFeedback = mapping.feedback != null

  const handleThumbFeedback = (choice: "up" | "down") => {
    const next = mapping.feedback === choice ? null : choice
    setPdfMappingFeedback(mapping.id, next)
    setIsEditing(next === "down")
  }

  return (
    <li
      className={`group/row transition-colors hover:bg-blue-50/50 ${rowClass}`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3.5">
        <div className="flex w-5 shrink-0 justify-center self-start pt-0.5">
          {needsUserInput ? (
            <Info
              className="size-3.5 text-amber-500"
              strokeWidth={2}
              aria-hidden
            />
          ) : (
            <CircleCheck
              className="size-3.5 text-emerald-600"
              strokeWidth={2}
              aria-hidden
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelectBlock(mapping.blockId)}
          className="min-w-0 text-left"
        >
          {pdfDisplayText ? (
            <p className="text-[12px] leading-relaxed text-gray-600">
              {pdfDisplayText}
            </p>
          ) : (
            <p className="text-[12px] italic leading-relaxed text-gray-400">
              Not found in PDF
            </p>
          )}
          {showBlockLabel && (
            <p className="mt-1 text-[11px] text-gray-400">{mapping.blockLabel}</p>
          )}
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <ArrowRight className="size-3.5 shrink-0 text-gray-300" />

          <div
            className={`relative min-w-0 flex-1 ${isEditing ? "" : "pr-7"}`}
            onClick={(event) => event.stopPropagation()}
          >
            {isEditing ? (
              <PdfVariablePicker
                value={variableId}
                onChange={(nextId) => {
                  if (nextId && nextId !== variableId) {
                    remapPdfFieldMapping(mapping.id, nextId)
                    setIsEditing(false)
                  }
                }}
              />
            ) : (
              <>
                <VariablePill
                  category={mapping.category}
                  variableKey={mapping.variableKey}
                  variableLabel={mapping.variableLabel}
                />
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-md border border-transparent p-1 text-gray-400 opacity-0 transition-all hover:border-gray-200 hover:bg-white hover:text-gray-700 group-hover/row:opacity-100"
                  aria-label="Edit variable mapping"
                  title="Edit mapping"
                >
                  <Pencil className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {!isUnmapped ? (
          <div
            className={`flex w-[52px] shrink-0 items-start gap-0.5 self-start pt-0.5 transition-opacity ${
              hasFeedback ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => handleThumbFeedback("up")}
              aria-pressed={mapping.feedback === "up"}
              className={`rounded-md border p-1 transition-all ${
                mapping.feedback === "up"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-transparent bg-transparent text-gray-400 hover:border-emerald-200 hover:bg-white hover:text-emerald-600"
              }`}
              aria-label="Confirm mapping"
              title="Confirm mapping"
            >
              <ThumbsUp
                className={`size-3.5 ${mapping.feedback === "up" ? "fill-current" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={() => handleThumbFeedback("down")}
              aria-pressed={mapping.feedback === "down"}
              className={`rounded-md border p-1 transition-all ${
                mapping.feedback === "down"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-transparent bg-transparent text-gray-400 hover:border-amber-200 hover:bg-white hover:text-amber-600"
              }`}
              aria-label="Incorrect mapping"
              title="Incorrect mapping"
            >
              <ThumbsDown
                className={`size-3.5 ${mapping.feedback === "down" ? "fill-current" : ""}`}
              />
            </button>
          </div>
        ) : (
          <div className="w-[52px] shrink-0" aria-hidden />
        )}
      </div>
    </li>
  )
}

export function PdfFieldMappingTable({
  mappings,
  onSelectBlock,
}: {
  mappings: PdfFieldMapping[]
  onSelectBlock: (blockId: string) => void
}) {
  const template = usePromptBuilderStore((s) => s.template)
  const learnings = usePromptBuilderStore((s) => s.pdfMappingLearnings)
  const pdfSource = usePromptBuilderStore((s) => s.pdfSourceDataUrl)

  if (mappings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-[13px] text-gray-500">
          No field mappings were detected from the uploaded PDF.
        </p>
      </div>
    )
  }

  if (!template) return null

  const coverage = summarizeMappingCoverage(mappings)
  const sections = groupMappingsForReview(template, mappings)

  const coverageMessage = (() => {
    if (coverage.showFullyMappedLabel) {
      return `All ${coverage.total} fields are mapped to quote variables.`
    }
    if (coverage.needsUserInput > 0) {
      const needLabel =
        coverage.needsUserInput === 1 ? "field still needs" : "fields still need"
      return `Mapped ${coverage.aiMapped} of ${coverage.total} fields from your PDF to quote variables — ${coverage.needsUserInput} ${needLabel} your input.`
    }
    if (coverage.aiMapped === coverage.total) {
      return `Mapped all ${coverage.total} fields from your PDF to quote variables.`
    }
    return `Mapped ${coverage.aiMapped} of ${coverage.total} fields from your PDF to quote variables.`
  })()

  return (
    <div className="space-y-4">
      {learnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p className="text-[12px] leading-relaxed text-blue-900">
            {learnings.length} mapping preference
            {learnings.length === 1 ? "" : "s"} saved — the assistant will apply
            these on your next PDF upload.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <Sparkles className="size-4 shrink-0 text-blue-600" strokeWidth={2} />
        <p className="text-[13px] leading-snug text-gray-700">{coverageMessage}</p>
      </div>

      <div className="space-y-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="flex items-start gap-5">
            <section className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <h3 className="min-w-0 text-[13px] font-semibold text-gray-900">
                  {section.label}
                </h3>
                <div className="flex shrink-0 items-center gap-2 text-[11px] text-gray-500">
                  {section.needsUserInput > 0 && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-100">
                      {section.needsUserInput} awaiting input
                    </span>
                  )}
                  <span>
                    {section.mappings.length} field
                    {section.mappings.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {sectionIndex === 0 && (
                <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  <span aria-hidden className="w-5" />
                  <span>From PDF</span>
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="size-3.5 shrink-0" />
                    <span>Quote variable</span>
                  </div>
                  <span aria-hidden className="w-[52px]" />
                </div>
              )}

              <ul className="divide-y divide-gray-100">
                {section.mappings.map((mapping) => (
                  <MappingRow
                    key={mapping.id}
                    mapping={mapping}
                    variableId={resolveMappingVariableId(template, mapping)}
                    onSelectBlock={onSelectBlock}
                  />
                ))}
              </ul>
            </section>

            <PdfMappingSectionThumbnail
              section={section}
              pdfSource={pdfSource}
              className={THUMBNAIL_COLUMN_WIDTH_CLASS}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
