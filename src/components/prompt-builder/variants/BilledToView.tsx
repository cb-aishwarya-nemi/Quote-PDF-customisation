import { SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"
import { Building2, Mail, MapPin, User } from "lucide-react"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

const L = DEFAULT_LABELS.billed_to

function ContactFields({
  blockId,
  c,
  onField,
  compact,
}: {
  blockId: string
  c: Record<string, unknown>
  onField: (field: string, value: string) => void
  compact?: boolean
}) {
  return (
    <>
      <VariableField blockId={blockId}
        blockType="billed_to"
        field="contactName"
        value={String(c.contactName ?? "")}
        onChange={(v) => onField("contactName", v)}
        className={compact ? "text-[12px] text-gray-700" : "mt-1 text-[13px] text-gray-700"}
      />
      <VariableField blockId={blockId}
        blockType="billed_to"
        field="contact"
        value={String(c.contact ?? "")}
        onChange={(v) => onField("contact", v)}
        layout="inline"
        className="mt-0.5 text-[12px] text-blue-600"
      />
    </>
  )
}

export function BilledToView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "standard")
  const sectionLabel = staticLabel(c, "sectionLabel", L.sectionLabel)
  const contactLabel = staticLabel(c, "contactColumnLabel", L.contactColumnLabel)

  if (variant === "two_column") {
    return (
      <div className="grid grid-cols-2 gap-5">
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Building2 className="size-3.5 text-gray-400" />
            <SectionLabel
              blockId={block.id}
              value={sectionLabel}
              onChange={(v) => onField("sectionLabel", v)}
            />
          </div>
          <VariableField blockId={block.id}
            blockType="billed_to"
            field="name"
            value={String(c.name ?? "")}
            onChange={(v) => onField("name", v)}
            className="text-[14px] font-semibold text-gray-900"
          />
          <VariableField blockId={block.id}
            blockType="billed_to"
            field="address"
            value={String(c.address ?? "")}
            onChange={(v) => onField("address", v)}
            multiline
            lineBreaks="manual"
            className="mt-2 text-[12px] leading-relaxed text-gray-600"
          />
        </div>
        <div className="border-l border-gray-100 pl-5">
          <div className="mb-2 flex items-center gap-1.5">
            <User className="size-3.5 text-gray-400" />
            <SectionLabel
              blockId={block.id}
              value={contactLabel}
              onChange={(v) => onField("contactColumnLabel", v)}
            />
          </div>
          <ContactFields blockId={block.id} c={c} onField={onField} />
        </div>
      </div>
    )
  }

  if (variant === "card") {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="h-1 bg-cb-orange" />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <Building2 className="size-4 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <SectionLabel
                blockId={block.id}
                value={sectionLabel}
                onChange={(v) => onField("sectionLabel", v)}
              />
              <VariableField blockId={block.id}
                blockType="billed_to"
                field="name"
                value={String(c.name ?? "")}
                onChange={(v) => onField("name", v)}
                className="text-[15px] font-semibold text-gray-900"
              />
              <div className="mt-2 flex items-start gap-1.5">
                <User className="mt-0.5 size-3 shrink-0 text-gray-400" />
                <ContactFields blockId={block.id} c={c} onField={onField} compact />
              </div>
              <div className="mt-2 flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3 shrink-0 text-gray-400" />
                <VariableField blockId={block.id}
                  blockType="billed_to"
                  field="address"
                  value={String(c.address ?? "")}
                  onChange={(v) => onField("address", v)}
                  multiline
                  lineBreaks="manual"
                  className="text-[12px] leading-relaxed text-gray-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionLabel
        blockId={block.id}
        value={sectionLabel}
        onChange={(v) => onField("sectionLabel", v)}
      />
      <VariableField blockId={block.id}
        blockType="billed_to"
        field="name"
        value={String(c.name ?? "")}
        onChange={(v) => onField("name", v)}
        className="mt-2 text-[14px] font-semibold text-gray-900"
      />
      <VariableField blockId={block.id}
        blockType="billed_to"
        field="contactName"
        value={String(c.contactName ?? "")}
        onChange={(v) => onField("contactName", v)}
        className="mt-1 text-[13px] text-gray-700"
      />
      <div className="mt-0.5 flex items-center gap-1">
        <Mail className="size-3 shrink-0 text-gray-400" />
        <VariableField blockId={block.id}
          blockType="billed_to"
          field="contact"
          value={String(c.contact ?? "")}
          onChange={(v) => onField("contact", v)}
          layout="inline"
          className="text-[12px] text-blue-600"
        />
      </div>
      <VariableField blockId={block.id}
        blockType="billed_to"
        field="address"
        value={String(c.address ?? "")}
        onChange={(v) => onField("address", v)}
        multiline
        lineBreaks="manual"
        className="mt-2 text-[12px] leading-relaxed text-gray-600"
      />
    </div>
  )
}
