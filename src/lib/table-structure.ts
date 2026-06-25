import { arrayMove } from "@dnd-kit/sortable"

export function tableColumnCount(headers: string[], rows: string[][]): number {
  const fromRows = rows.reduce((max, row) => Math.max(max, row.length), 0)
  return Math.max(headers.length, fromRows, 1)
}

function padToLength<T>(values: T[], length: number, fill: T): T[] {
  const next = [...values]
  while (next.length < length) next.push(fill)
  return next.slice(0, length)
}

export function reorderTableRows(
  rows: string[][],
  fromIndex: number,
  toIndex: number,
): string[][] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= rows.length ||
    toIndex >= rows.length ||
    fromIndex === toIndex
  ) {
    return rows
  }
  return arrayMove(rows, fromIndex, toIndex)
}

export function reorderTableColumns(
  headers: string[],
  rows: string[][],
  fromIndex: number,
  toIndex: number,
): { headers: string[]; rows: string[][] } {
  const cols = tableColumnCount(headers, rows)
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= cols ||
    toIndex >= cols ||
    fromIndex === toIndex
  ) {
    return { headers, rows }
  }

  const reorderLine = <T,>(line: T[], fill: T) =>
    arrayMove(padToLength(line, cols, fill), fromIndex, toIndex)

  return {
    headers:
      headers.length > 0
        ? reorderLine(headers, "")
        : headers,
    rows: rows.map((row) => reorderLine(row, "")),
  }
}

export function deleteTableRow(rows: string[][], index: number): string[][] {
  if (rows.length <= 1 || index < 0 || index >= rows.length) return rows
  return rows.filter((_, rowIndex) => rowIndex !== index)
}

export function deleteTableColumn(
  headers: string[],
  rows: string[][],
  index: number,
): { headers: string[]; rows: string[][] } {
  const cols = tableColumnCount(headers, rows)
  if (cols <= 1 || index < 0 || index >= cols) return { headers, rows }

  const removeAt = <T,>(line: T[]) =>
    padToLength(line, cols, "" as T).filter((_, colIndex) => colIndex !== index)

  return {
    headers: headers.length > 0 ? removeAt(headers) : headers,
    rows: rows.map((row) => removeAt(row)),
  }
}
