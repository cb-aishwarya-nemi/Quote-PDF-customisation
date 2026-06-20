import { createId } from "@/lib/create-id"
import { deriveTemplateStats } from "@/lib/derive-template-stats"
import { mockVariants, type GeneratedVariant } from "@/mock/data"
import type { BuilderTemplate } from "@/types/prompt-builder"
import type { TemplateStatus } from "@/types/template"
import { create } from "zustand"

export type LibraryGeneratedTemplate = GeneratedVariant & {
  status: TemplateStatus
  builderTemplateId?: string
}

export type PublishedBuilderTemplate = {
  id: string
  name: string
  status: TemplateStatus
  template: BuilderTemplate
  updatedAt: string
  publishedAt: string
  quotesSent: number
  variableCount: number
  conditionCount: number
  variantId?: string
}

type TemplateLibraryStore = {
  templates: LibraryGeneratedTemplate[]
  publishedTemplates: PublishedBuilderTemplate[]
  publishedVariantId: string | null
  initialized: boolean
  ensureInitialized: () => void
  saveBuilderTemplateDraft: (template: BuilderTemplate) => PublishedBuilderTemplate
  publishBuilderTemplate: (template: BuilderTemplate) => PublishedBuilderTemplate
  duplicateBuilderTemplate: (id: string) => PublishedBuilderTemplate | undefined
  publishGeneratedTemplate: (input: {
    variantId: string
    builderTemplateId: string
    name: string
  }) => void
  getPublishedTemplate: (id: string) => PublishedBuilderTemplate | undefined
}

function seedTemplates(): LibraryGeneratedTemplate[] {
  return mockVariants.map((variant) => ({
    ...variant,
    status: "draft" as const,
  }))
}

function cloneTemplate(template: BuilderTemplate): BuilderTemplate {
  return JSON.parse(JSON.stringify(template)) as BuilderTemplate
}

function upsertBuilderTemplateRecord(
  template: BuilderTemplate,
  existing: PublishedBuilderTemplate | undefined,
  status: TemplateStatus,
): PublishedBuilderTemplate {
  const stats = deriveTemplateStats(template)
  const now = new Date().toISOString()
  const snapshot = cloneTemplate({
    ...template,
    name: template.name.trim() || "Untitled template",
  })

  return {
    id: snapshot.id,
    name: snapshot.name,
    status,
    template: snapshot,
    updatedAt: now,
    publishedAt: existing?.publishedAt ?? now,
    quotesSent: existing?.quotesSent ?? stats.quotesSent,
    variableCount: stats.variableCount,
    conditionCount: stats.conditionCount,
    variantId: snapshot.variantId,
  }
}

export const useTemplateLibraryStore = create<TemplateLibraryStore>((set, get) => ({
  templates: [],
  publishedTemplates: [],
  publishedVariantId: null,
  initialized: false,

  ensureInitialized: () => {
    if (get().initialized) return
    set({ templates: seedTemplates(), initialized: true })
  },

  saveBuilderTemplateDraft: (template) => {
    get().ensureInitialized()
    const existing = get().publishedTemplates.find(
      (entry) => entry.id === template.id,
    )
    const record = upsertBuilderTemplateRecord(
      template,
      existing,
      existing?.status ?? "draft",
    )

    set((s) => ({
      publishedTemplates: [
        record,
        ...s.publishedTemplates.filter((entry) => entry.id !== record.id),
      ],
    }))

    return record
  },

  publishBuilderTemplate: (template) => {
    get().ensureInitialized()
    const existing = get().publishedTemplates.find(
      (entry) => entry.id === template.id,
    )
    const record = upsertBuilderTemplateRecord(
      template,
      existing,
      "published",
    )

    set((s) => ({
      publishedVariantId: record.variantId ?? s.publishedVariantId,
      publishedTemplates: [
        record,
        ...s.publishedTemplates.filter((entry) => entry.id !== record.id),
      ],
      templates: record.variantId
        ? s.templates.map((entry) =>
            entry.id !== record.variantId
              ? entry
              : {
                  ...entry,
                  name: record.name,
                  status: "published" as const,
                  builderTemplateId: record.id,
                },
          )
        : s.templates,
    }))

    return record
  },

  duplicateBuilderTemplate: (id) => {
    get().ensureInitialized()
    const source = get().publishedTemplates.find((entry) => entry.id === id)
    if (!source) return undefined

    const snapshot = cloneTemplate(source.template)
    snapshot.id = createId("tpl")
    snapshot.name = `${source.name} copy`

    const stats = deriveTemplateStats(snapshot)
    const now = new Date().toISOString()

    const record: PublishedBuilderTemplate = {
      id: snapshot.id,
      name: snapshot.name,
      status: "draft",
      template: snapshot,
      updatedAt: now,
      publishedAt: now,
      quotesSent: stats.quotesSent,
      variableCount: stats.variableCount,
      conditionCount: stats.conditionCount,
      variantId: snapshot.variantId,
    }

    set((s) => ({
      publishedTemplates: [record, ...s.publishedTemplates],
    }))

    return record
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

  getPublishedTemplate: (id) =>
    get().publishedTemplates.find((entry) => entry.id === id),
}))

export function isDimmedGeneratedTemplate(
  template: LibraryGeneratedTemplate,
  publishedVariantId: string | null,
) {
  return publishedVariantId !== null && template.id !== publishedVariantId
}
