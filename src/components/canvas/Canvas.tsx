import { SortableCanvasBlock } from "@/components/canvas/SortableCanvasBlock"
import { useCanvasStore } from "@/store/canvas-store"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { FileText } from "lucide-react"

export function Canvas() {
  const blocks = useCanvasStore((s) => s.template?.blocks ?? [])
  const setSelectedBlockId = useCanvasStore((s) => s.setSelectedBlockId)

  const { setNodeRef, isOver } = useDroppable({ id: "canvas" })

  return (
    <main
      className="flex min-w-0 flex-1 flex-col bg-[#e8eaed]"
      onClick={() => setSelectedBlockId(null)}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div
          ref={setNodeRef}
          className={`mx-auto min-h-[720px] w-full max-w-[640px] rounded-sm bg-white shadow-md ring-1 ring-black/5 transition-shadow ${
            isOver ? "ring-2 ring-blue-300" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {blocks.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-8 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-gray-100">
                <FileText className="size-6 text-gray-400" />
              </div>
              <p className="mt-4 text-[14px] font-medium text-gray-700">
                Your canvas is empty
              </p>
              <p className="mt-1 max-w-xs text-[13px] text-gray-500">
                Drag blocks from the left panel or click the + icon to start
                building your quote PDF layout.
              </p>
            </div>
          ) : (
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="px-8 py-6">
                {blocks.map((block) => (
                  <SortableCanvasBlock key={block.id} block={block} />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </main>
  )
}
