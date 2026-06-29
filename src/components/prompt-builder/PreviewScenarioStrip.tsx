import { CustomerPreviewPicker } from "@/components/prompt-builder/CustomerPreviewPicker"
import { PreviewScenarioPicker } from "@/components/prompt-builder/PreviewScenarioPicker"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { X } from "lucide-react"

export function PreviewScenarioStrip() {
  const closePreview = usePromptBuilderStore((s) => s.closePreview)

  return (
    <div className="flex w-full items-center gap-3 rounded-t-xl border border-b-0 border-gray-200/90 bg-slate-50 px-4 py-2 shadow-sm ring-1 ring-black/5">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px] text-gray-600">
        <span className="shrink-0 font-medium text-gray-500">Preview scenario</span>
        <PreviewScenarioPicker variant="strip" className="min-w-0" />
        <span className="shrink-0 text-gray-400">for</span>
        <CustomerPreviewPicker variant="strip" className="min-w-0" />
      </div>
      <div className="group/close relative shrink-0">
        <button
          type="button"
          onClick={closePreview}
          className="flex size-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white hover:text-gray-700"
          aria-label="Close preview"
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium leading-snug text-slate-700 shadow-md group-hover/close:block"
        >
          Close preview
        </span>
      </div>
    </div>
  )
}
