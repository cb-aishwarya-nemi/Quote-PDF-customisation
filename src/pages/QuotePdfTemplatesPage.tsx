import { CreateAdditionalTemplateModal } from "@/components/templates/CreateAdditionalTemplateModal"
import { CreateQuoteTemplateModal } from "@/components/templates/CreateQuoteTemplateModal"
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
import { navigateToPromptBuilder } from "@/lib/navigate-to-builder"
import { isDefaultPublishedTemplate, resolveTemplatesPageLibrary } from "@/lib/seed-demo-library"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { ChevronRight, Plus } from "lucide-react"
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
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [processingOpen, setProcessingOpen] = useState(false)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [hasUploads, setHasUploads] = useState(false)
  const [creationBrief, setCreationBrief] = useState<string | undefined>()
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([])
  const [highlightTemplateId, setHighlightTemplateId] = useState<
    string | undefined
  >(locationState?.highlightTemplateId)
  const [libraryQuery, setLibraryQuery] = useState<TemplateLibraryQuery>(
    DEFAULT_TEMPLATE_LIBRARY_QUERY,
  )

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
    if (locationState?.highlightTemplateId) {
      setHighlightTemplateId(locationState.highlightTemplateId)
    }
  }, [locationState?.highlightTemplateId])

  useEffect(() => {
    setCreateModalOpen(false)
    setLibraryQuery(DEFAULT_TEMPLATE_LIBRARY_QUERY)
    setHighlightTemplateId(undefined)
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
      if (isDefaultPublishedTemplate(record)) return
      navigateToPromptBuilder(
        navigate,
        { template: record.template, name: record.name },
        record.id,
      )
    },
    [navigate],
  )

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
    setCreateModalOpen(false)
    setPendingFiles(files)
    setUploadedFileNames(files.map((file) => file.name))
    setHasUploads(files.length > 0)
    setCreationBrief(undefined)
    setProcessingOpen(true)
  }, [])

  const firstTemplateModalVisible = !hasTemplates && !processingOpen
  const additionalTemplateModalVisible = hasTemplates && createModalOpen && !processingOpen

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
        <div className="px-8 py-8">
          {showLibraryControls && (
            <TemplateLibraryControls
              query={libraryQuery}
              totalCount={displayTemplates.length}
              filteredCount={filteredTemplates.length}
              onChange={setLibraryQuery}
            />
          )}

          {filteredTemplates.length === 0 ? (
            <TemplateLibraryEmptyState
              onClear={() => setLibraryQuery(DEFAULT_TEMPLATE_LIBRARY_QUERY)}
            />
          ) : (
            <div className="grid grid-cols-3 gap-8">
              {filteredTemplates.map((record) => (
                <PublishedTemplateCard
                  key={record.id}
                  record={record}
                  highlighted={record.id === highlightTemplateId}
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
        open={firstTemplateModalVisible}
        onClose={closeCreateModal}
        dismissible={hasTemplates}
        onGenerate={handleGenerate}
      />

      <CreateAdditionalTemplateModal
        open={additionalTemplateModalVisible}
        onClose={closeCreateModal}
        onGenerate={handleGenerate}
      />

      <GenerateTemplateProcessingModal
        open={processingOpen}
        files={pendingFiles}
        onComplete={handleGenerationComplete}
      />

      <TemplatesPageDemoSwitcher value={demoView} onChange={setDemoView} />
    </div>
  )
}
