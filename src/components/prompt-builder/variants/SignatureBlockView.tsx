import { EditableLabel, SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

const L = DEFAULT_LABELS.signature

export function SignatureBlockView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "dual")
  const acceptanceLabel = staticLabel(c, "acceptanceLabel", L.acceptanceLabel)
  const dateLabel = staticLabel(c, "dateLabel", L.dateLabel)
  const footerText = staticLabel(c, "footerText", L.footerText)

  if (variant === "boxed") {
    return (
      <div className="rounded-xl border-2 border-gray-300 bg-gray-50/40 p-5">
        <SectionLabel
          value={acceptanceLabel}
          onChange={(v) => onField("acceptanceLabel", v)}
          className="mb-4 tracking-widest text-gray-500"
        />
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="h-10 border-b-2 border-gray-400" />
            <InlineEditable
              value={String(c.label ?? "Authorized signature")}
              onChange={(v) => onField("label", v)}
              className="mt-2 text-[10px] text-gray-600"
            />
          </div>
          {Boolean(c.showDate) && (
            <div>
              <div className="h-10 border-b-2 border-gray-400" />
              <EditableLabel
                value={dateLabel}
                onChange={(v) => onField("dateLabel", v)}
                className="mt-2 text-[10px] text-gray-600"
              />
            </div>
          )}
        </div>
        <InlineEditable
          value={footerText}
          onChange={(v) => onField("footerText", v)}
          multiline
          className="mt-4 text-[9px] leading-relaxed text-gray-400"
        />
      </div>
    )
  }

  if (variant === "single") {
    return (
      <div className="max-w-xs pt-2">
        <div className="border-b-2 border-gray-800 pb-1" />
        <InlineEditable
          value={String(c.label ?? "Authorized signature")}
          onChange={(v) => onField("label", v)}
          className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-500"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-8 pt-2">
      <div>
        <div className="border-b border-gray-400 pb-1" />
        <InlineEditable
          value={String(c.label ?? "Authorized signature")}
          onChange={(v) => onField("label", v)}
          className="mt-1 text-[10px] text-gray-500"
        />
      </div>
      {Boolean(c.showDate) && (
        <div>
          <div className="border-b border-gray-400 pb-1" />
          <EditableLabel
            value={dateLabel}
            onChange={(v) => onField("dateLabel", v)}
            className="mt-1 text-[10px] text-gray-500"
          />
        </div>
      )}
    </div>
  )
}
