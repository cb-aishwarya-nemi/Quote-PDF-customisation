import { EditableDataTable } from "@/components/prompt-builder/EditableDataTable"
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

  return (
    <EditableDataTable
      blockId={block.id}
      headers={headers}
      rows={rows}
      variant={variant}
      onHeadersChange={(next) => onField("headers", next)}
      onRowsChange={(next) => onField("rows", next)}
    />
  )
}
