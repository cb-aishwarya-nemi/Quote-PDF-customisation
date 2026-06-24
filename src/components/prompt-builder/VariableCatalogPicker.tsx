import { getVariableCatalog } from "@/lib/derive-template-variables"
import type { TemplateVariableCategory } from "@/types/prompt-builder"
import { Check, Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

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
  onSelect: (key: string, label: string) => void
  selectedKey?: string
  title?: string
  className?: string
}

export function VariableCatalogPicker({
  onSelect,
  selectedKey,
  title = "Insert variable",
  className = "",
}: Props) {
  const [searchQuery, setSearchQuery] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const catalog = useMemo(() => getVariableCatalog(), [])

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

  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  return (
    <div
      className={`w-[272px] rounded-lg border border-gray-200 bg-white shadow-lg ${className}`}
      role="dialog"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="border-b border-gray-100 px-3 py-2.5">
        <p className="text-[11px] font-semibold text-gray-900">{title}</p>
      </div>

      <div className="py-1">
        <div className="px-3 pb-1.5 pt-1">
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
                  const selected = entry.key === selectedKey
                  return (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => onSelect(entry.key, entry.label)}
                      className={`flex w-full items-start gap-2 px-3 py-1.5 text-left transition-colors hover:bg-gray-50 ${
                        selected ? "bg-blue-50/60" : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-gray-900">
                          {entry.label}
                        </p>
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
    </div>
  )
}
