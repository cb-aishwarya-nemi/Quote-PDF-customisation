import { withPersistedPdfImport } from "@/lib/template-pdf-import"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { lastPersistedAtByTemplateId, flushBuilderAutosave } from "@/lib/builder-autosave"
import { useEffect, useRef, useState } from "react"

const AUTOSAVE_DELAY_MS = 3000

export { flushBuilderAutosave }

export function useBuilderAutosave() {
  const templateId = usePromptBuilderStore((s) => s.template?.id ?? null)

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const debounceRef = useRef<number>()
  const skipNextChangeRef = useRef(false)

  useEffect(() => {
    if (!templateId) {
      setLastSavedAt(null)
      return
    }

    const hydrateSavedAt = () => {
      const fromMemory = lastPersistedAtByTemplateId.get(templateId)
      if (fromMemory) return fromMemory

      return (
        useTemplateLibraryStore
          .getState()
          .getPublishedTemplate(templateId)?.updatedAt ?? null
      )
    }

    const commitSave = () => {
      const state = usePromptBuilderStore.getState()
      const current = state.template
      if (!current || current.id !== templateId) return

      const persistable = withPersistedPdfImport(current, {
        pdfFieldMappings: state.pdfFieldMappings,
        pdfSourceFileName: state.pdfSourceFileName,
        pdfSourceDataUrl: state.pdfSourceDataUrl,
        pdfMappingLearnings: state.pdfMappingLearnings,
      })

      const record = useTemplateLibraryStore
        .getState()
        .saveBuilderTemplateDraft(persistable)
      lastPersistedAtByTemplateId.set(templateId, record.updatedAt)
      setLastSavedAt(record.updatedAt)
    }

    const scheduleSave = (immediate = false) => {
      const current = usePromptBuilderStore.getState().template
      if (!current || current.id !== templateId) return

      window.clearTimeout(debounceRef.current)

      if (immediate) {
        commitSave()
        skipNextChangeRef.current = true
        return
      }

      debounceRef.current = window.setTimeout(commitSave, AUTOSAVE_DELAY_MS)
    }

    const existingSavedAt = hydrateSavedAt()
    if (existingSavedAt) {
      setLastSavedAt(existingSavedAt)
    } else {
      scheduleSave(true)
    }

    const unsubscribe = usePromptBuilderStore.subscribe((state, prevState) => {
      if (state.template?.id !== templateId) return

      const templateChanged = state.template !== prevState.template
      const pdfChanged =
        state.pdfFieldMappings !== prevState.pdfFieldMappings ||
        state.pdfMappingLearnings !== prevState.pdfMappingLearnings ||
        state.pdfSourceFileName !== prevState.pdfSourceFileName ||
        state.pdfSourceDataUrl !== prevState.pdfSourceDataUrl

      if (!templateChanged && !pdfChanged) return

      if (skipNextChangeRef.current) {
        skipNextChangeRef.current = false
        return
      }

      scheduleSave()
    })

    return () => {
      unsubscribe()
      window.clearTimeout(debounceRef.current)
    }
  }, [templateId])

  return { lastSavedAt, visible: !!templateId }
}
