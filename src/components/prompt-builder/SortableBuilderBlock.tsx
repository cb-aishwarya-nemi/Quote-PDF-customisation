import { BlockChrome } from "@/components/prompt-builder/BlockChrome"
import { BuilderBlockView } from "@/components/prompt-builder/BuilderBlockView"
import { useCanEditBlockStructure } from "@/hooks/use-builder-editor-mode"
import { ADDABLE_BLOCKS, getVariantLabel } from "@/lib/block-variants"
import type { BuilderBlock } from "@/types/prompt-builder"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"

type Props = {
  block: BuilderBlock
}

export function SortableBuilderBlock({ block }: Props) {
  const canEditStructure = useCanEditBlockStructure()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    disabled: !canEditStructure,
    data: { source: "canvas", block },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`min-w-0 ${isDragging ? "relative z-10 opacity-90" : ""}`}
    >
      <BlockChrome
        block={block}
        isDragging={isDragging}
        dragHandleProps={
          canEditStructure ? { ...listeners, ...attributes } : undefined
        }
      >
        <BuilderBlockView block={block} />
      </BlockChrome>
    </div>
  )
}

export function BuilderDragOverlayLabel({ block }: { block: BuilderBlock }) {
  const variantId = String(block.content.variant ?? "classic")
  const variantLabel = getVariantLabel(block.type, variantId)
  const typeLabel =
    ADDABLE_BLOCKS.find((entry) => entry.type === block.type)?.label ??
    block.type.replace(/_/g, " ")

  return (
    <div className="rounded-lg border border-blue-300 bg-white px-4 py-3 shadow-lg">
      <p className="text-[13px] font-medium text-gray-900">{typeLabel}</p>
      {ADDABLE_BLOCKS.some((entry) => entry.type === block.type) && (
        <p className="text-[11px] text-gray-500">{variantLabel}</p>
      )}
    </div>
  )
}

export function BuilderBlockRow({
  children,
}: {
  children: ReactNode
}) {
  return <div className="grid grid-cols-2 items-start gap-4">{children}</div>
}
