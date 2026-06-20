import { deriveTemplateVariables } from "@/lib/derive-template-variables"
import { normalizeConditionRules } from "@/lib/segment-conditions"
import type {
  BlockDisplayCondition,
  BuilderTemplate,
  ConditionalSegment,
} from "@/types/prompt-builder"

export type TemplateStats = {
  variableCount: number
  conditionCount: number
  quotesSent: number
}

function mockQuotesSent(templateId: string): number {
  let hash = 0
  for (let i = 0; i < templateId.length; i += 1) {
    hash = (hash + templateId.charCodeAt(i) * (i + 3)) % 997
  }
  return 18 + (hash % 412)
}

export function deriveTemplateStats(template: BuilderTemplate): TemplateStats {
  const variableCount = deriveTemplateVariables(template).filter(
    (variable) => variable.category !== "routing",
  ).length

  let conditionCount = 0
  for (const block of template.blocks) {
    conditionCount += normalizeConditionRules(
      (block.content.displayCondition ?? null) as BlockDisplayCondition,
    ).length

    conditionCount += normalizeConditionRules(
      (block.content.logoDisplayCondition ?? null) as BlockDisplayCondition,
    ).length

    if (block.type === "terms") {
      const segments = (block.content.segments as ConditionalSegment[]) ?? []
      for (const segment of segments) {
        conditionCount += normalizeConditionRules(segment.condition).length
      }
    }
  }

  return {
    variableCount,
    conditionCount,
    quotesSent: mockQuotesSent(template.id),
  }
}

export function formatAutosaveAgo(iso: string): string {
  const diffSec = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  )

  if (diffSec < 5) return "just now"
  if (diffSec < 60) return `${diffSec} sec ago`

  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) {
    return diffMin === 1 ? "1 min ago" : `${diffMin} min ago`
  }

  return formatTemplateEditedAt(iso)
}

export function formatTemplateEditedAt(iso: string): string {
  const edited = new Date(iso)
  const now = Date.now()
  const diffMs = edited.getTime() - now
  const diffMinutes = Math.round(diffMs / 60_000)
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute")
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 48) {
    return rtf.format(diffHours, "hour")
  }

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 14) {
    return rtf.format(diffDays, "day")
  }

  return edited.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: edited.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  })
}
