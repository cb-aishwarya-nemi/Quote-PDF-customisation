import { AddBlockDivider } from "@/components/prompt-builder/AddBlockDivider"
import { BlockChrome } from "@/components/prompt-builder/BlockChrome"
import { BuilderBlockView } from "@/components/prompt-builder/BuilderBlockView"
import { TemplateDocumentFrame } from "@/components/prompt-builder/TemplateDocumentFrame"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { Fragment } from "react"

export function BuilderCanvas() {
  const template = usePromptBuilderStore((s) => s.template)
  const clearSelection = usePromptBuilderStore((s) => s.setSelectedBlockId)

  if (!template) return null

  return (
    <div
      className="flex min-w-0 flex-1 flex-col bg-[#e8eaed]"
      onClick={() => clearSelection(null)}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <TemplateDocumentFrame onClick={(e) => e.stopPropagation()}>
          {template.blocks.map((block) => (
            <Fragment key={block.id}>
              <BlockChrome block={block}>
                <BuilderBlockView block={block} />
              </BlockChrome>
              <AddBlockDivider afterId={block.id} />
            </Fragment>
          ))}
        </TemplateDocumentFrame>
      </div>
    </div>
  )
}
