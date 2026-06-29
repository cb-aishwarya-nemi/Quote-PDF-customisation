import {
  BLOCK_TYPE_LABELS,
  deriveTemplateVariables,
  getBlockFieldDefs,
  getEntitlementRowVariableDef,
  getPricingRowVariableDef,
  getVariableDef,
  isVariableRemoved,
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
  blockId?: string
  blockType?: BuilderBlockType
  field: string
}): string {
  if (input.blockType) return `${input.blockType}:${input.field}`
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

function pushUnmappedMapping(
  list: PdfFieldMapping[],
  seen: Set<string>,
  mappedSlots: Set<string>,
  block: BuilderBlock,
  field: string,
  variableKey: string,
  variableLabel: string,
  category: TemplateVariableCategory,
) {
  const slotKey = mappingSlotKey({ blockType: block.type, field })
  if (mappedSlots.has(slotKey) || seen.has(slotKey)) return
  seen.add(slotKey)

  list.push({
    id: `unmapped:${block.id}:${field}`,
    blockId: block.id,
    blockType: block.type,
    blockLabel: BLOCK_TYPE_LABELS[block.type],
    field,
    variableKey,
    variableLabel,
    category,
    pdfExcerpt: "",
    mappedValue: "",
    status: "unmapped",
    feedback: null,
    source: "ai",
  })
}

function collectUnmappedBlockMappings(
  list: PdfFieldMapping[],
  seen: Set<string>,
  mappedSlots: Set<string>,
  extractedBlock: BuilderBlock,
  mergedBlock: BuilderBlock,
) {
  const block = mergedBlock

  if (
    block.type !== "pricing" &&
    block.type !== "entitlements" &&
    block.type !== "terms"
  ) {
    for (const def of getBlockFieldDefs(block.type)) {
      if (isVariableRemoved(block.content, def.field)) continue
      const resolved = resolveVariableDef(
        block.type,
        def.field,
        block.content,
        def,
      )
      if (!resolved) continue
      const value = formatFieldValue(extractedBlock.content[def.field])
      if (value) continue
      pushUnmappedMapping(
        list,
        seen,
        mappedSlots,
        block,
        def.field,
        resolved.key,
        resolved.label,
        resolved.category,
      )
    }
    return
  }

  if (block.type === "pricing") {
    const rows =
      (extractedBlock.content.rows as {
        item: string
        amount: string
        description?: string
      }[]) ?? []
    rows.forEach((row, index) => {
      const itemField = `rows[${index}].item`
      const amountField = `rows[${index}].amount`
      if (!row.item?.trim() && !isVariableRemoved(block.content, itemField)) {
        const def = getPricingRowVariableDef(index, "item")
        const resolved = resolveVariableDef(
          block.type,
          def.field,
          block.content,
          def,
        )!
        pushUnmappedMapping(
          list,
          seen,
          mappedSlots,
          block,
          def.field,
          resolved.key,
          resolved.label,
          resolved.category,
        )
      }
      if (!row.amount?.trim() && !isVariableRemoved(block.content, amountField)) {
        const def = getPricingRowVariableDef(index, "amount")
        const resolved = resolveVariableDef(
          block.type,
          def.field,
          block.content,
          def,
        )!
        pushUnmappedMapping(
          list,
          seen,
          mappedSlots,
          block,
          def.field,
          resolved.key,
          resolved.label,
          resolved.category,
        )
      }
    })

    const subtotalDef = getBlockFieldDefs("pricing").find(
      (def) => def.field === "subtotal",
    )
    if (
      subtotalDef &&
      !formatFieldValue(extractedBlock.content.subtotal) &&
      !isVariableRemoved(block.content, "subtotal")
    ) {
      const resolved = resolveVariableDef(
        block.type,
        subtotalDef.field,
        block.content,
        subtotalDef,
      )!
      pushUnmappedMapping(
        list,
        seen,
        mappedSlots,
        block,
        subtotalDef.field,
        resolved.key,
        resolved.label,
        resolved.category,
      )
    }
    return
  }

  if (block.type === "entitlements") {
    const rows =
      (extractedBlock.content.rows as {
        name: string
        limit: string
        notes?: string
      }[]) ?? []
    rows.forEach((row, index) => {
      const nameField = `rows[${index}].name`
      const limitField = `rows[${index}].limit`
      if (!row.name?.trim() && !isVariableRemoved(block.content, nameField)) {
        const def = getEntitlementRowVariableDef(index, "name")
        const resolved = resolveVariableDef(
          block.type,
          def.field,
          block.content,
          def,
        )!
        pushUnmappedMapping(
          list,
          seen,
          mappedSlots,
          block,
          def.field,
          resolved.key,
          resolved.label,
          resolved.category,
        )
      }
      if (!row.limit?.trim() && !isVariableRemoved(block.content, limitField)) {
        const def = getEntitlementRowVariableDef(index, "limit")
        const resolved = resolveVariableDef(
          block.type,
          def.field,
          block.content,
          def,
        )!
        pushUnmappedMapping(
          list,
          seen,
          mappedSlots,
          block,
          def.field,
          resolved.key,
          resolved.label,
          resolved.category,
        )
      }
    })
    return
  }

  if (block.type === "terms") {
    const segments = (extractedBlock.content.segments as { text?: string }[]) ?? []
    segments.forEach((segment, index) => {
      if (segment.text?.trim()) return
      pushUnmappedMapping(
        list,
        seen,
        mappedSlots,
        block,
        `segments[${index}].text`,
        "quote.terms_body",
        index === 0 ? "Terms body" : `Terms segment ${index + 1}`,
        "quote",
      )
    })
  }
}

function buildUnmappedMappings(
  extractedTemplate: BuilderTemplate,
  mergedTemplate: BuilderTemplate,
  mappedSlots: Set<string>,
): PdfFieldMapping[] {
  const unmapped: PdfFieldMapping[] = []
  const seen = new Set<string>()

  for (const extractedBlock of extractedTemplate.blocks) {
    const mergedBlock = mergedTemplate.blocks.find(
      (block) => block.type === extractedBlock.type,
    )
    if (!mergedBlock) continue
    collectUnmappedBlockMappings(
      unmapped,
      seen,
      mappedSlots,
      extractedBlock,
      mergedBlock,
    )
  }

  return unmapped
}

const REVIEW_MAPPING_TOTAL = 10
const REVIEW_MAPPED_TARGET = 9
const REVIEW_UNMAPPED_TARGET = 1

export const PDF_MAPPING_REVIEW_TOTAL = REVIEW_MAPPING_TOTAL

/** Fixed mapped slots for the 9/10 review set. */
const MAPPED_REVIEW_SLOTS = [
  "company_details:name",
  "quote_summary_header:quoteNumber",
  "billed_to:name",
  "pricing:rows[0].item",
  "tcv_summary:amount",
  "quote_summary_header:issued",
  "billed_to:address",
  "contract_details:paymentTerms",
  "company_details:address",
]

/** Prefer an unmapped row that still has PDF text for the user to review. */
const UNMAPPED_REVIEW_PRIORITY = [
  "company_details:taxId",
  "billed_to:contact",
  "contract_details:salesperson",
  "company_details:entity",
  "ae_profile:email",
  "billed_to:contactName",
]

function mappingPdfText(mapping: PdfFieldMapping): string {
  return mapping.pdfExcerpt.trim() || mapping.mappedValue.trim()
}

function pickUnmappedReviewSlot(mappings: PdfFieldMapping[]): string {
  const slotKey = (mapping: PdfFieldMapping) =>
    mappingSlotKey({ blockType: mapping.blockType, field: mapping.field })
  const bySlot = new Map(mappings.map((mapping) => [slotKey(mapping), mapping]))

  for (const candidate of UNMAPPED_REVIEW_PRIORITY) {
    const existing = bySlot.get(candidate)
    if (existing && mappingPdfText(existing)) return candidate
  }

  for (const mapping of mappings) {
    if (mapping.status === "unmapped" && mappingPdfText(mapping)) {
      return slotKey(mapping)
    }
  }

  // Use a mapped field that has PDF text — user still needs to confirm the variable.
  for (let index = MAPPED_REVIEW_SLOTS.length - 1; index >= 0; index -= 1) {
    const candidate = MAPPED_REVIEW_SLOTS[index]
    const existing = bySlot.get(candidate)
    if (existing && mappingPdfText(existing)) return candidate
  }

  for (const mapping of mappings) {
    if (mappingPdfText(mapping)) return slotKey(mapping)
  }

  return UNMAPPED_REVIEW_PRIORITY[0]
}

function buildReviewSlotPlan(
  mappings: PdfFieldMapping[],
): { slot: string; role: "mapped" | "unmapped" }[] {
  const slotKey = (mapping: PdfFieldMapping) =>
    mappingSlotKey({ blockType: mapping.blockType, field: mapping.field })
  const unmappedSlot = pickUnmappedReviewSlot(mappings)
  const mappedSlots = MAPPED_REVIEW_SLOTS.filter((slot) => slot !== unmappedSlot)

  while (mappedSlots.length < REVIEW_MAPPED_TARGET) {
    const filler = mappings.find((mapping) => {
      const key = slotKey(mapping)
      return (
        key !== unmappedSlot &&
        !mappedSlots.includes(key) &&
        mapping.status === "mapped" &&
        mappingPdfText(mapping)
      )
    })
    if (!filler) break
    mappedSlots.push(slotKey(filler))
  }

  return [
    ...mappedSlots.map((slot) => ({ slot, role: "mapped" as const })),
    { slot: unmappedSlot, role: "unmapped" },
  ]
}

function resolvePdfExcerptForReviewSlot(
  slot: string,
  mappings: PdfFieldMapping[],
  mergedTemplate: BuilderTemplate,
  fullText: string,
): string {
  const bySlot = new Map(
    mappings.map((mapping) => [
      mappingSlotKey({ blockType: mapping.blockType, field: mapping.field }),
      mapping,
    ]),
  )
  const existing = bySlot.get(slot)
  if (existing) {
    const fromMapping = mappingPdfText(existing)
    if (fromMapping) {
      return (
        existing.pdfExcerpt.trim() ||
        (fullText.trim()
          ? findPdfExcerpt(fullText, existing.mappedValue)
          : existing.mappedValue.trim())
      )
    }
  }

  const { blockType, field } = parseReviewSlot(slot)
  const block = mergedTemplate.blocks.find((entry) => entry.type === blockType)
  if (!block) return ""

  const value = readReviewFieldValue(block, field) ?? ""
  if (!value) return ""

  return fullText.trim() ? findPdfExcerpt(fullText, value) : value
}

function parseReviewSlot(slot: string): { blockType: BuilderBlockType; field: string } {
  const separator = slot.indexOf(":")
  return {
    blockType: slot.slice(0, separator) as BuilderBlockType,
    field: slot.slice(separator + 1),
  }
}

function resolveReviewFieldDef(
  blockType: BuilderBlockType,
  field: string,
): ReturnType<typeof getVariableDef> {
  const rowMatch = field.match(/^rows\[(\d+)\]\.(\w+)$/)
  if (rowMatch) {
    const index = Number(rowMatch[1])
    const part = rowMatch[2]
    if (blockType === "pricing" && (part === "item" || part === "amount")) {
      return getPricingRowVariableDef(index, part)
    }
    if (blockType === "entitlements" && (part === "name" || part === "limit")) {
      return getEntitlementRowVariableDef(index, part as "name" | "limit")
    }
  }

  const segmentMatch = field.match(/^segments\[(\d+)\]\.text$/)
  if (segmentMatch && blockType === "terms") {
    const index = Number(segmentMatch[1])
    return {
      field,
      key: "quote.terms_body",
      label: index === 0 ? "Terms body" : `Terms segment ${index + 1}`,
      category: "quote",
    }
  }

  return getVariableDef(blockType, field)
}

function readReviewFieldValue(
  block: BuilderBlock,
  field: string,
): string | null {
  const rowMatch = field.match(/^rows\[(\d+)\]\.(\w+)$/)
  if (rowMatch) {
    const index = Number(rowMatch[1])
    const key = rowMatch[2]
    const rows = (block.content.rows as Record<string, unknown>[]) ?? []
    return formatFieldValue(rows[index]?.[key])
  }

  const segmentMatch = field.match(/^segments\[(\d+)\]\.text$/)
  if (segmentMatch) {
    const index = Number(segmentMatch[1])
    const segments = (block.content.segments as { text?: string }[]) ?? []
    return formatFieldValue(segments[index]?.text)
  }

  return formatFieldValue(block.content[field])
}

function synthesizeReviewMapping(
  mergedTemplate: BuilderTemplate,
  slot: string,
  role: "mapped" | "unmapped",
  options?: {
    source?: PdfFieldMapping
    mappings?: PdfFieldMapping[]
    fullText?: string
  },
): PdfFieldMapping | null {
  const { source, mappings = [], fullText = "" } = options ?? {}

  if (source) {
    if (role === "unmapped") {
      const demoted = demoteToUnmapped(source)
      if (!demoted.pdfExcerpt.trim()) {
        const excerpt = resolvePdfExcerptForReviewSlot(
          slot,
          mappings,
          mergedTemplate,
          fullText,
        )
        if (excerpt) return { ...demoted, pdfExcerpt: excerpt }
      }
      return demoted
    }
    if (source.status === "mapped") return { ...source, status: "mapped" }
  }

  const { blockType, field } = parseReviewSlot(slot)
  const block = mergedTemplate.blocks.find((entry) => entry.type === blockType)
  if (!block) return null

  const def = resolveReviewFieldDef(blockType, field)
  if (!def) return null

  const resolved = resolveVariableDef(block.type, field, block.content, def)
  if (!resolved) return null

  const value = readReviewFieldValue(block, field) ?? ""
  const mappedValue = role === "mapped" ? value : ""
  const pdfExcerpt = resolvePdfExcerptForReviewSlot(
    slot,
    mappings,
    mergedTemplate,
    fullText,
  )

  return {
    id:
      role === "unmapped"
        ? `unmapped:${block.id}:${field}`
        : `${block.id}:${field}:${resolved.key}`,
    blockId: block.id,
    blockType: block.type,
    blockLabel: BLOCK_TYPE_LABELS[block.type],
    field,
    variableKey: resolved.key,
    variableLabel: resolved.label,
    category: resolved.category,
    pdfExcerpt,
    mappedValue,
    status: role,
    feedback: null,
    source: "ai",
  }
}

function demoteToUnmapped(mapping: PdfFieldMapping): PdfFieldMapping {
  const pdfExcerpt =
    mapping.pdfExcerpt.trim() ||
    mapping.mappedValue.trim()

  return {
    ...mapping,
    status: "unmapped",
    pdfExcerpt,
    mappedValue: "",
    feedback: null,
    source: "ai",
  }
}

/** Always returns exactly 10 review rows: 9 mapped + 1 needing user input. */
export function curatePdfFieldMappingsForReview(
  mappings: PdfFieldMapping[],
  mergedTemplate: BuilderTemplate,
  fullText = "",
): PdfFieldMapping[] {
  if (mappings.length === 0) return mappings

  const slot = (mapping: PdfFieldMapping) =>
    mappingSlotKey({ blockType: mapping.blockType, field: mapping.field })
  const bySlot = new Map(mappings.map((mapping) => [slot(mapping), mapping]))
  const reviewSlotPlan = buildReviewSlotPlan(mappings)

  const curated: PdfFieldMapping[] = []

  for (const plan of reviewSlotPlan) {
    const existing = bySlot.get(plan.slot)
    const entry = synthesizeReviewMapping(
      mergedTemplate,
      plan.slot,
      plan.role,
      { source: existing, mappings, fullText },
    )
    if (entry) curated.push(entry)
  }

  if (curated.length >= REVIEW_MAPPING_TOTAL) {
    return curated.slice(0, REVIEW_MAPPING_TOTAL)
  }

  const usedSlots = new Set(curated.map(slot))
  const fallbackMapped = mappings
    .filter(
      (mapping) =>
        mapping.status === "mapped" && !usedSlots.has(slot(mapping)),
    )
    .slice(0, REVIEW_MAPPED_TARGET - curated.filter((m) => m.status === "mapped").length)

  const withFallback = [...curated, ...fallbackMapped]

  while (
    withFallback.filter((mapping) => mapping.status === "mapped").length <
    REVIEW_MAPPED_TARGET
  ) {
    const nextSlot = MAPPED_REVIEW_SLOTS.find(
      (candidate) =>
        !withFallback.some((mapping) => slot(mapping) === candidate),
    )
    if (!nextSlot) break
    const entry = synthesizeReviewMapping(
      mergedTemplate,
      nextSlot,
      "mapped",
      { mappings, fullText },
    )
    if (!entry) break
    withFallback.push(entry)
  }

  while (
    withFallback.filter((mapping) => mapping.status === "unmapped").length <
    REVIEW_UNMAPPED_TARGET
  ) {
    const existingMapped = [...withFallback]
      .reverse()
      .find(
        (mapping) => mapping.status === "mapped" && mappingPdfText(mapping),
      )
    if (!existingMapped) break
    withFallback.splice(
      withFallback.indexOf(existingMapped),
      1,
      demoteToUnmapped(existingMapped),
    )
  }

  const mapped = withFallback.filter((mapping) => mapping.status === "mapped").slice(0, REVIEW_MAPPED_TARGET)
  const unmapped = withFallback
    .filter((mapping) => mapping.status === "unmapped")
    .slice(0, REVIEW_UNMAPPED_TARGET)

  return [...mapped, ...unmapped].slice(0, REVIEW_MAPPING_TOTAL)
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
  const mappedSlots = new Set(
    mapped.map((mapping) =>
      mappingSlotKey({ blockType: mapping.blockType, field: mapping.field }),
    ),
  )
  const unmapped = buildUnmappedMappings(
    extractedTemplate,
    mergedTemplate,
    mappedSlots,
  )

  const complete = [...mapped, ...unmapped].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "mapped" ? -1 : 1
    }
    const blockOrder =
      mergedTemplate.blocks.findIndex((block) => block.id === a.blockId) -
      mergedTemplate.blocks.findIndex((block) => block.id === b.blockId)
    if (blockOrder !== 0) return blockOrder
    return a.variableLabel.localeCompare(b.variableLabel)
  })

  return curatePdfFieldMappingsForReview(complete, mergedTemplate, fullText)
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
  if (mapping.status === "unmapped" && mapping.source === "ai") {
    return ""
  }

  if (mapping.id.startsWith("unmapped:")) {
    const match = getMappableVariables(template).find(
      (variable) =>
        variable.blockId === mapping.blockId &&
        variable.field === mapping.field &&
        variable.key === mapping.variableKey,
    )
    return match?.id ?? `${mapping.blockId}:${mapping.field}`
  }

  const match = getMappableVariables(template).find(
    (variable) =>
      variable.blockId === mapping.blockId &&
      variable.field === mapping.field &&
      variable.key === mapping.variableKey,
  )
  return match?.id ?? ""
}

export function mappingNeedsUserInput(mapping: PdfFieldMapping): boolean {
  return mapping.status === "unmapped" || mapping.feedback === "down"
}

export function ensurePdfFieldMappingsReviewSet(
  mappings: PdfFieldMapping[],
  template: BuilderTemplate,
): PdfFieldMapping[] {
  if (mappings.length === 0) return mappings
  return curatePdfFieldMappingsForReview(mappings, template)
}

export function summarizeMappingCoverage(mappings: PdfFieldMapping[]): {
  total: number
  mapped: number
  aiMapped: number
  userMapped: number
  needsUserInput: number
  mappedPercent: number
  /** When true, show "N/N mapped" instead of "N/N mapped by AI". */
  showFullyMappedLabel: boolean
} {
  if (mappings.length === 0) {
    return {
      total: 0,
      mapped: 0,
      aiMapped: 0,
      userMapped: 0,
      needsUserInput: 0,
      mappedPercent: 0,
      showFullyMappedLabel: false,
    }
  }

  const total = PDF_MAPPING_REVIEW_TOTAL
  const reviewMappings = mappings.slice(0, total)
  const needsUserInput = reviewMappings.filter(mappingNeedsUserInput).length
  const mapped = total - needsUserInput
  const userMapped = reviewMappings.filter(
    (mapping) => !mappingNeedsUserInput(mapping) && mapping.source === "user",
  ).length
  const aiMapped = mapped - userMapped
  const mappedPercent = Math.round((mapped / total) * 100)
  const showFullyMappedLabel = needsUserInput === 0 && userMapped > 0

  return {
    total,
    mapped,
    aiMapped,
    userMapped,
    needsUserInput,
    mappedPercent,
    showFullyMappedLabel,
  }
}

export function sortMappingsForReview(mappings: PdfFieldMapping[]): PdfFieldMapping[] {
  return [...mappings].sort((a, b) => {
    const aNeeds = mappingNeedsUserInput(a)
    const bNeeds = mappingNeedsUserInput(b)
    if (aNeeds !== bNeeds) return aNeeds ? -1 : 1
    return a.variableLabel.localeCompare(b.variableLabel)
  })
}

export function countReviewedMappings(mappings: PdfFieldMapping[]): {
  reviewed: number
  total: number
  mapped: number
  unmapped: number
} {
  const reviewMappings = mappings.slice(0, PDF_MAPPING_REVIEW_TOTAL)
  const mapped = reviewMappings.filter((m) => m.status === "mapped")
  const unmapped = reviewMappings.filter((m) => m.status === "unmapped")
  const reviewed = reviewMappings.filter(
    (m) =>
      m.feedback === "up" ||
      (m.status === "mapped" && m.mappedValue.trim() && m.source === "user") ||
      (m.status === "unmapped" && m.mappedValue.trim()),
  ).length

  return {
    reviewed,
    total: mappings.length > 0 ? PDF_MAPPING_REVIEW_TOTAL : 0,
    mapped: mapped.length,
    unmapped: unmapped.length,
  }
}
