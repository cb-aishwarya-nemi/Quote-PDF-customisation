import { ChevronDown, LayoutTemplate, Plus, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  onGenerateFromPdf: () => void
  onStartBlank: () => void
}

export function NewTemplateMenu({ onGenerateFromPdf, onStartBlank }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const closeAnd = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus className="size-3.5" />
        New template
        <ChevronDown
          className={`size-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="menu"
          aria-label="New template options"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => closeAnd(onGenerateFromPdf)}
            className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
          >
            <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <span>
              <span className="block text-[12px] font-medium text-gray-900">
                Generate new from PDF
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
                Upload a sample quote and match layout with AI
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => closeAnd(onStartBlank)}
            className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
          >
            <LayoutTemplate className="mt-0.5 size-4 shrink-0 text-gray-500" />
            <span>
              <span className="block text-[12px] font-medium text-gray-900">
                Start from blank
              </span>
              <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">
                Open an empty canvas and add blocks yourself
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
