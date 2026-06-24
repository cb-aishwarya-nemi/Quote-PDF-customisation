import { useTemplateLibraryStore } from "@/store/template-library-store"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"

/** Survives StrictMode remounts so the first save isn't lost. */
export const lastPersistedAtByTemplateId = new Map<string, string>()

/** Persist the current builder template immediately (e.g. after page removal). */
export function flushBuilderAutosave() {
  const template = usePromptBuilderStore.getState().template
  if (!template) return

  const record = useTemplateLibraryStore
    .getState()
    .saveBuilderTemplateDraft(template)
  lastPersistedAtByTemplateId.set(template.id, record.updatedAt)
}
