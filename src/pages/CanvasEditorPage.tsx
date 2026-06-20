import { CanvasEditorHeader } from "@/components/canvas/CanvasEditorHeader"
import { EditorWorkspace } from "@/components/canvas/EditorWorkspace"
import { createTemplate } from "@/lib/create-template"
import type { CanvasNavigationState } from "@/lib/navigate-to-canvas"
import { useCanvasStore } from "@/store/canvas-store"
import { useLayoutEffect } from "react"
import { useLocation, useParams } from "react-router-dom"

export function CanvasEditorPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const location = useLocation()
  const initTemplate = useCanvasStore((s) => s.initTemplate)
  const template = useCanvasStore((s) => s.template)

  useLayoutEffect(() => {
    if (!templateId) return
    if (template?.id === templateId) return

    const navState = location.state as CanvasNavigationState | null
    if (navState?.template?.id === templateId) {
      initTemplate(navState.template)
      return
    }

    initTemplate(createTemplate(templateId, navState ?? undefined))
  }, [templateId, location.key, location.state, initTemplate, template?.id])

  if (!templateId) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-[13px] text-gray-500">
        Missing template id.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-[#f5f7fa]">
      <CanvasEditorHeader />
      <div className="flex min-h-0 flex-1">
        <EditorWorkspace />
      </div>
    </div>
  )
}
