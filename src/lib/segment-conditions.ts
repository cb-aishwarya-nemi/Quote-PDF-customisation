import { createId } from "@/lib/create-id"
import {
  createDefaultRule,
  getConditionField,
  getConditionValueLabel,
  operatorLabel,
} from "@/lib/condition-fields"
import type {
  BlockDisplayCondition,
  ConditionMatchMode,
  ConditionOperator,
  ConditionRuleGroup,
  SegmentCondition,
} from "@/types/prompt-builder"

export type ConditionInput = BlockDisplayCondition

export function normalizeConditionRules(input: ConditionInput): SegmentCondition[] {
  if (!input) return []
  if (Array.isArray(input)) {
    return input.filter((rule) => rule && typeof rule.field === "string" && rule.field)
  }
  if (typeof input === "object") {
    if ("rules" in input && Array.isArray(input.rules)) {
      return input.rules.filter(
        (rule) => rule && typeof rule.field === "string" && rule.field,
      )
    }
    if ("field" in input) return [input]
  }
  return []
}

export function parseConditionInput(input: ConditionInput): {
  match: ConditionMatchMode
  rules: SegmentCondition[]
} {
  const rules = normalizeConditionRules(input)
  let match: ConditionMatchMode = "and"
  if (input && typeof input === "object" && !Array.isArray(input) && "rules" in input) {
    const group = input as ConditionRuleGroup
    match = group.match === "or" ? "or" : "and"
  }
  return { match, rules }
}

export function serializeConditionGroup(
  match: ConditionMatchMode,
  rules: SegmentCondition[],
): BlockDisplayCondition {
  if (rules.length === 0) return null
  if (rules.length === 1) return rules[0]
  return { match, rules }
}

export function hasConditions(input: ConditionInput): boolean {
  return normalizeConditionRules(input).length > 0
}

export function describeConditionRule(rule: SegmentCondition): string {
  const fieldDef = getConditionField(rule.field)
  const fieldLabel = fieldDef?.label ?? rule.field
  const valueLabel = getConditionValueLabel(rule.field, rule.value, rule.label)
  return `${fieldLabel} ${operatorLabel(rule.operator)} ${valueLabel}`
}

export function describeConditionRules(input: ConditionInput): string {
  const { match, rules } = parseConditionInput(input)
  if (rules.length === 0) return "Always shown"
  if (rules.length === 1) return `Show when ${describeConditionRule(rules[0])}`
  const join = match === "or" ? " OR " : " AND "
  return `Show when ${rules.map(describeConditionRule).join(join)}`
}

export function describeConditionRulesShort(input: ConditionInput): string {
  const { match, rules } = parseConditionInput(input)
  if (rules.length === 0) return "Always shown"
  if (rules.length === 1) return describeConditionRule(rules[0])
  const join = match === "or" ? " OR " : " AND "
  return rules.map(describeConditionRule).join(join)
}

export function conditionRulesEqual(a: ConditionInput, b: ConditionInput): boolean {
  const parsedA = parseConditionInput(a)
  const parsedB = parseConditionInput(b)
  if (parsedA.match !== parsedB.match) return false
  if (parsedA.rules.length !== parsedB.rules.length) return false
  return parsedA.rules.every((rule, index) => {
    const other = parsedB.rules[index]
    return (
      rule.field === other.field &&
      rule.operator === other.operator &&
      rule.value === other.value
    )
  })
}

export function createConditionRule(fieldKey?: string): SegmentCondition {
  const defaults = createDefaultRule(fieldKey)
  return {
    id: createId("rule"),
    ...defaults,
  }
}

export function rulesIncludeValue(
  input: ConditionInput,
  field: string,
  value: string,
): boolean {
  return normalizeConditionRules(input).some(
    (rule) => rule.field === field && rule.value === value,
  )
}

export function segmentHasConditionValue(
  condition: ConditionInput,
  field: string,
  value: string,
): boolean {
  return rulesIncludeValue(condition, field, value)
}

function formatNaturalList(items: string[]): string {
  if (items.length === 0) return ""
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} or ${items[1]}`
  return `${items.slice(0, -1).join(", ")}, or ${items[items.length - 1]}`
}

function ruleValueLabel(rule: SegmentCondition): string {
  return getConditionValueLabel(rule.field, rule.value, rule.label)
}

function summarizeFieldOrValues(field: string, values: string[]): string {
  const joined = formatNaturalList(values)
  switch (field) {
    case "deal_type":
      return `${joined} deals`
    case "customer_region":
      return `quotes in ${joined}`
    case "payment_terms":
      return `${joined} payment terms`
    case "item_type":
      return `${joined} items`
    case "frequency":
      return `${joined} billing`
    default: {
      const fieldDef = getConditionField(field)
      const label = (fieldDef?.label ?? field).toLowerCase()
      return values.length === 1 ? `${label} is ${joined}` : `${label} is ${joined}`
    }
  }
}

function summarizePositiveFragment(rule: SegmentCondition): string {
  const value = ruleValueLabel(rule)

  if (rule.operator === "contains") {
    if (rule.field === "item_name") return `items containing "${value}"`
    const fieldDef = getConditionField(rule.field)
    return `${(fieldDef?.label ?? rule.field).toLowerCase()} contains ${value}`
  }

  switch (rule.field) {
    case "deal_type":
      return `${value} deals`
    case "customer_region":
      return value
    case "payment_terms":
      return `${value} payment`
    case "item_type":
      return `${value} items`
    case "frequency":
      return `${value} billing`
    case "metered":
      return value === "Yes" ? "metered usage" : "non-metered usage"
    case "quantity":
      return `quantity ${value}`
    case "item_name":
      return `${value} items`
    default: {
      const fieldDef = getConditionField(rule.field)
      return `${(fieldDef?.label ?? rule.field).toLowerCase()} is ${value}`
    }
  }
}

function summarizeNegativeFragment(rule: SegmentCondition): string {
  const value = ruleValueLabel(rule)
  switch (rule.field) {
    case "deal_type":
      return `non-${value.toLowerCase()} deals`
    case "customer_region":
      return `quotes outside ${value}`
    case "payment_terms":
      return `non-${value.toLowerCase()} payment`
    default: {
      const fieldDef = getConditionField(rule.field)
      return `${(fieldDef?.label ?? rule.field).toLowerCase()} isn't ${value}`
    }
  }
}

function summarizeAndRules(rules: SegmentCondition[]): string {
  const dealRules = rules.filter((r) => r.field === "deal_type" && r.operator === "is")
  const regionRules = rules.filter(
    (r) => r.field === "customer_region" && r.operator === "is",
  )
  const paymentRules = rules.filter(
    (r) => r.field === "payment_terms" && r.operator === "is",
  )
  const consumed = new Set([...dealRules, ...regionRules, ...paymentRules])
  const remaining = rules.filter((rule) => !consumed.has(rule))

  const parts: string[] = []

  if (dealRules.length === 1) {
    parts.push(summarizePositiveFragment(dealRules[0]))
  } else if (dealRules.length > 1) {
    parts.push(
      summarizeFieldOrValues(
        "deal_type",
        dealRules.map((rule) => ruleValueLabel(rule)),
      ),
    )
  }

  if (regionRules.length === 1) {
    const region = ruleValueLabel(regionRules[0])
    if (parts.length > 0 && parts[0].endsWith(" deals")) {
      parts[0] = `${parts[0]} in ${region}`
    } else {
      parts.push(`quotes in ${region}`)
    }
  } else if (regionRules.length > 1) {
    parts.push(
      summarizeFieldOrValues(
        "customer_region",
        regionRules.map((rule) => ruleValueLabel(rule)),
      ),
    )
  }

  if (paymentRules.length === 1) {
    const payment = summarizePositiveFragment(paymentRules[0])
    if (parts.length > 0) {
      parts[0] = `${parts[0]} with ${payment}`
    } else {
      parts.push(`quotes with ${payment}`)
    }
  } else if (paymentRules.length > 1) {
    parts.push(
      summarizeFieldOrValues(
        "payment_terms",
        paymentRules.map((rule) => ruleValueLabel(rule)),
      ),
    )
  }

  for (const rule of remaining) {
    if (rule.operator === "is_not") {
      parts.push(summarizeNegativeFragment(rule))
    } else {
      parts.push(summarizePositiveFragment(rule))
    }
  }

  if (parts.length === 0) {
    return rules
      .map((rule) =>
        rule.operator === "is_not"
          ? summarizeNegativeFragment(rule)
          : summarizePositiveFragment(rule),
      )
      .join(" and ")
  }

  return parts.join(" and ")
}

/** One-line natural-language summary for quote-level template routing rules. */
export function summarizeQuoteLevelConditions(input: ConditionInput): string {
  const { match, rules } = parseConditionInput(input)
  if (rules.length === 0) return "Used for all quotes."

  if (rules.length === 1) {
    const rule = rules[0]
    if (rule.operator === "is_not") {
      return `Used for ${summarizeNegativeFragment(rule)}.`
    }
    return `Used for ${summarizePositiveFragment(rule)}.`
  }

  if (match === "or") {
    const sameField = rules.every(
      (rule) => rule.field === rules[0].field && rule.operator === "is",
    )
    if (sameField) {
      return `Used for ${summarizeFieldOrValues(
        rules[0].field,
        rules.map((rule) => ruleValueLabel(rule)),
      )}.`
    }

    const fragments = rules.map((rule) =>
      rule.operator === "is_not"
        ? summarizeNegativeFragment(rule)
        : summarizePositiveFragment(rule),
    )
    return `Used for ${formatNaturalList(fragments)}.`
  }

  return `Used for ${summarizeAndRules(rules)}.`
}

/** @deprecated use describeConditionRules */
export function describeSegmentCondition(condition: SegmentCondition | null): string {
  if (!condition) return "Always shown"
  return `Show when ${describeConditionRule(condition)}`
}

/** @deprecated use normalizeConditionRules */
export type SegmentConditionPreset = SegmentCondition | null

/** @deprecated use conditionRulesEqual */
export function segmentConditionEquals(
  a: SegmentConditionPreset | SegmentCondition[],
  b: SegmentConditionPreset | SegmentCondition[],
): boolean {
  return conditionRulesEqual(a, b)
}

export { operatorLabel as formatOperator }

export function patchRuleField(
  rule: SegmentCondition,
  fieldKey: string,
): SegmentCondition {
  const def = getConditionField(fieldKey)
  if (!def) return { ...rule, field: fieldKey }
  const firstValue = def.values[0]
  return {
    ...rule,
    field: def.field,
    operator: def.operators[0] as ConditionOperator,
    value: firstValue?.value ?? "",
    label: firstValue?.label,
  }
}
