import {
  blockAllowsHalfWidth,
  blockRequiresFullWidth,
  blockRequiresHalfWidth,
  canBlocksFormPair,
} from "@/lib/block-layout-rules"
import type { BuilderBlock, BuilderBlockType } from "@/types/prompt-builder"

export type LayoutColumn = "full" | "left" | "right"

export type BlockLayoutRow =
  | { type: "single"; block: BuilderBlock }
  | { type: "pair"; left: BuilderBlock; right: BuilderBlock }

export function getLayoutColumn(content: Record<string, unknown>): LayoutColumn {
  const value = content.layoutColumn
  if (value === "left" || value === "right") return value
  return "full"
}

export function blocksAreActivePair(
  left: BuilderBlock,
  right: BuilderBlock,
): boolean {
  return (
    getLayoutColumn(left.content) === "left" &&
    getLayoutColumn(right.content) === "right" &&
    canBlocksFormPair(left, right.type)
  )
}

export function canAddBesideBlock(
  block: BuilderBlock,
  nextBlock: BuilderBlock | undefined,
): boolean {
  if (blockRequiresFullWidth(block.type)) return false
  if (getLayoutColumn(block.content) === "right") return false

  if (block.type === "company_logo" && nextBlock?.type === "company_details") {
    return false
  }

  if (nextBlock && blocksAreActivePair(block, nextBlock)) {
    return false
  }

  return blockAllowsHalfWidth(block.type)
}

/** Standalone half blocks keep their column; orphan right slots without a pair reset to left. */
export function reconcileOrphanHalfColumns(blocks: BuilderBlock[]): BuilderBlock[] {
  return blocks.map((block, index) => {
    const column = getLayoutColumn(block.content)

    if (column === "right") {
      const prev = blocks[index - 1]
      if (prev && blocksAreActivePair(prev, block)) return block
      if (blockAllowsHalfWidth(block.type)) {
        return setBlockLayoutColumn(block, "left")
      }
      return setBlockLayoutColumn(block, "full")
    }

    return block
  })
}

export function enforceBlockLayoutRules(blocks: BuilderBlock[]): BuilderBlock[] {
  return normalizeBlockLayout(reconcileOrphanHalfColumns(blocks))
}

export function normalizeBlockLayout(blocks: BuilderBlock[]): BuilderBlock[] {
  return blocks.map((block) => {
    let column = getLayoutColumn(block.content)

    if (blockRequiresFullWidth(block.type)) {
      return {
        ...block,
        content: { ...block.content, layoutColumn: "full" },
      }
    }

    if (blockRequiresHalfWidth(block.type)) {
      if (column === "full") {
        column = "left"
      }
    }

    if (column === "left") {
      return {
        ...block,
        content: {
          ...block.content,
          layoutColumn: blockAllowsHalfWidth(block.type) ? "left" : "full",
        },
      }
    }

    if (column === "right") {
      return {
        ...block,
        content: {
          ...block.content,
          layoutColumn: blockAllowsHalfWidth(block.type) ? "right" : "full",
        },
      }
    }

    return {
      ...block,
      content: { ...block.content, layoutColumn: column },
    }
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
      getLayoutColumn(next.content) === "right" &&
      canBlocksFormPair(block, next.type)
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

export function setBlockCanvasWidth(
  blocks: BuilderBlock[],
  blockId: string,
  width: "half" | "full",
): BuilderBlock[] {
  const index = blocks.findIndex((block) => block.id === blockId)
  if (index < 0) return blocks

  const block = blocks[index]
  const rule = blockRequiresFullWidth(block.type)
    ? "full_only"
    : blockRequiresHalfWidth(block.type)
      ? "half_only"
      : "half_or_full"

  if (rule === "full_only") return blocks
  if (rule === "half_only" && width === "full") return blocks

  const next = [...blocks]

  if (width === "full") {
    const current = getLayoutColumn(block.content)
    if (current === "left") {
      const partner = next[index + 1]
      if (partner && getLayoutColumn(partner.content) === "right") {
        next[index + 1] = setBlockLayoutColumn(partner, "full")
      }
    } else if (current === "right") {
      const partner = next[index - 1]
      if (partner && getLayoutColumn(partner.content) === "left") {
        next[index - 1] = setBlockLayoutColumn(partner, "full")
      }
    }
    next[index] = setBlockLayoutColumn(block, "full")
    return enforceBlockLayoutRules(next)
  }

  const partnerIndex = index + 1
  const partner = next[partnerIndex]
  if (
    partner &&
    getLayoutColumn(partner.content) === "right" &&
    getLayoutColumn(block.content) === "left"
  ) {
    return enforceBlockLayoutRules(next)
  }

  if (getLayoutColumn(block.content) === "right") {
    const prev = next[index - 1]
    if (prev && getLayoutColumn(prev.content) === "left") {
      next[index - 1] = setBlockLayoutColumn(prev, "left")
    }
  }

  next[index] = setBlockLayoutColumn(block, "left")
  return enforceBlockLayoutRules(next)
}

export function filterTypesForBesideAdd(
  leftBlock: BuilderBlock,
  types: BuilderBlockType[],
): BuilderBlockType[] {
  return types.filter((type) => canBlocksFormPair(leftBlock, type))
}

/** Remove a block and expand any surviving half_or_full pair partner to full width. */
export function removeBlockFromLayout(
  blocks: BuilderBlock[],
  blockId: string,
): BuilderBlock[] {
  const index = blocks.findIndex((block) => block.id === blockId)
  if (index < 0) return blocks

  const removed = blocks[index]
  const prev = blocks[index - 1]
  const next = blocks[index + 1]
  let nextBlocks = [...blocks]

  if (
    prev &&
    blocksAreActivePair(prev, removed) &&
    !blockRequiresHalfWidth(prev.type)
  ) {
    nextBlocks[index - 1] = setBlockLayoutColumn(prev, "full")
  }

  if (
    next &&
    blocksAreActivePair(removed, next) &&
    !blockRequiresHalfWidth(next.type)
  ) {
    nextBlocks[index + 1] = setBlockLayoutColumn(next, "full")
  }

  return nextBlocks.filter((block) => block.id !== blockId)
}
