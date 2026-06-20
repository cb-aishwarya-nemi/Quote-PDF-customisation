import { BlockTray } from "@/components/canvas/BlockTray"
import { Canvas } from "@/components/canvas/Canvas"
import { PropertiesPanel } from "@/components/canvas/PropertiesPanel"
import { useCanvasStore } from "@/store/canvas-store"
import type { BlockType } from "@/types/template"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { useState } from "react"
import { getBlockLabel } from "@/lib/block-catalog"

export function EditorWorkspace() {
  const blocks = useCanvasStore((s) => s.template?.blocks ?? [])
  const addBlock = useCanvasStore((s) => s.addBlock)
  const reorderBlocks = useCanvasStore((s) => s.reorderBlocks)
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.source === "tray" && data.type) {
      setActiveDragLabel(getBlockLabel(data.type as BlockType))
    } else if (data?.source === "canvas" && data.block) {
      setActiveDragLabel(getBlockLabel(data.block.type))
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragLabel(null)
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)

    if (activeId.startsWith("tray-")) {
      const type = activeId.replace("tray-", "") as BlockType
      if (over.id === "canvas") {
        addBlock(type)
        return
      }
      const overIndex = blocks.findIndex((b) => b.id === over.id)
      if (overIndex >= 0) {
        addBlock(type, overIndex)
      }
      return
    }

    const fromIndex = blocks.findIndex((b) => b.id === active.id)
    const toIndex = blocks.findIndex((b) => b.id === over.id)
    if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
      reorderBlocks(fromIndex, toIndex)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
        <BlockTray />
        <Canvas />
        <PropertiesPanel />
      </div>
      <DragOverlay>
        {activeDragLabel ? (
          <div className="rounded-lg border border-blue-300 bg-white px-4 py-3 shadow-lg">
            <p className="text-[13px] font-medium text-gray-900">
              {activeDragLabel}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
