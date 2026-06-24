import { Plus, Text, Variable } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  variablePickerOptions: { key: string; label: string }[]
  onAddText: () => void
  onAddVariable: (variableKey: string, label: string) => void
  className?: string
}

export function AddComponentMenu({
  variablePickerOptions,
  onAddText,
  onAddVariable,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<"root" | "variables">("root")
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setOpen(false)
      setView("root")
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  const close = () => {
    setOpen(false)
    setView("root")
  }

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => {
            if (v) setView("root")
            return !v
          })
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-700"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus className="size-3.5" />
        Add component
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-40 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          {view === "root" ? (
            <>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddText()
                  close()
                }}
              >
                <Text className="size-3.5 shrink-0 text-gray-500" />
                Text
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={variablePickerOptions.length === 0}
                className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                onClick={(e) => {
                  e.stopPropagation()
                  if (variablePickerOptions.length === 1) {
                    const only = variablePickerOptions[0]
                    onAddVariable(only.key, only.label)
                    close()
                    return
                  }
                  setView("variables")
                }}
              >
                <span className="flex items-center gap-2">
                  <Variable className="size-3.5 shrink-0 text-gray-500" />
                  Variable
                </span>
                {variablePickerOptions.length > 1 && (
                  <span className="text-[10px] text-gray-400">›</span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[10px] font-medium text-gray-500 hover:bg-gray-50"
                onClick={(e) => {
                  e.stopPropagation()
                  setView("root")
                }}
              >
                ‹ Back
              </button>
              <div className="border-t border-gray-100" />
              <p className="px-3 py-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                Choose variable
              </p>
              <div className="max-h-40 overflow-y-auto">
                {variablePickerOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-1.5 text-left text-[11px] text-gray-700 hover:bg-gray-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddVariable(option.key, option.label)
                      close()
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
