import { mockVariants, type GeneratedVariant } from "@/mock/data"
import type { TemplateStatus } from "@/types/template"
import { create } from "zustand"

export type LibraryGeneratedTemplate = GeneratedVariant & {
  status: TemplateStatus
  builderTemplateId?: string
}

type TemplateLibraryStore = {
  templates: LibraryGeneratedTemplate[]
  publishedVariantId: string | null
  initialized: boolean
  ensureInitialized: () => void
  publishGeneratedTemplate: (input: {
    variantId: string
    builderTemplateId: string
    name: string
  }) => void
}

function seedTemplates(): LibraryGeneratedTemplate[] {
  return mockVariants.map((variant) => ({
    ...variant,
    status: "draft" as const,
  }))
}

export const useTemplateLibraryStore = create<TemplateLibraryStore>((set, get) => ({
  templates: [],
  publishedVariantId: null,
  initialized: false,

  ensureInitialized: () => {
    if (get().initialized) return
    set({ templates: seedTemplates(), initialized: true })
  },

  publishGeneratedTemplate: ({ variantId, builderTemplateId, name }) => {
    get().ensureInitialized()
    set((s) => ({
      publishedVariantId: variantId,
      templates: s.templates.map((template) => {
        if (template.id !== variantId) return template
        return {
          ...template,
          name,
          status: "published" as const,
          builderTemplateId,
        }
      }),
    }))
  },
}))

export function isDimmedGeneratedTemplate(
  template: LibraryGeneratedTemplate,
  publishedVariantId: string | null,
) {
  return publishedVariantId !== null && template.id !== publishedVariantId
}
