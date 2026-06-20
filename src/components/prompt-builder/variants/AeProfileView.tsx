import { SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"
import { Mail, Phone, User } from "lucide-react"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

export function AeProfileView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "card")
  const sectionLabel = staticLabel(
    c,
    "sectionLabel",
    DEFAULT_LABELS.ae_profile.sectionLabel,
  )

  if (variant === "banner") {
    return (
      <div className="flex items-center gap-4 rounded-xl bg-[#012A38] px-5 py-4 text-white">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/20">
          <User className="size-6 text-white/90" />
        </div>
        <div className="min-w-0 flex-1">
          <SectionLabel
            blockId={block.id}
            value={sectionLabel}
            onChange={(v) => onField("sectionLabel", v)}
            className="tracking-widest text-teal-200/70"
          />
          <VariableField blockId={block.id}
            blockType="ae_profile"
            field="name"
            value={String(c.name ?? "")}
            onChange={(v) => onField("name", v)}
            className="text-[16px] font-bold text-white"
          />
          <VariableField blockId={block.id}
            blockType="ae_profile"
            field="title"
            value={String(c.title ?? "")}
            onChange={(v) => onField("title", v)}
            className="text-[12px] text-teal-100/80"
          />
        </div>
        <div className="hidden shrink-0 text-right text-[11px] sm:block">
          <VariableField blockId={block.id}
            blockType="ae_profile"
            field="email"
            value={String(c.email ?? "")}
            onChange={(v) => onField("email", v)}
            className="text-teal-100"
          />
          <VariableField blockId={block.id}
            blockType="ae_profile"
            field="phone"
            value={String(c.phone ?? "")}
            onChange={(v) => onField("phone", v)}
            className="mt-0.5 text-white/70"
          />
        </div>
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <User className="size-4 text-gray-500" />
        </div>
        <div className="min-w-0 flex-1 text-[12px]">
          <VariableField blockId={block.id}
            blockType="ae_profile"
            field="name"
            value={String(c.name ?? "")}
            onChange={(v) => onField("name", v)}
            className="inline font-semibold text-gray-900"
          />
          <span className="text-gray-400"> · </span>
          <VariableField blockId={block.id}
            blockType="ae_profile"
            field="title"
            value={String(c.title ?? "")}
            onChange={(v) => onField("title", v)}
            className="inline text-gray-500"
          />
        </div>
        <VariableField blockId={block.id}
          blockType="ae_profile"
          field="email"
          value={String(c.email ?? "")}
          onChange={(v) => onField("email", v)}
          className="hidden text-[11px] text-blue-600 sm:block"
        />
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
        <User className="size-5 text-gray-500" />
      </div>
      <div className="text-[12px]">
        <VariableField blockId={block.id}
          blockType="ae_profile"
          field="name"
          value={String(c.name ?? "")}
          onChange={(v) => onField("name", v)}
          className="text-[14px] font-semibold text-gray-900"
        />
        <VariableField blockId={block.id}
          blockType="ae_profile"
          field="title"
          value={String(c.title ?? "")}
          onChange={(v) => onField("title", v)}
          className="text-gray-500"
        />
        <div className="mt-2 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <Mail className="size-3 text-gray-400" />
            <VariableField blockId={block.id}
              blockType="ae_profile"
              field="email"
              value={String(c.email ?? "")}
              onChange={(v) => onField("email", v)}
              className="text-blue-600"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Phone className="size-3 text-gray-400" />
            <VariableField blockId={block.id}
              blockType="ae_profile"
              field="phone"
              value={String(c.phone ?? "")}
              onChange={(v) => onField("phone", v)}
              className="text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
