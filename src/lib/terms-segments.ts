import { createId } from "@/lib/create-id"
import {
  createConditionRule,
  describeConditionRulesShort,
  hasConditions,
} from "@/lib/segment-conditions"
import type {
  BlockDisplayCondition,
  ConditionalSegment,
  PreviewScenario,
} from "@/types/prompt-builder"
import { PREVIEW_SCENARIOS, segmentMatches } from "@/types/prompt-builder"

export const TERMS_SEGMENT_DRAG_SOURCE = "terms-segment" as const

export const DEFAULT_TERMS_TABLE_HEADERS: string[] = []

export const DEFAULT_TERMS_TABLE_ROWS = [
  ["Net-30 from invoice date"],
  ["30 days from quote date"],
]

export function isTermsTableSegment(
  segment: ConditionalSegment,
): segment is Extract<ConditionalSegment, { kind: "table" }> {
  return segment.kind === "table"
}

export function getSegmentText(segment: ConditionalSegment): string {
  return isTermsTableSegment(segment) ? "" : segment.text
}

export function countConditionalSegments(segments: ConditionalSegment[]): number {
  return segments.filter((segment) => hasConditions(segment.condition)).length
}

export type TermsConditionalOverlap = {
  hasOverlap: boolean
  maxMatches: number
  exampleScenarioLabel?: string
}

/** Detect when multiple conditional clauses can match the same quote scenario. */
export function analyzeTermsConditionalOverlap(
  segments: ConditionalSegment[],
  scenarios: PreviewScenario[] = PREVIEW_SCENARIOS,
): TermsConditionalOverlap {
  const conditional = segments.filter((segment) => hasConditions(segment.condition))
  if (conditional.length < 2) {
    return { hasOverlap: false, maxMatches: 0 }
  }

  let maxMatches = 0
  let exampleScenarioLabel: string | undefined

  for (const scenario of scenarios) {
    const matchCount = conditional.filter((segment) =>
      segmentMatches(segment, scenario),
    ).length
    if (matchCount >= 2 && matchCount > maxMatches) {
      maxMatches = matchCount
      exampleScenarioLabel = scenario.label
    }
  }

  const signatures = conditional.map((segment) =>
    describeConditionRulesShort(segment.condition),
  )
  const hasDuplicateConditions = signatures.some(
    (signature, index) => signatures.indexOf(signature) !== index,
  )

  if (maxMatches >= 2) {
    return { hasOverlap: true, maxMatches, exampleScenarioLabel }
  }

  if (hasDuplicateConditions) {
    return { hasOverlap: true, maxMatches: 2 }
  }

  return { hasOverlap: false, maxMatches: 0 }
}

export function describeTermsConditionalOverlapMessage(
  overlap: TermsConditionalOverlap,
): string {
  if (!overlap.hasOverlap) return ""

  if (overlap.exampleScenarioLabel) {
    const countLabel =
      overlap.maxMatches === 2
        ? "Two conditional clauses"
        : `${overlap.maxMatches} conditional clauses`
    return `${countLabel} can match the same scenario (${overlap.exampleScenarioLabel}). Only the first in list order is used — reorder or narrow conditions?`
  }

  return "Some conditional clauses use the same rules and will compete. Only the first in list order is used — reorder or narrow conditions?"
}

/** Segment ids that participate in at least one overlapping scenario or duplicate rule. */
export function findOverlappingTermsSegmentIds(
  segments: ConditionalSegment[],
  scenarios: PreviewScenario[] = PREVIEW_SCENARIOS,
): Set<string> {
  const conditional = segments.filter((segment) => hasConditions(segment.condition))
  const ids = new Set<string>()

  for (const scenario of scenarios) {
    const matching = conditional.filter((segment) => segmentMatches(segment, scenario))
    if (matching.length >= 2) {
      for (const segment of matching) ids.add(segment.id)
    }
  }

  const bySignature = new Map<string, string[]>()
  for (const segment of conditional) {
    const signature = describeConditionRulesShort(segment.condition)
    const list = bySignature.get(signature) ?? []
    list.push(segment.id)
    bySignature.set(signature, list)
  }
  for (const segmentIds of bySignature.values()) {
    if (segmentIds.length >= 2) {
      for (const id of segmentIds) ids.add(id)
    }
  }

  return ids
}

/** Unconditional segments always show; conditional segments use first-match-wins. */
export function resolveTermsSegmentsForScenario(
  segments: ConditionalSegment[],
  scenario: PreviewScenario,
): ConditionalSegment[] {
  let conditionalMatchUsed = false

  return segments.filter((segment) => {
    if (!hasConditions(segment.condition)) return true
    if (!segmentMatches(segment, scenario)) return false
    if (conditionalMatchUsed) return false
    conditionalMatchUsed = true
    return true
  })
}

export function createTextSegment(
  text: string,
  condition: BlockDisplayCondition = null,
): ConditionalSegment {
  return {
    id: createId("seg"),
    kind: "text",
    condition,
    text,
  }
}

export function createTableSegment(
  condition: BlockDisplayCondition = null,
): ConditionalSegment {
  return {
    id: createId("seg"),
    kind: "table",
    condition,
    headers: [...DEFAULT_TERMS_TABLE_HEADERS],
    rows: DEFAULT_TERMS_TABLE_ROWS.map((row) => [...row]),
    tableVariant: "standard",
  }
}

export function createConditionalTextSegment(): ConditionalSegment {
  return createTextSegment(
    "Add region-specific terms here.",
    [createConditionRule("customer_region")],
  )
}

export function createConditionalTableSegment(): ConditionalSegment {
  return createTableSegment([createConditionRule("customer_region")])
}

export function normalizeTermsTableSegment(
  segment: Extract<ConditionalSegment, { kind: "table" }>,
): Extract<ConditionalSegment, { kind: "table" }> {
  const rows = segment.rows.map((row) => {
    if (row.length <= 1) return [row[0] ?? ""]
    const details = row.slice(1).join(" — ").trim()
    return [details || row[0] || ""]
  })
  return {
    ...segment,
    headers: [],
    rows,
  }
}

export function textSegmentToTable(
  segment: Extract<ConditionalSegment, { kind?: "text" }>,
): Extract<ConditionalSegment, { kind: "table" }> {
  return {
    id: segment.id,
    condition: segment.condition,
    kind: "table",
    headers: [],
    rows: [[segment.text]],
    tableVariant: "standard",
  }
}

export function tableSegmentToText(
  segment: Extract<ConditionalSegment, { kind: "table" }>,
): Extract<ConditionalSegment, { kind?: "text" }> {
  const normalized = normalizeTermsTableSegment(segment)
  const text = normalized.rows
    .map((row) => row[0]?.trim() ?? "")
    .filter(Boolean)
    .join("\n\n")

  return {
    id: segment.id,
    condition: segment.condition,
    kind: "text",
    text: text || "Add terms content here.",
  }
}

export function applyTermsVariantToSegments(
  segments: ConditionalSegment[],
  variant: string,
): ConditionalSegment[] {
  const useTable = variant === "table"
  return segments.map((segment) => {
    const isTable = isTermsTableSegment(segment)
    if (useTable && !isTable) {
      return textSegmentToTable(segment as Extract<ConditionalSegment, { kind?: "text" }>)
    }
    if (useTable && isTable) {
      return normalizeTermsTableSegment(segment)
    }
    if (!useTable && isTable) {
      return tableSegmentToText(segment)
    }
    return segment
  })
}

export function defaultTermsTableSegments(): ConditionalSegment[] {
  return applyTermsVariantToSegments(
    [
      createTextSegment(
        "This quote is valid for 30 days from the date above. Payment terms are Net-30 unless otherwise specified. Services commence upon signed order form.",
      ),
      createTextSegment(
        "Services wind down on the termination effective date. Final invoice reflects usage through that date. Prepaid credits are settled per the master agreement.",
        {
          field: "deal_type",
          operator: "is",
          value: "termination",
          label: "Termination",
        },
      ),
      createTextSegment(
        "This amendment supersedes conflicting terms in the prior order form. All other terms remain in full force.",
        {
          field: "deal_type",
          operator: "is",
          value: "amendment",
          label: "Amendment",
        },
      ),
      createTextSegment(
        "APAC customers: Payment in USD. Local consumption tax may apply. Wire transfer fees are borne by the customer unless prepaid terms apply.",
        {
          field: "customer_region",
          operator: "is",
          value: "APAC",
          label: "APAC",
        },
      ),
    ],
    "table",
  )
}
