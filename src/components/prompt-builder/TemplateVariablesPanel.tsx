import {
  deriveTemplateVariables,
} from "@/lib/derive-template-variables"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { TemplateVariable } from "@/types/prompt-builder"
import type { TemplateVariableCategory } from "@/types/prompt-builder"
import { Braces, ChevronDown, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"

const CATEGORY_LABELS: Record<TemplateVariableCategory, string> = {
  quote: "Quote",
  customer: "Customer",
  contract: "Contract",
  pricing: "Pricing",
  people: "People",
  routing: "Conditions",
  custom: "Custom",
}

const CATEGORY_STYLES: Record<TemplateVariableCategory, string> = {
  quote: "bg-blue-50 text-blue-700 ring-blue-100",
  customer: "bg-violet-50 text-violet-700 ring-violet-100",
  contract: "bg-amber-50 text-amber-800 ring-amber-100",
  pricing: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  people: "bg-slate-100 text-slate-700 ring-slate-200",
  routing: "bg-orange-50 text-orange-800 ring-orange-100",
  custom: "bg-gray-100 text-gray-700 ring-gray-200",
}

function VariableRow({ variable }: { variable: TemplateVariable }) {
  const setSelectedBlockId = usePromptBuilderStore((s) => s.setSelectedBlockId)

  return (
    <button
      type="button"
      onClick={() => setSelectedBlockId(variable.blockId)}
      className="flex w-full flex-col gap-0.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors hover:border-gray-200 hover:bg-gray-50"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-gray-900">
          {variable.label}
        </span>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ring-1 ring-inset ${CATEGORY_STYLES[variable.category]}`}
        >
          {CATEGORY_LABELS[variable.category]}
        </span>
      </div>
      <code className="text-[10px] text-gray-400">{`{{${variable.key}}}`}</code>
      <span className="truncate text-[10px] text-gray-500">
        {variable.sampleValue}
      </span>
      <span className="text-[10px] text-gray-400">{variable.blockLabel}</span>
    </button>
  )
}

export function TemplateVariablesPanel() {
  const template = usePromptBuilderStore((s) => s.template)
  const [expanded, setExpanded] = useState(false)

  const variables = useMemo(
    () => deriveTemplateVariables(template),
    [template],
  )

  const grouped = useMemo(() => {
    const map = new Map<TemplateVariableCategory, TemplateVariable[]>()
    for (const v of variables) {
      const list = map.get(v.category) ?? []
      list.push(v)
      map.set(v.category, list)
    }
    return map
  }, [variables])

  if (!template) return null

  return (
    <div className="border-b border-gray-100 bg-gray-50/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50"
      >
        {expanded ? (
          <ChevronDown className="size-3.5 text-gray-400" />
        ) : (
          <ChevronRight className="size-3.5 text-gray-400" />
        )}
        <Braces className="size-3.5 text-[#012A38]" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-gray-900">
            Template variables
          </p>
          <p className="text-[10px] text-gray-500">
            {variables.length} identified from your layout
          </p>
        </div>
      </button>

      {expanded && (
        <div className="max-h-[220px] space-y-2 overflow-y-auto px-3 pb-3">
          {variables.length === 0 ? (
            <p className="px-1 text-[11px] text-gray-500">
              Add blocks to the canvas and variables will appear here
              automatically.
            </p>
          ) : (
            Array.from(grouped.entries()).map(([category, vars]) => (
              <div key={category}>
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {CATEGORY_LABELS[category]}
                </p>
                <div className="space-y-0.5">
                  {vars.map((v) => (
                    <VariableRow key={v.id} variable={v} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
