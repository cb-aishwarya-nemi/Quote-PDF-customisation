import { ADDABLE_BLOCKS, type AddableBlockEntry } from "@/lib/block-variants"
import type { BuilderBlockType } from "@/types/prompt-builder"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

export type AddBlockOptions = {
  fileAccept?: string
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
  items: AddableBlockEntry[]
  onAdd: (entry: AddableBlockEntry) => void
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <BlockMenuButton
            key={item.menuKey ?? item.type}
            label={item.label}
            onClick={() => onAdd(item)}
          />
        ))}
      </div>
    </div>
  )
}

type Props = {
  onAdd: (type: BuilderBlockType, options?: AddBlockOptions) => void
  align?: "center" | "right" | "left"
  allowedTypes?: BuilderBlockType[]
  children: (openMenu: (e: ReactMouseEvent<HTMLButtonElement>) => void) => ReactNode
}

export function AddBlockMenu({ onAdd, align = "center", allowedTypes, children }: Props) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isAllowed = (entry: AddableBlockEntry) =>
    !allowedTypes || allowedTypes.includes(entry.type)

  const standardBlocks = ADDABLE_BLOCKS.filter(
    (entry) => entry.group === "standard" && isAllowed(entry),
  )
  const customBlocks = ADDABLE_BLOCKS.filter(
    (entry) => entry.group === "custom" && isAllowed(entry),
  )

  const updatePosition = useCallback(() => {
    const btn = triggerRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 8,
      left:
        align === "right"
          ? rect.right
          : align === "left"
            ? rect.left
            : rect.left + rect.width / 2,
    })
  }, [align])

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

  const handleAdd = (entry: AddableBlockEntry) => {
    setOpen(false)
    onAdd(entry.type, { fileAccept: entry.fileAccept })
  }

  const openMenu = (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    triggerRef.current = e.currentTarget
    setOpen((value) => !value)
  }

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        className={`fixed z-[200] max-h-[min(70vh,420px)] w-[280px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-3 shadow-lg ${
          align === "right"
            ? "-translate-x-full"
            : align === "left"
              ? ""
              : "-translate-x-1/2"
        }`}
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
        <BlockMenuSection title="Custom" items={customBlocks} onAdd={handleAdd} />
      </div>,
      document.body,
    )

  return (
    <>
      {children(openMenu)}
      {menu}
    </>
  )
}
