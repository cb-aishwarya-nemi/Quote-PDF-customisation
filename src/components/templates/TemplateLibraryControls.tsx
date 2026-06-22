import {
  DEFAULT_TEMPLATE_LIBRARY_QUERY,
  TEMPLATE_DEAL_TYPE_FILTERS,
  TEMPLATE_OWNER_FILTERS,
  TEMPLATE_SORT_OPTIONS,
  TEMPLATE_STATUS_FILTERS,
  hasActiveTemplateLibraryFilters,
  type TemplateLibraryQuery,
} from "@/lib/filter-published-templates"
import { ArrowUpDown, ChevronDown, Search, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  query: TemplateLibraryQuery
  totalCount: number
  filteredCount: number
  onChange: (query: TemplateLibraryQuery) => void
}

type FilterPillProps<T extends string> = {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}

function FilterPill<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterPillProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = value !== ("all" as T)
  const activeLabel = options.find((option) => option.value === value)?.label

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
          active
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900"
        }`}
        aria-expanded={open}
      >
        {active ? activeLabel : label}
        <ChevronDown className="size-3 opacity-70" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-30 min-w-[160px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full px-3 py-2 text-left text-[12px] transition-colors hover:bg-gray-50 ${
                option.value === value
                  ? "font-medium text-gray-900"
                  : "text-gray-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SortMenu({
  value,
  onChange,
}: {
  value: TemplateLibraryQuery["sort"]
  onChange: (sort: TemplateLibraryQuery["sort"]) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const active =
    value !== DEFAULT_TEMPLATE_LIBRARY_QUERY.sort

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`inline-flex size-8 items-center justify-center rounded-lg border transition-colors ${
          active
            ? "border-gray-900 bg-gray-900 text-white"
            : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-800"
        }`}
        aria-label="Sort templates"
        aria-expanded={open}
      >
        <ArrowUpDown className="size-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[180px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {TEMPLATE_SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full px-3 py-2 text-left text-[12px] transition-colors hover:bg-gray-50 ${
                option.value === value
                  ? "font-medium text-gray-900"
                  : "text-gray-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function TemplateLibraryControls({
  query,
  totalCount,
  filteredCount,
  onChange,
}: Props) {
  const countLabel =
    filteredCount === totalCount
      ? `${totalCount} template${totalCount === 1 ? "" : "s"}`
      : `${filteredCount} of ${totalCount} templates`

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <p className="shrink-0 text-[13px] font-medium tabular-nums text-gray-600">
        {countLabel}
      </p>

      <div className="relative min-w-[180px] flex-1 sm:max-w-[240px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query.search}
          onChange={(event) =>
            onChange({ ...query, search: event.target.value })
          }
          placeholder="Search templates…"
          className="w-full rounded-full border border-gray-200 bg-white py-1.5 pl-9 pr-8 text-[12px] text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          aria-label="Search templates"
        />
        {query.search && (
          <button
            type="button"
            onClick={() => onChange({ ...query, search: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <FilterPill
        label="Status"
        value={query.status}
        options={TEMPLATE_STATUS_FILTERS}
        onChange={(status) => onChange({ ...query, status })}
      />
      <FilterPill
        label="Type"
        value={query.dealType}
        options={TEMPLATE_DEAL_TYPE_FILTERS}
        onChange={(dealType) => onChange({ ...query, dealType })}
      />
      <FilterPill
        label="Owner"
        value={query.owner}
        options={TEMPLATE_OWNER_FILTERS}
        onChange={(owner) => onChange({ ...query, owner })}
      />

      {hasActiveTemplateLibraryFilters(query) && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_TEMPLATE_LIBRARY_QUERY)}
          className="shrink-0 text-[12px] font-medium text-blue-600 hover:text-blue-700"
        >
          Clear
        </button>
      )}

      <div className="ml-auto">
        <SortMenu
          value={query.sort}
          onChange={(sort) => onChange({ ...query, sort })}
        />
      </div>
    </div>
  )
}
