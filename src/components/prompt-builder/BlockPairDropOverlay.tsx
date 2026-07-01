import { useDroppable } from "@dnd-kit/core"

type Props = {
  id: string
  visible?: boolean
}

/** Right-half drop target on a block while dragging a half-width block. */
export function BlockPairDropOverlay({ id, visible = true }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !visible })

  if (!visible) return null

  return (
    <div
      ref={setNodeRef}
      className={`pointer-events-auto absolute inset-y-0 right-0 z-30 w-1/2 rounded-r-lg border-2 border-dashed transition-colors ${
        isOver
          ? "border-blue-400 bg-blue-50/70"
          : "border-blue-200/60 bg-blue-50/25"
      }`}
      aria-label="Drop to place beside block"
    />
  )
}
