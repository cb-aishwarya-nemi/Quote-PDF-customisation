import { PreviewScenarioBar } from "@/components/prompt-builder/PreviewScenarioBar"
import { BuilderBlockView } from "@/components/prompt-builder/BuilderBlockView"
import { TemplateDocumentFrame } from "@/components/prompt-builder/TemplateDocumentFrame"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { blockIsVisible } from "@/types/prompt-builder"
import { useRef } from "react"

export function BuilderPreviewCanvas() {
  const documentRef = useRef<HTMLDivElement>(null)
  const template = usePromptBuilderStore((s) => s.template)
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)

  if (!template) return null

  const visibleBlocks = template.blocks.filter((block) => {
    const displayCondition = (block.content.displayCondition ?? null) as Parameters<
      typeof blockIsVisible
    >[0]
    return blockIsVisible(displayCondition, activeScenario)
  })

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-[#e8eaed]">
      <PreviewScenarioBar documentRef={documentRef} />

      <div className="flex-1 overflow-y-auto p-6">
        <TemplateDocumentFrame exportRef={documentRef}>
          {visibleBlocks.length === 0 ? (
            <p className="py-12 text-center text-[13px] text-gray-500">
              No blocks visible for{" "}
              <span className="font-medium text-gray-700">{activeScenario.label}</span>.
              Switch scenario or ask the agent to adjust display conditions.
            </p>
          ) : (
            visibleBlocks.map((block, index) => (
              <div
                key={block.id}
                className={index > 0 ? "mt-6 border-t border-gray-100 pt-6" : ""}
              >
                <BuilderBlockView block={block} />
              </div>
            ))
          )}
        </TemplateDocumentFrame>
      </div>
    </div>
  )
}
