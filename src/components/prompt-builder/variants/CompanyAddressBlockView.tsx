import { SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

const L = DEFAULT_LABELS.company_address

export function CompanyAddressBlockView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "standard")
  const sectionLabel = staticLabel(c, "sectionLabel", L.sectionLabel)

  if (variant === "compact") {
    return (
      <div className="text-[12px] text-gray-700">
        <VariableField
          blockId={block.id}
          blockType="company_address"
          field="name"
          value={String(c.name ?? "")}
          onChange={(v) => onField("name", v)}
          layout="inline"
          className="inline font-semibold text-gray-900"
        />
        <span className="text-gray-400"> · </span>
        <VariableField
          blockId={block.id}
          blockType="company_address"
          field="address"
          value={String(c.address ?? "")}
          onChange={(v) => onField("address", v)}
          layout="inline"
          className="inline text-gray-600"
        />
      </div>
    )
  }

  return (
    <div>
      <SectionLabel
        blockId={block.id}
        value={sectionLabel}
        onChange={(v) => onField("sectionLabel", v)}
        className="mb-2"
      />
      <VariableField
        blockId={block.id}
        blockType="company_address"
        field="name"
        value={String(c.name ?? "")}
        onChange={(v) => onField("name", v)}
        className="text-[14px] font-semibold text-gray-900"
      />
      <VariableField
        blockId={block.id}
        blockType="company_address"
        field="address"
        value={String(c.address ?? "")}
        onChange={(v) => onField("address", v)}
        multiline
        hugContents
        className="mt-1 text-[12px] leading-relaxed text-gray-600"
      />
      <div className="mt-2 space-y-0.5 text-[11px] text-gray-500">
        <VariableField
          blockId={block.id}
          blockType="company_address"
          field="taxId"
          value={String(c.taxId ?? "")}
          onChange={(v) => onField("taxId", v)}
          layout="inline"
        />
        <VariableField
          blockId={block.id}
          blockType="company_address"
          field="entity"
          value={String(c.entity ?? "")}
          onChange={(v) => onField("entity", v)}
          layout="inline"
        />
      </div>
    </div>
  )
}
