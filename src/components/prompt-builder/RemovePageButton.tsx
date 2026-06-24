import { useIsTemplateEditMode } from "@/hooks/use-builder-editor-mode"
import { isQuotePageId } from "@/lib/template-pages"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { Trash2 } from "lucide-react"

type Props = {
  pageId: string
  variant?: "canvas" | "panel"
}

export function RemovePageButton({ pageId, variant = "canvas" }: Props) {
  const removePage = usePromptBuilderStore((s) => s.removePage)
  const isTemplateEdit = useIsTemplateEditMode()

  if (!isTemplateEdit || isQuotePageId(pageId)) return null

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    removePage(pageId)
  }

  if (variant === "panel") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="absolute right-1.5 top-1.5 z-10 flex size-6 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 opacity-0 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 group-hover/page:opacity-100"
        aria-label="Delete page"
      >
        <Trash2 className="size-3.5" />
      </button>
    )
  }

  return (
    <div className="group/delete pointer-events-auto relative">
      <button
        type="button"
        onClick={handleClick}
        className="rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        aria-label="Remove page"
      >
        <Trash2 className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-md group-hover/delete:block"
      >
        Remove page
      </span>
    </div>
  )
}

export function PageCanvasDeleteControls({ pageId }: { pageId: string }) {
  const isTemplateEdit = useIsTemplateEditMode()

  if (!isTemplateEdit || isQuotePageId(pageId)) return null

  return (
    <div className="pointer-events-none absolute right-2 top-2 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover/page:opacity-100 group-focus-within/page:opacity-100">
      <RemovePageButton pageId={pageId} />
    </div>
  )
}
