import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: unknown) => void
}

export function CustomTableBlockView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "standard")
  const headers = (c.headers as string[]) ?? []
  const rows = (c.rows as string[][]) ?? []

  const updateHeader = (index: number, value: string) => {
    const next = headers.map((h, i) => (i === index ? value : h))
    onField("headers", next)
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const next = rows.map((row, ri) =>
      ri === rowIndex
        ? row.map((cell, ci) => (ci === colIndex ? value : cell))
        : row,
    )
    onField("rows", next)
  }

  const thClass =
    variant === "striped"
      ? "px-3 py-2 text-left font-medium"
      : variant === "minimal"
        ? "border-b border-gray-300 py-2 text-left font-semibold text-gray-800"
        : "py-2 pl-2 text-left font-semibold text-gray-600"

  const tdClass =
    variant === "striped"
      ? "border-t border-gray-100 px-3 py-2 text-gray-800"
      : variant === "minimal"
        ? "py-2 text-gray-700"
        : "py-2 pl-2 text-gray-800"

  const tableClass =
    variant === "striped"
      ? "w-full overflow-hidden rounded-lg border border-gray-200 text-[12px]"
      : "w-full border-collapse text-[12px]"

  const theadClass =
    variant === "striped"
      ? "bg-gray-800 text-white"
      : variant === "table" || variant === "standard"
        ? "border-b-2 border-gray-200 bg-gray-50"
        : ""

  return (
    <table className={tableClass}>
      <thead>
        <tr className={theadClass}>
          {headers.map((h, i) => (
            <th key={i} className={thClass}>
              <InlineEditable
                value={h}
                onChange={(v) => updateHeader(i, v)}
                className="font-inherit"
              />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr
            key={ri}
            className={
              variant === "striped"
                ? ri % 2 === 0
                  ? "bg-gray-50"
                  : "bg-white"
                : variant === "standard"
                  ? "border-b border-gray-100"
                  : ""
            }
          >
            {row.map((cell, ci) => (
              <td key={ci} className={tdClass}>
                <InlineEditable
                  value={cell}
                  onChange={(v) => updateCell(ri, ci, v)}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
