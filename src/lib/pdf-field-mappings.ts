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
  TemplateVariable,
  TemplateVariableCategory,
} from "@/types/prompt-builder"

export type PdfMappingFeedback = "up" | "down" | null
export type PdfMappingSource = "ai" | "user"
export type PdfMappingStatus = "mapped" | "unmapped"

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
  status: PdfMappingStatus
  feedback: PdfMappingFeedback
  source: PdfMappingSource
}

export function mappingSlotKey(input: {
  blockId: string
  field: string
}): string {
  return `${input.blockId}:${input.field}`
}

export function normalizePdfFieldMapping(
  mapping: PdfFieldMapping,
): PdfFieldMapping {
  return {
    ...mapping,
    status: mapping.status ?? (mapping.mappedValue?.trim() ? "mapped" : "unmapped"),
    feedback: mapping.feedback ?? null,
    source: mapping.source ?? "ai",
  }
}

export function getMappableVariables(template: BuilderTemplate): TemplateVariable[] {
  return deriveTemplateVariables(template).filter(
    (variable) => variable.category !== "routing",
  )
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
    status: "mapped",
    feedback: null,
    source: "ai",
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
      status: "mapped" as const,
      feedback: null,
      source: "ai" as const,
    }))
}

function buildUnmappedMappings(
  template: BuilderTemplate,
  mappedSlots: Set<string>,
): PdfFieldMapping[] {
  return getMappableVariables(template)
    .filter((variable) => !mappedSlots.has(mappingSlotKey(variable)))
    .map((variable) => ({
      id: `unmapped:${variable.id}`,
      blockId: variable.blockId,
      blockType: variable.blockType,
      blockLabel: variable.blockLabel,
      field: variable.field,
      variableKey: variable.key,
      variableLabel: variable.label,
      category: variable.category,
      pdfExcerpt: "",
      mappedValue: "",
      status: "unmapped" as const,
      feedback: null,
      source: "ai" as const,
    }))
}

/** AI-mapped fields plus template variables the AI could not match to PDF text. */
export function buildCompletePdfFieldMappings(
  extractedTemplate: BuilderTemplate,
  mergedTemplate: BuilderTemplate,
  fullText: string,
): PdfFieldMapping[] {
  const mapped = derivePdfFieldMappings(extractedTemplate, fullText).map(
    normalizePdfFieldMapping,
  )
  const mappedSlots = new Set(mapped.map((mapping) => mappingSlotKey(mapping)))
  const unmapped = buildUnmappedMappings(mergedTemplate, mappedSlots)

  return [...mapped, ...unmapped].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "mapped" ? -1 : 1
    }
    const blockOrder =
      mergedTemplate.blocks.findIndex((block) => block.id === a.blockId) -
      mergedTemplate.blocks.findIndex((block) => block.id === b.blockId)
    if (blockOrder !== 0) return blockOrder
    return a.variableLabel.localeCompare(b.variableLabel)
  })
}

export function applyFieldValueToContent(
  content: Record<string, unknown>,
  field: string,
  value: string,
): Record<string, unknown> {
  const rowMatch = field.match(/^rows\[(\d+)\]\.(\w+)$/)
  if (rowMatch) {
    const index = Number(rowMatch[1])
    const key = rowMatch[2]
    const rows = [...((content.rows as Record<string, unknown>[]) ?? [])]
    while (rows.length <= index) rows.push({})
    rows[index] = { ...rows[index], [key]: value }
    return { ...content, rows }
  }

  const segmentMatch = field.match(/^segments\[(\d+)\]\.(\w+)$/)
  if (segmentMatch) {
    const index = Number(segmentMatch[1])
    const key = segmentMatch[2]
    const segments = [...((content.segments as Record<string, unknown>[]) ?? [])]
    while (segments.length <= index) segments.push({})
    segments[index] = { ...segments[index], [key]: value }
    return { ...content, segments }
  }

  return { ...content, [field]: value }
}

export function applyPdfMappingToTemplate(
  template: BuilderTemplate,
  mapping: PdfFieldMapping,
): BuilderTemplate {
  const value = mapping.mappedValue.trim()
  if (!value) return template

  const patchBlock = (block: BuilderBlock): BuilderBlock => {
    if (block.id !== mapping.blockId) return block
    return {
      ...block,
      content: applyFieldValueToContent(block.content, mapping.field, value),
    }
  }

  return {
    ...template,
    blocks: template.blocks.map(patchBlock),
    customPages: template.customPages?.map((page) => ({
      ...page,
      blocks: page.blocks?.map(patchBlock),
    })),
  }
}

export function resolveMappingVariableId(
  template: BuilderTemplate,
  mapping: PdfFieldMapping,
): string {
  if (mapping.id.startsWith("unmapped:")) {
    return mapping.id.slice("unmapped:".length)
  }

  const match = getMappableVariables(template).find(
    (variable) =>
      variable.blockId === mapping.blockId &&
      variable.field === mapping.field &&
      variable.key === mapping.variableKey,
  )
  return match?.id ?? ""
}

export function countReviewedMappings(mappings: PdfFieldMapping[]): {
  reviewed: number
  total: number
  mapped: number
  unmapped: number
} {
  const mapped = mappings.filter((m) => m.status === "mapped")
  const unmapped = mappings.filter((m) => m.status === "unmapped")
  const reviewed = mappings.filter(
    (m) =>
      m.feedback === "up" ||
      (m.status === "mapped" && m.mappedValue.trim() && m.source === "user") ||
      (m.status === "unmapped" && m.mappedValue.trim()),
  ).length

  return {
    reviewed,
    total: mappings.length,
    mapped: mapped.length,
    unmapped: unmapped.length,
  }
}
