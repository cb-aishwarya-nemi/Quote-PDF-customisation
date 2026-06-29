import { PREVIEW_CUSTOMERS } from "@/data/preview-customers"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { Check, ChevronDown, Users } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type CustomerPreviewPickerProps = {
  variant?: "inline" | "strip"
  className?: string
}

export function CustomerPreviewPicker({
  variant = "inline",
  className,
}: CustomerPreviewPickerProps) {
  const activePreviewCustomerId = usePromptBuilderStore(
    (s) => s.activePreviewCustomerId,
  )
  const setActivePreviewCustomer = usePromptBuilderStore(
    (s) => s.setActivePreviewCustomer,
  )
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const activeCustomer =
    PREVIEW_CUSTOMERS.find((customer) => customer.id === activePreviewCustomerId) ??
    null

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

  const triggerClass =
    variant === "strip"
      ? "flex min-w-0 max-w-[280px] items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 shadow-sm hover:bg-gray-50"
      : "flex min-w-0 max-w-[260px] items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1 shadow-sm hover:bg-gray-50"

  const triggerLabel = activeCustomer?.label ?? "Select customer"

  return (
    <div ref={rootRef} className={`relative flex min-w-0 ${className ?? ""}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={triggerClass}
      >
        <Users className="size-3.5 shrink-0 text-gray-400" />
        <span
          className={`min-w-0 truncate text-[12px] font-medium ${
            activeCustomer ? "text-blue-700" : "text-gray-900"
          }`}
        >
          {triggerLabel}
        </span>
        <ChevronDown
          className={`size-3.5 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Preview customers"
          className={`absolute z-40 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg ${
            variant === "strip" ? "right-0" : "left-0"
          } top-[calc(100%+6px)]`}
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            View canvas for
          </p>
          {PREVIEW_CUSTOMERS.map((customer) => {
            const selected = activePreviewCustomerId === customer.id
            return (
              <button
                key={customer.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setActivePreviewCustomer(customer.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                  selected
                    ? "bg-blue-50 text-blue-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="truncate font-medium">{customer.label}</span>
                {selected && (
                  <Check className="size-3.5 shrink-0 text-blue-600" />
                )}
              </button>
            )
          })}
          {activeCustomer && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => {
                  setActivePreviewCustomer(null)
                  setOpen(false)
                }}
                className="flex w-full px-3 py-2 text-left text-[12px] text-gray-500 hover:bg-gray-50"
              >
                Use template defaults
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
