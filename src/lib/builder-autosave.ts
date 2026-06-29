import { withPersistedPdfImport } from "@/lib/template-pdf-import"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"

/** Survives StrictMode remounts so the first save isn't lost. */
export const lastPersistedAtByTemplateId = new Map<string, string>()

function persistableTemplateFromStore() {
  const state = usePromptBuilderStore.getState()
  if (!state.template) return null

  return withPersistedPdfImport(state.template, {
    pdfFieldMappings: state.pdfFieldMappings,
    pdfSourceFileName: state.pdfSourceFileName,
    pdfSourceDataUrl: state.pdfSourceDataUrl,
    pdfMappingLearnings: state.pdfMappingLearnings,
  })
}

/** Persist the current builder template immediately (e.g. after page removal). */
export function flushBuilderAutosave() {
  const template = persistableTemplateFromStore()
  if (!template) return

  const record = useTemplateLibraryStore
    .getState()
    .saveBuilderTemplateDraft(template)
  lastPersistedAtByTemplateId.set(template.id, record.updatedAt)
}
