import type { BuilderBlockType } from "@/types/prompt-builder"

export type BlockVariantOption = {
  id: string
  label: string
  description: string
}

export const BLOCK_VARIANTS: Record<BuilderBlockType, BlockVariantOption[]> = {
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
      label: "Boxed",
      description: "Signature inside a formal bordered box",
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
  { type: "quote_summary_header", label: "Quote summary", group: "standard" },
  { type: "tcv_summary", label: "TCV summary", group: "standard" },
  { type: "billed_to", label: "Billed to", group: "standard" },
  { type: "contract_details", label: "Contract details", group: "standard" },
  { type: "pricing", label: "Pricing table", group: "standard" },
  { type: "terms", label: "Terms & conditions", group: "standard" },
  { type: "custom_text", label: "Text", group: "custom" },
  { type: "custom_table", label: "Table", group: "custom" },
  { type: "custom_image", label: "Image / PDF", group: "custom" },
  { type: "signature", label: "Signature", group: "custom" },
  { type: "ae_profile", label: "AE profile", group: "custom" },
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
