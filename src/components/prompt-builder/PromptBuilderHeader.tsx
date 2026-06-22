import { AutosaveIndicator } from "@/components/prompt-builder/AutosaveIndicator"
import { useBuilderAutosave } from "@/hooks/use-builder-autosave"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function PromptBuilderHeader() {
  const navigate = useNavigate()
  const template = usePromptBuilderStore((s) => s.template)
  const setTemplateName = usePromptBuilderStore((s) => s.setTemplateName)
  const publishBuilderTemplate = useTemplateLibraryStore(
    (s) => s.publishBuilderTemplate,
  )
  const { lastSavedAt, visible } = useBuilderAutosave()

  const handlePublish = () => {
    if (!template) return
    const published = publishBuilderTemplate(template)
    navigate("/templates", {
      state: { highlightTemplateId: published.id, fromPublish: true },
    })
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
        <input
          type="text"
          value={template?.name ?? ""}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Template name"
          className="mt-0.5 w-full max-w-md truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[14px] font-semibold text-gray-900 outline-none transition-colors hover:border-gray-200 hover:bg-gray-50 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
          aria-label="Template name"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <AutosaveIndicator
          lastSavedAt={lastSavedAt}
          visible={visible}
        />
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
