import { BLOCK_CATALOG } from "@/lib/block-catalog"
import { useCanvasStore } from "@/store/canvas-store"
import type { BlockType } from "@/types/template"
import { useDraggable } from "@dnd-kit/core"
import { GripVertical, Plus } from "lucide-react"

function TrayItem({
  type,
  label,
  description,
  onAdd,
}: {
  type: BlockType
  label: string
  description: string
  onAdd: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `tray-${type}`,
    data: { source: "tray", type },
  })

  return (
    <div
      ref={setNodeRef}
      className={`group flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2.5 transition-all hover:border-blue-200 hover:shadow-sm ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <button
        type="button"
        className="mt-0.5 cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        {...listeners}
        {...attributes}
        aria-label={`Drag ${label}`}
      >
        <GripVertical className="size-4" />
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="min-w-0 flex-1 text-left"
      >
        <p className="text-[13px] font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-gray-500">
          {description}
        </p>
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-gray-100 hover:text-blue-600 group-hover:opacity-100"
        aria-label={`Add ${label}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export function BlockTray() {
  const addBlock = useCanvasStore((s) => s.addBlock)
  const blockTypes = useCanvasStore((s) => s.template?.blocks.map((b) => b.type))

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-[13px] font-semibold text-gray-900">Blocks</h2>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Drag or click to add to canvas
        </p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {BLOCK_CATALOG.map((item) => {
          const onCanvas = blockTypes?.includes(item.type)
          return (
            <div key={item.type} className="relative">
              <TrayItem
                type={item.type}
                label={item.label}
                description={item.description}
                onAdd={() => addBlock(item.type)}
              />
              {onCanvas && (
                <span className="absolute right-2 top-2 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">
                  On canvas
                </span>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
