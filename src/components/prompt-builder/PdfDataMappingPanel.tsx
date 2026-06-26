import { PdfFieldMappingTable } from "@/components/prompt-builder/PdfFieldMappingTable"
import { BuilderWorkflowTabs } from "@/components/prompt-builder/BuilderWorkflowTabs"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { ArrowRight, FileText } from "lucide-react"

export function PdfDataMappingPanel() {
  const mappings = usePromptBuilderStore((s) => s.pdfFieldMappings)
  const sourceFileName = usePromptBuilderStore((s) => s.pdfSourceFileName)
  const setSelectedBlockId = usePromptBuilderStore((s) => s.setSelectedBlockId)
  const setBuilderWorkflowTab = usePromptBuilderStore((s) => s.setBuilderWorkflowTab)
  const showWorkflowTabs = mappings.length > 0

  const openBlockOnCanvas = (blockId: string) => {
    setSelectedBlockId(blockId)
    setBuilderWorkflowTab("canvas")
  }

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 pb-8 pt-3">
        {showWorkflowTabs && (
          <div className="flex justify-center">
            <BuilderWorkflowTabs />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-500">
            <FileText className="size-4 shrink-0" />
            <p className="text-[11px] font-medium uppercase tracking-wide">
              Review before editing
            </p>
          </div>
          <h1 className="text-[22px] font-semibold text-gray-900">
            Data mapping from your PDF
          </h1>
          <p className="max-w-2xl text-[13px] leading-relaxed text-gray-600">
            We read your uploaded quote PDF and mapped detected text to quote
            variables. Review each match, hover to confirm or remap, then
            continue to the template canvas.
          </p>
          {sourceFileName && (
            <p className="text-[12px] text-gray-500">Source file: {sourceFileName}</p>
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
            Continue to template canvas
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
