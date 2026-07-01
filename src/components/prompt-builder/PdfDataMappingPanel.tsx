import { PdfFieldMappingTable } from "@/components/prompt-builder/PdfFieldMappingTable"
import { useBuilderScrollContainerRef } from "@/components/prompt-builder/builder-scroll-container"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { ArrowRight, ExternalLink } from "lucide-react"

export function PdfDataMappingPanel() {
  const mappings = usePromptBuilderStore((s) => s.pdfFieldMappings)
  const sourcePdfDataUrl = usePromptBuilderStore((s) => s.pdfSourceDataUrl)
  const setSelectedBlockId = usePromptBuilderStore((s) => s.setSelectedBlockId)
  const setBuilderWorkflowTab = usePromptBuilderStore((s) => s.setBuilderWorkflowTab)
  const scrollContainerRef = useBuilderScrollContainerRef()

  const openBlockOnCanvas = (blockId: string) => {
    setSelectedBlockId(blockId)
    setBuilderWorkflowTab("canvas")
  }

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-0 min-w-0 flex-1 overflow-y-auto"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 pb-8 pt-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[22px] font-semibold text-gray-900">
            Review data mapped from your PDF
          </h1>
          {sourcePdfDataUrl && (
            <a
              href={sourcePdfDataUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-blue-600 hover:text-blue-700"
            >
              View PDF
              <ExternalLink className="size-3.5 shrink-0" />
            </a>
          )}
        </div>

        <PdfFieldMappingTable
          mappings={mappings}
          onSelectBlock={openBlockOnCanvas}
        />

        <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <p className="text-[12px] text-gray-500">
            Click a row to open that block on the template canvas.
          </p>
          <button
            type="button"
            onClick={() => setBuilderWorkflowTab("canvas")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
          >
            Continue to Edit template
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
