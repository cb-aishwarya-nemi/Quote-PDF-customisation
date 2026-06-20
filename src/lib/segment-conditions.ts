import { createId } from "@/lib/create-id"
import {
  createDefaultRule,
  getConditionField,
  getConditionValueLabel,
  operatorLabel,
} from "@/lib/condition-fields"
import type { ConditionOperator, SegmentCondition } from "@/types/prompt-builder"

export type ConditionInput = SegmentCondition | SegmentCondition[] | null | undefined

export function normalizeConditionRules(input: ConditionInput): SegmentCondition[] {
  if (!input) return []
  if (Array.isArray(input)) {
    return input.filter((rule) => rule && typeof rule.field === "string" && rule.field)
  }
  if (typeof input === "object" && "field" in input) return [input]
  return []
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
  const rules = normalizeConditionRules(input)
  if (rules.length === 0) return "Always shown"
  if (rules.length === 1) return `Show when ${describeConditionRule(rules[0])}`
  return `Show when ${rules.map(describeConditionRule).join(" AND ")}`
}

export function describeConditionRulesShort(input: ConditionInput): string {
  const rules = normalizeConditionRules(input)
  if (rules.length === 0) return "Always shown"
  return rules.map(describeConditionRule).join(" · ")
}

export function conditionRulesEqual(a: ConditionInput, b: ConditionInput): boolean {
  const rulesA = normalizeConditionRules(a)
  const rulesB = normalizeConditionRules(b)
  if (rulesA.length !== rulesB.length) return false
  return rulesA.every((rule, index) => {
    const other = rulesB[index]
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
