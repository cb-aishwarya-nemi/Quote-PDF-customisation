import { normalizeConditionRules } from "@/lib/segment-conditions"
import type {
  BlockDisplayCondition,
  BuilderTemplate,
  ConditionalSegment,
  DealType,
} from "@/types/prompt-builder"

const ALL_DEAL_TYPES: DealType[] = [
  "new_business",
  "expansion",
  "amendment",
  "termination",
]

const MOCK_OWNERS = [
  { id: "jordan-lee", name: "Jordan Lee" },
  { id: "sam-patel", name: "Sam Patel" },
  { id: "alex-chen", name: "Alex Chen" },
] as const

function collectDealTypeValues(template: BuilderTemplate): Set<DealType> {
  const values = new Set<DealType>()

  const ingest = (condition: BlockDisplayCondition) => {
    for (const rule of normalizeConditionRules(condition)) {
      if (rule.field !== "deal_type") continue
      if (rule.operator !== "is") continue
      if (ALL_DEAL_TYPES.includes(rule.value as DealType)) {
        values.add(rule.value as DealType)
      }
    }
  }

  ingest(template.displayCondition ?? null)

  for (const block of template.blocks) {
    ingest((block.content.displayCondition ?? null) as BlockDisplayCondition)
    ingest((block.content.logoDisplayCondition ?? null) as BlockDisplayCondition)

    if (block.type !== "terms") continue
    const segments = (block.content.segments as ConditionalSegment[]) ?? []
    for (const segment of segments) {
      ingest(segment.condition)
    }
  }

  return values
}

export function deriveTemplateDealTypes(template: BuilderTemplate): DealType[] {
  const found = collectDealTypeValues(template)
  if (found.size === 0) return [...ALL_DEAL_TYPES]
  return ALL_DEAL_TYPES.filter((type) => found.has(type))
}

export function deriveMockTemplateOwner(templateId: string) {
  let hash = 0
  for (let i = 0; i < templateId.length; i += 1) {
    hash = (hash + templateId.charCodeAt(i) * (i + 5)) % 997
  }
  return MOCK_OWNERS[hash % MOCK_OWNERS.length]
}

export const TEMPLATE_LIBRARY_OWNERS = MOCK_OWNERS
