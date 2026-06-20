import { ADDABLE_BLOCKS } from "@/lib/block-variants"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlockType } from "@/types/prompt-builder"
import { Plus } from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"
import { createPortal } from "react-dom"

type Props = {
  afterId?: string
  atStart?: boolean
}

function BlockMenuButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex min-w-0 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
    >
      <Plus className="size-3 shrink-0 text-gray-400" strokeWidth={2} />
      <span className="truncate text-[12px] font-semibold text-gray-800">
        {label}
      </span>
    </button>
  )
}

function BlockMenuSection({
  title,
  items,
  onAdd,
}: {
  title: string
  items: { type: BuilderBlockType; label: string }[]
  onAdd: (type: BuilderBlockType) => void
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <BlockMenuButton
            key={item.type}
            label={item.label}
            onClick={() => onAdd(item.type)}
          />
        ))}
      </div>
    </div>
  )
}

export function AddBlockDivider({ afterId, atStart }: Props) {
  const addBlock = usePromptBuilderStore((s) => s.addBlock)
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const standardBlocks = ADDABLE_BLOCKS.filter((b) => b.group === "standard")
  const customBlocks = ADDABLE_BLOCKS.filter((b) => b.group === "custom")

  const updatePosition = useCallback(() => {
    const btn = triggerRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updatePosition()
    window.addEventListener("resize", onScrollOrResize)
    window.addEventListener("scroll", onScrollOrResize, true)
    return () => {
      window.removeEventListener("resize", onScrollOrResize)
      window.removeEventListener("scroll", onScrollOrResize, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: globalThis.MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  const handleAdd = (type: BuilderBlockType) => {
    addBlock(type, atStart ? "__start__" : afterId)
    setOpen(false)
  }

  const toggleOpen = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setOpen((v) => !v)
  }

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        className="fixed z-[200] w-[280px] -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
        style={{ top: menuPos.top, left: menuPos.left }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <BlockMenuSection
          title="Standard"
          items={standardBlocks}
          onAdd={handleAdd}
        />
        <div className="my-3 border-t border-gray-100" />
        <BlockMenuSection
          title="Custom"
          items={customBlocks}
          onAdd={handleAdd}
        />
      </div>,
      document.body,
    )

  return (
    <>
      <div className="group/divider relative py-1">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200 transition-colors group-hover/divider:bg-gray-300" />
          <button
            ref={triggerRef}
            type="button"
            onClick={toggleOpen}
            className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-500 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600"
          >
            <Plus className="size-3" />
            Add block
          </button>
          <div className="h-px flex-1 bg-gray-200 transition-colors group-hover/divider:bg-gray-300" />
        </div>
      </div>
      {menu}
    </>
  )
}
