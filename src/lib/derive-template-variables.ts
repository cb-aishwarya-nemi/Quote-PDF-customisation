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
  part: "item" | "amount",
): FieldDef {
  if (part === "item") {
    return {
      field: `rows[${index}].item`,
      key: `quote.line_items[${index}].name`,
      label: `Line item ${index + 1}`,
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
      const raw = block.content[def.field]
      const sample = formatSample(raw)
      if (!sample) continue

      pushUnique(variables, seen, {
        id: `${block.id}:${def.field}`,
        key: def.key,
        label: def.label,
        category: def.category,
        blockId: block.id,
        blockType: block.type,
        blockLabel,
        field: def.field,
        sampleValue: sample,
      })
    }

    if (block.type === "pricing") {
      const rows = (block.content.rows as { item: string; amount: string }[]) ?? []
      rows.forEach((row, index) => {
        if (row.item) {
          pushUnique(variables, seen, {
            id: `${block.id}:row-${index}-item`,
            key: `quote.line_items[${index}].name`,
            label: `Line item ${index + 1}`,
            category: "pricing",
            blockId: block.id,
            blockType: block.type,
            blockLabel,
            field: `rows[${index}].item`,
            sampleValue: row.item,
          })
        }
        if (row.amount) {
          pushUnique(variables, seen, {
            id: `${block.id}:row-${index}-amount`,
            key: `quote.line_items[${index}].amount`,
            label: `Line item ${index + 1} amount`,
            category: "pricing",
            blockId: block.id,
            blockType: block.type,
            blockLabel,
            field: `rows[${index}].amount`,
            sampleValue: row.amount,
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
      pushUnique(variables, seen, {
        id: `${block.id}:text`,
        key: `custom.${block.id}.text`,
        label: "Custom text",
        category: "custom",
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
