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

export function findColumnDropTarget(
  overId: string | number | undefined | null,
  collisionIds?: Array<string | number | undefined | null>,
): BlockDropTarget | null {
  const seen = new Set<string>()
  const candidates: Array<string | number | undefined | null> = [
    overId,
    ...(collisionIds ?? []),
  ]

  for (const id of candidates) {
    if (id == null) continue
    const key = String(id)
    if (seen.has(key)) continue
    seen.add(key)
    const target = parseColumnDropId(id)
    if (target) return target
  }

  return null
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

  if (target.kind === "pair-right") {
    if (!blockAllowsHalfWidth(dragged.type)) return blocks
    const leftIndex = list.findIndex((block) => block.id === target.leftBlockId)
    if (leftIndex < 0) return blocks
    const leftBlock = list[leftIndex]
    const canPair =
      getLayoutColumn(leftBlock.content) === "left" &&
      canBlocksFormPair(leftBlock, dragged.type)

    if (!canPair) {
      const placed = setBlockLayoutColumn(dragged, "right")
      const next = list[leftIndex + 1]
      if (next && getLayoutColumn(next.content) === "right") {
        list[leftIndex + 1] = placed
      } else {
        list.splice(leftIndex + 1, 0, placed)
      }
      return enforceBlockLayoutRules(list)
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
    const insertIndex = resolveInsertIndex(
      list,
      target.insertBeforeBlockId,
      insertOptions,
    )
    if (insertIndex < 0) return blocks
    list.splice(insertIndex, 0, dragged)
    return enforceBlockLayoutRules(list)
  }

  const placed = setBlockLayoutColumn(dragged, target.column)
  const insertIndex = resolveInsertIndex(
    list,
    target.insertBeforeBlockId,
    insertOptions,
  )
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
