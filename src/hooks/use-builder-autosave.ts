import { useTemplateLibraryStore } from "@/store/template-library-store"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useEffect, useRef, useState } from "react"

const AUTOSAVE_DELAY_MS = 800

/** Survives StrictMode remounts so the first save isn't lost. */
const lastPersistedAtByTemplateId = new Map<string, string>()

export type AutosaveStatus = "idle" | "saving" | "saved"

export function useBuilderAutosave() {
  const templateId = usePromptBuilderStore((s) => s.template?.id ?? null)

  const [status, setStatus] = useState<AutosaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const debounceRef = useRef<number>()
  const skipNextChangeRef = useRef(false)

  useEffect(() => {
    if (!templateId) {
      setStatus("idle")
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
      const current = usePromptBuilderStore.getState().template
      if (!current || current.id !== templateId) return

      const record = useTemplateLibraryStore
        .getState()
        .saveBuilderTemplateDraft(current)
      lastPersistedAtByTemplateId.set(templateId, record.updatedAt)
      setLastSavedAt(record.updatedAt)
      setStatus("saved")
    }

    const scheduleSave = (debounced: boolean) => {
      const current = usePromptBuilderStore.getState().template
      if (!current || current.id !== templateId) return

      window.clearTimeout(debounceRef.current)

      if (!debounced) {
        setStatus("saving")
        commitSave()
        skipNextChangeRef.current = true
        return
      }

      setStatus("saving")
      debounceRef.current = window.setTimeout(commitSave, AUTOSAVE_DELAY_MS)
    }

    const existingSavedAt = hydrateSavedAt()
    if (existingSavedAt) {
      setLastSavedAt(existingSavedAt)
      setStatus("saved")
    } else {
      scheduleSave(false)
    }

    const unsubscribe = usePromptBuilderStore.subscribe((state, prevState) => {
      if (state.template === prevState.template) return
      if (state.template?.id !== templateId) return

      if (skipNextChangeRef.current) {
        skipNextChangeRef.current = false
        return
      }

      scheduleSave(true)
    })

    return () => {
      unsubscribe()
      window.clearTimeout(debounceRef.current)
    }
  }, [templateId])

  return { status, lastSavedAt, visible: !!templateId }
}
