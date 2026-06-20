import { createTemplate } from "@/lib/create-template"
import { createId } from "@/lib/create-id"
import { useCanvasStore } from "@/store/canvas-store"
import type { EditorSource, Template } from "@/types/template"

export type CanvasNavigationState = EditorSource & {
  template?: Template
}

export function canvasEditPath(templateId?: string) {
  return `/templates/${templateId ?? createId("tpl")}/edit`
}

/** Use with navigate(buildCanvasNavigation(...)) */
export function buildCanvasNavigation(
  source?: EditorSource,
  templateId?: string,
) {
  return {
    pathname: canvasEditPath(templateId),
    state: source,
  } as const
}

export function navigateToCanvas(
  navigate: (to: string, options?: { state?: CanvasNavigationState }) => void,
  source?: EditorSource,
  templateId?: string,
) {
  const id = templateId ?? createId("tpl")
  const template = createTemplate(id, source)
  useCanvasStore.getState().initTemplate(template)
  navigate(canvasEditPath(id), { state: { ...source, template } })
}
