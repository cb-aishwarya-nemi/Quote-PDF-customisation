import { isBlockLocked } from "@/lib/block-lock"
import {
  isSalesRestrictedEditor,
  usePromptBuilderStore,
} from "@/store/prompt-builder-store"

export function useEditorMode() {
  return usePromptBuilderStore((s) => s.editorMode)
}

export function usePreviewPersona() {
  return usePromptBuilderStore((s) => s.previewPersona)
}

export function useIsPreviewMode() {
  return usePromptBuilderStore((s) => s.editorMode === "preview")
}

export function useIsAdminPreview() {
  return usePromptBuilderStore(
    (s) => s.editorMode === "preview" && s.previewPersona === "admin",
  )
}

export function useIsSalesPreview() {
  return usePromptBuilderStore(
    (s) => s.editorMode === "preview" && s.previewPersona === "sales",
  )
}

export function useIsSalesMode() {
  const editorMode = useEditorMode()
  const previewPersona = usePreviewPersona()
  return isSalesRestrictedEditor(editorMode, previewPersona)
}

export function useIsTemplateEditMode() {
  return usePromptBuilderStore((s) => s.editorMode === "edit")
}

export function useCanEditBlockContent(blockId: string): boolean {
  const editorMode = useEditorMode()
  const previewPersona = usePreviewPersona()
  const locked = usePromptBuilderStore((s) => {
    const block = s.template?.blocks.find((b) => b.id === blockId)
    return isBlockLocked(block?.content)
  })

  if (editorMode === "preview" && previewPersona === "admin") return false
  if (isSalesRestrictedEditor(editorMode, previewPersona) && locked) return false
  return true
}

export function useCanEditBlockStructure(): boolean {
  return useIsTemplateEditMode()
}
