import { deriveLayoutVisualHints } from "@/lib/template-validation"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useMemo } from "react"

export function useBlockLayoutHints(blockId: string) {
  const template = usePromptBuilderStore((s) => s.template)
  const ignoredValidationIssueIds = usePromptBuilderStore(
    (s) => s.ignoredValidationIssueIds,
  )

  return useMemo(() => {
    const ignored = new Set(ignoredValidationIssueIds)
    const { blockHints } = deriveLayoutVisualHints(template, ignored)
    return blockHints.get(blockId) ?? []
  }, [blockId, ignoredValidationIssueIds, template])
}

export function useCanvasLayoutBanners() {
  const template = usePromptBuilderStore((s) => s.template)
  const ignoredValidationIssueIds = usePromptBuilderStore(
    (s) => s.ignoredValidationIssueIds,
  )

  return useMemo(() => {
    const ignored = new Set(ignoredValidationIssueIds)
    return deriveLayoutVisualHints(template, ignored).canvasBanners
  }, [ignoredValidationIssueIds, template])
}
