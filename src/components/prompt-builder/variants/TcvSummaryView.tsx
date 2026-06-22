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

function MetricCell({
  block,
  c,
  metricKey,
  labelKey,
  fallback,
  onField,
  labelClassName = "",
  valueClassName = "text-[14px] font-semibold text-gray-900",
}: {
  block: BuilderBlock
  c: Record<string, unknown>
  metricKey: string
  labelKey: string
  fallback: string
  onField: (field: string, value: string) => void
  labelClassName?: string
  valueClassName?: string
}) {
  return (
    <div className="min-w-0">
      <SectionLabel
        blockId={block.id}
        value={staticLabel(c, labelKey, fallback)}
        onChange={(v) => onField(labelKey, v)}
        className={labelClassName}
      />
      <VariableField
        blockId={block.id}
        blockType="tcv_summary"
        field={metricKey}
        value={String(c[metricKey] ?? "")}
        onChange={(v) => onField(metricKey, v)}
        className={`mt-1 ${valueClassName}`}
      />
    </div>
  )
}

export function TcvSummaryView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "classic")
  const emphasized = c.emphasized === true
  const sectionLabel = staticLabel(c, "label", DEFAULT_LABELS.tcv_summary.label)
  const inlineLabel = staticLabel(c, "inlineLabel", DEFAULT_LABELS.tcv_summary.inlineLabel)

  const emphasisClass = emphasized ? "rounded-lg ring-2 ring-cb-orange/15" : ""

  if (variant === "inline") {
    return (
      <div
        className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${emphasisClass}`}
      >
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <EditableLabel
            blockId={block.id}
            value={inlineLabel}
            onChange={(v) => onField("inlineLabel", v)}
            className="text-[10px] font-semibold uppercase tracking-wider text-gray-400"
          />
          <VariableField
            blockId={block.id}
            blockType="tcv_summary"
            field="amount"
            value={String(c.amount ?? "")}
            onChange={(v) => onField("amount", v)}
            layout="inline"
            className="text-[16px] font-bold tracking-tight text-gray-900"
          />
          <VariableField
            blockId={block.id}
            blockType="tcv_summary"
            field="subtitle"
            value={String(c.subtitle ?? "")}
            onChange={(v) => onField("subtitle", v)}
            layout="inline"
            className="text-[12px] text-gray-500"
          />
        </div>

        <div className="hidden h-5 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />

        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          {METRICS.map(([key, labelKey, fallback], index) => (
            <div key={key} className="flex items-center gap-x-4">
              {index > 0 && (
                <div className="hidden h-5 w-px shrink-0 bg-gray-200 sm:block" aria-hidden />
              )}
              <div className="flex min-w-0 items-baseline gap-1.5">
                <EditableLabel
                  blockId={block.id}
                  value={staticLabel(c, labelKey, fallback)}
                  onChange={(v) => onField(labelKey, v)}
                  className="text-[10px] font-medium uppercase tracking-wide text-gray-400"
                />
                <VariableField
                  blockId={block.id}
                  blockType="tcv_summary"
                  field={key}
                  value={String(c[key] ?? "")}
                  onChange={(v) => onField(key, v)}
                  layout="inline"
                  className="text-[13px] font-semibold text-gray-800"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === "cards") {
    return (
      <div className={`overflow-hidden rounded-xl ${emphasisClass}`}>
        <div className="bg-gradient-to-br from-[#012A38] via-[#013545] to-[#024a5e] px-5 pb-9 pt-4">
          <EditableLabel
            blockId={block.id}
            value={sectionLabel}
            onChange={(v) => onField("label", v)}
            className="text-[10px] font-semibold uppercase tracking-widest text-teal-200/70"
          />
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <VariableField
              blockId={block.id}
              blockType="tcv_summary"
              field="amount"
              value={String(c.amount ?? "")}
              onChange={(v) => onField("amount", v)}
              className="text-[34px] font-bold leading-none tracking-tight text-white"
            />
            <VariableField
              blockId={block.id}
              blockType="tcv_summary"
              field="subtitle"
              value={String(c.subtitle ?? "")}
              onChange={(v) => onField("subtitle", v)}
              className="text-[13px] font-medium text-teal-100/80"
            />
          </div>
        </div>

        <div className="-mt-5 grid grid-cols-3 gap-2.5 px-4 pb-4">
          {METRICS.map(([key, labelKey, fallback]) => (
            <div
              key={key}
              className="rounded-lg border border-gray-200/80 bg-white px-3 py-3 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.03]"
            >
              <MetricCell
                block={block}
                c={c}
                metricKey={key}
                labelKey={labelKey}
                fallback={fallback}
                onField={onField}
                labelClassName="text-[9px] text-gray-400"
                valueClassName="text-[14px] font-bold text-gray-900"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={emphasisClass}>
      <div className="border-b border-gray-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-cb-orange" aria-hidden />
          <div className="min-w-0 flex-1">
            <SectionLabel
              blockId={block.id}
              value={sectionLabel}
              onChange={(v) => onField("label", v)}
            />
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <VariableField
                blockId={block.id}
                blockType="tcv_summary"
                field="amount"
                value={String(c.amount ?? "")}
                onChange={(v) => onField("amount", v)}
                className="text-[32px] font-bold leading-none tracking-tight text-gray-900"
              />
              <VariableField
                blockId={block.id}
                blockType="tcv_summary"
                field="subtitle"
                value={String(c.subtitle ?? "")}
                onChange={(v) => onField("subtitle", v)}
                className="text-[13px] font-medium text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 pt-3">
        {METRICS.map(([key, labelKey, fallback]) => (
          <div key={key} className="px-4 py-1">
            <MetricCell
              block={block}
              c={c}
              metricKey={key}
              labelKey={labelKey}
              fallback={fallback}
              onField={onField}
              labelClassName="text-[9px]"
              valueClassName="text-[14px] font-semibold text-gray-900"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
