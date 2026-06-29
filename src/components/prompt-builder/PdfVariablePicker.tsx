import { getMappableVariables } from "@/lib/pdf-field-mappings"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { TemplateVariableCategory } from "@/types/prompt-builder"
import { ChevronDown } from "lucide-react"

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
    <div className={`relative inline-flex w-fit max-w-full ${className ?? ""}`}>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-auto min-w-[9.5rem] max-w-[13.5rem] appearance-none truncate rounded-md border border-gray-300 bg-white py-0.5 pl-2 pr-7 text-[10px] leading-normal text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
      >
        <option value="">Select variable</option>
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
      <ChevronDown
        className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-gray-500"
        aria-hidden
      />
    </div>
  )
}
