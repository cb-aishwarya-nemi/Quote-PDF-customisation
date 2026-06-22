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

const DEMO_PUBLISHED_AT = "2026-06-10T14:30:00.000Z"
const DEMO_UPDATED_RECENT = "2026-06-19T09:15:00.000Z"
const DEMO_UPDATED_OLDER = "2026-06-12T11:40:00.000Z"
const DEMO_UPDATED_MIDDLE = "2026-06-16T16:20:00.000Z"

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
    variableCount: stats.variableCount,
    conditionCount: stats.conditionCount,
    variantId: input.variantId,
    dealTypes: input.dealTypes ?? deriveTemplateDealTypes(template),
    ownerId: owner.id,
    ownerName: owner.name,
  }
}

export const DEMO_PUBLISHED_TEMPLATES: PublishedBuilderTemplate[] = [
  buildDemoRecord({
    id: "demo-tpl-standard",
    name: DEFAULT_QUOTE_TEMPLATE_NAME,
    status: "published",
    updatedAt: DEMO_UPDATED_RECENT,
    quotesSent: 190,
    ownerId: "jordan-lee",
    ownerName: "Jordan Lee",
    dealTypes: ["new_business", "expansion", "amendment", "termination"],
  }),
  buildDemoRecord({
    id: "demo-tpl-amendment",
    name: "Amendment & renewal",
    status: "draft",
    updatedAt: DEMO_UPDATED_MIDDLE,
    quotesSent: 42,
    ownerId: "sam-patel",
    ownerName: "Sam Patel",
    dealTypes: ["amendment", "expansion"],
  }),
  buildDemoRecord({
    id: "demo-tpl-smb",
    name: "SMB quick quote",
    status: "published",
    updatedAt: DEMO_UPDATED_OLDER,
    quotesSent: 318,
    ownerId: "alex-chen",
    ownerName: "Alex Chen",
    dealTypes: ["new_business"],
    variantId: "v1",
  }),
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
  if (demoView === "data") return DEMO_PUBLISHED_TEMPLATES
  return liveTemplates
}
