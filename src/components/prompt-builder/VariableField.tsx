import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import {
  getVariableDef,
  type VariableFieldDef,
} from "@/lib/derive-template-variables"
import type { BuilderBlockType, TemplateVariableCategory } from "@/types/prompt-builder"

const CATEGORY_FIELD_STYLES: Record<TemplateVariableCategory, string> = {
  quote:
    "border-blue-200/80 bg-blue-50/40 focus-within:bg-blue-50/70 focus-within:ring-blue-200",
  customer:
    "border-violet-200/80 bg-violet-50/40 focus-within:bg-violet-50/70 focus-within:ring-violet-200",
  contract:
    "border-amber-200/80 bg-amber-50/40 focus-within:bg-amber-50/70 focus-within:ring-amber-200",
  pricing:
    "border-emerald-200/80 bg-emerald-50/40 focus-within:bg-emerald-50/70 focus-within:ring-emerald-200",
  people:
    "border-slate-200 bg-slate-50/60 focus-within:bg-slate-50 focus-within:ring-slate-200",
  routing:
    "border-orange-200/80 bg-orange-50/40 focus-within:bg-orange-50/70 focus-within:ring-orange-200",
  custom:
    "border-gray-200 bg-gray-50/60 focus-within:bg-gray-50 focus-within:ring-gray-200",
}

const CATEGORY_BADGE_STYLES: Record<TemplateVariableCategory, string> = {
  quote: "bg-blue-50 text-blue-700 ring-blue-100",
  customer: "bg-violet-50 text-violet-700 ring-violet-100",
  contract: "bg-amber-50 text-amber-800 ring-amber-100",
  pricing: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  people: "bg-slate-100 text-slate-700 ring-slate-200",
  routing: "bg-orange-50 text-orange-800 ring-orange-100",
  custom: "bg-gray-100 text-gray-600 ring-gray-200",
}

type Props = {
  blockType: BuilderBlockType
  field: string
  value: string
  onChange: (value: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
  /** When parent already renders the human label (e.g. QUOTE #) */
  showFieldLabel?: boolean
  layout?: "stacked" | "inline"
  /** Override lookup — pricing rows, custom text */
  variableDef?: VariableFieldDef
}

export function VariableField({
  blockType,
  field,
  value,
  onChange,
  className = "",
  multiline,
  placeholder,
  showFieldLabel = false,
  layout = "stacked",
  variableDef,
}: Props) {
  const isPreview = useIsPreviewMode()
  const def = variableDef ?? getVariableDef(blockType, field)

  if (isPreview) {
    const display = value || placeholder || "—"
    if (layout === "inline") {
      return <span className={className}>{display}</span>
    }
    return (
      <div className="min-w-0">
        {showFieldLabel && def && (
          <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            {def.label}
          </span>
        )}
        <span className={className}>{display}</span>
      </div>
    )
  }

  if (!def) {
    return (
      <InlineEditable
        value={value}
        onChange={onChange}
        className={className}
        multiline={multiline}
        placeholder={placeholder}
      />
    )
  }

  const fieldShell = CATEGORY_FIELD_STYLES[def.category]
  const badge = CATEGORY_BADGE_STYLES[def.category]

  const mergeKey = (
    <code
      className={`inline-block rounded px-1 py-px font-mono text-[9px] font-medium ring-1 ring-inset ${badge}`}
    >
      {`{{${def.key}}}`}
    </code>
  )

  if (layout === "inline") {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-1">
        <span
          className={`inline-block rounded border border-dashed px-1 py-px ${fieldShell}`}
        >
          <InlineEditable
            value={value}
            onChange={onChange}
            className={className}
            multiline={multiline}
            placeholder={placeholder}
          />
        </span>
        {mergeKey}
      </span>
    )
  }

  return (
    <div className="min-w-0">
      {(showFieldLabel || layout === "stacked") && (
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {showFieldLabel && (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              {def.label}
            </span>
          )}
          {mergeKey}
        </div>
      )}
      <div
        className={`rounded-md border border-dashed px-1.5 py-0.5 ring-1 ring-transparent focus-within:ring-2 ${fieldShell}`}
      >
        <InlineEditable
          value={value}
          onChange={onChange}
          className={className}
          multiline={multiline}
          placeholder={placeholder}
        />
      </div>
    </div>
  )
}
