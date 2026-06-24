import { createId } from "@/lib/create-id"
import {
  createConditionRule,
} from "@/lib/segment-conditions"
import type { BlockDisplayCondition, ConditionalSegment } from "@/types/prompt-builder"

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
