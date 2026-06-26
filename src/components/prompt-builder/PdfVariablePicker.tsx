import { getMappableVariables } from "@/lib/pdf-field-mappings"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { TemplateVariableCategory } from "@/types/prompt-builder"

const CATEGORY_LABELS: Record<TemplateVariableCategory, string> = {
  quote: "Quote",
  customer: "Customer",
  pricing: "Pricing",
  contract: "Contract",
  people: "People",
  routing: "Routing",
  custom: "Custom",
}

type Props = {
  value: string
  onChange: (variableId: string) => void
  className?: string
  disabled?: boolean
}

export function PdfVariablePicker({ value, onChange, className, disabled }: Props) {
  const template = usePromptBuilderStore((s) => s.template)
  if (!template) return null

  const variables = getMappableVariables(template)
  const grouped = variables.reduce(
    (acc, variable) => {
      const list = acc.get(variable.category) ?? []
      list.push(variable)
      acc.set(variable.category, list)
      return acc
    },
    new Map<TemplateVariableCategory, typeof variables>(),
  )

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[12px] text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${className ?? ""}`}
    >
      <option value="">Select variable…</option>
      {[...grouped.entries()].map(([category, items]) => (
        <optgroup key={category} label={CATEGORY_LABELS[category]}>
          {items.map((variable) => (
            <option key={variable.id} value={variable.id}>
              {variable.label} ({`{${variable.key}}`})
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}
