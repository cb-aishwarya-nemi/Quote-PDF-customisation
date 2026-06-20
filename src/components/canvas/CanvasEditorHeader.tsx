import { useCanvasStore } from "@/store/canvas-store"
import { ChevronRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function CanvasEditorHeader() {
  const navigate = useNavigate()
  const template = useCanvasStore((s) => s.template)
  const setTemplateName = useCanvasStore((s) => s.setTemplateName)
  const saveAsDraft = useCanvasStore((s) => s.saveAsDraft)
  const publish = useCanvasStore((s) => s.publish)

  const handleSave = () => {
    saveAsDraft()
    navigate("/templates")
  }

  const handlePublish = () => {
    publish()
    navigate("/templates")
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-2.5">
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
          <ChevronRight className="size-2.5 shrink-0" />
          <span className="truncate text-gray-600">Canvas editor</span>
        </nav>
        <input
          type="text"
          value={template?.name ?? "Untitled template"}
          onChange={(e) => setTemplateName(e.target.value)}
          className="mt-0.5 w-full max-w-md truncate border-0 bg-transparent p-0 text-[14px] font-semibold text-gray-900 outline-none focus:ring-0"
          aria-label="Template name"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
        >
          Save as draft
        </button>
        <button
          type="button"
          onClick={handlePublish}
          className="rounded bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700"
        >
          Publish
        </button>
      </div>
    </header>
  )
}
