import { DefaultTemplatePreviewModal } from "@/components/templates/DefaultTemplatePreviewModal"
import { CreateAdditionalTemplateModal } from "@/components/templates/CreateAdditionalTemplateModal"
import { CreateQuoteTemplateModal } from "@/components/templates/CreateQuoteTemplateModal"
import { NewTemplateMenu } from "@/components/templates/NewTemplateMenu"
import {
  GenerateTemplateProcessingModal,
  type TemplateGenerationResult,
} from "@/components/templates/GenerateTemplateProcessingModal"
import { PublishedTemplateCard } from "@/components/templates/PublishedTemplateCard"
import { TemplateLibraryControls } from "@/components/templates/TemplateLibraryControls"
import { TemplateLibraryEmptyState } from "@/components/templates/TemplateLibraryEmptyState"
import {
  TemplatesPageDemoSwitcher,
  useTemplatesPageDemoView,
} from "@/components/templates/TemplatesPageDemoSwitcher"
import {
  DEFAULT_TEMPLATE_LIBRARY_QUERY,
  filterAndSortPublishedTemplates,
  type TemplateLibraryQuery,
} from "@/lib/filter-published-templates"
import { hasTemplateWithRoutingConditions } from "@/lib/derive-template-library-meta"
import { navigateToPromptBuilder } from "@/lib/navigate-to-builder"
import { createBlankBuilderTemplate } from "@/lib/create-builder-template"
import { createId } from "@/lib/create-id"
import {
  hasUserCreatedTemplates,
  isDefaultPublishedTemplate,
  resolveTemplatesPageLibrary,
  writeTemplatesPageDemoView,
} from "@/lib/seed-demo-library"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { CheckCircle2, ChevronRight, Plus, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
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
  const duplicatePublishedRecord = useTemplateLibraryStore(
    (s) => s.duplicatePublishedRecord,
  )
  const deletePublishedTemplate = useTemplateLibraryStore(
    (s) => s.deletePublishedTemplate,
  )

  const [demoView, setDemoView] = useTemplatesPageDemoView()
  const displayTemplates = useMemo(
    () => resolveTemplatesPageLibrary(demoView, publishedTemplates),
    [demoView, publishedTemplates],
  )

  const hasTemplates = displayTemplates.length > 0
  const hasUserCreatedTemplate = useMemo(
    () => hasUserCreatedTemplates(displayTemplates),
    [displayTemplates],
  )
  const hasConditionalTemplates = useMemo(
    () => hasTemplateWithRoutingConditions(displayTemplates),
    [displayTemplates],
  )
  const [firstCreateModalOpen, setFirstCreateModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [processingOpen, setProcessingOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [hasUploads, setHasUploads] = useState(false)
  const [creationBrief, setCreationBrief] = useState<string | undefined>()
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([])
  const [highlightTemplateId, setHighlightTemplateId] = useState<
    string | undefined
  >(locationState?.highlightTemplateId)
  const [publishSuccessVisible, setPublishSuccessVisible] = useState(
    Boolean(locationState?.fromPublish && locationState?.highlightTemplateId),
  )
  const [libraryQuery, setLibraryQuery] = useState<TemplateLibraryQuery>(
    DEFAULT_TEMPLATE_LIBRARY_QUERY,
  )
  const [defaultPreviewRecord, setDefaultPreviewRecord] =
    useState<PublishedBuilderTemplate | null>(null)

  const showLibraryControls = displayTemplates.length > 1
  const filteredTemplates = useMemo(
    () =>
      showLibraryControls
        ? filterAndSortPublishedTemplates(displayTemplates, libraryQuery)
        : displayTemplates,
    [displayTemplates, libraryQuery, showLibraryControls],
  )

  useEffect(() => {
    ensureInitialized()
  }, [ensureInitialized])

  useEffect(() => {
    if (!locationState?.fromPublish || !locationState.highlightTemplateId) return

    setHighlightTemplateId(locationState.highlightTemplateId)
    setPublishSuccessVisible(true)
    setLibraryQuery(DEFAULT_TEMPLATE_LIBRARY_QUERY)

    if (demoView === "empty") {
      setDemoView("data")
      writeTemplatesPageDemoView("data")
    }

    navigate(location.pathname, { replace: true, state: null })
  }, [
    demoView,
    location.pathname,
    locationState?.fromPublish,
    locationState?.highlightTemplateId,
    navigate,
    setDemoView,
  ])

  useEffect(() => {
    if (!highlightTemplateId) return
    const timer = window.setTimeout(() => {
      setHighlightTemplateId(undefined)
    }, 6000)
    return () => window.clearTimeout(timer)
  }, [highlightTemplateId])

  useEffect(() => {
    setFirstCreateModalOpen(false)
    setCreateModalOpen(false)
    setLibraryQuery(DEFAULT_TEMPLATE_LIBRARY_QUERY)
    if (demoView === "empty") {
      setHighlightTemplateId(undefined)
      setPublishSuccessVisible(false)
    }
  }, [demoView])

  const duplicateRecord = useCallback(
    (record: PublishedBuilderTemplate) => {
      if (demoView === "data") {
        return duplicatePublishedRecord(record)
      }
      return duplicateBuilderTemplate(record.id)
    },
    [demoView, duplicateBuilderTemplate, duplicatePublishedRecord],
  )

  const openTemplate = useCallback(
    (record: PublishedBuilderTemplate) => {
      if (isDefaultPublishedTemplate(record)) {
        setDefaultPreviewRecord(record)
        return
      }
      navigateToPromptBuilder(
        navigate,
        { template: record.template, name: record.name },
        record.id,
      )
    },
    [navigate],
  )

  const closeDefaultPreview = useCallback(() => {
    setDefaultPreviewRecord(null)
  }, [])

  const duplicateFromDefaultPreview = useCallback(() => {
    if (!defaultPreviewRecord) return
    const duplicate = duplicateRecord(defaultPreviewRecord)
    if (!duplicate) return
    closeDefaultPreview()
    navigateToPromptBuilder(
      navigate,
      { template: duplicate.template, name: duplicate.name },
      duplicate.id,
    )
  }, [
    closeDefaultPreview,
    defaultPreviewRecord,
    duplicateRecord,
    navigate,
  ])

  const handleDuplicate = useCallback(
    (record: PublishedBuilderTemplate) => {
      const duplicate = duplicateRecord(record)
      if (!duplicate) return
      navigateToPromptBuilder(
        navigate,
        { template: duplicate.template, name: duplicate.name },
        duplicate.id,
      )
    },
    [duplicateRecord, navigate],
  )

  const handleDelete = useCallback(
    (record: PublishedBuilderTemplate) => {
      if (!deletePublishedTemplate(record.id)) return
      setHighlightTemplateId((current) =>
        current === record.id ? undefined : current,
      )
    },
    [deletePublishedTemplate],
  )

  const handleGenerationComplete = useCallback(
    (result: TemplateGenerationResult) => {
      setProcessingOpen(false)
      navigateToPromptBuilder(navigate, {
        hasUploads,
        creationBrief,
        uploadedFileNames,
        template: result.template,
        extractionSummary: result.extractionSummary ?? undefined,
        generationStepLabels: result.stepLabels,
      })
      setCreationBrief(undefined)
      setUploadedFileNames([])
      setPendingFiles([])
    },
    [creationBrief, hasUploads, navigate, uploadedFileNames],
  )

  const handleGenerate = useCallback((files: File[]) => {
    setFirstCreateModalOpen(false)
    setCreateModalOpen(false)
    setPendingFiles(files)
    setUploadedFileNames(files.map((file) => file.name))
    setHasUploads(files.length > 0)
    setCreationBrief(undefined)
    setProcessingOpen(true)
  }, [])

  const handleGuidedComplete = useCallback((brief: string) => {
    setFirstCreateModalOpen(false)
    setCreateModalOpen(false)
    setPendingFiles([])
    setUploadedFileNames([])
    setHasUploads(false)
    setCreationBrief(brief)
    setProcessingOpen(true)
  }, [])

  const openNewTemplate = useCallback(() => {
    if (!hasUserCreatedTemplate) {
      setFirstCreateModalOpen(true)
      return
    }
    setCreateModalOpen(true)
  }, [hasUserCreatedTemplate])

  const handleStartBlank = useCallback(() => {
    const id = createId("tpl")
    const template = createBlankBuilderTemplate(id)
    navigateToPromptBuilder(navigate, { template, name: template.name }, id)
  }, [navigate])

  const firstCreateModalVisible = firstCreateModalOpen && !processingOpen
  const newTemplateModalVisible =
    createModalOpen && hasUserCreatedTemplate && !processingOpen

  const closeFirstCreateModal = useCallback(() => {
    setFirstCreateModalOpen(false)
  }, [])

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false)
  }, [])

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
          {(hasTemplates || !hasUserCreatedTemplate) &&
            (hasUserCreatedTemplate ? (
              <NewTemplateMenu
                onGenerateFromPdf={openNewTemplate}
                onStartBlank={handleStartBlank}
              />
            ) : (
              <button
                type="button"
                onClick={openNewTemplate}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Plus className="size-3.5" />
                New template
              </button>
            ))}
        </div>
      </header>

      {publishSuccessVisible && (
        <div className="px-8 pt-4">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
            <div className="flex min-w-0 items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold">Template published</p>
                <p className="mt-0.5 text-[12px] text-emerald-800/90">
                  Your template is live in the library below.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPublishSuccessVisible(false)}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-emerald-700 transition-colors hover:bg-emerald-100/80"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {!hasTemplates && (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-24 text-center">
          <h2 className="text-[18px] font-semibold text-gray-900">
            Create your first quote PDF template
          </h2>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-gray-500">
            Upload sample quotes or answer a few questions — we&apos;ll draft a
            template you can refine in the studio.
          </p>
          <button
            type="button"
            onClick={openNewTemplate}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-blue-700"
          >
            <Plus className="size-4" />
            New template
          </button>
        </div>
      )}

      {hasTemplates && (
        <div className="flex flex-col items-center px-8 py-8">
          {showLibraryControls && (
            <div className="mb-6 w-[800px]">
              <TemplateLibraryControls
                query={libraryQuery}
                totalCount={displayTemplates.length}
                filteredCount={filteredTemplates.length}
                onChange={setLibraryQuery}
              />
            </div>
          )}

          {filteredTemplates.length === 0 ? (
            <div className="w-[800px]">
              <TemplateLibraryEmptyState
                onClear={() => setLibraryQuery(DEFAULT_TEMPLATE_LIBRARY_QUERY)}
              />
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-3">
              {filteredTemplates.map((record) => (
                <PublishedTemplateCard
                  key={record.id}
                  record={record}
                  highlighted={record.id === highlightTemplateId}
                  hasConditionalTemplates={hasConditionalTemplates}
                  onOpen={() => openTemplate(record)}
                  onDuplicate={() => handleDuplicate(record)}
                  onDelete={() => handleDelete(record)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CreateQuoteTemplateModal
        open={firstCreateModalVisible}
        onClose={closeFirstCreateModal}
        onGenerate={handleGenerate}
        onGuidedComplete={handleGuidedComplete}
      />

      <CreateAdditionalTemplateModal
        open={newTemplateModalVisible}
        onClose={closeCreateModal}
        onGenerate={handleGenerate}
      />

      <GenerateTemplateProcessingModal
        open={processingOpen}
        files={pendingFiles}
        onComplete={handleGenerationComplete}
      />

      <DefaultTemplatePreviewModal
        record={defaultPreviewRecord}
        onClose={closeDefaultPreview}
        onDuplicate={duplicateFromDefaultPreview}
      />

      <TemplatesPageDemoSwitcher value={demoView} onChange={setDemoView} />
    </div>
  )
}
