export type TemplateVariableCategory =
  | "quote"
  | "customer"
  | "contract"
  | "pricing"
  | "people"
  | "routing"
  | "custom"

export type TemplateVariable = {
  id: string
  key: string
  label: string
  category: TemplateVariableCategory
  blockId: string
  blockType: BuilderBlockType
  blockLabel: string
  field: string
  sampleValue: string
}

export type BuilderBlockType =
  | "quote_summary_header"
  | "tcv_summary"
  | "billed_to"
  | "contract_details"
  | "pricing"
  | "entitlements"
  | "terms"
  | "custom_text"
  | "custom_table"
  | "custom_image"
  | "signature"
  | "ae_profile"

export type ConditionOperator = "is" | "is_not" | "contains"

export type SegmentCondition = {
  id?: string
  field: string
  operator: ConditionOperator
  value: string
  label?: string
}

/** Empty array or null = always show. Multiple rules are combined with AND. */
export type ConditionRuleSet = SegmentCondition[]

/** Block-level display condition — hide block when scenario doesn't match */
export type BlockDisplayCondition = ConditionRuleSet | SegmentCondition | null

export type ConditionalSegment = {
  id: string
  condition: BlockDisplayCondition
  text: string
}

export type BuilderBlock = {
  id: string
  type: BuilderBlockType
  order: number
  content: Record<string, unknown>
}

export type BuilderTemplate = {
  id: string
  name: string
  variantId?: string
  presetId?: string
  /** When set, template only applies to quotes matching these rules */
  displayCondition?: BlockDisplayCondition
  blocks: BuilderBlock[]
}

export type PreviewScenario = {
  id: string
  label: string
  values: Record<string, string>
}

export type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export type DealType = "new_business" | "expansion" | "amendment" | "termination"

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  new_business: "New business",
  expansion: "Expansion",
  amendment: "Amendment",
  termination: "Termination",
}

export type PreviewScenarioGroup = {
  id: DealType
  label: string
  scenarios: PreviewScenario[]
}

export const PREVIEW_SCENARIO_GROUPS: PreviewScenarioGroup[] = [
  {
    id: "new_business",
    label: "New business",
    scenarios: [
      {
        id: "new-us",
        label: "US · Net-30",
        values: {
          deal_type: "new_business",
          customer_region: "US",
          payment_terms: "Net-30",
          item_type: "software",
          item_name: "Enterprise Platform",
          metered: "false",
          quantity: "10+",
          frequency: "annual",
        },
      },
      {
        id: "new-de",
        label: "Germany · EU",
        values: {
          deal_type: "new_business",
          customer_region: "DE",
          payment_terms: "Net-30",
          item_type: "service",
          item_name: "Implementation services",
          metered: "false",
          quantity: "1",
          frequency: "one_time",
        },
      },
      {
        id: "new-apac",
        label: "APAC · Prepaid",
        values: {
          deal_type: "new_business",
          customer_region: "APAC",
          payment_terms: "Prepaid",
          item_type: "usage",
          item_name: "Premium Support",
          metered: "true",
          quantity: "5",
          frequency: "monthly",
        },
      },
    ],
  },
  {
    id: "expansion",
    label: "Expansion",
    scenarios: [
      {
        id: "exp-eu",
        label: "EU · Co-term add-on",
        values: {
          deal_type: "expansion",
          customer_region: "EU",
          payment_terms: "Net-30",
          item_type: "software",
          item_name: "Enterprise Platform",
          metered: "true",
          quantity: "100+",
          frequency: "annual",
        },
      },
    ],
  },
  {
    id: "amendment",
    label: "Amendment",
    scenarios: [
      {
        id: "amend-us",
        label: "US · Contract change",
        values: {
          deal_type: "amendment",
          customer_region: "US",
          payment_terms: "Net-30",
          item_type: "software",
          item_name: "Enterprise Platform",
          metered: "false",
          quantity: "10+",
          frequency: "annual",
        },
      },
    ],
  },
  {
    id: "termination",
    label: "Termination",
    scenarios: [
      {
        id: "term-us",
        label: "US · Wind-down",
        values: {
          deal_type: "termination",
          customer_region: "US",
          payment_terms: "Net-30",
          item_type: "software",
          item_name: "Enterprise Platform",
          metered: "false",
          quantity: "1",
          frequency: "annual",
        },
      },
    ],
  },
]

/** @deprecated Use PREVIEW_SCENARIO_GROUPS — flat list kept for store init and lookups */
export const PREVIEW_SCENARIOS: PreviewScenario[] =
  PREVIEW_SCENARIO_GROUPS.flatMap((g) => g.scenarios)

import { normalizeConditionRules } from "@/lib/segment-conditions"

export function segmentMatches(
  segment: ConditionalSegment,
  scenario: PreviewScenario,
): boolean {
  const rules = normalizeConditionRules(segment.condition)
  if (rules.length === 0) return true
  return rules.every((rule) => conditionMatches(rule, scenario))
}

export function conditionMatches(
  condition: SegmentCondition,
  scenario: PreviewScenario,
): boolean {
  const actual = scenario.values[condition.field] ?? ""
  const expected = condition.value
  switch (condition.operator) {
    case "is":
      return actual === expected
    case "is_not":
      return actual !== expected
    case "contains":
      return actual.includes(expected)
    default:
      return false
  }
}

export function blockIsVisible(
  displayCondition: BlockDisplayCondition,
  scenario: PreviewScenario,
): boolean {
  const rules = normalizeConditionRules(displayCondition)
  if (rules.length === 0) return true
  return rules.every((rule) => conditionMatches(rule, scenario))
}

export function templateAppliesToScenario(
  template: BuilderTemplate | null,
  scenario: PreviewScenario,
): boolean {
  if (!template) return false
  return blockIsVisible(template.displayCondition ?? null, scenario)
}
