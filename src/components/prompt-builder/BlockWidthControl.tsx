import {
  blockIsHalfWidth,
  getBlockWidthRule,
  widthLabelForBlock,
} from "@/lib/block-layout-rules"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock } from "@/types/prompt-builder"
import { Columns2 } from "lucide-react"

type Props = {
  block: BuilderBlock
}

export function BlockWidthControl({ block }: Props) {
  const setBlockCanvasWidth = usePromptBuilderStore((s) => s.setBlockCanvasWidth)
  const rule = getBlockWidthRule(block.type)
  const label = widthLabelForBlock(block)
  const isFixedWidth = rule === "full_only" || rule === "half_only"
  const nextWidth = blockIsHalfWidth(block) ? "full" : "half"

  const title = isFixedWidth
    ? rule === "full_only"
      ? "Full width is fixed for this block"
      : "Half width is fixed for this block"
    : nextWidth === "full"
      ? "Expand to full width"
      : "Use half width (50%)"

  return (
    <button
      type="button"
      disabled={isFixedWidth}
      onClick={(e) => {
        e.stopPropagation()
        setBlockCanvasWidth(block.id, nextWidth)
      }}
      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium shadow-sm transition-colors enabled:text-gray-600 enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
      title={title}
    >
      <Columns2 className="size-3" />
      {label}
    </button>
  )
}
