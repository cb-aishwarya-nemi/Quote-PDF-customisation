import { isBlockLocked } from "@/lib/block-lock"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"

export function useEditorMode() {
  return usePromptBuilderStore((s) => s.editorMode)
}

export function useIsPreviewMode() {
  return usePromptBuilderStore((s) => s.editorMode === "preview")
}

export function useIsSalesMode() {
  return usePromptBuilderStore((s) => s.editorMode === "sales")
}

export function useIsTemplateEditMode() {
  return usePromptBuilderStore((s) => s.editorMode === "edit")
}

export function useCanEditBlockContent(blockId: string): boolean {
  const editorMode = useEditorMode()
  const locked = usePromptBuilderStore((s) => {
    const block = s.template?.blocks.find((b) => b.id === blockId)
    return isBlockLocked(block?.content)
  })

  if (editorMode === "preview") return false
  if (editorMode === "sales" && locked) return false
  return true
}

export function useCanEditBlockStructure(): boolean {
  return useIsTemplateEditMode()
}
