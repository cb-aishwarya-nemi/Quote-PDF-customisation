import type { BuilderBlockType } from "@/types/prompt-builder"

export type BlockVariantOption = {
  id: string
  label: string
  description: string
}

export const BLOCK_VARIANTS: Record<BuilderBlockType, BlockVariantOption[]> = {
  company_logo: [
    {
      id: "default",
      label: "Default",
      description: "Standard logo size",
    },
    {
      id: "wide",
      label: "Wide",
      description: "Wider logo area for horizontal marks",
    },
    {
      id: "compact",
      label: "Compact",
      description: "Smaller logo mark",
    },
  ],
  company_address: [
    {
      id: "standard",
      label: "Standard",
      description: "Company name, address, and tax details",
    },
    {
      id: "compact",
      label: "Compact",
      description: "Single-line name and address",
    },
  ],
  quote_summary_header: [
    {
      id: "classic",
      label: "Classic",
      description: "Left-aligned title with a three-column meta row",
    },
    {
      id: "centered",
      label: "Centered",
      description: "Cover-style header with centered customer name",
    },
    {
      id: "minimal",
      label: "Minimal",
      description: "Single-line strip — ideal for dense quotes",
    },
  ],
  tcv_summary: [
    {
      id: "classic",
      label: "Hero",
      description: "Large TCV with a breakdown row beneath",
    },
    {
      id: "cards",
      label: "Metric cards",
      description: "TCV on a dark band with floating stat cards",
    },
    {
      id: "inline",
      label: "Inline strip",
      description: "All values in one compact horizontal line",
    },
  ],
  billed_to: [
    {
      id: "standard",
      label: "Standard",
      description: "Stacked company, contact, and address",
    },
    {
      id: "two_column",
      label: "Split",
      description: "Company left · primary contact right",
    },
    {
      id: "card",
      label: "Card",
      description: "Contained card with accent bar",
    },
  ],
  contract_details: [
    {
      id: "grid",
      label: "Grid",
      description: "Two-column field grid",
    },
    {
      id: "list",
      label: "Definition list",
      description: "Label-value pairs in a clean list",
    },
    {
      id: "timeline",
      label: "Timeline",
      description: "Vertical timeline with milestone dots",
    },
  ],
  pricing: [
    {
      id: "table",
      label: "Table",
      description: "Classic rows with header and subtotal",
    },
    {
      id: "compact",
      label: "Compact",
      description: "Dense zebra rows for long line lists",
    },
    {
      id: "quote",
      label: "Quote style",
      description: "Dotted leaders between item and amount",
    },
    {
      id: "with_descriptions",
      label: "With descriptions",
      description: "Item name with a description line under each row",
    },
  ],
  entitlements: [
    {
      id: "table",
      label: "Table",
      description: "Entitlement, limit, and usage notes in columns",
    },
    {
      id: "list",
      label: "Narrative list",
      description: "Stacked explainer bullets for white-glove deals",
    },
    {
      id: "compact",
      label: "Compact strip",
      description: "Name and limit only — for short add-on quotes",
    },
  ],
  terms: [
    {
      id: "standard",
      label: "Cards",
      description: "Each clause in its own bordered card",
    },
    {
      id: "numbered",
      label: "Numbered",
      description: "Ordered clauses with step numbers",
    },
    {
      id: "legal",
      label: "Legal dense",
      description: "Continuous fine print — traditional T&C",
    },
  ],
  custom_text: [
    {
      id: "standard",
      label: "Body",
      description: "Plain paragraph text",
    },
    {
      id: "callout",
      label: "Callout",
      description: "Highlighted note with left accent",
    },
    {
      id: "pull_quote",
      label: "Pull quote",
      description: "Centered emphasis for key messaging",
    },
  ],
  custom_table: [
    {
      id: "standard",
      label: "Standard",
      description: "Header row with clean borders",
    },
    {
      id: "minimal",
      label: "Minimal",
      description: "Borderless, airy columns",
    },
    {
      id: "striped",
      label: "Striped",
      description: "Alternating row bands for scanability",
    },
  ],
  custom_image: [
    {
      id: "standard",
      label: "Standard",
      description: "Contained image with toolbar",
    },
    {
      id: "full_bleed",
      label: "Full bleed",
      description: "Edge-to-edge within the page margins",
    },
    {
      id: "framed",
      label: "Framed",
      description: "Polaroid-style frame with caption",
    },
  ],
  signature: [
    {
      id: "dual_party",
      label: "Dual-party",
      description: "Customer and vendor countersignature lines",
    },
    {
      id: "dual",
      label: "Dual line",
      description: "Signature and date side by side",
    },
    {
      id: "single",
      label: "Single line",
      description: "Signature only — minimal close",
    },
    {
      id: "boxed",
      label: "Order form",
      description: "Boxed acceptance with legal acknowledgment line",
    },
  ],
  ae_profile: [
    {
      id: "card",
      label: "Card",
      description: "Avatar card with stacked contact info",
    },
    {
      id: "inline",
      label: "Inline",
      description: "Horizontal row — name beside avatar",
    },
    {
      id: "banner",
      label: "Banner",
      description: "Full-width bar with CTA styling",
    },
  ],
}

export const ADDABLE_BLOCKS: {
  type: BuilderBlockType
  label: string
  group: "standard" | "custom"
}[] = [
  { type: "company_logo", label: "Company logo", group: "standard" },
  { type: "company_address", label: "Company address", group: "standard" },
  { type: "tcv_summary", label: "TCV summary", group: "standard" },
  { type: "billed_to", label: "Billed to", group: "standard" },
  { type: "contract_details", label: "Contract details", group: "standard" },
  { type: "pricing", label: "Pricing table", group: "standard" },
  { type: "terms", label: "Terms & conditions", group: "standard" },
  { type: "entitlements", label: "Entitlements", group: "standard" },
  { type: "custom_text", label: "Text", group: "custom" },
  { type: "custom_table", label: "Table", group: "custom" },
  { type: "custom_image", label: "Image / PDF", group: "custom" },
  { type: "signature", label: "Signature", group: "standard" },
  { type: "ae_profile", label: "AE details", group: "standard" },
]

export function getVariantLabel(
  type: BuilderBlockType,
  variantId?: string,
): string {
  const variants = BLOCK_VARIANTS[type]
  return (
    variants.find((v) => v.id === variantId)?.label ?? variants[0]?.label ?? "Classic"
  )
}

export const LOGO_VARIANTS: BlockVariantOption[] = [
  {
    id: "default",
    label: "Default",
    description: "Standard logo size",
  },
  {
    id: "wide",
    label: "Wide",
    description: "Wider logo area for horizontal marks",
  },
  {
    id: "compact",
    label: "Compact",
    description: "Smaller logo mark",
  },
]

export function getLogoVariantLabel(variantId?: string): string {
  return (
    LOGO_VARIANTS.find((v) => v.id === variantId)?.label ??
    LOGO_VARIANTS[0]?.label ??
    "Default"
  )
}
