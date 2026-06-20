import { CreateQuoteTemplateModal } from "@/components/templates/CreateQuoteTemplateModal"
import { GenerateTemplateProcessingModal } from "@/components/templates/GenerateTemplateProcessingModal"
import { PublishedTemplateCard } from "@/components/templates/PublishedTemplateCard"
import { navigateToPromptBuilder } from "@/lib/navigate-to-builder"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { ChevronRight, Plus } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

type TemplatesLocationState = {
  highlightTemplateId?: string
  fromPublish?: boolean
}

export function QuotePdfTemplatesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = (location.state ?? null) as TemplatesLocationState | null

  const ensureInitialized = useTemplateLibraryStore((s) => s.ensureInitialized)
  const publishedTemplates = useTemplateLibraryStore((s) => s.publishedTemplates)
  const duplicateBuilderTemplate = useTemplateLibraryStore(
    (s) => s.duplicateBuilderTemplate,
  )

  const hasTemplates = publishedTemplates.length > 0
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [processingOpen, setProcessingOpen] = useState(false)
  const [hasUploads, setHasUploads] = useState(false)
  const [highlightTemplateId, setHighlightTemplateId] = useState<
    string | undefined
  >(locationState?.highlightTemplateId)

  useEffect(() => {
    ensureInitialized()
  }, [ensureInitialized])

  useEffect(() => {
    if (locationState?.highlightTemplateId) {
      setHighlightTemplateId(locationState.highlightTemplateId)
    }
  }, [locationState?.highlightTemplateId])

  const openTemplate = useCallback(
    (record: (typeof publishedTemplates)[number]) => {
      navigateToPromptBuilder(
        navigate,
        { template: record.template, name: record.name },
        record.id,
      )
    },
    [navigate],
  )

  const handleDuplicate = useCallback(
    (record: (typeof publishedTemplates)[number]) => {
      const duplicate = duplicateBuilderTemplate(record.id)
      if (!duplicate) return
      setHighlightTemplateId(duplicate.id)
    },
    [duplicateBuilderTemplate],
  )

  const handleGenerationComplete = useCallback(() => {
    setProcessingOpen(false)
    navigateToPromptBuilder(navigate, {
      name: "Quote template builder",
      hasUploads,
    })
  }, [hasUploads, navigate])

  const createModalVisible =
    (!hasTemplates || createModalOpen) && !processingOpen

  const closeCreateModal = useCallback(() => {
    if (!hasTemplates) return
    setCreateModalOpen(false)
  }, [hasTemplates])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-16">
      <header className="border-b border-gray-200 bg-white px-8 py-2.5">
        <nav className="flex items-center gap-1 text-[11px] text-gray-500">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="hover:text-gray-700"
          >
            Configure Chargebee
          </button>
          <ChevronRight className="size-2.5 shrink-0" />
          <button
            type="button"
            onClick={() => navigate("/cpq")}
            className="hover:text-gray-700"
          >
            Chargebee CPQ
          </button>
          <ChevronRight className="size-2.5 shrink-0" />
          <span className="truncate text-gray-600">Quote PDF templates</span>
        </nav>
        <div className="mt-0.5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[14px] font-semibold text-gray-900">
              Quote PDF templates
            </h1>
          </div>
          {hasTemplates && (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Plus className="size-3.5" />
              New template
            </button>
          )}
        </div>
      </header>

      {hasTemplates && (
        <div className="mx-auto w-full max-w-[1080px] px-8 py-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {publishedTemplates.map((record) => (
              <PublishedTemplateCard
                key={record.id}
                record={record}
                highlighted={record.id === highlightTemplateId}
                onOpen={() => openTemplate(record)}
                onDuplicate={() => handleDuplicate(record)}
              />
            ))}
          </div>
        </div>
      )}

      <CreateQuoteTemplateModal
        open={createModalVisible}
        onClose={closeCreateModal}
        dismissible={hasTemplates}
        onGenerate={(files) => {
          setCreateModalOpen(false)
          setHasUploads(files.length > 0)
          setProcessingOpen(true)
        }}
      />

      <GenerateTemplateProcessingModal
        open={processingOpen}
        hasUploads={hasUploads}
        onComplete={handleGenerationComplete}
      />
    </div>
  )
}
