import { createId } from "@/lib/create-id"
import type { Block, BlockType } from "@/types/template"

export type BlockCatalogItem = {
  type: BlockType
  label: string
  description: string
}

export const BLOCK_CATALOG: BlockCatalogItem[] = [
  { type: "header", label: "Header", description: "Quote title, number, and date" },
  {
    type: "quote_details",
    label: "Quote info",
    description: "Quote ID, salesperson, expiry",
  },
  { type: "billed_to", label: "Billed to", description: "Customer name and address" },
  {
    type: "company_details",
    label: "Company details",
    description: "Your company name, address, tax ID",
  },
  {
    type: "tcv_billing",
    label: "Total contract value",
    description: "TCV, ACV, billing cycle",
  },
  { type: "pricing", label: "Pricing table", description: "Line items and totals" },
  { type: "signature", label: "Signature block", description: "Sign-off area" },
  {
    type: "terms",
    label: "Terms and conditions",
    description: "Legal text with conditional spans",
  },
]

const defaultContent: Record<BlockType, Record<string, unknown>> = {
  header: { showQuoteNumber: true, showDate: true, showValidUntil: true },
  quote_details: { showQuoteId: true, showSalesperson: true, showExpiryDate: true },
  billed_to: { fields: ["name", "address", "contact", "region"] },
  company_details: { fields: ["name", "address", "tax_id", "entity"] },
  tcv_billing: {
    showTCV: true,
    showACV: true,
    showBillingCycle: true,
    tcvPlacement: "bottom",
  },
  pricing: {
    labelOverride: "Pricing",
    showSubtotal: true,
    showDiscounts: true,
    lineItemStyle: "table",
  },
  signature: { showDate: true, showTitle: true },
  terms: { text: "Standard terms and conditions apply.", spans: [], rules: [] },
}

export function getBlockLabel(type: BlockType): string {
  return BLOCK_CATALOG.find((b) => b.type === type)?.label ?? type
}

export function createBlock(type: BlockType, order: number): Block {
  return {
    id: createId("block"),
    type,
    order,
    layout: { topPadding: 16, showBorder: false },
    content: { ...defaultContent[type] },
  }
}

const PRESET_BLOCKS: Record<string, BlockType[]> = {
  "preset-standard": [
    "header",
    "company_details",
    "billed_to",
    "quote_details",
    "pricing",
    "tcv_billing",
    "terms",
  ],
  "preset-pricing-first": [
    "header",
    "pricing",
    "tcv_billing",
    "billed_to",
    "terms",
  ],
  "preset-multi-region": [
    "header",
    "quote_details",
    "pricing",
    "terms",
    "signature",
  ],
  "preset-header-led": [
    "header",
    "company_details",
    "billed_to",
    "pricing",
    "terms",
  ],
  "preset-order-form": ["billed_to", "pricing", "tcv_billing", "signature"],
  "preset-smb-quick": ["header", "pricing", "terms"],
}

const VARIANT_BLOCKS: Record<string, BlockType[]> = {
  v1: ["header", "pricing", "tcv_billing", "terms"],
  v2: ["header", "company_details", "pricing", "terms"],
  v3: ["header", "quote_details", "pricing", "terms"],
}

export function blocksForVariant(variantId: string): BlockType[] {
  return VARIANT_BLOCKS[variantId] ?? []
}

export function blocksForSource(source?: {
  mode?: string
  presetId?: string
  variantId?: string
}): BlockType[] {
  if (source?.presetId && PRESET_BLOCKS[source.presetId]) {
    return PRESET_BLOCKS[source.presetId]
  }
  if (source?.variantId) {
    return blocksForVariant(source.variantId)
  }
  return []
}
