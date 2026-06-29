import type { PreviewCustomer } from "@/data/preview-customers"
import { normalizeVariableKey } from "@/lib/derive-template-variables"
import type { BuilderBlockType } from "@/types/prompt-builder"

export function resolvePreviewCustomerFieldValue(
  customer: PreviewCustomer | null | undefined,
  blockType: BuilderBlockType,
  field: string,
  variableKey?: string,
): string | undefined {
  if (!customer) return undefined

  const rowMatch = field.match(/^rows\[(\d+)\]\.(\w+)$/)
  if (rowMatch) {
    const index = Number(rowMatch[1])
    const part = rowMatch[2]

    if (blockType === "pricing") {
      const row = customer.pricingRows[index]
      if (!row) return undefined
      if (part === "item") return row.item
      if (part === "amount") return row.amount
      if (part === "description") return row.description
    }

    if (blockType === "entitlements") {
      const row = customer.entitlementRows[index]
      if (!row) return undefined
      if (part === "name") return row.name
      if (part === "limit") return row.limit
      if (part === "notes") return row.notes
    }
  }

  if (variableKey) {
    const normalized = normalizeVariableKey(variableKey)
    const value = customer.values[normalized]?.trim()
    if (value) return value
  }

  return undefined
}

export function resolvePreviewCustomerDisplayValue(
  customer: PreviewCustomer | null | undefined,
  blockType: BuilderBlockType,
  field: string,
  variableKey: string | undefined,
  templateValue: string,
  fallback = "",
): string {
  const customerValue = resolvePreviewCustomerFieldValue(
    customer,
    blockType,
    field,
    variableKey,
  )
  if (customerValue?.trim()) return customerValue

  const trimmedTemplate = templateValue.trim()
  if (trimmedTemplate) return trimmedTemplate

  const trimmedFallback = fallback.trim()
  if (trimmedFallback) return trimmedFallback

  return ""
}
