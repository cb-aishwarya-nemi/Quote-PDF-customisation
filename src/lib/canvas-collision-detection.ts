import { INLINE_FRAGMENT_DRAG_SOURCE } from "@/lib/content-fragments"
import {
  closestCenter,
  type CollisionDetection,
} from "@dnd-kit/core"

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

  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) =>
        container.data.current?.source !== INLINE_FRAGMENT_DRAG_SOURCE,
    ),
  })
}
