import { ADDABLE_BLOCKS } from "@/lib/block-variants"
import {
  findCustomPage,
  isQuotePageId,
  QUOTE_PAGE_ID,
  resolveCustomPages,
} from "@/lib/template-pages"
import type {
  BuilderBlock,
  BuilderBlockType,
  BuilderTemplate,
  CustomTemplatePage,
} from "@/types/prompt-builder"

export type CustomPageKind = "intro" | "blocks"

/** Image / PDF blocks belong on the intro (cover) page only. */
export const INTRO_ONLY_BLOCK_TYPES: BuilderBlockType[] = ["custom_image"]

export function getCustomPageKind(page: CustomTemplatePage): CustomPageKind {
  if (page.kind === "intro" || page.kind === "blocks") return page.kind
  if (page.blocks !== undefined) return "blocks"
  return "intro"
}

export function isIntroCustomPage(
  template: BuilderTemplate,
  pageId: string,
): boolean {
  const page = findCustomPage(template, pageId)
  return page ? getCustomPageKind(page) === "intro" : false
}

export function isBlockCustomPage(
  template: BuilderTemplate,
  pageId: string,
): boolean {
  const page = findCustomPage(template, pageId)
  return page ? getCustomPageKind(page) === "blocks" : false
}

export function getBlocksForPage(
  template: BuilderTemplate,
  pageId: string,
): BuilderBlock[] {
  if (isQuotePageId(pageId)) return template.blocks
  const page = findCustomPage(template, pageId)
  if (!page || getCustomPageKind(page) !== "blocks") return []
  return page.blocks ?? []
}

export function setBlocksForPage(
  template: BuilderTemplate,
  pageId: string,
  blocks: BuilderBlock[],
): BuilderTemplate {
  if (isQuotePageId(pageId)) {
    return { ...template, blocks }
  }

  const customPages = resolveCustomPages(template).map((page) =>
    page.id === pageId && getCustomPageKind(page) === "blocks"
      ? { ...page, kind: "blocks" as const, blocks }
      : page,
  )

  return { ...template, customPages, introPage: undefined }
}

export function findBlockInTemplate(
  template: BuilderTemplate | null,
  blockId: string,
): BuilderBlock | undefined {
  if (!template) return undefined

  const inQuote = template.blocks.find((block) => block.id === blockId)
  if (inQuote) return inQuote

  for (const page of resolveCustomPages(template)) {
    if (getCustomPageKind(page) !== "blocks") continue
    const found = page.blocks?.find((block) => block.id === blockId)
    if (found) return found
  }

  return undefined
}

export function pageSupportsBlockEditing(
  template: BuilderTemplate,
  pageId: string,
): boolean {
  return isQuotePageId(pageId) || isBlockCustomPage(template, pageId)
}

export function getAddableBlockTypesForPage(
  template: BuilderTemplate,
  pageId: string,
): BuilderBlockType[] {
  const allTypes = ADDABLE_BLOCKS.map((entry) => entry.type)

  if (isIntroCustomPage(template, pageId)) return []

  if (isQuotePageId(pageId) || isBlockCustomPage(template, pageId)) {
    return allTypes.filter((type) => !INTRO_ONLY_BLOCK_TYPES.includes(type))
  }

  return allTypes
}

export function resolveBlockEditPageId(
  template: BuilderTemplate,
  activePageId: string,
): string {
  if (pageSupportsBlockEditing(template, activePageId)) return activePageId
  return QUOTE_PAGE_ID
}

export function findBlockPageId(
  template: BuilderTemplate,
  blockId: string,
): string | undefined {
  if (template.blocks.some((block) => block.id === blockId)) {
    return QUOTE_PAGE_ID
  }

  for (const page of resolveCustomPages(template)) {
    if (getCustomPageKind(page) !== "blocks") continue
    if (page.blocks?.some((block) => block.id === blockId)) {
      return page.id
    }
  }

  return undefined
}
