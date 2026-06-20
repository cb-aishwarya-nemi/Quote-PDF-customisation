import { describeConditionRule, normalizeConditionRules } from "@/lib/segment-conditions"
import type {
  BuilderBlockType,
  BuilderTemplate,
  ConditionalSegment,
  TemplateVariable,
  TemplateVariableCategory,
} from "@/types/prompt-builder"

type FieldDef = {
  field: string
  key: string
  label: string
  category: TemplateVariableCategory
}

export type { FieldDef as VariableFieldDef }

const BLOCK_FIELD_DEFS: Partial<Record<BuilderBlockType, FieldDef[]>> = {
  quote_summary_header: [
    { field: "quoteNumber", key: "quote.number", label: "Quote #", category: "quote" },
    { field: "issued", key: "quote.issued_date", label: "Issued date", category: "quote" },
    {
      field: "validUntil",
      key: "quote.valid_until",
      label: "Valid until",
      category: "quote",
    },
    {
      field: "customerName",
      key: "customer.name",
      label: "Prepared for",
      category: "customer",
    },
  ],
  tcv_summary: [
    { field: "amount", key: "quote.tcv_amount", label: "TCV amount", category: "quote" },
    { field: "subtitle", key: "quote.tcv_term", label: "TCV term label", category: "quote" },
    { field: "oneTime", key: "quote.one_time_fees", label: "One-time fees", category: "pricing" },
    {
      field: "recurring",
      key: "quote.recurring_amount",
      label: "Recurring amount",
      category: "pricing",
    },
    {
      field: "termMonths",
      key: "contract.term_months",
      label: "Term (months)",
      category: "contract",
    },
  ],
  billed_to: [
    {
      field: "name",
      key: "customer.billing_name",
      label: "Billed to — company",
      category: "customer",
    },
    {
      field: "contactName",
      key: "customer.contact_name",
      label: "Billed to — contact",
      category: "customer",
    },
    { field: "contact", key: "customer.email", label: "Billing email", category: "customer" },
    {
      field: "address",
      key: "customer.billing_address",
      label: "Billing address",
      category: "customer",
    },
  ],
  contract_details: [
    { field: "term", key: "contract.term", label: "Contract term", category: "contract" },
    {
      field: "startDate",
      key: "contract.start_date",
      label: "Start date",
      category: "contract",
    },
    {
      field: "billingCycle",
      key: "contract.billing_cycle",
      label: "Billing cycle",
      category: "contract",
    },
    {
      field: "paymentTerms",
      key: "contract.payment_terms",
      label: "Payment terms",
      category: "contract",
    },
    {
      field: "salesperson",
      key: "quote.salesperson",
      label: "Sales contact",
      category: "people",
    },
  ],
  pricing: [
    { field: "subtotal", key: "quote.subtotal", label: "Subtotal", category: "pricing" },
  ],
  entitlements: [
    {
      field: "label",
      key: "quote.entitlements_label",
      label: "Section label",
      category: "quote",
    },
  ],
  ae_profile: [
    { field: "name", key: "ae.name", label: "AE name", category: "people" },
    { field: "title", key: "ae.title", label: "AE title", category: "people" },
    { field: "email", key: "ae.email", label: "AE email", category: "people" },
    { field: "phone", key: "ae.phone", label: "AE phone", category: "people" },
  ],
}

function formatSample(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value.trim()
  return String(value)
}

const BLOCK_TYPE_LABELS: Record<BuilderBlockType, string> = {
  quote_summary_header: "Quote summary",
  tcv_summary: "TCV summary",
  billed_to: "Billed to",
  contract_details: "Contract details",
  pricing: "Pricing table",
  entitlements: "Entitlements",
  terms: "Terms & conditions",
  custom_text: "Custom text",
  custom_table: "Custom table",
  custom_image: "Image",
  signature: "Signature",
  ae_profile: "AE profile",
}

export function getVariableDef(
  blockType: BuilderBlockType,
  field: string,
): FieldDef | undefined {
  return BLOCK_FIELD_DEFS[blockType]?.find((d) => d.field === field)
}

export function getPricingRowVariableDef(
  index: number,
  part: "item" | "amount" | "description",
): FieldDef {
  if (part === "item") {
    return {
      field: `rows[${index}].item`,
      key: `quote.line_items[${index}].name`,
      label: `Line item ${index + 1}`,
      category: "pricing",
    }
  }
  if (part === "description") {
    return {
      field: `rows[${index}].description`,
      key: `quote.line_items[${index}].description`,
      label: `Line item ${index + 1} description`,
      category: "pricing",
    }
  }
  return {
    field: `rows[${index}].amount`,
    key: `quote.line_items[${index}].amount`,
    label: `Line item ${index + 1} amount`,
    category: "pricing",
  }
}

export function getCustomTextVariableDef(blockId: string): FieldDef {
  return {
    field: "text",
    key: `custom.${blockId}.text`,
    label: "Custom text",
    category: "custom",
  }
}

const CATEGORY_ORDER: TemplateVariableCategory[] = [
  "quote",
  "customer",
  "contract",
  "pricing",
  "people",
  "routing",
  "custom",
]

function categoryFromKey(key: string): TemplateVariableCategory {
  if (key.startsWith("customer.")) return "customer"
  if (key.startsWith("contract.")) return "contract"
  if (key.startsWith("ae.")) return "people"
  if (key.startsWith("custom.")) return "custom"
  if (key.startsWith("deal.")) return "routing"
  if (key.includes("line_items")) return "pricing"
  return "quote"
}

export type VariableCatalogEntry = {
  key: string
  label: string
  category: TemplateVariableCategory
}

export function getVariableCatalog(): VariableCatalogEntry[] {
  const seen = new Set<string>()
  const list: VariableCatalogEntry[] = []

  for (const defs of Object.values(BLOCK_FIELD_DEFS)) {
    for (const def of defs ?? []) {
      if (seen.has(def.key)) continue
      seen.add(def.key)
      list.push({ key: def.key, label: def.label, category: def.category })
    }
  }

  for (let i = 0; i < 8; i++) {
    const nameKey = `quote.line_items[${i}].name`
    const amountKey = `quote.line_items[${i}].amount`
    const descriptionKey = `quote.line_items[${i}].description`
    if (!seen.has(nameKey)) {
      seen.add(nameKey)
      list.push({ key: nameKey, label: `Line item ${i + 1}`, category: "pricing" })
    }
    if (!seen.has(amountKey)) {
      seen.add(amountKey)
      list.push({
        key: amountKey,
        label: `Line item ${i + 1} amount`,
        category: "pricing",
      })
    }
    if (!seen.has(descriptionKey)) {
      seen.add(descriptionKey)
      list.push({
        key: descriptionKey,
        label: `Line item ${i + 1} description`,
        category: "pricing",
      })
    }
  }

  return list.sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category)
    const bi = CATEGORY_ORDER.indexOf(b.category)
    if (ai !== bi) return ai - bi
    return a.label.localeCompare(b.label)
  })
}

export function getVariableKeyOverrides(
  content: Record<string, unknown>,
): Record<string, string> {
  const raw = content.variableKeys
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
    ),
  )
}

export function getVariableFallbacks(
  content: Record<string, unknown>,
): Record<string, string> {
  const raw = content.variableFallbacks
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  )
}

export function getVariableFallback(
  content: Record<string, unknown>,
  field: string,
): string {
  return getVariableFallbacks(content)[field] ?? ""
}

export function isVariableRemoved(
  content: Record<string, unknown>,
  field: string,
): boolean {
  const raw = content.variableRemoved
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false
  return Boolean((raw as Record<string, unknown>)[field])
}

export function resolveVariableDisplayValue(
  value: string,
  content: Record<string, unknown>,
  field: string,
): string {
  const trimmed = value.trim()
  if (trimmed) return trimmed
  const fallback = getVariableFallback(content, field).trim()
  if (fallback) return fallback
  return ""
}

export function resolveVariableDef(
  blockType: BuilderBlockType,
  field: string,
  content: Record<string, unknown>,
  variableDef?: FieldDef,
): FieldDef | undefined {
  const base = variableDef ?? getVariableDef(blockType, field)
  if (!base) return variableDef

  const overrideKey = getVariableKeyOverrides(content)[field]
  if (!overrideKey || overrideKey === base.key) return base

  const catalogEntry = getVariableCatalog().find((entry) => entry.key === overrideKey)
  if (catalogEntry) {
    return {
      ...base,
      key: catalogEntry.key,
      label: catalogEntry.label,
      category: catalogEntry.category,
    }
  }

  return {
    ...base,
    key: overrideKey,
    label: overrideKey,
    category: categoryFromKey(overrideKey),
  }
}

function pushUnique(
  list: TemplateVariable[],
  seen: Set<string>,
  variable: TemplateVariable,
) {
  if (seen.has(variable.key)) return
  seen.add(variable.key)
  list.push(variable)
}

export function deriveTemplateVariables(
  template: BuilderTemplate | null,
): TemplateVariable[] {
  if (!template) return []

  const variables: TemplateVariable[] = []
  const seen = new Set<string>()

  for (const block of template.blocks) {
    const blockLabel = BLOCK_TYPE_LABELS[block.type]
    const defs = BLOCK_FIELD_DEFS[block.type] ?? []

    for (const def of defs) {
      if (isVariableRemoved(block.content, def.field)) continue
      const resolved = resolveVariableDef(block.type, def.field, block.content, def)
      if (!resolved) continue
      const raw = block.content[def.field]
      const sample = formatSample(raw)
      if (!sample) continue

      pushUnique(variables, seen, {
        id: `${block.id}:${def.field}`,
        key: resolved.key,
        label: resolved.label,
        category: resolved.category,
        blockId: block.id,
        blockType: block.type,
        blockLabel,
        field: def.field,
        sampleValue: sample,
      })
    }

    if (block.type === "pricing") {
      const rows =
        (block.content.rows as {
          item: string
          amount: string
          description?: string
        }[]) ?? []
      rows.forEach((row, index) => {
        const itemField = `rows[${index}].item`
        const amountField = `rows[${index}].amount`
        const descriptionField = `rows[${index}].description`
        if (row.item && !isVariableRemoved(block.content, itemField)) {
          const baseDef = getPricingRowVariableDef(index, "item")
          const resolved = resolveVariableDef(
            block.type,
            baseDef.field,
            block.content,
            baseDef,
          )!
          pushUnique(variables, seen, {
            id: `${block.id}:row-${index}-item`,
            key: resolved.key,
            label: resolved.label,
            category: resolved.category,
            blockId: block.id,
            blockType: block.type,
            blockLabel,
            field: baseDef.field,
            sampleValue: row.item,
          })
        }
        if (row.amount && !isVariableRemoved(block.content, amountField)) {
          const baseDef = getPricingRowVariableDef(index, "amount")
          const resolved = resolveVariableDef(
            block.type,
            baseDef.field,
            block.content,
            baseDef,
          )!
          pushUnique(variables, seen, {
            id: `${block.id}:row-${index}-amount`,
            key: resolved.key,
            label: resolved.label,
            category: resolved.category,
            blockId: block.id,
            blockType: block.type,
            blockLabel,
            field: baseDef.field,
            sampleValue: row.amount,
          })
        }
        if (
          row.description &&
          !isVariableRemoved(block.content, descriptionField)
        ) {
          const baseDef = getPricingRowVariableDef(index, "description")
          const resolved = resolveVariableDef(
            block.type,
            baseDef.field,
            block.content,
            baseDef,
          )!
          pushUnique(variables, seen, {
            id: `${block.id}:row-${index}-description`,
            key: resolved.key,
            label: resolved.label,
            category: resolved.category,
            blockId: block.id,
            blockType: block.type,
            blockLabel,
            field: baseDef.field,
            sampleValue: row.description,
          })
        }
      })
    }

    const displayRules = normalizeConditionRules(
      block.content.displayCondition as Parameters<typeof normalizeConditionRules>[0],
    )
    displayRules.forEach((rule, ruleIndex) => {
      pushUnique(variables, seen, {
        id: `${block.id}:condition-${ruleIndex}`,
        key: `deal.${rule.field}`,
        label: `Condition — ${describeConditionRule(rule)}`,
        category: "routing",
        blockId: block.id,
        blockType: block.type,
        blockLabel,
        field: `displayCondition[${ruleIndex}]`,
        sampleValue: `${rule.field} ${rule.operator} ${rule.value}`,
      })
    })

    if (block.type === "terms") {
      const segments = (block.content.segments as ConditionalSegment[]) ?? []
      segments.forEach((seg, index) => {
        normalizeConditionRules(seg.condition).forEach((rule, ruleIndex) => {
          pushUnique(variables, seen, {
            id: `${block.id}:seg-${seg.id}-condition-${ruleIndex}`,
            key: `deal.${rule.field}`,
            label: `T&C segment ${index + 1} — ${describeConditionRule(rule)}`,
            category: "routing",
            blockId: block.id,
            blockType: block.type,
            blockLabel,
            field: `segments[${index}].condition[${ruleIndex}]`,
            sampleValue: `${rule.field} ${rule.operator} ${rule.value}`,
          })
        })
      })
    }

    if (block.type === "custom_text" && block.content.text) {
      if (isVariableRemoved(block.content, "text")) continue
      const baseDef = getCustomTextVariableDef(block.id)
      const resolved = resolveVariableDef(block.type, "text", block.content, baseDef)!
      pushUnique(variables, seen, {
        id: `${block.id}:text`,
        key: resolved.key,
        label: resolved.label,
        category: resolved.category,
        blockId: block.id,
        blockType: block.type,
        blockLabel,
        field: "text",
        sampleValue: formatSample(block.content.text),
      })
    }
  }

  const categoryOrder: TemplateVariableCategory[] = [
    "quote",
    "customer",
    "contract",
    "pricing",
    "people",
    "routing",
    "custom",
  ]

  return variables.sort((a, b) => {
    const ai = categoryOrder.indexOf(a.category)
    const bi = categoryOrder.indexOf(b.category)
    if (ai !== bi) return ai - bi
    return a.label.localeCompare(b.label)
  })
}

export function buildVariablesWelcomeMessage(
  template: BuilderTemplate,
): string {
  const variables = deriveTemplateVariables(template)
  const count = variables.length
  if (count === 0) {
    return "I can help refine this quote template. Add blocks and I'll identify merge variables automatically."
  }

  const highlights = variables
    .filter((v) => v.category === "quote" || v.category === "customer")
    .slice(0, 4)
    .map((v) => v.label)
    .join(", ")

  return `I've scanned your template and identified ${count} variables that will be populated from quote and customer data at send time${highlights ? ` — including ${highlights}` : ""}. See the list above. Ask me to explain any variable or add conditions.`
}

export function formatVariablesListReply(
  template: BuilderTemplate | null,
): string {
  const variables = deriveTemplateVariables(template)
  if (variables.length === 0) {
    return "No variables detected yet. Add standard blocks like Quote summary or Billed to and I'll map the fields automatically."
  }

  const byCategory = variables.reduce(
    (acc, v) => {
      if (!acc[v.category]) acc[v.category] = []
      acc[v.category].push(v)
      return acc
    },
    {} as Record<string, TemplateVariable[]>,
  )

  const categoryLabels: Record<TemplateVariableCategory, string> = {
    quote: "Quote",
    customer: "Customer",
    contract: "Contract",
    pricing: "Pricing",
    people: "People",
    routing: "Routing / conditions",
    custom: "Custom",
  }

  const lines = Object.entries(byCategory).map(([cat, vars]) => {
    const heading = categoryLabels[cat as TemplateVariableCategory] ?? cat
    const items = vars
      .map((v) => `• ${v.label} ({{${v.key}}}) — e.g. "${v.sampleValue}"`)
      .join("\n")
    return `${heading}\n${items}`
  })

  return `Here are the ${variables.length} variables I found in your template:\n\n${lines.join("\n\n")}`
}

export { BLOCK_TYPE_LABELS }
