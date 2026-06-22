import { SearchX } from "lucide-react"

type Props = {
  onClear: () => void
}

export function TemplateLibraryEmptyState({ onClear }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
        <SearchX className="size-4 text-gray-500" />
      </div>
      <h2 className="mt-3 text-[14px] font-semibold text-gray-900">
        No templates match your filters
      </h2>
      <p className="mt-1 max-w-sm text-[13px] text-gray-500">
        Try a different search term or status filter.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Clear filters
      </button>
    </div>
  )
}
