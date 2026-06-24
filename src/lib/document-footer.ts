import {
  CANVAS_DOCUMENT_MAX_WIDTH,
  CANVAS_DOCUMENT_PADDING_PX,
} from "@/lib/canvas-constants"
import { deriveTemplatePages, isQuotePageId } from "@/lib/template-pages"
import type {
  BuilderBlock,
  BuilderTemplate,
  DocumentFooterConfig,
} from "@/types/prompt-builder"

const CONTENT_WIDTH_PX =
  CANVAS_DOCUMENT_MAX_WIDTH - CANVAS_DOCUMENT_PADDING_PX * 2
/** One A4 printable content area on the canvas (excludes footer band). */
const QUOTE_PRINTABLE_HEIGHT_PX =
  CONTENT_WIDTH_PX * (297 / 210) - 96

export const DEFAULT_DOCUMENT_FOOTER: DocumentFooterConfig = {
  showPageNumber: true,
  showQuoteNumber: true,
  showCustomerName: true,
  quotePageCount: 1,
  quoteNumber: "QT-2026-0142",
  customerName: "Acme Corp",
}

export function normalizeDocumentFooter(
  footer?: DocumentFooterConfig | null,
): Required<DocumentFooterConfig> {
  return {
    showPageNumber: footer?.showPageNumber ?? DEFAULT_DOCUMENT_FOOTER.showPageNumber!,
    showQuoteNumber: footer?.showQuoteNumber ?? DEFAULT_DOCUMENT_FOOTER.showQuoteNumber!,
    showCustomerName: footer?.showCustomerName ?? DEFAULT_DOCUMENT_FOOTER.showCustomerName!,
    quotePageCount: Math.max(1, footer?.quotePageCount ?? DEFAULT_DOCUMENT_FOOTER.quotePageCount!),
    quoteNumber: footer?.quoteNumber ?? DEFAULT_DOCUMENT_FOOTER.quoteNumber!,
    customerName: footer?.customerName ?? DEFAULT_DOCUMENT_FOOTER.customerName!,
  }
}

export function findQuoteSummaryBlock(template: BuilderTemplate) {
  return template.blocks.find((block) => block.type === "quote_summary_header")
}

export function resolveFooterQuoteNumber(template: BuilderTemplate): string {
  const block = findQuoteSummaryBlock(template)
  const fromBlock = block?.content.quoteNumber
  if (typeof fromBlock === "string" && fromBlock.trim()) return fromBlock
  return normalizeDocumentFooter(template.documentFooter).quoteNumber ?? ""
}

export function resolveFooterCustomerName(template: BuilderTemplate): string {
  const block = findQuoteSummaryBlock(template)
  const fromBlock = block?.content.customerName
  if (typeof fromBlock === "string" && fromBlock.trim()) return fromBlock
  const billedTo = template.blocks.find((block) => block.type === "billed_to")
  const billedName = billedTo?.content.name
  if (typeof billedName === "string" && billedName.trim()) return billedName
  return normalizeDocumentFooter(template.documentFooter).customerName ?? ""
}

function estimateBlockPrintHeight(block: BuilderBlock): number {
  const topPadding =
    typeof block.content.topPadding === "number" ? block.content.topPadding : 0
  const base = 48 + topPadding

  switch (block.type) {
    case "company_logo":
      return base + 80
    case "company_address":
    case "billed_to":
    case "quote_summary_header":
    case "contract_details":
    case "tcv_summary":
    case "ae_profile":
      return base + 100
    case "pricing": {
      const rows = Array.isArray(block.content.lineItems)
        ? block.content.lineItems.length
        : 4
      return base + 120 + rows * 36
    }
    case "terms": {
      const text = String(block.content.text ?? "")
      const lines = Math.ceil(text.length / 90)
      return base + Math.max(120, lines * 16)
    }
    case "entitlements":
      return base + 160
    case "signature":
      return base + 120
    case "custom_text":
      return base + Math.max(80, Math.ceil(String(block.content.text ?? "").length / 90) * 16)
    case "custom_table":
      return base + 180
    case "custom_image":
      return base + 220
    default:
      return base + 80
  }
}

/** Quote content can overflow onto multiple printed pages — estimate from block stack. */
export function estimateQuotePrintedPageCount(template: BuilderTemplate): number {
  const blocks = template.blocks
  if (blocks.length === 0) return 1

  const totalHeight = blocks.reduce(
    (sum, block) => sum + estimateBlockPrintHeight(block),
    0,
  )
  return Math.max(1, Math.ceil(totalHeight / QUOTE_PRINTABLE_HEIGHT_PX))
}

export function deriveFooterPageCounts(template: BuilderTemplate) {
  const pages = deriveTemplatePages(template)
  const customPageCount = pages.filter((page) => page.kind === "custom").length
  const configuredQuotePages =
    normalizeDocumentFooter(template.documentFooter).quotePageCount
  const quotePageCount = Math.max(
    configuredQuotePages,
    estimateQuotePrintedPageCount(template),
  )
  const totalPrintedPages = customPageCount + quotePageCount
  return { pages, customPageCount, quotePageCount, totalPrintedPages }
}

/** Custom pages: `1/5`. Quote page: `2…5/5` when preceded by custom pages, else `1…5/5`. */
export function formatFooterPageNumber(
  template: BuilderTemplate,
  pageId: string,
): string {
  const { pages, customPageCount, totalPrintedPages } =
    deriveFooterPageCounts(template)
  const page = pages.find((item) => item.id === pageId)
  if (!page || totalPrintedPages <= 0) return ""

  if (isQuotePageId(pageId)) {
    const start = customPageCount > 0 ? customPageCount + 1 : 1
    return `${start}…${totalPrintedPages}/${totalPrintedPages}`
  }

  return `${page.pageNumber}/${totalPrintedPages}`
}
