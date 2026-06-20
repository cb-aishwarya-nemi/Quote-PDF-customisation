import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { ChevronRight, Eye, Pencil } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function PromptBuilderHeader() {
  const navigate = useNavigate()
  const template = usePromptBuilderStore((s) => s.template)
  const setTemplateName = usePromptBuilderStore((s) => s.setTemplateName)
  const editorMode = usePromptBuilderStore((s) => s.editorMode)
  const openPreview = usePromptBuilderStore((s) => s.openPreview)
  const closePreview = usePromptBuilderStore((s) => s.closePreview)
  const publishGeneratedTemplate = useTemplateLibraryStore(
    (s) => s.publishGeneratedTemplate,
  )
  const isPreview = editorMode === "preview"

  const handlePublish = () => {
    if (!template) return
    if (template.variantId) {
      publishGeneratedTemplate({
        variantId: template.variantId,
        builderTemplateId: template.id,
        name: template.name,
      })
      navigate("/templates", { state: { viewGenerated: true } })
      return
    }
    navigate("/templates")
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-2.5">
      <div className="min-w-0">
        <nav className="flex items-center gap-1 text-[11px] text-gray-500">
          <button
            type="button"
            onClick={() => navigate("/templates")}
            className="hover:text-gray-700"
          >
            Quote PDF templates
          </button>
          <ChevronRight className="size-2.5 shrink-0" />
          <span className="truncate text-gray-600">Prompt builder</span>
        </nav>
        <input
          type="text"
          value={template?.name ?? "Untitled template"}
          onChange={(e) => setTemplateName(e.target.value)}
          className="mt-0.5 w-full max-w-md truncate border-0 bg-transparent p-0 text-[14px] font-semibold text-gray-900 outline-none"
          aria-label="Template name"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isPreview ? (
          <button
            type="button"
            onClick={closePreview}
            className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="size-3.5" />
            Back to edit
          </button>
        ) : (
          <button
            type="button"
            onClick={openPreview}
            className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <Eye className="size-3.5" />
            Preview
          </button>
        )}
        <button
          type="button"
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
        >
          Save as draft
        </button>
        <button
          type="button"
          onClick={handlePublish}
          disabled={!template}
          className="rounded bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Publish
        </button>
      </div>
    </header>
  )
}
