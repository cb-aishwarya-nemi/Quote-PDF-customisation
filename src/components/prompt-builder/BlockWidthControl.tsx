import {
  blockIsHalfWidth,
  getBlockWidthRule,
  widthLabelForBlock,
} from "@/lib/block-layout-rules"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock } from "@/types/prompt-builder"
import { Check, ChevronDown, Columns2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  block: BuilderBlock
}

type WidthOption = {
  value: "half" | "full"
  label: "50%" | "100%"
  description: string
}

const WIDTH_OPTIONS: WidthOption[] = [
  { value: "half", label: "50%", description: "Half width — one column" },
  { value: "full", label: "100%", description: "Full width — spans both columns" },
]

export function BlockWidthControl({ block }: Props) {
  const setBlockCanvasWidth = usePromptBuilderStore((s) => s.setBlockCanvasWidth)
  const rule = getBlockWidthRule(block.type)
  const label = widthLabelForBlock(block)
  const isHalf = blockIsHalfWidth(block)
  const isFixedWidth = rule === "full_only" || rule === "half_only"

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const availableOptions = WIDTH_OPTIONS.filter((option) => {
    if (rule === "full_only") return option.value === "full"
    if (rule === "half_only") return option.value === "half"
    return true
  })

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const title = isFixedWidth
    ? rule === "full_only"
      ? "Full width is fixed for this block"
      : "Half width is fixed for this block"
    : "Choose layout width"

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        disabled={isFixedWidth}
        onClick={(e) => {
          e.stopPropagation()
          if (!isFixedWidth) setOpen((v) => !v)
        }}
        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium shadow-sm transition-colors enabled:text-gray-600 enabled:hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
        title={title}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Columns2 className="size-3" />
        {label}
        {!isFixedWidth && (
          <ChevronDown
            className={`size-3 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && !isFixedWidth && (
        <div
          className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
          aria-label="Layout width"
          onClick={(e) => e.stopPropagation()}
        >
          {availableOptions.map((option) => {
            const selected =
              option.value === "half" ? isHalf : !isHalf
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={(e) => {
                  e.stopPropagation()
                  setBlockCanvasWidth(block.id, option.value)
                  setOpen(false)
                }}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                  selected ? "bg-blue-50/80" : "hover:bg-gray-50"
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-gray-900">
                      {option.label}
                    </span>
                    {selected && (
                      <Check
                        className="size-3 shrink-0 text-blue-600"
                        strokeWidth={2.5}
                      />
                    )}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-snug text-gray-500">
                    {option.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
