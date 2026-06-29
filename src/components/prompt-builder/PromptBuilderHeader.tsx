import { AutosaveIndicator } from "@/components/prompt-builder/AutosaveIndicator"
import { flushBuilderAutosave, useBuilderAutosave } from "@/hooks/use-builder-autosave"
import { TEMPLATE_NAME_PLACEHOLDER } from "@/lib/create-builder-template"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { ArrowRight, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"

export function PromptBuilderHeader() {
  const navigate = useNavigate()
  const template = usePromptBuilderStore((s) => s.template)
  const setTemplateName = usePromptBuilderStore((s) => s.setTemplateName)
  const requestPublish = usePromptBuilderStore((s) => s.requestPublish)
  const setBuilderWorkflowTab = usePromptBuilderStore((s) => s.setBuilderWorkflowTab)
  const builderWorkflowTab = usePromptBuilderStore((s) => s.builderWorkflowTab)
  const pdfFieldMappings = usePromptBuilderStore((s) => s.pdfFieldMappings)
  const ensureInitialized = useTemplateLibraryStore((s) => s.ensureInitialized)
  const publishedTemplates = useTemplateLibraryStore((s) => s.publishedTemplates)
  const { lastSavedAt, visible } = useBuilderAutosave()
  const nameInputRef = useRef<HTMLInputElement>(null)

  const showDataMapping =
    pdfFieldMappings.length > 0 && builderWorkflowTab === "data_mapping"

  const isPublished = useMemo(() => {
    if (!template) return false
    const record = publishedTemplates.find((entry) => entry.id === template.id)
    return record?.status === "published"
  }, [publishedTemplates, template])

  const nameIsEmpty = !template?.name.trim()

  useEffect(() => {
    if (!template || template.name.trim()) return
    nameInputRef.current?.focus()
  }, [template?.id, template?.name])

  const handlePublish = () => {
    if (!template) return
    ensureInitialized()
    flushBuilderAutosave()
    requestPublish()
  }

  const handleEditTemplate = () => {
    setBuilderWorkflowTab("canvas")
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-2.5">
      <div className="min-w-0">
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
          <button
            type="button"
            onClick={() => navigate("/templates")}
            className="hover:text-gray-700"
          >
            Quote PDF templates
          </button>
        </nav>
        <div className="mt-0.5 flex min-w-0 items-center gap-2">
          <input
            ref={nameInputRef}
            type="text"
            value={template?.name ?? ""}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={TEMPLATE_NAME_PLACEHOLDER}
            className={`min-w-0 max-w-md flex-1 truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[14px] font-semibold outline-none transition-colors placeholder:italic placeholder:font-normal placeholder:text-gray-400 hover:border-gray-200 hover:bg-gray-50 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 ${
              nameIsEmpty ? "text-gray-400" : "text-gray-900"
            }`}
            aria-label="Template name"
          />
          {isPublished && (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              Published
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {!showDataMapping && (
          <AutosaveIndicator
            lastSavedAt={lastSavedAt}
            visible={visible}
          />
        )}
        {showDataMapping ? (
          <button
            type="button"
            onClick={handleEditTemplate}
            disabled={!template}
            className="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Edit template
            <ArrowRight className="size-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={!template}
            className="rounded bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isPublished ? "Save and publish" : "Publish"}
          </button>
        )}
      </div>
    </header>
  )
}
