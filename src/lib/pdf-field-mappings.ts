import {
  BLOCK_TYPE_LABELS,
  deriveTemplateVariables,
  getEntitlementRowVariableDef,
  getPricingRowVariableDef,
  getVariableDef,
  resolveVariableDef,
} from "@/lib/derive-template-variables"
import type {
  BuilderBlock,
  BuilderBlockType,
  BuilderTemplate,
  TemplateVariableCategory,
} from "@/types/prompt-builder"

export type PdfFieldMapping = {
  id: string
  blockId: string
  blockType: BuilderBlockType
  blockLabel: string
  field: string
  variableKey: string
  variableLabel: string
  category: TemplateVariableCategory
  pdfExcerpt: string
  mappedValue: string
}

function excerptAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 28)
  const end = Math.min(text.length, index + length + 28)
  let excerpt = text.slice(start, end).replace(/\s+/g, " ").trim()
  if (start > 0) excerpt = `…${excerpt}`
  if (end < text.length) excerpt = `${excerpt}…`
  return excerpt
}

function findPdfExcerpt(fullText: string, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  const needles = [
    trimmed.slice(0, 72),
    trimmed.split("\n")[0]?.trim().slice(0, 48) ?? "",
  ].filter(Boolean)

  for (const needle of needles) {
    const index = fullText.indexOf(needle)
    if (index >= 0) {
      return excerptAround(fullText, index, needle.length)
    }
  }

  const compact = trimmed.replace(/\s+/g, " ")
  return compact.length > 96 ? `${compact.slice(0, 93)}…` : compact
}

function formatFieldValue(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  return null
}

function pushMapping(
  list: PdfFieldMapping[],
  seen: Set<string>,
  fullText: string,
  block: BuilderBlock,
  field: string,
  variableKey: string,
  variableLabel: string,
  category: TemplateVariableCategory,
  mappedValue: string,
) {
  const dedupeKey = `${block.id}:${field}:${variableKey}`
  if (seen.has(dedupeKey)) return
  seen.add(dedupeKey)

  list.push({
    id: dedupeKey,
    blockId: block.id,
    blockType: block.type,
    blockLabel: BLOCK_TYPE_LABELS[block.type],
    field,
    variableKey,
    variableLabel,
    category,
    pdfExcerpt: findPdfExcerpt(fullText, mappedValue),
    mappedValue,
  })
}

function collectBlockMappings(
  list: PdfFieldMapping[],
  seen: Set<string>,
  fullText: string,
  block: BuilderBlock,
) {
  if (block.type === "pricing" || block.type === "entitlements" || block.type === "terms") {
    // handled below
  } else {
    for (const key of Object.keys(block.content)) {
      if (key === "layoutColumn" || key === "displayCondition") continue
      const def = getVariableDef(block.type, key)
      if (!def) continue
      const resolved = resolveVariableDef(block.type, key, block.content, def)
      if (!resolved) continue
      const value = formatFieldValue(block.content[key])
      if (!value) continue
      pushMapping(
        list,
        seen,
        fullText,
        block,
        key,
        resolved.key,
        resolved.label,
        resolved.category,
        value,
      )
    }
  }

  if (block.type === "pricing") {
    const rows =
      (block.content.rows as { item: string; amount: string; description?: string }[]) ??
      []
    rows.forEach((row, index) => {
      if (row.item?.trim()) {
        const def = getPricingRowVariableDef(index, "item")
        const resolved = resolveVariableDef(block.type, def.field, block.content, def)!
        pushMapping(
          list,
          seen,
          fullText,
          block,
          def.field,
          resolved.key,
          resolved.label,
          resolved.category,
          row.item.trim(),
        )
      }
      if (row.amount?.trim()) {
        const def = getPricingRowVariableDef(index, "amount")
        const resolved = resolveVariableDef(block.type, def.field, block.content, def)!
        pushMapping(
          list,
          seen,
          fullText,
          block,
          def.field,
          resolved.key,
          resolved.label,
          resolved.category,
          row.amount.trim(),
        )
      }
    })
  }

  if (block.type === "entitlements") {
    const rows =
      (block.content.rows as { name: string; limit: string; notes?: string }[]) ?? []
    rows.forEach((row, index) => {
      if (row.name?.trim()) {
        const def = getEntitlementRowVariableDef(index, "name")
        const resolved = resolveVariableDef(block.type, def.field, block.content, def)!
        pushMapping(
          list,
          seen,
          fullText,
          block,
          def.field,
          resolved.key,
          resolved.label,
          resolved.category,
          row.name.trim(),
        )
      }
      if (row.limit?.trim()) {
        const def = getEntitlementRowVariableDef(index, "limit")
        const resolved = resolveVariableDef(block.type, def.field, block.content, def)!
        pushMapping(
          list,
          seen,
          fullText,
          block,
          def.field,
          resolved.key,
          resolved.label,
          resolved.category,
          row.limit.trim(),
        )
      }
    })
  }

  if (block.type === "terms") {
    const segments = (block.content.segments as { text?: string }[]) ?? []
    segments.forEach((segment, index) => {
      const text = segment.text?.trim()
      if (!text) return
      pushMapping(
        list,
        seen,
        fullText,
        block,
        `segments[${index}].text`,
        "quote.terms_body",
        index === 0 ? "Terms body" : `Terms segment ${index + 1}`,
        "quote",
        text.length > 120 ? `${text.slice(0, 117)}…` : text,
      )
    })
  }
}

/** Map extracted template content back to PDF excerpts and merge-variable keys. */
export function derivePdfFieldMappings(
  template: BuilderTemplate,
  fullText: string,
): PdfFieldMapping[] {
  if (!fullText.trim()) {
    return derivePdfFieldMappingsFromVariables(template)
  }

  const mappings: PdfFieldMapping[] = []
  const seen = new Set<string>()

  for (const block of template.blocks) {
    collectBlockMappings(mappings, seen, fullText, block)
  }

  if (mappings.length === 0) {
    return derivePdfFieldMappingsFromVariables(template)
  }

  return mappings.sort((a, b) => {
    const blockOrder =
      template.blocks.findIndex((block) => block.id === a.blockId) -
      template.blocks.findIndex((block) => block.id === b.blockId)
    if (blockOrder !== 0) return blockOrder
    return a.variableLabel.localeCompare(b.variableLabel)
  })
}

function derivePdfFieldMappingsFromVariables(
  template: BuilderTemplate,
): PdfFieldMapping[] {
  return deriveTemplateVariables(template)
    .filter(
      (variable) =>
        variable.category !== "routing" && Boolean(variable.sampleValue?.trim()),
    )
    .map((variable) => ({
      id: variable.id,
      blockId: variable.blockId,
      blockType: variable.blockType,
      blockLabel: variable.blockLabel,
      field: variable.field,
      variableKey: variable.key,
      variableLabel: variable.label,
      category: variable.category,
      pdfExcerpt: variable.sampleValue,
      mappedValue: variable.sampleValue,
    }))
}
