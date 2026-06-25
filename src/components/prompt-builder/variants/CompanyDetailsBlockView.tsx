import { SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

const L = DEFAULT_LABELS.company_details

export function CompanyDetailsBlockView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "standard")
  const sectionLabel = staticLabel(c, "sectionLabel", L.sectionLabel)

  if (variant === "compact") {
    return (
      <div className="text-[12px] whitespace-nowrap text-gray-700">
        <span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {sectionLabel}
        </span>
        <VariableField
          blockId={block.id}
          blockType="company_details"
          field="name"
          value={String(c.name ?? "")}
          onChange={(v) => onField("name", v)}
          layout="inline"
          className="inline font-semibold text-gray-900"
        />
        <span className="text-gray-400"> · </span>
        <VariableField
          blockId={block.id}
          blockType="company_details"
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
        blockType="company_details"
        field="name"
        value={String(c.name ?? "")}
        onChange={(v) => onField("name", v)}
        className="text-[14px] font-semibold text-gray-900"
      />
      <VariableField
        blockId={block.id}
        blockType="company_details"
        field="address"
        value={String(c.address ?? "")}
        onChange={(v) => onField("address", v)}
        multiline
        lineBreaks="manual"
        className="mt-1 text-[12px] leading-relaxed text-gray-600"
      />
      <div className="mt-2 space-y-0.5 text-[11px] text-gray-500">
        <VariableField
          blockId={block.id}
          blockType="company_details"
          field="taxId"
          value={String(c.taxId ?? "")}
          onChange={(v) => onField("taxId", v)}
          layout="inline"
        />
        <VariableField
          blockId={block.id}
          blockType="company_details"
          field="entity"
          value={String(c.entity ?? "")}
          onChange={(v) => onField("entity", v)}
          layout="inline"
        />
      </div>
    </div>
  )
}
