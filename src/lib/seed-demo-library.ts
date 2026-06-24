import {
  DEFAULT_QUOTE_TEMPLATE_NAME,
  createBuilderTemplate,
} from "@/lib/create-builder-template"
import { deriveTemplateStats } from "@/lib/derive-template-stats"
import {
  deriveMockTemplateOwner,
  deriveTemplateDealTypes,
} from "@/lib/derive-template-library-meta"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import type { TemplateStatus } from "@/types/template"
import type { DealType } from "@/types/prompt-builder"

export type TemplatesPageDemoView = "empty" | "data"

export const DEFAULT_PUBLISHED_TEMPLATE_ID = "tpl-standard-business"

export function isDefaultPublishedTemplate(
  idOrRecord: string | { id: string },
): boolean {
  const id = typeof idOrRecord === "string" ? idOrRecord : idOrRecord.id
  return id === DEFAULT_PUBLISHED_TEMPLATE_ID
}

const DEMO_PUBLISHED_AT = "2026-03-21T14:30:00.000Z"
const DEMO_UPDATED_RECENT = "2026-06-19T09:15:00.000Z"

function buildDemoRecord(input: {
  id: string
  name: string
  status: TemplateStatus
  updatedAt: string
  publishedAt?: string
  quotesSent?: number
  ownerId?: string
  ownerName?: string
  dealTypes?: DealType[]
  variantId?: string
  variableCount?: number
}): PublishedBuilderTemplate {
  const template = createBuilderTemplate(input.id, {
    name: input.name,
    variantId: input.variantId,
  })
  const stats = deriveTemplateStats(template)
  const owner = input.ownerId
    ? { id: input.ownerId, name: input.ownerName ?? input.ownerId }
    : deriveMockTemplateOwner(template.id)

  return {
    id: input.id,
    name: input.name,
    status: input.status,
    template,
    updatedAt: input.updatedAt,
    publishedAt: input.publishedAt ?? DEMO_PUBLISHED_AT,
    quotesSent: input.quotesSent ?? stats.quotesSent,
    variableCount: input.variableCount ?? stats.variableCount,
    conditionCount: stats.conditionCount,
    variantId: input.variantId,
    dealTypes: input.dealTypes ?? deriveTemplateDealTypes(template),
    ownerId: owner.id,
    ownerName: owner.name,
  }
}

export function createDefaultPublishedTemplate(): PublishedBuilderTemplate {
  return buildDemoRecord({
    id: DEFAULT_PUBLISHED_TEMPLATE_ID,
    name: DEFAULT_QUOTE_TEMPLATE_NAME,
    status: "published",
    updatedAt: DEMO_UPDATED_RECENT,
    publishedAt: DEMO_PUBLISHED_AT,
    quotesSent: 190,
    variableCount: 30,
    ownerId: "jordan-lee",
    ownerName: "Jordan Lee",
    dealTypes: ["new_business", "expansion", "amendment", "termination"],
  })
}

export const DEMO_PUBLISHED_TEMPLATES: PublishedBuilderTemplate[] = [
  createDefaultPublishedTemplate(),
]

export const TEMPLATES_PAGE_DEMO_STORAGE_KEY = "templates-page-demo-view"

export function readTemplatesPageDemoView(): TemplatesPageDemoView {
  try {
    const value = localStorage.getItem(TEMPLATES_PAGE_DEMO_STORAGE_KEY)
    if (value === "empty" || value === "data") return value
  } catch {
    /* ignore */
  }
  return "data"
}

export function writeTemplatesPageDemoView(view: TemplatesPageDemoView) {
  try {
    localStorage.setItem(TEMPLATES_PAGE_DEMO_STORAGE_KEY, view)
  } catch {
    /* ignore */
  }
}

export function resolveTemplatesPageLibrary(
  demoView: TemplatesPageDemoView,
  liveTemplates: PublishedBuilderTemplate[],
): PublishedBuilderTemplate[] {
  if (demoView === "empty") return []
  return liveTemplates
}
