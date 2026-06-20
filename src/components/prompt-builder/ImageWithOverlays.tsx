import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { createId } from "@/lib/create-id"
import type {
  ImageTextOverlay,
  ImageTextOverlayAlign,
  ImageTextOverlayStyle,
} from "@/types/image-block"
import { OVERLAY_POSITION_PRESETS } from "@/types/image-block"
import { GripVertical, Trash2, Type } from "lucide-react"
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"

const STYLE_CLASSES: Record<ImageTextOverlayStyle, string> = {
  light: "text-[15px] font-semibold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]",
  dark: "text-[14px] font-semibold text-gray-900",
  pill: "rounded-md bg-white/92 px-2.5 py-1 text-[13px] font-medium text-gray-900 shadow-md ring-1 ring-black/5 backdrop-blur-sm",
}

const DRAG_THRESHOLD_PX = 4

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function alignTransform(align: ImageTextOverlayAlign): string {
  switch (align) {
    case "left":
      return "translate(0, -50%)"
    case "right":
      return "translate(-100%, -50%)"
    default:
      return "translate(-50%, -50%)"
  }
}

function pointerToOverlayPosition(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): Pick<ImageTextOverlay, "x" | "y" | "align"> {
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 100, 2, 98),
    y: clamp(((clientY - rect.top) / rect.height) * 100, 2, 98),
    align: "center",
  }
}

function createDefaultOverlay(): ImageTextOverlay {
  return {
    id: createId("overlay"),
    text: "Your text here",
    x: 50,
    y: 88,
    align: "center",
    style: "pill",
  }
}

type OverlayProps = {
  overlay: ImageTextOverlay
  containerRef: React.RefObject<HTMLDivElement | null>
  isSelected: boolean
  onSelect: () => void
  onChange: (patch: Partial<ImageTextOverlay>) => void
  onRemove: () => void
}

function TextOverlayItem({
  overlay,
  containerRef,
  isSelected,
  onSelect,
  onChange,
  onRemove,
}: OverlayProps) {
  const editableWrapRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragSessionRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    dragging: boolean
    fromEditable: boolean
  } | null>(null)

  const applyPointerPosition = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    onChange(pointerToOverlayPosition(clientX, clientY, rect))
  }

  const endDragSession = () => {
    const session = dragSessionRef.current
    if (!session) return

    if (!session.dragging && session.fromEditable) {
      const editable = editableWrapRef.current?.querySelector<HTMLElement>(
        "[contenteditable='true']",
      )
      editable?.focus()
    }

    dragSessionRef.current = null
    setIsDragging(false)
  }

  const beginDragSession = (
    e: ReactPointerEvent,
    options: { immediate?: boolean; fromEditable?: boolean } = {},
  ) => {
    e.stopPropagation()
    onSelect()

    const { immediate = false, fromEditable = false } = options

    if (immediate) {
      e.preventDefault()
      applyPointerPosition(e.clientX, e.clientY)
      setIsDragging(true)
    }

    dragSessionRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dragging: immediate,
      fromEditable,
    }

    const onMove = (ev: PointerEvent) => {
      const session = dragSessionRef.current
      if (!session || ev.pointerId !== session.pointerId) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      if (!session.dragging) {
        const dx = ev.clientX - session.startX
        const dy = ev.clientY - session.startY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        session.dragging = true
        setIsDragging(true)
      }

      ev.preventDefault()
      applyPointerPosition(ev.clientX, ev.clientY)
    }

    const onUp = (ev: PointerEvent) => {
      if (dragSessionRef.current?.pointerId !== ev.pointerId) return
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      document.removeEventListener("pointercancel", onUp)
      endDragSession()
    }

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
    document.addEventListener("pointercancel", onUp)
  }

  const onRootPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest("button, select")) return

    const fromEditable = Boolean(target.closest("[contenteditable='true']"))
    beginDragSession(e, { fromEditable })
  }

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    beginDragSession(e, { immediate: true })
  }

  return (
    <div
      className={`group/overlay pointer-events-auto absolute z-10 max-w-[85%] touch-none ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      } ${isSelected || isDragging ? "z-20" : ""}`}
      style={{
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        transform: alignTransform(overlay.align),
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={onRootPointerDown}
    >
      <div
        className={`relative rounded-md transition-shadow ${
          isSelected || isDragging
            ? "ring-2 ring-blue-400 ring-offset-1 ring-offset-transparent"
            : "group-hover/overlay:ring-1 group-hover/overlay:ring-blue-300/70"
        }`}
      >
        <div
          className={`mb-1 flex flex-wrap items-center gap-1 transition-opacity ${
            isSelected || isDragging
              ? "opacity-100"
              : "opacity-0 group-hover/overlay:opacity-100 group-focus-within/overlay:opacity-100"
          }`}
        >
          <button
            type="button"
            title="Drag to reposition"
            aria-label="Drag to reposition"
            onPointerDown={onHandlePointerDown}
            className={`cursor-grab rounded bg-black/60 p-0.5 text-white hover:bg-black/75 active:cursor-grabbing ${
              isDragging ? "cursor-grabbing" : ""
            }`}
          >
            <GripVertical className="size-3" />
          </button>
          {OVERLAY_POSITION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={(e) => {
                e.stopPropagation()
                onChange({
                  x: preset.x,
                  y: preset.y,
                  align: preset.align,
                })
              }}
              className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                overlay.x === preset.x &&
                overlay.y === preset.y &&
                overlay.align === preset.align
                  ? "bg-blue-600 text-white"
                  : "bg-black/60 text-white hover:bg-black/75"
              }`}
            >
              {preset.label}
            </button>
          ))}
          <select
            value={overlay.style}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation()
              onChange({ style: e.target.value as ImageTextOverlayStyle })
            }}
            className="rounded border-0 bg-black/60 py-0.5 pl-1 pr-0.5 text-[9px] font-medium text-white"
          >
            <option value="pill">Pill</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="rounded bg-black/60 p-0.5 text-white hover:bg-red-600"
            aria-label="Remove text overlay"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
        <div ref={editableWrapRef}>
          <InlineEditable
            value={overlay.text}
            onChange={(text) => onChange({ text })}
            multiline
            placeholder="Enter overlay text…"
            className={`min-w-[4rem] select-text text-center ${STYLE_CLASSES[overlay.style]} ${
              isDragging ? "pointer-events-none" : ""
            }`}
          />
        </div>
      </div>
    </div>
  )
}

type FrameProps = {
  src: string
  alt: string
  overlays: ImageTextOverlay[]
  onUpdateOverlay: (id: string, patch: Partial<ImageTextOverlay>) => void
  onRemoveOverlay: (id: string) => void
}

export function ImageWithOverlays({
  src,
  alt,
  overlays,
  onUpdateOverlay,
  onRemoveOverlay,
}: FrameProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null)

  return (
    <div
      ref={containerRef}
      className="relative"
      onClick={(e) => {
        if (
          e.target === e.currentTarget ||
          (e.target as HTMLElement).tagName === "IMG"
        ) {
          setSelectedOverlayId(null)
        }
      }}
    >
      <img src={src} alt={alt} className="block w-full" draggable={false} />
      {overlays.map((overlay) => (
        <TextOverlayItem
          key={overlay.id}
          overlay={overlay}
          containerRef={containerRef}
          isSelected={selectedOverlayId === overlay.id}
          onSelect={() => setSelectedOverlayId(overlay.id)}
          onChange={(patch) => onUpdateOverlay(overlay.id, patch)}
          onRemove={() => {
            onRemoveOverlay(overlay.id)
            if (selectedOverlayId === overlay.id) setSelectedOverlayId(null)
          }}
        />
      ))}
    </div>
  )
}

export function AddTextOverlayButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      title="Add text on image"
    >
      <Type className="size-3" />
      Add text
    </button>
  )
}

export { createDefaultOverlay }
