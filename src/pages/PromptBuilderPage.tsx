import { AgentChatPanel } from "@/components/prompt-builder/AgentChatPanel"
import { QuoteCanvasArea } from "@/components/prompt-builder/QuoteCanvasArea"
import { PromptBuilderHeader } from "@/components/prompt-builder/PromptBuilderHeader"
import { PromptBuilderSkeleton } from "@/components/prompt-builder/PromptBuilderSkeleton"
import { createBuilderTemplate } from "@/lib/create-builder-template"
import type { BuilderNavigationState } from "@/lib/navigate-to-builder"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { useEffect, useLayoutEffect, useState } from "react"
import { useLocation, useParams } from "react-router-dom"

const SKELETON_DURATION_MS = 2800

export function PromptBuilderPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const location = useLocation()
  const initTemplate = usePromptBuilderStore((s) => s.initTemplate)
  const template = usePromptBuilderStore((s) => s.template)

  const navState = location.state as BuilderNavigationState | null
  const [showSkeleton, setShowSkeleton] = useState(
    () => !!navState?.fromGeneration,
  )

  useLayoutEffect(() => {
    if (!templateId) return
    if (template?.id === templateId) return

    useTemplateLibraryStore.getState().ensureInitialized()

    const generationOptions = navState?.generationStepLabels?.length
      ? { generationStepLabels: navState.generationStepLabels }
      : undefined

    if (navState?.template?.id === templateId) {
      initTemplate(navState.template, generationOptions)
      return
    }

    const saved = useTemplateLibraryStore
      .getState()
      .getPublishedTemplate(templateId)
    if (saved) {
      initTemplate(saved.template, generationOptions)
      return
    }

    initTemplate(
      createBuilderTemplate(templateId, {
        variantId: navState?.variantId,
        presetId: navState?.presetId,
        name: navState?.name ?? navState?.variantName,
      }),
      generationOptions,
    )
  }, [
    templateId,
    location.key,
    location.state,
    initTemplate,
    template?.id,
    navState?.template,
    navState?.variantId,
    navState?.presetId,
    navState?.name,
    navState?.variantName,
    navState?.generationStepLabels,
  ])

  useEffect(() => {
    if (!navState?.fromGeneration) {
      setShowSkeleton(false)
      return
    }

    setShowSkeleton(true)
    const timer = setTimeout(() => setShowSkeleton(false), SKELETON_DURATION_MS)
    return () => clearTimeout(timer)
  }, [location.key, navState?.fromGeneration])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f7fa]">
      <PromptBuilderHeader />
      {showSkeleton ? (
        <PromptBuilderSkeleton />
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <QuoteCanvasArea />
          <AgentChatPanel />
        </div>
      )}
    </div>
  )
}
