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
