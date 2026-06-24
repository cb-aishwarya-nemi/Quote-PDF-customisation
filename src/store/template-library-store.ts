import { createId } from "@/lib/create-id"
import { deriveTemplateStats } from "@/lib/derive-template-stats"
import {
  deriveMockTemplateOwner,
  deriveTemplateDealTypes,
} from "@/lib/derive-template-library-meta"
import {
  createDefaultPublishedTemplate,
  isDefaultPublishedTemplate,
} from "@/lib/seed-demo-library"
import { mockVariants, type GeneratedVariant } from "@/mock/data"
import type { BuilderTemplate } from "@/types/prompt-builder"
import type { DealType } from "@/types/prompt-builder"
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
  dealTypes: DealType[]
  ownerId: string
  ownerName: string
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
  duplicatePublishedRecord: (
    source: PublishedBuilderTemplate,
  ) => PublishedBuilderTemplate
  publishGeneratedTemplate: (input: {
    variantId: string
    builderTemplateId: string
    name: string
  }) => void
  getPublishedTemplate: (id: string) => PublishedBuilderTemplate | undefined
  deletePublishedTemplate: (id: string) => boolean
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
  const owner = existing
    ? { id: existing.ownerId, name: existing.ownerName }
    : deriveMockTemplateOwner(snapshot.id)

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
    dealTypes: deriveTemplateDealTypes(snapshot),
    ownerId: owner.id,
    ownerName: owner.name,
  }
}

function duplicatePublishedRecordFromSource(
  source: PublishedBuilderTemplate,
): PublishedBuilderTemplate {
  const snapshot = cloneTemplate(source.template)
  snapshot.id = createId("tpl")
  snapshot.name = `Copy of ${source.name}`

  const stats = deriveTemplateStats(snapshot)
  const now = new Date().toISOString()
  const owner = deriveMockTemplateOwner(snapshot.id)

  return {
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
    dealTypes: deriveTemplateDealTypes(snapshot),
    ownerId: owner.id,
    ownerName: owner.name,
  }
}

export const useTemplateLibraryStore = create<TemplateLibraryStore>((set, get) => ({
  templates: [],
  publishedTemplates: [],
  publishedVariantId: null,
  initialized: false,

  ensureInitialized: () => {
    if (get().initialized) return
    set({
      templates: seedTemplates(),
      publishedTemplates: [createDefaultPublishedTemplate()],
      initialized: true,
    })
  },

  saveBuilderTemplateDraft: (template) => {
    get().ensureInitialized()
    if (isDefaultPublishedTemplate(template.id)) {
      const existing = get().publishedTemplates.find(
        (entry) => entry.id === template.id,
      )
      if (!existing) return createDefaultPublishedTemplate()
      return existing
    }
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
    if (isDefaultPublishedTemplate(template.id)) {
      const existing = get().publishedTemplates.find(
        (entry) => entry.id === template.id,
      )
      if (!existing) return createDefaultPublishedTemplate()
      return existing
    }
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

    const record = duplicatePublishedRecordFromSource(source)

    set((s) => ({
      publishedTemplates: [record, ...s.publishedTemplates],
    }))

    return record
  },

  duplicatePublishedRecord: (source) => {
    get().ensureInitialized()
    const record = duplicatePublishedRecordFromSource(source)

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

  deletePublishedTemplate: (id) => {
    if (isDefaultPublishedTemplate(id)) return false
    const hadEntry = get().publishedTemplates.some((entry) => entry.id === id)
    if (!hadEntry) return false
    set((s) => ({
      publishedTemplates: s.publishedTemplates.filter((entry) => entry.id !== id),
    }))
    return true
  },
}))

export function isDimmedGeneratedTemplate(
  template: LibraryGeneratedTemplate,
  publishedVariantId: string | null,
) {
  return publishedVariantId !== null && template.id !== publishedVariantId
}
