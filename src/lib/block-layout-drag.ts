import {
  blockAllowsHalfWidth,
  canBlocksFormPair,
} from "@/lib/block-layout-rules"
import {
  blocksAreActivePair,
  enforceBlockLayoutRules,
  getLayoutColumn,
  setBlockLayoutColumn,
  type LayoutColumn,
} from "@/lib/block-layout"
import type { BuilderBlock, BuilderBlockType } from "@/types/prompt-builder"

export type BlockDropTarget =
  | { kind: "reorder"; insertBeforeBlockId: string }
  | { kind: "column"; column: LayoutColumn; insertBeforeBlockId: string }
  | { kind: "pair-right"; leftBlockId: string }
  | { kind: "pair-beside-anchor"; anchorBlockId: string }

const DROP_PREFIX = "col:"

export function columnDropId(
  column: "left" | "right",
  ref: string,
): string {
  return `${DROP_PREFIX}${column}:${ref}`
}

export function parseColumnDropId(
  id: string | number,
): BlockDropTarget | null {
  if (typeof id !== "string" || !id.startsWith(DROP_PREFIX)) return null
  const rest = id.slice(DROP_PREFIX.length)
  const colon = rest.indexOf(":")
  if (colon < 0) return null

  const column = rest.slice(0, colon) as LayoutColumn
  const ref = rest.slice(colon + 1)
  if (column !== "left" && column !== "right") return null

  if (ref.startsWith("beside:")) {
    return { kind: "pair-beside-anchor", anchorBlockId: ref.slice("beside:".length) }
  }

  if (ref.startsWith("pair:")) {
    return { kind: "pair-right", leftBlockId: ref.slice("pair:".length) }
  }

  return { kind: "column", column, insertBeforeBlockId: ref }
}

export function findColumnDropTarget(
  overId: string | number | undefined | null,
  collisionIds?: Array<string | number | undefined | null>,
): BlockDropTarget | null {
  const seen = new Set<string>()
  const candidates: Array<string | number | undefined | null> = [
    overId,
    ...(collisionIds ?? []),
  ]

  const matches: BlockDropTarget[] = []

  for (const id of candidates) {
    if (id == null) continue
    const key = String(id)
    if (seen.has(key)) continue
    seen.add(key)
    const target = parseColumnDropId(id)
    if (target) matches.push(target)
  }

  if (matches.length === 0) return null
  if (matches.length === 1) return matches[0]

  matches.sort(
    (a, b) => dropTargetPriority(a) - dropTargetPriority(b),
  )
  return matches[0]
}

function dropTargetPriority(target: BlockDropTarget): number {
  if (target.kind === "pair-beside-anchor") return 0
  if (target.kind === "pair-right") return 1
  return 2
}

export function canAcceptRightPartnerDrop(
  block: BuilderBlock,
  blocks: BuilderBlock[],
  draggedType: BuilderBlockType,
): boolean {
  if (!blockAllowsHalfWidth(draggedType)) return false

  const column = getLayoutColumn(block.content)
  const index = blocks.findIndex((entry) => entry.id === block.id)
  const next = blocks[index + 1]
  const prev = blocks[index - 1]

  if (column === "left") {
    if (
      next &&
      getLayoutColumn(next.content) === "right" &&
      blocksAreActivePair(block, next)
    ) {
      return false
    }
    return canBlocksFormPair(block, draggedType)
  }

  if (column === "full" && blockAllowsHalfWidth(block.type)) {
    return canBlocksFormPair(setBlockLayoutColumn(block, "left"), draggedType)
  }

  if (
    column === "right" &&
    prev &&
    blocksAreActivePair(prev, block)
  ) {
    return canBlocksFormPair(setBlockLayoutColumn(block, "left"), draggedType)
  }

  return false
}

export function rightPairDropIdForBlock(
  block: BuilderBlock,
  blocks: BuilderBlock[],
): string {
  const column = getLayoutColumn(block.content)
  const index = blocks.findIndex((entry) => entry.id === block.id)
  const prev = blocks[index - 1]

  if (
    column === "right" &&
    prev &&
    blocksAreActivePair(prev, block)
  ) {
    return columnDropId("right", `beside:${block.id}`)
  }

  return columnDropId("right", `pair:${block.id}`)
}

export function resolveBlockDropOnBlock(
  blocks: BuilderBlock[],
  draggedId: string,
  overBlockId: string,
): BlockDropTarget | null {
  const dragged = blocks.find((block) => block.id === draggedId)
  const over = blocks.find((block) => block.id === overBlockId)
  if (!dragged || !over || dragged.id === over.id) return null
  if (!canAcceptRightPartnerDrop(over, blocks, dragged.type)) return null

  const column = getLayoutColumn(over.content)
  const index = blocks.findIndex((block) => block.id === overBlockId)
  const prev = blocks[index - 1]

  if (
    column === "right" &&
    prev &&
    blocksAreActivePair(prev, over)
  ) {
    return { kind: "pair-beside-anchor", anchorBlockId: over.id }
  }

  return { kind: "pair-right", leftBlockId: over.id }
}

export function applyBlockDrop(
  blocks: BuilderBlock[],
  draggedId: string,
  target: BlockDropTarget,
): BuilderBlock[] {
  const dragged = blocks.find((block) => block.id === draggedId)
  if (!dragged) return blocks

  const originalIndex = blocks.findIndex((block) => block.id === draggedId)
  let list = blocks.filter((block) => block.id !== draggedId)
  const insertOptions = { draggedId, originalIndex }

  if (target.kind === "reorder") {
    const insertIndex = resolveInsertIndex(
      list,
      target.insertBeforeBlockId,
      insertOptions,
    )
    if (insertIndex < 0) return blocks
    list.splice(insertIndex, 0, dragged)
    return enforceBlockLayoutRules(list)
  }

  if (target.kind === "pair-beside-anchor") {
    if (!blockAllowsHalfWidth(dragged.type)) return blocks

    const anchorIndex = list.findIndex(
      (block) => block.id === target.anchorBlockId,
    )
    if (anchorIndex < 0) return blocks

    const anchorAsLeft = setBlockLayoutColumn(list[anchorIndex], "left")
    if (!canBlocksFormPair(anchorAsLeft, dragged.type)) return blocks

    const draggedRight = setBlockLayoutColumn(dragged, "right")
    list[anchorIndex] = anchorAsLeft

    const next = list[anchorIndex + 1]
    if (next && getLayoutColumn(next.content) === "right") {
      list[anchorIndex + 1] = draggedRight
    } else {
      list.splice(anchorIndex + 1, 0, draggedRight)
    }

    return enforceBlockLayoutRules(list)
  }

  if (target.kind === "pair-right") {
    if (!blockAllowsHalfWidth(dragged.type)) return blocks

    const leftIndex = list.findIndex((block) => block.id === target.leftBlockId)
    if (leftIndex < 0) return blocks

    let leftBlock = list[leftIndex]
    let column = getLayoutColumn(leftBlock.content)

    if (column === "full" && blockAllowsHalfWidth(leftBlock.type)) {
      leftBlock = setBlockLayoutColumn(leftBlock, "left")
      list[leftIndex] = leftBlock
      column = "left"
    }

    if (column !== "left" || !canBlocksFormPair(leftBlock, dragged.type)) {
      return blocks
    }

    const draggedRight = setBlockLayoutColumn(dragged, "right")
    const next = list[leftIndex + 1]
    if (next && getLayoutColumn(next.content) === "right") {
      list[leftIndex + 1] = draggedRight
    } else {
      list.splice(leftIndex + 1, 0, draggedRight)
    }

    return enforceBlockLayoutRules(list)
  }

  if (!blockAllowsHalfWidth(dragged.type)) {
    const insertIndex = resolveInsertIndex(
      list,
      target.insertBeforeBlockId,
      insertOptions,
    )
    if (insertIndex < 0) return blocks
    list.splice(insertIndex, 0, dragged)
    return enforceBlockLayoutRules(list)
  }

  const insertIndex = resolveInsertIndex(
    list,
    target.insertBeforeBlockId,
    insertOptions,
  )
  if (insertIndex < 0) return blocks

  if (target.column === "right") {
    const paired = applyRightColumnDrop(list, dragged, insertIndex)
    if (!paired) return blocks
    return enforceBlockLayoutRules(paired)
  }

  const placed = setBlockLayoutColumn(dragged, target.column)

  if (
    target.column === "left" &&
    insertIndex < list.length &&
    getLayoutColumn(list[insertIndex].content) === "right" &&
    canBlocksFormPair(placed, list[insertIndex].type)
  ) {
    list.splice(insertIndex, 0, placed)
    return enforceBlockLayoutRules(list)
  }

  list.splice(insertIndex, 0, placed)
  return enforceBlockLayoutRules(list)
}

/**
 * Place a dragged block in the right column at `insertIndex`, ensuring a valid
 * left partner exists so reconcile does not flip it back to left.
 */
function applyRightColumnDrop(
  list: BuilderBlock[],
  dragged: BuilderBlock,
  insertIndex: number,
): BuilderBlock[] | null {
  const next = [...list]
  const draggedRight = setBlockLayoutColumn(dragged, "right")

  if (insertIndex > 0) {
    const prev = next[insertIndex - 1]
    const prevCol = getLayoutColumn(prev.content)

    if (prevCol === "left" && canBlocksFormPair(prev, dragged.type)) {
      const atInsert = next[insertIndex]
      if (atInsert && getLayoutColumn(atInsert.content) === "right") {
        next[insertIndex] = draggedRight
      } else {
        next.splice(insertIndex, 0, draggedRight)
      }
      return next
    }

    if (
      prevCol === "full" &&
      blockAllowsHalfWidth(prev.type) &&
      canBlocksFormPair(setBlockLayoutColumn(prev, "left"), dragged.type)
    ) {
      next[insertIndex - 1] = setBlockLayoutColumn(prev, "left")
      next.splice(insertIndex, 0, draggedRight)
      return next
    }
  }

  const anchor = next[insertIndex]
  if (anchor) {
    const anchorCol = getLayoutColumn(anchor.content)

    if (
      anchorCol === "full" &&
      blockAllowsHalfWidth(anchor.type) &&
      canBlocksFormPair(setBlockLayoutColumn(anchor, "left"), dragged.type)
    ) {
      next[insertIndex] = setBlockLayoutColumn(anchor, "left")
      const after = next[insertIndex + 1]
      if (after && getLayoutColumn(after.content) === "right") {
        next[insertIndex + 1] = draggedRight
      } else {
        next.splice(insertIndex + 1, 0, draggedRight)
      }
      return next
    }

    if (anchorCol === "left" && canBlocksFormPair(anchor, dragged.type)) {
      const after = next[insertIndex + 1]
      if (after && getLayoutColumn(after.content) === "right") {
        next[insertIndex + 1] = draggedRight
      } else {
        next.splice(insertIndex + 1, 0, draggedRight)
      }
      return next
    }
  }

  return null
}

function resolveInsertIndex(
  blocks: BuilderBlock[],
  insertBeforeBlockId: string,
  options?: { draggedId?: string; originalIndex?: number },
): number {
  if (insertBeforeBlockId === "__end__") return blocks.length
  if (insertBeforeBlockId === "__start__") return 0

  const index = blocks.findIndex((block) => block.id === insertBeforeBlockId)
  if (index >= 0) return index

  if (
    options?.draggedId &&
    insertBeforeBlockId === options.draggedId &&
    options.originalIndex != null &&
    options.originalIndex >= 0
  ) {
    return Math.min(options.originalIndex, blocks.length)
  }

  return -1
}
