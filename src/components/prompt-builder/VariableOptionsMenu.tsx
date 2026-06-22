import { getVariableCatalog } from "@/lib/derive-template-variables"
import type { TemplateVariableCategory } from "@/types/prompt-builder"
import { Check, Link2, Pencil, Search, Unlink } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

const CATEGORY_BADGE_STYLES: Record<TemplateVariableCategory, string> = {
  quote: "bg-blue-50 text-blue-700 ring-blue-100 hover:bg-blue-100/80",
  customer: "bg-violet-50 text-violet-700 ring-violet-100 hover:bg-violet-100/80",
  contract: "bg-amber-50 text-amber-800 ring-amber-100 hover:bg-amber-100/80",
  pricing: "bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100/80",
  people: "bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200/80",
  routing: "bg-orange-50 text-orange-800 ring-orange-100 hover:bg-orange-100/80",
  custom: "bg-gray-100 text-gray-600 ring-gray-200 hover:bg-gray-200/80",
}

const CATEGORY_LABELS: Record<TemplateVariableCategory, string> = {
  quote: "Quote",
  customer: "Customer",
  contract: "Contract",
  pricing: "Pricing",
  people: "People",
  routing: "Conditions",
  custom: "Custom",
}

type Props = {
  fieldLabel: string
  variableKey: string
  category: TemplateVariableCategory
  fallbackValue: string
  removed: boolean
  onKeyChange: (key: string) => void
  onFallbackChange: (value: string) => void
  onRemove: () => void
  onRestore: () => void
}

export function VariableOptionsMenu({
  fieldLabel,
  variableKey,
  category,
  fallbackValue,
  removed,
  onKeyChange,
  onFallbackChange,
  onRemove,
  onRestore,
}: Props) {
  const [open, setOpen] = useState(false)
  const [changingVariable, setChangingVariable] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const catalog = useMemo(() => getVariableCatalog(), [])
  const badge = CATEGORY_BADGE_STYLES[category]

  const grouped = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const entries = q
      ? catalog.filter((entry) => {
          const categoryLabel = CATEGORY_LABELS[entry.category].toLowerCase()
          return (
            entry.label.toLowerCase().includes(q) ||
            entry.key.toLowerCase().includes(q) ||
            categoryLabel.includes(q)
          )
        })
      : catalog

    const map = new Map<TemplateVariableCategory, typeof catalog>()
    for (const entry of entries) {
      const list = map.get(entry.category) ?? []
      list.push(entry)
      map.set(entry.category, list)
    }
    return map
  }, [catalog, searchQuery])

  const resultCount = useMemo(
    () => Array.from(grouped.values()).reduce((sum, entries) => sum + entries.length, 0),
    [grouped],
  )

  const showPicker = removed || changingVariable

  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setChangingVariable(false)
      return
    }
    if (removed) setChangingVariable(true)
  }, [open, removed])

  useEffect(() => {
    if (!open || !showPicker) return
    searchRef.current?.focus()
  }, [open, showPicker])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const handleSelectKey = (key: string) => {
    if (removed) onRestore()
    onKeyChange(key)
    setOpen(false)
  }

  const iconBtnClass =
    "inline-flex size-6 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"

  const pillClass = `inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-medium ring-1 ring-inset transition-colors hover:brightness-95 ${badge}`

  return (
    <div
      ref={rootRef}
      className="relative inline-flex"
      data-variable-menu-open={open ? "true" : undefined}
    >
      {removed ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-gray-300 bg-gray-50 px-2 py-0.5 text-[9px] font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-100"
          aria-expanded={open}
          title="Link to a merge field"
        >
          <Link2 className="size-2.5" />
          Add field
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          className={`${pillClass} ${open ? "ring-2 ring-blue-300/80" : ""}`}
          aria-expanded={open}
          aria-haspopup="dialog"
          title={`${fieldLabel} · {{${variableKey}}}`}
        >
          {"{ }"}
        </button>
      )}

      {open && (
        <div
          className="absolute left-0 top-full z-30 mt-1 w-[272px] rounded-lg border border-gray-200 bg-white shadow-lg"
          role="dialog"
          aria-label={`${fieldLabel} variable options`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-gray-100 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-gray-900">{fieldLabel}</p>
            {!removed && !showPicker && (
              <div className="mt-2 flex items-center gap-1">
                <span
                  className={`min-w-0 flex-1 truncate rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ring-1 ring-inset ${badge}`}
                >
                  {`{{${variableKey}}}`}
                </span>
                <button
                  type="button"
                  onClick={() => setChangingVariable(true)}
                  className={iconBtnClass}
                  aria-label="Change variable"
                  title="Change variable"
                >
                  <Pencil className="size-3" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onRemove()
                    setOpen(false)
                  }}
                  className={iconBtnClass}
                  aria-label="Remove variable"
                  title="Remove variable"
                >
                  <Unlink className="size-3" strokeWidth={1.75} />
                </button>
              </div>
            )}
            {!removed && showPicker && (
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="min-w-0 truncate font-mono text-[10px] text-gray-500">{`{{${variableKey}}}`}</p>
                <button
                  type="button"
                  onClick={() => {
                    setChangingVariable(false)
                    setSearchQuery("")
                  }}
                  className="shrink-0 text-[10px] font-medium text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {!removed && !showPicker && (
            <div className="px-3 py-2.5">
              <label className="mb-1 block text-[10px] font-medium text-gray-500">
                Fallback value
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={fallbackValue}
                  onChange={(e) => onFallbackChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      setOpen(false)
                    }
                  }}
                  placeholder="Shown when data is missing"
                  className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className={iconBtnClass}
                  aria-label="Save fallback"
                  title="Save"
                >
                  <Check className="size-3" strokeWidth={1.75} />
                </button>
              </div>
            </div>
          )}

          {showPicker && (
            <div className="py-1">
              <p className="px-3 py-1 text-[10px] font-medium text-gray-500">
                {removed ? "Choose variable" : "Change variable"}
              </p>
              <div className="px-3 pb-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search variables…"
                    className="w-full rounded-md border border-gray-200 py-1 pl-7 pr-2 text-[11px] text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {resultCount === 0 ? (
                <p className="px-3 py-3 text-center text-[11px] text-gray-400">
                  No variables match &ldquo;{searchQuery.trim()}&rdquo;
                </p>
              ) : (
                <ul className="max-h-[200px] overflow-y-auto py-0.5">
                  {Array.from(grouped.entries()).map(([group, entries]) => (
                    <li key={group}>
                      <p className="px-3 pb-0.5 pt-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                        {CATEGORY_LABELS[group]}
                      </p>
                      {entries.map((entry) => {
                        const selected = !removed && entry.key === variableKey
                        return (
                          <button
                            key={entry.key}
                            type="button"
                            onClick={() => handleSelectKey(entry.key)}
                            className={`flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors hover:bg-gray-50 ${
                              selected ? "bg-blue-50/60" : ""
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-gray-900">{entry.label}</p>
                              <p className="font-mono text-[10px] text-gray-400">{`{{${entry.key}}}`}</p>
                            </div>
                            {selected && (
                              <Check className="mt-0.5 size-3 shrink-0 text-blue-600" />
                            )}
                          </button>
                        )
                      })}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
