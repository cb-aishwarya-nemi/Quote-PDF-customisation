import type { BuilderBlock } from "@/types/prompt-builder"

export type LayoutColumn = "full" | "left" | "right"

export type BlockLayoutRow =
  | { type: "single"; block: BuilderBlock }
  | { type: "pair"; left: BuilderBlock; right: BuilderBlock }

export function getLayoutColumn(content: Record<string, unknown>): LayoutColumn {
  const value = content.layoutColumn
  if (value === "left" || value === "right") return value
  return "full"
}

export function canAddBesideBlock(
  block: BuilderBlock,
  nextBlock: BuilderBlock | undefined,
): boolean {
  if (block.type === "quote_summary_header") return false
  if (getLayoutColumn(block.content) === "right") return false
  if (nextBlock && getLayoutColumn(nextBlock.content) === "right") return false
  return true
}

export function normalizeBlockLayout(blocks: BuilderBlock[]): BuilderBlock[] {
  return blocks.map((block, index) => {
    const column = getLayoutColumn(block.content)

    if (column === "left") {
      const next = blocks[index + 1]
      if (!next || getLayoutColumn(next.content) !== "right") {
        return {
          ...block,
          content: { ...block.content, layoutColumn: "full" },
        }
      }
    }

    if (column === "right") {
      const prev = blocks[index - 1]
      if (!prev || getLayoutColumn(prev.content) !== "left") {
        return {
          ...block,
          content: { ...block.content, layoutColumn: "full" },
        }
      }
    }

    return block
  })
}

export function groupBlocksForLayout(blocks: BuilderBlock[]): BlockLayoutRow[] {
  const rows: BlockLayoutRow[] = []
  let index = 0

  while (index < blocks.length) {
    const block = blocks[index]
    const next = blocks[index + 1]

    if (
      getLayoutColumn(block.content) === "left" &&
      next &&
      getLayoutColumn(next.content) === "right"
    ) {
      rows.push({ type: "pair", left: block, right: next })
      index += 2
      continue
    }

    rows.push({ type: "single", block })
    index += 1
  }

  return rows
}

export function setBlockLayoutColumn(
  block: BuilderBlock,
  layoutColumn: LayoutColumn,
): BuilderBlock {
  return {
    ...block,
    content: { ...block.content, layoutColumn },
  }
}
