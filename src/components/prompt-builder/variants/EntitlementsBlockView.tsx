import { EditableLabel, SectionLabel } from "@/components/prompt-builder/EditableLabel"
import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { DEFAULT_LABELS, staticLabel } from "@/lib/block-static-labels"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: unknown) => void
}

type EntitlementRow = {
  name: string
  limit: string
  notes: string
}

const L = DEFAULT_LABELS.entitlements

export function EntitlementsBlockView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "table")
  const rows = (c.rows as EntitlementRow[]) ?? []
  const sectionLabel = staticLabel(c, "label", L.label)
  const nameCol = staticLabel(c, "nameColumnLabel", L.nameColumnLabel)
  const limitCol = staticLabel(c, "limitColumnLabel", L.limitColumnLabel)
  const notesCol = staticLabel(c, "notesColumnLabel", L.notesColumnLabel)

  const updateRow = (index: number, part: keyof EntitlementRow, value: string) => {
    const next = rows.map((r, j) => (j === index ? { ...r, [part]: value } : r))
    onField("rows", next)
  }

  if (variant === "list") {
    return (
      <div>
        <SectionLabel
          blockId={block.id}
          value={sectionLabel}
          onChange={(v) => onField("label", v)}
          className="mb-3"
        />
        <ul className="space-y-3">
          {rows.map((row, i) => (
            <li key={i} className="border-l-2 border-blue-200 pl-3">
              <InlineEditable
                blockId={block.id}
                value={row.name}
                onChange={(v) => updateRow(i, "name", v)}
                className="text-[12px] font-semibold text-gray-900"
              />
              <InlineEditable
                blockId={block.id}
                value={row.limit}
                onChange={(v) => updateRow(i, "limit", v)}
                className="mt-0.5 text-[11px] text-gray-600"
              />
              <InlineEditable
                blockId={block.id}
                value={row.notes}
                onChange={(v) => updateRow(i, "notes", v)}
                multiline
                className="mt-1 text-[10px] leading-relaxed text-gray-500"
              />
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (variant === "compact") {
    return (
      <div>
        <SectionLabel
          blockId={block.id}
          value={sectionLabel}
          onChange={(v) => onField("label", v)}
          className="mb-2"
        />
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {rows.map((row, i) => (
            <div key={i} className="flex items-start justify-between gap-4 px-3 py-2 text-[11px]">
              <InlineEditable
                blockId={block.id}
                value={row.name}
                onChange={(v) => updateRow(i, "name", v)}
                className="font-medium text-gray-900"
              />
              <InlineEditable
                blockId={block.id}
                value={row.limit}
                onChange={(v) => updateRow(i, "limit", v)}
                className="shrink-0 text-gray-600"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionLabel
        blockId={block.id}
        value={sectionLabel}
        onChange={(v) => onField("label", v)}
        className="mb-3"
      />
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
            <th className="pb-2 pr-3 font-medium">
              <EditableLabel blockId={block.id} value={nameCol} onChange={(v) => onField("nameColumnLabel", v)} />
            </th>
            <th className="pb-2 pr-3 font-medium">
              <EditableLabel blockId={block.id} value={limitCol} onChange={(v) => onField("limitColumnLabel", v)} />
            </th>
            <th className="pb-2 font-medium">
              <EditableLabel blockId={block.id} value={notesCol} onChange={(v) => onField("notesColumnLabel", v)} />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 last:border-0">
              <td className="py-2 pr-3 align-top font-medium text-gray-900">
                <InlineEditable
                  blockId={block.id}
                  value={row.name}
                  onChange={(v) => updateRow(i, "name", v)}
                />
              </td>
              <td className="py-2 pr-3 align-top text-gray-700">
                <InlineEditable
                  blockId={block.id}
                  value={row.limit}
                  onChange={(v) => updateRow(i, "limit", v)}
                />
              </td>
              <td className="py-2 align-top text-gray-500">
                <InlineEditable
                  blockId={block.id}
                  value={row.notes}
                  onChange={(v) => updateRow(i, "notes", v)}
                  multiline
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
