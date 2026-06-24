import {
  blockAllowsHalfWidth,
  canBlocksFormPair,
} from "@/lib/block-layout-rules"
import {
  enforceBlockLayoutRules,
  getLayoutColumn,
  setBlockLayoutColumn,
  type LayoutColumn,
} from "@/lib/block-layout"
import type { BuilderBlock } from "@/types/prompt-builder"

export type BlockDropTarget =
  | { kind: "reorder"; insertBeforeBlockId: string }
  | { kind: "column"; column: LayoutColumn; insertBeforeBlockId: string }
  | { kind: "pair-right"; leftBlockId: string }

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

  if (ref.startsWith("pair:")) {
    return { kind: "pair-right", leftBlockId: ref.slice("pair:".length) }
  }

  return { kind: "column", column, insertBeforeBlockId: ref }
}

export function resolveBlockDropTarget(
  blocks: BuilderBlock[],
  dragged: BuilderBlock,
  overBlockId: string,
  pointerX: number,
  overRect: { left: number; width: number },
): BlockDropTarget {
  if (!blockAllowsHalfWidth(dragged.type)) {
    return { kind: "reorder", insertBeforeBlockId: overBlockId }
  }

  const overIndex = blocks.findIndex((block) => block.id === overBlockId)
  if (overIndex < 0) {
    return { kind: "reorder", insertBeforeBlockId: overBlockId }
  }

  const overBlock = blocks[overIndex]
  const overColumn = getLayoutColumn(overBlock.content)
  const isLeftHalf = pointerX < overRect.left + overRect.width / 2

  if (isLeftHalf) {
    return { kind: "column", column: "left", insertBeforeBlockId: overBlockId }
  }

  if (
    overColumn === "left" &&
    canBlocksFormPair(overBlock, dragged.type)
  ) {
    const next = blocks[overIndex + 1]
    if (next && getLayoutColumn(next.content) === "right") {
      return { kind: "column", column: "right", insertBeforeBlockId: next.id }
    }
    return { kind: "pair-right", leftBlockId: overBlockId }
  }

  const next = blocks[overIndex + 1]
  return {
    kind: "column",
    column: "right",
    insertBeforeBlockId: next?.id ?? "__end__",
  }
}

export function applyBlockDrop(
  blocks: BuilderBlock[],
  draggedId: string,
  target: BlockDropTarget,
): BuilderBlock[] {
  const dragged = blocks.find((block) => block.id === draggedId)
  if (!dragged) return blocks

  let list = blocks.filter((block) => block.id !== draggedId)

  if (target.kind === "reorder") {
    const insertIndex = resolveInsertIndex(list, target.insertBeforeBlockId)
    if (insertIndex < 0) return blocks
    list.splice(insertIndex, 0, dragged)
    return enforceBlockLayoutRules(list)
  }

  if (target.kind === "pair-right") {
    if (!blockAllowsHalfWidth(dragged.type)) return blocks
    const leftIndex = list.findIndex((block) => block.id === target.leftBlockId)
    if (leftIndex < 0) return blocks
    const leftBlock = list[leftIndex]
    if (
      getLayoutColumn(leftBlock.content) !== "left" ||
      !canBlocksFormPair(leftBlock, dragged.type)
    ) {
      return blocks
    }

    const next = list[leftIndex + 1]
    if (next && getLayoutColumn(next.content) === "right") {
      list[leftIndex + 1] = setBlockLayoutColumn(dragged, "right")
    } else {
      list.splice(leftIndex + 1, 0, setBlockLayoutColumn(dragged, "right"))
    }
    return enforceBlockLayoutRules(list)
  }

  if (!blockAllowsHalfWidth(dragged.type)) {
    const insertIndex = resolveInsertIndex(list, target.insertBeforeBlockId)
    if (insertIndex < 0) return blocks
    list.splice(insertIndex, 0, dragged)
    return enforceBlockLayoutRules(list)
  }

  const placed = setBlockLayoutColumn(dragged, target.column)
  const insertIndex = resolveInsertIndex(list, target.insertBeforeBlockId)
  if (insertIndex < 0) return blocks

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

function resolveInsertIndex(
  blocks: BuilderBlock[],
  insertBeforeBlockId: string,
): number {
  if (insertBeforeBlockId === "__end__") return blocks.length
  if (insertBeforeBlockId === "__start__") return 0
  return blocks.findIndex((block) => block.id === insertBeforeBlockId)
}
