import { INLINE_FRAGMENT_DRAG_SOURCE } from "@/lib/content-fragments"
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from "@dnd-kit/core"

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

/** Keeps block drags on blocks and inline-fragment drags within the same block. */
export const canvasCollisionDetection: CollisionDetection = (args) => {
  const activeSource = args.active.data.current?.source

  if (activeSource === INLINE_FRAGMENT_DRAG_SOURCE) {
    const blockId = args.active.data.current?.blockId
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((container) => {
        const data = container.data.current
        return (
          data?.source === INLINE_FRAGMENT_DRAG_SOURCE &&
          data?.blockId === blockId
        )
      }),
    })
  }

  const eligible = args.droppableContainers.filter(
    (container) =>
      container.id !== args.active.id &&
      container.data.current?.source !== INLINE_FRAGMENT_DRAG_SOURCE,
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
