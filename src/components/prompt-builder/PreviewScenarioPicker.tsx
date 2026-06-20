import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { PREVIEW_SCENARIO_GROUPS } from "@/types/prompt-builder"
import { Check, ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type PreviewScenarioPickerProps = {
  variant?: "inline" | "floating"
  className?: string
}

export function PreviewScenarioPicker({
  variant: _variant = "inline",
  className,
}: PreviewScenarioPickerProps) {
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const setScenario = usePromptBuilderStore((s) => s.setActiveScenario)
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

  const triggerClass =
    "flex min-w-0 max-w-[240px] items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1 shadow-sm hover:bg-gray-50"

  const triggerLabel = activeScenario.label

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className ?? ""}`}>
      <span className="shrink-0 text-[11px] font-medium text-gray-500">Scenario</span>
      <div ref={rootRef} className="relative min-w-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={triggerClass}
        >
          <span className="min-w-0 truncate text-[12px] font-medium text-gray-900">
            {triggerLabel}
          </span>
          <ChevronDown
            className={`size-3.5 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Preview scenarios"
            className="absolute left-0 top-[calc(100%+6px)] z-40 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            {PREVIEW_SCENARIO_GROUPS.map((scenarioGroup) => (
              <div key={scenarioGroup.id}>
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {scenarioGroup.label}
                </p>
                {scenarioGroup.scenarios.map((scenario) => {
                  const selected = activeScenario.id === scenario.id
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setScenario(scenario)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                        selected
                          ? "bg-blue-50 text-blue-900"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate font-medium">{scenario.label}</span>
                      {selected && (
                        <Check className="size-3.5 shrink-0 text-blue-600" />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
