import { INLINE_FRAGMENT_DRAG_SOURCE } from "@/lib/content-fragments"
import { TERMS_SEGMENT_DRAG_SOURCE } from "@/lib/terms-segments"
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core"

const NESTED_BLOCK_DRAG_SOURCES = new Set<string>([
  INLINE_FRAGMENT_DRAG_SOURCE,
  TERMS_SEGMENT_DRAG_SOURCE,
])

const COLUMN_DROP_PREFIX = "col:"

function isColumnDropId(id: string | number): boolean {
  return typeof id === "string" && id.startsWith(COLUMN_DROP_PREFIX)
}

function columnSlotCollisions(
  args: Parameters<CollisionDetection>[0],
  columnSlots: typeof args.droppableContainers,
) {
  return (
    pointerWithin({ ...args, droppableContainers: columnSlots }) ||
    rectIntersection({ ...args, droppableContainers: columnSlots })
  )
}

/** Keeps block drags on blocks and nested drags within the same block. */
export const canvasCollisionDetection: CollisionDetection = (args) => {
  const activeSource = args.active.data.current?.source

  if (activeSource && NESTED_BLOCK_DRAG_SOURCES.has(activeSource)) {
    const blockId = args.active.data.current?.blockId
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) => {
        const data = container.data.current
        return data?.source === activeSource && data?.blockId === blockId
      }),
    })
  }

  const eligible = args.droppableContainers.filter(
    (container) =>
      container.id !== args.active.id &&
      !NESTED_BLOCK_DRAG_SOURCES.has(container.data.current?.source ?? ""),
  )

  const columnSlots = eligible.filter((container) => isColumnDropId(container.id))
  if (columnSlots.length > 0) {
    const columnCollisions = columnSlotCollisions(args, columnSlots)
    if (columnCollisions.length > 0) {
      return columnCollisions
    }
  }

  return closestCenter({
    ...args,
    droppableContainers: eligible.filter(
      (container) => !isColumnDropId(container.id),
    ),
  })
}
