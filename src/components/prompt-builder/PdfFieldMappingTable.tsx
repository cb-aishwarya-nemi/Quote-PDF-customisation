import { PdfVariablePicker } from "@/components/prompt-builder/PdfVariablePicker"
import {
  countReviewedMappings,
  resolveMappingVariableId,
  type PdfFieldMapping,
} from "@/lib/pdf-field-mappings"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { TemplateVariableCategory } from "@/types/prompt-builder"
import { AlertCircle, ArrowRight, Pencil, ThumbsDown, ThumbsUp } from "lucide-react"
import { useEffect, useState } from "react"

const CATEGORY_LABELS: Record<TemplateVariableCategory, string> = {
  quote: "Quote",
  customer: "Customer",
  pricing: "Pricing",
  contract: "Contract",
  people: "People",
  routing: "Routing",
  custom: "Custom",
}

function CategoryPill({ category }: { category: TemplateVariableCategory }) {
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-500">
      {CATEGORY_LABELS[category]}
    </span>
  )
}

function MappingRow({
  mapping,
  variableId,
  onSelectBlock,
}: {
  mapping: PdfFieldMapping
  variableId: string
  onSelectBlock: (blockId: string) => void
}) {
  const remapPdfFieldMapping = usePromptBuilderStore((s) => s.remapPdfFieldMapping)
  const setPdfMappingFeedback = usePromptBuilderStore((s) => s.setPdfMappingFeedback)
  const [isEditing, setIsEditing] = useState(false)

  const isUnmapped = mapping.status === "unmapped"
  const needsRemap = mapping.feedback === "down"

  useEffect(() => {
    if (mapping.feedback === "down") {
      setIsEditing(true)
    }
    if (mapping.feedback === "up") {
      setIsEditing(false)
    }
  }, [mapping.feedback])

  const rowClass = needsRemap
    ? "border-l-2 border-l-amber-400 bg-amber-50/30"
    : isUnmapped
      ? "border-l-2 border-l-slate-200 bg-slate-50/40"
      : mapping.feedback === "up"
        ? "bg-emerald-50/20"
        : ""

  return (
    <li
      className={`group/row transition-colors hover:bg-blue-50/50 ${rowClass}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-start gap-3 px-4 py-3.5">
        <button
          type="button"
          onClick={() => onSelectBlock(mapping.blockId)}
          className="min-w-0 text-left"
        >
          {isUnmapped && !mapping.pdfExcerpt.trim() ? (
            <p className="text-[12px] italic leading-relaxed text-gray-400">
              Not found in PDF
            </p>
          ) : (
            <p className="text-[12px] leading-relaxed text-gray-600">
              {mapping.pdfExcerpt || "—"}
            </p>
          )}
          <p className="mt-1 text-[11px] text-gray-400">{mapping.blockLabel}</p>
        </button>

        <ArrowRight className="mt-1 size-3.5 shrink-0 text-gray-300" />

        <div
          className="relative min-w-0 pr-7"
          onClick={(event) => event.stopPropagation()}
        >
          {isEditing ? (
            <div className="space-y-1.5">
              <PdfVariablePicker
                value={variableId}
                onChange={(nextId) => {
                  if (nextId && nextId !== variableId) {
                    remapPdfFieldMapping(mapping.id, nextId)
                    setIsEditing(false)
                  }
                }}
              />
              {needsRemap && (
                <p className="text-[11px] text-amber-700">
                  Pick the correct variable
                </p>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-[11px] text-gray-500 hover:text-gray-700"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <p className="text-[12px] font-medium leading-relaxed text-gray-900">
                {mapping.variableLabel}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                  {`{${mapping.variableKey}}`}
                </code>
                <CategoryPill category={mapping.category} />
              </div>
              {mapping.mappedValue.trim() && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  {mapping.mappedValue}
                </p>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="absolute right-0 top-0 rounded-md border border-transparent p-1 text-gray-400 opacity-0 transition-all hover:border-gray-200 hover:bg-white hover:text-gray-700 group-hover/row:opacity-100"
                aria-label="Edit variable mapping"
                title="Edit mapping"
              >
                <Pencil className="size-3.5" />
              </button>
            </>
          )}
        </div>

        {!isUnmapped && (
          <div
            className="flex shrink-0 items-start gap-0.5 pt-0.5"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() =>
                setPdfMappingFeedback(
                  mapping.id,
                  mapping.feedback === "up" ? null : "up",
                )
              }
              className={`rounded-md border p-1 transition-all ${
                mapping.feedback === "up"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 opacity-100"
                  : "border-transparent bg-transparent text-gray-400 opacity-0 hover:border-emerald-200 hover:bg-white hover:text-emerald-600 group-hover/row:opacity-100"
              }`}
              aria-label="Confirm mapping"
              title="Confirm mapping"
            >
              <ThumbsUp className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = mapping.feedback === "down" ? null : "down"
                setPdfMappingFeedback(mapping.id, next)
                if (next === "down") setIsEditing(true)
              }}
              className={`rounded-md border p-1 transition-all ${
                mapping.feedback === "down"
                  ? "border-amber-300 bg-amber-50 text-amber-700 opacity-100"
                  : "border-transparent bg-transparent text-gray-400 opacity-0 hover:border-amber-200 hover:bg-white hover:text-amber-600 group-hover/row:opacity-100"
              }`}
              aria-label="Incorrect mapping"
              title="Incorrect mapping"
            >
              <ThumbsDown className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

function MappingSection({
  title,
  description,
  mappings,
  template,
  onSelectBlock,
}: {
  title: string
  description?: string
  mappings: PdfFieldMapping[]
  template: NonNullable<ReturnType<typeof usePromptBuilderStore.getState>["template"]>
  onSelectBlock: (blockId: string) => void
}) {
  if (mappings.length === 0) return null

  return (
    <section className="space-y-2">
      <div>
        <h2 className="text-[14px] font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[12px] text-gray-500">{description}</p>
        )}
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          <span>From PDF</span>
          <span aria-hidden />
          <span>Quote variable</span>
          <span aria-hidden className="w-[52px]" />
        </div>
        <ul className="divide-y divide-gray-100">
          {mappings.map((mapping) => (
            <MappingRow
              key={mapping.id}
              mapping={mapping}
              variableId={resolveMappingVariableId(template, mapping)}
              onSelectBlock={onSelectBlock}
            />
          ))}
        </ul>
      </div>
    </section>
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

  const aiMapped = mappings.filter((m) => m.status === "mapped")
  const unmapped = mappings.filter((m) => m.status === "unmapped")
  const stats = countReviewedMappings(mappings)

  return (
    <div className="space-y-6">
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

      <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-500">
        <span>
          {stats.mapped} AI-mapped · {stats.unmapped} need your input
        </span>
        <span className="text-gray-300">·</span>
        <span>{stats.reviewed} reviewed</span>
      </div>

      <MappingSection
        title="Mapped from your PDF"
        description="Hover a row to confirm or correct. Click edit to remap a variable."
        mappings={aiMapped}
        template={template}
        onSelectBlock={onSelectBlock}
      />

      <MappingSection
        title="Not mapped by AI"
        description="Click edit on a row to assign a variable."
        mappings={unmapped}
        template={template}
        onSelectBlock={onSelectBlock}
      />
    </div>
  )
}
