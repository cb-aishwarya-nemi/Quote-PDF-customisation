import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { Plus } from "lucide-react"

type Props = {
  visible?: boolean
  onInsertHover?: (active: boolean) => void
  label?: string
  onAdd?: () => void
  compact?: boolean
}

export function AddIntroPageDivider({
  visible = false,
  onInsertHover,
  label = "Add page",
  onAdd,
  compact = false,
}: Props) {
  const addPage = usePromptBuilderStore((s) => s.addPage)

  const handleAdd = onAdd ?? (() => addPage())

  return (
    <div
      className={`group/divider relative transition-all duration-150 ${
        visible
          ? compact
            ? "py-0.5 opacity-100"
            : "py-1 opacity-100"
          : "pointer-events-none max-h-0 overflow-hidden py-0 opacity-0"
      }`}
      onPointerEnter={() => onInsertHover?.(true)}
      onPointerLeave={() => onInsertHover?.(false)}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
        <div className="h-px flex-1 bg-blue-300 transition-colors group-hover/divider:bg-blue-400" />
        <button
          type="button"
          onClick={handleAdd}
          className={`flex shrink-0 items-center gap-1 rounded-full border border-blue-500 bg-white font-medium text-blue-600 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-50 ${
            compact
              ? "px-1.5 py-0.5 text-[10px]"
              : "px-2.5 py-0.5 text-[11px]"
          }`}
        >
          <Plus className={compact ? "size-2.5" : "size-3"} />
          {label}
        </button>
        <div className="h-px flex-1 bg-blue-300 transition-colors group-hover/divider:bg-blue-400" />
      </div>
    </div>
  )
}
