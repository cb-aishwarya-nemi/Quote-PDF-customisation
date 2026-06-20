import { EditableLabel, SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { contractFieldLabel, DEFAULT_LABELS } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: unknown) => void
}

const FIELDS = [
  "term",
  "startDate",
  "billingCycle",
  "paymentTerms",
  "salesperson",
] as const

export function ContractDetailsView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "grid")

  const updateFieldLabel = (field: string, value: string) => {
    const labels = {
      ...((c.fieldLabels as Record<string, string>) ?? {}),
      [field]: value,
    }
    onField("fieldLabels", labels)
  }

  const fieldLabel = (field: (typeof FIELDS)[number]) =>
    contractFieldLabel(c, field, DEFAULT_LABELS.contract_details[field])

  if (variant === "timeline") {
    return (
      <div className="relative pl-4">
        <div className="absolute bottom-1 left-[5px] top-1 w-px bg-gray-200" />
        <div className="space-y-4">
          {FIELDS.map((key, i) => (
            <div key={key} className="relative flex gap-3">
              <div
                className={`absolute -left-4 top-1.5 size-2.5 rounded-full border-2 border-white ${
                  i === 0 ? "bg-cb-orange" : "bg-gray-300"
                }`}
              />
              <div className="min-w-0 flex-1">
                <SectionLabel
                  blockId={block.id}
                  value={fieldLabel(key)}
                  onChange={(v) => updateFieldLabel(key, v)}
                />
                <VariableField blockId={block.id}
                  blockType="contract_details"
                  field={key}
                  value={String(c[key] ?? "")}
                  onChange={(v) => onField(key, v)}
                  className="text-[13px] font-medium text-gray-900"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "list") {
    return (
      <dl className="divide-y divide-gray-100 rounded-lg border border-gray-100 text-[12px]">
        {FIELDS.map((key) => (
          <div
            key={key}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2"
          >
            <dt>
              <EditableLabel
                blockId={block.id}
                value={fieldLabel(key)}
                onChange={(v) => updateFieldLabel(key, v)}
                className="text-gray-500"
              />
            </dt>
            <dd className="min-w-[8rem] flex-1 text-right">
              <VariableField blockId={block.id}
                blockType="contract_details"
                field={key}
                value={String(c[key] ?? "")}
                onChange={(v) => onField(key, v)}
                className="font-medium text-gray-900"
              />
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-gray-50/60 p-3 text-[12px]">
      {FIELDS.map((key) => (
        <div key={key}>
          <SectionLabel
            blockId={block.id}
            value={fieldLabel(key)}
            onChange={(v) => updateFieldLabel(key, v)}
            className="text-[10px] font-medium"
          />
          <VariableField blockId={block.id}
            blockType="contract_details"
            field={key}
            value={String(c[key] ?? "")}
            onChange={(v) => onField(key, v)}
            className="mt-0.5 font-semibold text-gray-900"
          />
        </div>
      ))}
    </div>
  )
}
