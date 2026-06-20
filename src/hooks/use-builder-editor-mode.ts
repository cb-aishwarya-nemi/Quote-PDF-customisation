import { usePromptBuilderStore } from "@/store/prompt-builder-store"

export function useEditorMode() {
  return usePromptBuilderStore((s) => s.editorMode)
}

export function useIsPreviewMode() {
  return usePromptBuilderStore((s) => s.editorMode === "preview")
}
