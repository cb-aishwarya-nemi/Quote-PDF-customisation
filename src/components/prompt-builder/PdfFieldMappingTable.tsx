import type { PdfFieldMapping } from "@/lib/pdf-field-mappings"
import type { TemplateVariableCategory } from "@/types/prompt-builder"
import { ArrowRight } from "lucide-react"

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

export function PdfFieldMappingTable({
  mappings,
  onSelectBlock,
}: {
  mappings: PdfFieldMapping[]
  onSelectBlock: (blockId: string) => void
}) {
  if (mappings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-[13px] text-gray-500">
          No field mappings were detected from the uploaded PDF.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        <span>From PDF</span>
        <span aria-hidden />
        <span>Quote variable</span>
      </div>
      <ul className="divide-y divide-gray-100">
        {mappings.map((mapping) => (
          <li key={mapping.id}>
            <button
              type="button"
              onClick={() => onSelectBlock(mapping.blockId)}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-blue-50/50"
            >
              <div className="min-w-0">
                <p className="text-[12px] leading-relaxed text-gray-600">
                  {mapping.pdfExcerpt}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">{mapping.blockLabel}</p>
              </div>
              <ArrowRight className="mt-1 size-3.5 shrink-0 text-gray-300" />
              <div className="min-w-0">
                <p className="text-[12px] font-medium leading-relaxed text-gray-900">
                  {mapping.variableLabel}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                    {`{${mapping.variableKey}}`}
                  </code>
                  <CategoryPill category={mapping.category} />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-500">{mapping.mappedValue}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
