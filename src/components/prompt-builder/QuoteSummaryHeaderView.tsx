import { EditableLabel, SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

const BLOCK_TYPE = "quote_summary_header" as const
const L = DEFAULT_LABELS.quote_summary_header

export function QuoteSummaryHeaderView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "classic")

  const preparedFor = staticLabel(c, "preparedForLabel", L.preparedForLabel)
  const quoteNum = staticLabel(c, "quoteNumberLabel", L.quoteNumberLabel)
  const issued = staticLabel(c, "issuedLabel", L.issuedLabel)
  const validUntil = staticLabel(c, "validUntilLabel", L.validUntilLabel)
  const validShort = staticLabel(c, "validShortLabel", L.validShortLabel)

  if (variant === "centered") {
    return (
      <div className="rounded-lg border border-gray-100 bg-gray-50/80 px-6 py-5 text-center">
        <InlineEditable
          value={String(c.title ?? "Quote Summary")}
          onChange={(v) => onField("title", v)}
          className="text-[20px] font-semibold text-gray-900"
        />
        <p className="mt-1 text-[13px] text-gray-500">
          <EditableLabel
            value={preparedFor}
            onChange={(v) => onField("preparedForLabel", v)}
            className="text-gray-400"
          />{" "}
          <VariableField
            blockType={BLOCK_TYPE}
            field="customerName"
            value={String(c.customerName ?? "")}
            onChange={(v) => onField("customerName", v)}
            layout="inline"
            className="inline font-medium text-gray-700"
          />
        </p>
        <div className="mx-auto mt-4 flex max-w-md flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-gray-600">
          <span>
            <EditableLabel
              value={quoteNum}
              onChange={(v) => onField("quoteNumberLabel", v)}
              className="text-gray-400"
            />{" "}
            <VariableField
              blockType={BLOCK_TYPE}
              field="quoteNumber"
              value={String(c.quoteNumber ?? "")}
              onChange={(v) => onField("quoteNumber", v)}
              layout="inline"
              className="inline font-medium text-gray-800"
            />
          </span>
          <span className="text-gray-300">·</span>
          <span>
            <EditableLabel
              value={issued}
              onChange={(v) => onField("issuedLabel", v)}
              className="text-gray-400"
            />{" "}
            <VariableField
              blockType={BLOCK_TYPE}
              field="issued"
              value={String(c.issued ?? "")}
              onChange={(v) => onField("issued", v)}
              layout="inline"
              className="inline font-medium text-gray-800"
            />
          </span>
          <span className="text-gray-300">·</span>
          <span>
            <EditableLabel
              value={validUntil}
              onChange={(v) => onField("validUntilLabel", v)}
              className="text-gray-400"
            />{" "}
            <VariableField
              blockType={BLOCK_TYPE}
              field="validUntil"
              value={String(c.validUntil ?? "")}
              onChange={(v) => onField("validUntil", v)}
              layout="inline"
              className="inline font-medium text-gray-800"
            />
          </span>
        </div>
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2 text-[13px] text-gray-700">
        <InlineEditable
          value={String(c.title ?? "Quote Summary")}
          onChange={(v) => onField("title", v)}
          className="font-semibold text-gray-900"
        />
        <span className="text-gray-300">·</span>
        <VariableField
          blockType={BLOCK_TYPE}
          field="quoteNumber"
          value={String(c.quoteNumber ?? "")}
          onChange={(v) => onField("quoteNumber", v)}
          layout="inline"
          className="text-gray-600"
        />
        <span className="text-gray-300">·</span>
        <span className="text-gray-500">
          <EditableLabel
            value={issued}
            onChange={(v) => onField("issuedLabel", v)}
            className="text-gray-500"
          />{" "}
          <VariableField
            blockType={BLOCK_TYPE}
            field="issued"
            value={String(c.issued ?? "")}
            onChange={(v) => onField("issued", v)}
            layout="inline"
            className="inline text-gray-700"
          />
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500">
          <EditableLabel
            value={validShort}
            onChange={(v) => onField("validShortLabel", v)}
            className="text-gray-500"
          />{" "}
          <VariableField
            blockType={BLOCK_TYPE}
            field="validUntil"
            value={String(c.validUntil ?? "")}
            onChange={(v) => onField("validUntil", v)}
            layout="inline"
            className="inline text-gray-700"
          />
        </span>
        <span className="text-gray-300">·</span>
        <VariableField
          blockType={BLOCK_TYPE}
          field="customerName"
          value={String(c.customerName ?? "")}
          onChange={(v) => onField("customerName", v)}
          layout="inline"
          className="text-gray-700"
        />
      </div>
    )
  }

  return (
    <div>
      <InlineEditable
        value={String(c.title ?? "Quote Summary")}
        onChange={(v) => onField("title", v)}
        className="text-[16px] font-semibold text-gray-900"
      />
      <p className="mt-0.5 text-[13px] text-gray-500">
        <EditableLabel
          value={preparedFor}
          onChange={(v) => onField("preparedForLabel", v)}
          className="text-gray-500"
        />{" "}
        <VariableField
          blockType={BLOCK_TYPE}
          field="customerName"
          value={String(c.customerName ?? "")}
          onChange={(v) => onField("customerName", v)}
          layout="inline"
          className="inline font-medium text-gray-700"
        />
      </p>
      <div className="my-4 border-t border-gray-200" />
      <div className="grid grid-cols-3 gap-4 text-[11px]">
        <div>
          <SectionLabel
            value={quoteNum}
            onChange={(v) => onField("quoteNumberLabel", v)}
          />
          <VariableField
            blockType={BLOCK_TYPE}
            field="quoteNumber"
            value={String(c.quoteNumber ?? "")}
            onChange={(v) => onField("quoteNumber", v)}
            className="mt-1 font-medium text-gray-800"
          />
        </div>
        <div>
          <SectionLabel
            value={issued}
            onChange={(v) => onField("issuedLabel", v)}
          />
          <VariableField
            blockType={BLOCK_TYPE}
            field="issued"
            value={String(c.issued ?? "")}
            onChange={(v) => onField("issued", v)}
            className="mt-1 font-medium text-blue-800"
          />
        </div>
        <div>
          <SectionLabel
            value={validUntil}
            onChange={(v) => onField("validUntilLabel", v)}
          />
          <VariableField
            blockType={BLOCK_TYPE}
            field="validUntil"
            value={String(c.validUntil ?? "")}
            onChange={(v) => onField("validUntil", v)}
            className="mt-1 font-medium text-gray-800"
          />
        </div>
      </div>
    </div>
  )
}
