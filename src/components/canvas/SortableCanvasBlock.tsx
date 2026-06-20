import { BlockCanvasPreview } from "@/components/canvas/BlockCanvasPreview"
import { getBlockLabel } from "@/lib/block-catalog"
import { useCanvasStore } from "@/store/canvas-store"
import type { Block } from "@/types/template"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"

export function SortableCanvasBlock({ block }: { block: Block }) {
  const selectedBlockId = useCanvasStore((s) => s.selectedBlockId)
  const setSelectedBlockId = useCanvasStore((s) => s.setSelectedBlockId)
  const removeBlock = useCanvasStore((s) => s.removeBlock)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id, data: { source: "canvas", block } })

  const isSelected = selectedBlockId === block.id

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingTop: block.layout.topPadding,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg transition-shadow ${
        isDragging ? "z-10 opacity-90 shadow-lg" : ""
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSelectedBlockId(block.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setSelectedBlockId(block.id)
          }
        }}
        className={`w-full cursor-pointer rounded-lg border-2 bg-white p-4 text-left transition-all ${
          isSelected
            ? "border-blue-500 ring-2 ring-blue-100"
            : "border-transparent hover:border-gray-200 hover:shadow-sm"
        } ${block.layout.showBorder ? "border-gray-200" : ""}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            {getBlockLabel(block.type)}
          </span>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              className="cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              {...listeners}
              {...attributes}
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeBlock(block.id)
              }}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove block"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
        <BlockCanvasPreview block={block} />
      </div>
    </div>
  )
}
