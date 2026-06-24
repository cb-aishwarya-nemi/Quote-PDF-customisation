import { InlineEditable } from "@/components/prompt-builder/InlineEditable"

type Props = {
  blockId: string
  headers: string[]
  rows: string[][]
  variant?: string
  dense?: boolean
  onHeadersChange: (headers: string[]) => void
  onRowsChange: (rows: string[][]) => void
}

function columnCount(headers: string[], rows: string[][]): number {
  const fromRows = rows.reduce((max, row) => Math.max(max, row.length), 0)
  return Math.max(headers.length, fromRows, 1)
}

function columnWidth(columnCount: number): string {
  return `${100 / columnCount}%`
}

export function EditableDataTable({
  blockId,
  headers,
  rows,
  variant = "standard",
  dense = false,
  onHeadersChange,
  onRowsChange,
}: Props) {
  const textSize = dense ? "text-[10px]" : "text-[12px]"

  const updateHeader = (index: number, value: string) => {
    onHeadersChange(headers.map((header, i) => (i === index ? value : header)))
  }

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    onRowsChange(
      rows.map((row, ri) =>
        ri === rowIndex
          ? row.map((cell, ci) => (ci === colIndex ? value : cell))
          : row,
      ),
    )
  }

  const thClass =
    variant === "striped"
      ? `w-full min-w-0 align-top px-2 py-1.5 text-left font-medium ${dense ? "px-2 py-1" : "px-3 py-2"}`
      : variant === "minimal"
        ? `w-full min-w-0 align-top border-b border-gray-300 py-1.5 text-left font-semibold text-gray-800 ${dense ? "py-1" : "py-2"}`
        : `w-full min-w-0 align-top py-1.5 pl-2 pr-3 text-left font-semibold text-gray-600 ${dense ? "py-1" : "py-2 pl-2"}`

  const tdClass =
    variant === "striped"
      ? `w-full min-w-0 align-top border-t border-gray-100 text-gray-800 ${dense ? "px-2 py-1" : "px-3 py-2"}`
      : variant === "minimal"
        ? `w-full min-w-0 align-top text-gray-700 ${dense ? "py-1" : "py-2"}`
        : `w-full min-w-0 align-top text-gray-800 ${dense ? "py-1 pl-2 pr-3" : "py-2 pl-2 pr-3"}`

  const tableClass =
    variant === "striped"
      ? `w-full table-fixed overflow-hidden rounded-lg border border-gray-200 ${textSize}`
      : `w-full table-fixed border-collapse ${textSize}`

  const theadClass =
    variant === "striped"
      ? "bg-gray-800 text-white"
      : variant === "table" || variant === "standard"
        ? "border-b-2 border-gray-200 bg-gray-50"
        : ""

  const showHeader = headers.length > 0
  const columns = columnCount(headers, rows)

  return (
    <div className="w-full min-w-0">
      <table className={tableClass}>
        <colgroup>
          {Array.from({ length: columns }, (_, index) => (
            <col key={index} style={{ width: columnWidth(columns) }} />
          ))}
        </colgroup>
        {showHeader && (
          <thead>
            <tr className={theadClass}>
              {headers.map((header, index) => (
                <th key={index} className={thClass}>
                  <InlineEditable
                    blockId={blockId}
                    value={header}
                    onChange={(value) => updateHeader(index, value)}
                    hoverAffordance={false}
                    width="full"
                    className="font-inherit"
                  />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={
                variant === "striped"
                  ? rowIndex % 2 === 0
                    ? "bg-gray-50"
                    : "bg-white"
                  : variant === "standard"
                    ? "border-b border-gray-100"
                    : ""
              }
            >
              {row.map((cell, colIndex) => (
                <td key={colIndex} className={tdClass}>
                  <InlineEditable
                    blockId={blockId}
                    value={cell}
                    onChange={(value) => updateCell(rowIndex, colIndex, value)}
                    multiline
                    width="full"
                    hoverAffordance={false}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
