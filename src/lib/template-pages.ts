import type {
  BuilderTemplate,
  CustomTemplatePage,
  TemplatePageId,
} from "@/types/prompt-builder"
import { createId } from "@/lib/create-id"
import { normalizeDocumentFooter } from "@/lib/document-footer"

export const QUOTE_PAGE_ID = "quote" as const
/** Legacy id for templates that used a single intro page */
export const INTRO_PAGE_ID = "intro" as const

export type TemplatePageItem = {
  id: TemplatePageId
  label: string
  kind: "custom" | "quote"
  pageNumber: number
}

export function customPageLabel(pageNumber: number): string {
  return `Page ${pageNumber}`
}

export function normalizeCustomPageLabel(
  label: string | undefined,
  pageNumber: number,
): string {
  if (!label || label === "Cover" || label === "Intro") {
    return customPageLabel(pageNumber)
  }
  return label
}

/** Empty blocks page — shows the blank canvas with Add block. */
export function createBlankBlocksPage(pageNumber: number): CustomTemplatePage {
  return {
    id: createId("page"),
    label: customPageLabel(pageNumber),
    kind: "blocks",
    blocks: [],
  }
}

export function isQuotePageId(pageId: string): boolean {
  return pageId === QUOTE_PAGE_ID
}

export function resolveCustomPages(template: BuilderTemplate): CustomTemplatePage[] {
  // Treat an explicit empty array as "no custom pages" — do not fall back to legacy introPage.
  if (template.customPages != null) return template.customPages
  if (template.introPage) {
    return [
      {
        id: INTRO_PAGE_ID,
        label: "Intro",
        content: template.introPage,
      },
    ]
  }
  return []
}

export function getTemplatePageIds(template: BuilderTemplate): TemplatePageId[] {
  return [
    ...resolveCustomPages(template).map((page) => page.id),
    QUOTE_PAGE_ID,
  ]
}

export function normalizeTemplatePageOrder(
  template: BuilderTemplate,
): TemplatePageId[] {
  const available = new Set(getTemplatePageIds(template))
  const stored = (template.pageOrder ?? []).filter((id) => available.has(id))
  const missing = getTemplatePageIds(template).filter((id) => !stored.includes(id))

  if (!template.pageOrder) {
    const customIds = resolveCustomPages(template).map((page) => page.id)
    if (customIds.length > 0) return [...customIds, QUOTE_PAGE_ID]
    return [QUOTE_PAGE_ID]
  }

  return [...stored, ...missing]
}

export function deriveTemplatePages(template: BuilderTemplate): TemplatePageItem[] {
  const customPages = resolveCustomPages(template)

  return normalizeTemplatePageOrder(template).map((id, index) => {
    if (isQuotePageId(id)) {
      return {
        id: QUOTE_PAGE_ID,
        label: "Quote",
        kind: "quote",
        pageNumber: index + 1,
      }
    }

    const custom = customPages.find((page) => page.id === id)
    const pageNumber = index + 1
    return {
      id,
      label: normalizeCustomPageLabel(custom?.label, pageNumber),
      kind: "custom",
      pageNumber,
    }
  })
}

export function findCustomPage(
  template: BuilderTemplate,
  pageId: string,
): CustomTemplatePage | undefined {
  return resolveCustomPages(template).find((page) => page.id === pageId)
}

export function normalizeTemplatePages(template: BuilderTemplate): BuilderTemplate {
  const customPages = resolveCustomPages(template)
  const pageOrder = normalizeTemplatePageOrder({ ...template, customPages })
  const { introPage: _legacyIntro, ...rest } = template
  return {
    ...rest,
    customPages,
    pageOrder,
    introPage: undefined,
    documentFooter: normalizeDocumentFooter(template.documentFooter),
  }
}
