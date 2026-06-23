import type { BuilderBlock, BuilderBlockType } from "@/types/prompt-builder"
import type { LayoutColumn } from "@/lib/block-layout"

/** Canvas is a strict 2-column grid — blocks are half (50%) or full (100%) width. */
export type BlockWidthRule = "half_only" | "half_or_full" | "full_only"

export const BLOCK_WIDTH_RULES: Record<BuilderBlockType, BlockWidthRule> = {
  company_logo: "half_only",
  company_address: "half_only",
  quote_summary_header: "half_or_full",
  tcv_summary: "half_or_full",
  billed_to: "half_or_full",
  contract_details: "half_or_full",
  pricing: "full_only",
  terms: "full_only",
  entitlements: "half_or_full",
  signature: "half_or_full",
  ae_profile: "half_or_full",
  custom_text: "half_or_full",
  custom_table: "full_only",
  custom_image: "half_or_full",
}

/** Merge-field / content reference for docs and tooling. */
export const BLOCK_LAYOUT_ATTRIBUTES: Record<BuilderBlockType, string> = {
  company_logo: "Logo / image",
  company_address: "Address lines (org address from business profile)",
  quote_summary_header:
    "Quote number, quote date, expiry date, customer id, payment terms",
  tcv_summary: "TC value, billing cycles, first billing amount",
  billed_to: "Customer name, address line, zip, city (billing address)",
  contract_details:
    "Sub id, contract start, end, length, frequency, billing cycles, contract TCV, renewal behavior",
  pricing: "Items, ramps, summary per period",
  terms: "Conditional legal segments",
  entitlements: "Feature, included, notes",
  signature: "Customer, vendor, date for each",
  ae_profile: "Name, email, photo",
  custom_text: "Free text",
  custom_table: "Custom table rows",
  custom_image: "Image or PDF asset",
}

export function getBlockWidthRule(type: BuilderBlockType): BlockWidthRule {
  return BLOCK_WIDTH_RULES[type] ?? "half_or_full"
}

export function blockAllowsHalfWidth(type: BuilderBlockType): boolean {
  return getBlockWidthRule(type) !== "full_only"
}

export function blockRequiresFullWidth(type: BuilderBlockType): boolean {
  return getBlockWidthRule(type) === "full_only"
}

export function blockRequiresHalfWidth(type: BuilderBlockType): boolean {
  return getBlockWidthRule(type) === "half_only"
}

export function layoutColumnIsHalf(column: LayoutColumn): boolean {
  return column === "left" || column === "right"
}

export function blockIsHalfWidth(block: BuilderBlock): boolean {
  const column = String(block.content.layoutColumn ?? "full")
  return column === "left" || column === "right"
}

export function blockIsFullWidth(block: BuilderBlock): boolean {
  return !blockIsHalfWidth(block)
}

export function allowedLayoutColumns(type: BuilderBlockType): LayoutColumn[] {
  const rule = getBlockWidthRule(type)
  if (rule === "full_only") return ["full"]
  if (rule === "half_only") return ["left", "right"]
  return ["full", "left", "right"]
}

export function canBlocksFormPair(
  left: BuilderBlock,
  rightType: BuilderBlockType,
): boolean {
  if (!blockAllowsHalfWidth(left.type) || !blockAllowsHalfWidth(rightType)) {
    return false
  }

  const leftColumn = String(left.content.layoutColumn ?? "full")
  if (leftColumn === "right") return false

  if (left.type === "company_logo" && rightType !== "company_address") {
    return false
  }
  if (rightType === "company_address" && left.type !== "company_logo") {
    return false
  }
  if (left.type === "company_address") return false

  return true
}

export function widthLabelForBlock(block: BuilderBlock): "50%" | "100%" {
  return blockIsHalfWidth(block) ? "50%" : "100%"
}

export function defaultLayoutColumnForType(type: BuilderBlockType): LayoutColumn {
  if (blockRequiresFullWidth(type)) return "full"
  if (type === "company_logo" || type === "company_address") return "left"
  return "full"
}
