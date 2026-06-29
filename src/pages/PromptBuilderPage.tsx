import { AgentChatPanel } from "@/components/prompt-builder/AgentChatPanel"
import { BuilderWorkflowTabsRegion } from "@/components/prompt-builder/BuilderWorkflowTabsRegion"
import { PdfDataMappingPanel } from "@/components/prompt-builder/PdfDataMappingPanel"
import { PublishInterstitial } from "@/components/prompt-builder/PublishInterstitial"
import { PagesPanel } from "@/components/prompt-builder/PagesPanel"
import { QuoteCanvasArea } from "@/components/prompt-builder/QuoteCanvasArea"
import { PromptBuilderHeader } from "@/components/prompt-builder/PromptBuilderHeader"
import { PromptBuilderSkeleton } from "@/components/prompt-builder/PromptBuilderSkeleton"
import { createBuilderTemplate } from "@/lib/create-builder-template"
import { BUILDER_WORKSPACE_BG } from "@/lib/canvas-constants"
import type { BuilderNavigationState } from "@/lib/navigate-to-builder"
import { applyCreationContextToTemplate } from "@/lib/derive-template-from-creation"
import { isDefaultPublishedTemplate } from "@/lib/seed-demo-library"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { useEffect, useLayoutEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

const SKELETON_DURATION_MS = 2800

export function PromptBuilderPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const initTemplate = usePromptBuilderStore((s) => s.initTemplate)
  const ensurePdfFieldMappingsReviewSet = usePromptBuilderStore(
    (s) => s.ensurePdfFieldMappingsReviewSet,
  )
  const template = usePromptBuilderStore((s) => s.template)
  const publishingTemplateName = usePromptBuilderStore(
    (s) => s.publishingTemplateName,
  )
  const builderWorkflowTab = usePromptBuilderStore((s) => s.builderWorkflowTab)
  const pdfFieldMappings = usePromptBuilderStore((s) => s.pdfFieldMappings)

  const navState = location.state as BuilderNavigationState | null
  const [showSkeleton, setShowSkeleton] = useState(
    () => !!navState?.fromGeneration,
  )

  useEffect(() => {
    if (templateId && isDefaultPublishedTemplate(templateId)) {
      navigate("/templates", { replace: true })
    }
  }, [templateId, navigate])

  useLayoutEffect(() => {
    if (!templateId) return
    if (isDefaultPublishedTemplate(templateId)) return
    if (template?.id === templateId) return

    useTemplateLibraryStore.getState().ensureInitialized()

    const generationOptions =
      navState?.generationStepLabels?.length ||
      navState?.creationBrief ||
      navState?.extractionSummary
        ? {
            generationStepLabels: navState.generationStepLabels,
            creationBrief: navState.creationBrief,
            extractionSummary: navState.extractionSummary,
          }
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
      applyCreationContextToTemplate(
        createBuilderTemplate(templateId, {
          variantId: navState?.variantId,
          presetId: navState?.presetId,
          name: navState?.name ?? navState?.variantName,
        }),
        {
          creationBrief: navState?.creationBrief,
          uploadedFileNames: navState?.uploadedFileNames,
        },
      ),
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
    navState?.creationBrief,
    navState?.uploadedFileNames,
    navState?.extractionSummary,
  ])

  useEffect(() => {
    if (!template || pdfFieldMappings.length === 0) return
    ensurePdfFieldMappingsReviewSet()
  }, [template?.id, pdfFieldMappings.length, ensurePdfFieldMappingsReviewSet])

  useEffect(() => {
    if (!navState?.fromGeneration) {
      setShowSkeleton(false)
      return
    }

    setShowSkeleton(true)
    const timer = setTimeout(() => setShowSkeleton(false), SKELETON_DURATION_MS)
    return () => clearTimeout(timer)
  }, [location.key, navState?.fromGeneration])

  const showWorkflowTabs = pdfFieldMappings.length > 0
  const showDataMapping =
    showWorkflowTabs && builderWorkflowTab === "data_mapping"

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <PromptBuilderHeader />
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{ backgroundColor: BUILDER_WORKSPACE_BG }}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {showSkeleton ? (
            <PromptBuilderSkeleton />
          ) : (
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                <BuilderWorkflowTabsRegion enabled={showWorkflowTabs}>
                  {showDataMapping ? (
                    <PdfDataMappingPanel />
                  ) : (
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                      <PagesPanel />
                      <QuoteCanvasArea />
                    </div>
                  )}
                </BuilderWorkflowTabsRegion>
              </div>
              <AgentChatPanel />
            </div>
          )}
        </div>
      </div>
      {publishingTemplateName && (
        <PublishInterstitial templateName={publishingTemplateName} />
      )}
    </div>
  )
}
