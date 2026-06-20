import { EditableLabel, SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

const METRICS = [
  ["oneTime", "oneTimeLabel", DEFAULT_LABELS.tcv_summary.oneTimeLabel],
  ["recurring", "recurringLabel", DEFAULT_LABELS.tcv_summary.recurringLabel],
  ["termMonths", "termMonthsLabel", DEFAULT_LABELS.tcv_summary.termMonthsLabel],
] as const

export function TcvSummaryView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "classic")
  const sectionLabel = staticLabel(c, "label", DEFAULT_LABELS.tcv_summary.label)
  const inlineLabel = staticLabel(c, "inlineLabel", DEFAULT_LABELS.tcv_summary.inlineLabel)

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-gray-200 bg-gray-50/80 px-4 py-3 text-[12px]">
        <EditableLabel
          blockId={block.id}
          value={inlineLabel}
          onChange={(v) => onField("inlineLabel", v)}
          className="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
        />
        <VariableField blockId={block.id}
          blockType="tcv_summary"
          field="amount"
          value={String(c.amount ?? "")}
          onChange={(v) => onField("amount", v)}
          layout="inline"
          className="text-[15px] font-bold text-gray-900"
        />
        <span className="text-gray-300">·</span>
        <VariableField blockId={block.id}
          blockType="tcv_summary"
          field="subtitle"
          value={String(c.subtitle ?? "")}
          onChange={(v) => onField("subtitle", v)}
          layout="inline"
          className="text-gray-600"
        />
        {METRICS.map(([key, labelKey, fallback]) => (
          <span key={key} className="flex items-center gap-1 text-gray-500">
            <span className="text-gray-300">·</span>
            <EditableLabel
              blockId={block.id}
              value={staticLabel(c, labelKey, fallback)}
              onChange={(v) => onField(labelKey, v)}
              className="text-[10px] uppercase text-gray-500"
            />
            <VariableField blockId={block.id}
              blockType="tcv_summary"
              field={key}
              value={String(c[key] ?? "")}
              onChange={(v) => onField(key, v)}
              layout="inline"
              className="font-medium text-gray-800"
            />
          </span>
        ))}
      </div>
    )
  }

  if (variant === "cards") {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="bg-[#012A38] px-5 py-4">
          <EditableLabel
            blockId={block.id}
            value={sectionLabel}
            onChange={(v) => onField("label", v)}
            className="text-[10px] font-semibold uppercase tracking-widest text-teal-200/80"
          />
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <VariableField blockId={block.id}
              blockType="tcv_summary"
              field="amount"
              value={String(c.amount ?? "")}
              onChange={(v) => onField("amount", v)}
              className="text-[32px] font-bold tracking-tight text-white"
            />
            <VariableField blockId={block.id}
              blockType="tcv_summary"
              field="subtitle"
              value={String(c.subtitle ?? "")}
              onChange={(v) => onField("subtitle", v)}
              className="text-[13px] text-teal-100/90"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3">
          {METRICS.map(([key, labelKey, fallback]) => (
            <div
              key={key}
              className="rounded-lg border border-white bg-white px-3 py-2.5 shadow-sm"
            >
              <SectionLabel
                blockId={block.id}
                value={staticLabel(c, labelKey, fallback)}
                onChange={(v) => onField(labelKey, v)}
                className="text-[9px]"
              />
              <VariableField blockId={block.id}
                blockType="tcv_summary"
                field={key}
                value={String(c[key] ?? "")}
                onChange={(v) => onField(key, v)}
                className="mt-1 text-[13px] font-bold text-gray-900"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="border-l-4 border-cb-orange pl-4">
        <SectionLabel
          blockId={block.id}
          value={sectionLabel}
          onChange={(v) => onField("label", v)}
        />
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <VariableField blockId={block.id}
            blockType="tcv_summary"
            field="amount"
            value={String(c.amount ?? "")}
            onChange={(v) => onField("amount", v)}
            className="text-[30px] font-bold tracking-tight text-gray-900"
          />
          <VariableField blockId={block.id}
            blockType="tcv_summary"
            field="subtitle"
            value={String(c.subtitle ?? "")}
            onChange={(v) => onField("subtitle", v)}
            className="text-[13px] text-gray-500"
          />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 divide-x divide-gray-100 rounded-lg border border-gray-100 bg-gray-50/50">
        {METRICS.map(([key, labelKey, fallback]) => (
          <div key={key} className="px-3 py-2.5 text-center">
            <SectionLabel
              blockId={block.id}
              value={staticLabel(c, labelKey, fallback)}
              onChange={(v) => onField(labelKey, v)}
              className="text-[9px]"
            />
            <VariableField blockId={block.id}
              blockType="tcv_summary"
              field={key}
              value={String(c[key] ?? "")}
              onChange={(v) => onField(key, v)}
              className="mt-1 text-[13px] font-semibold text-gray-900"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
