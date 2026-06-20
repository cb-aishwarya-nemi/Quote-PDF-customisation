import { AgentChatPanel } from "@/components/prompt-builder/AgentChatPanel"
import { BuilderCanvas } from "@/components/prompt-builder/BuilderCanvas"
import { BuilderPreviewCanvas } from "@/components/prompt-builder/BuilderPreviewCanvas"
import { PromptBuilderHeader } from "@/components/prompt-builder/PromptBuilderHeader"
import { createBuilderTemplate } from "@/lib/create-builder-template"
import type { BuilderNavigationState } from "@/lib/navigate-to-builder"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useLayoutEffect } from "react"
import { useLocation, useParams } from "react-router-dom"

export function PromptBuilderPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const location = useLocation()
  const initTemplate = usePromptBuilderStore((s) => s.initTemplate)
  const template = usePromptBuilderStore((s) => s.template)
  const editorMode = usePromptBuilderStore((s) => s.editorMode)

  useLayoutEffect(() => {
    if (!templateId) return
    if (template?.id === templateId) return

    const navState = location.state as BuilderNavigationState | null
    if (navState?.template?.id === templateId) {
      initTemplate(navState.template)
      return
    }

    initTemplate(
      createBuilderTemplate(templateId, {
        variantId: navState?.variantId,
        presetId: navState?.presetId,
        name: navState?.name ?? navState?.variantName,
      }),
    )
  }, [templateId, location.key, location.state, initTemplate, template?.id])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f7fa]">
      <PromptBuilderHeader />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {editorMode === "preview" ? <BuilderPreviewCanvas /> : <BuilderCanvas />}
        <AgentChatPanel />
      </div>
    </div>
  )
}
