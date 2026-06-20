import { EditableLabel, SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { getPricingRowVariableDef } from "@/lib/derive-template-variables"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: unknown) => void
}

const L = DEFAULT_LABELS.pricing

export function PricingTableView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "table")
  const rows = (c.rows as { item: string; amount: string }[]) ?? []
  const sectionLabel = staticLabel(c, "label", L.label)
  const itemCol = staticLabel(c, "itemColumnLabel", L.itemColumnLabel)
  const amountCol = staticLabel(c, "amountColumnLabel", L.amountColumnLabel)
  const subtotalLabel = staticLabel(c, "subtotalLabel", L.subtotalLabel)

  const updateRow = (index: number, part: "item" | "amount", value: string) => {
    const next = rows.map((r, j) => (j === index ? { ...r, [part]: value } : r))
    onField("rows", next)
  }

  if (variant === "quote") {
    return (
      <div>
        <SectionLabel
          value={sectionLabel}
          onChange={(v) => onField("label", v)}
          className="mb-3"
        />
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-baseline gap-2 text-[12px]">
              <div className="shrink-0">
                <VariableField
                  blockType="pricing"
                  field={`rows[${i}].item`}
                  variableDef={getPricingRowVariableDef(i, "item")}
                  value={row.item}
                  onChange={(v) => updateRow(i, "item", v)}
                  layout="inline"
                  className="text-gray-900"
                />
              </div>
              <div className="min-w-[1rem] flex-1 border-b border-dotted border-gray-300" />
              <div className="shrink-0">
                <VariableField
                  blockType="pricing"
                  field={`rows[${i}].amount`}
                  variableDef={getPricingRowVariableDef(i, "amount")}
                  value={row.amount}
                  onChange={(v) => updateRow(i, "amount", v)}
                  layout="inline"
                  className="font-semibold text-gray-900"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-end border-t border-gray-200 pt-2">
          <span className="text-[14px] font-bold text-gray-900">
            <EditableLabel
              value={subtotalLabel}
              onChange={(v) => onField("subtotalLabel", v)}
            />{" "}
            <VariableField
              blockType="pricing"
              field="subtotal"
              value={String(c.subtotal ?? "")}
              onChange={(v) => onField("subtotal", v)}
              layout="inline"
              className="inline"
            />
          </span>
        </div>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div>
        <SectionLabel
          value={sectionLabel}
          onChange={(v) => onField("label", v)}
          className="mb-2"
        />
        <table className="w-full text-[11px]">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="py-1.5 pl-2 pr-2 align-top text-gray-900">
                  <VariableField
                    blockType="pricing"
                    field={`rows[${i}].item`}
                    variableDef={getPricingRowVariableDef(i, "item")}
                    value={row.item}
                    onChange={(v) => updateRow(i, "item", v)}
                  />
                </td>
                <td className="py-1.5 pr-2 text-right align-top font-medium text-gray-900">
                  <VariableField
                    blockType="pricing"
                    field={`rows[${i}].amount`}
                    variableDef={getPricingRowVariableDef(i, "amount")}
                    value={row.amount}
                    onChange={(v) => updateRow(i, "amount", v)}
                    className="text-right"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-2 flex justify-end bg-gray-100 px-2 py-1.5 text-[12px] font-semibold">
          <EditableLabel
            value={subtotalLabel}
            onChange={(v) => onField("subtotalLabel", v)}
          />{" "}
          <VariableField
            blockType="pricing"
            field="subtotal"
            value={String(c.subtotal ?? "")}
            onChange={(v) => onField("subtotal", v)}
            layout="inline"
            className="ml-1 inline"
          />
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionLabel
        value={sectionLabel}
        onChange={(v) => onField("label", v)}
        className="mb-2"
      />
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-50">
            <th className="py-2 pl-2 text-left font-semibold text-gray-600">
              <EditableLabel
                value={itemCol}
                onChange={(v) => onField("itemColumnLabel", v)}
              />
            </th>
            <th className="py-2 pr-2 text-right font-semibold text-gray-600">
              <EditableLabel
                value={amountCol}
                onChange={(v) => onField("amountColumnLabel", v)}
                className="inline-block w-full text-right"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 pl-2 pr-2 align-top text-gray-900">
                <VariableField
                  blockType="pricing"
                  field={`rows[${i}].item`}
                  variableDef={getPricingRowVariableDef(i, "item")}
                  value={row.item}
                  onChange={(v) => updateRow(i, "item", v)}
                />
              </td>
              <td className="py-2 pr-2 text-right align-top font-medium text-gray-900">
                <VariableField
                  blockType="pricing"
                  field={`rows[${i}].amount`}
                  variableDef={getPricingRowVariableDef(i, "amount")}
                  value={row.amount}
                  onChange={(v) => updateRow(i, "amount", v)}
                  className="text-right"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex justify-end">
        <span className="text-[13px] font-semibold text-gray-900">
          <EditableLabel
            value={subtotalLabel}
            onChange={(v) => onField("subtotalLabel", v)}
          />{" "}
          <VariableField
            blockType="pricing"
            field="subtotal"
            value={String(c.subtotal ?? "")}
            onChange={(v) => onField("subtotal", v)}
            layout="inline"
            className="inline font-semibold"
          />
        </span>
      </div>
    </div>
  )
}
