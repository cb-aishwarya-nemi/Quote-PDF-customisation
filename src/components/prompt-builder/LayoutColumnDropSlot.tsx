import { useDroppable } from "@dnd-kit/core"

type Props = {
  id: string
  visible?: boolean
  label?: string
  stretch?: boolean
}

export function LayoutColumnDropSlot({ id, visible = true, label, stretch }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !visible })

  if (!visible) {
    return <div aria-hidden className="min-h-0" />
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed transition-colors ${
        stretch ? "flex h-full min-h-[56px] flex-col" : "min-h-[56px]"
      } ${
        isOver
          ? "border-blue-400 bg-blue-50/70"
          : "border-blue-200/80 bg-blue-50/20"
      }`}
      aria-label={label}
    >
      {label && (
        <p className="flex flex-1 items-center justify-center px-2 py-3 text-center text-[10px] font-medium text-blue-600/80">
          {label}
        </p>
      )}
    </div>
  )
}
