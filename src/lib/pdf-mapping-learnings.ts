import type { PdfFieldMapping } from "@/lib/pdf-field-mappings"

export type PdfMappingLearning = {
  id: string
  pdfExcerpt: string
  variableKey: string
  variableLabel: string
  feedback: "up" | "down"
  /** Original AI-assigned variable when user corrected a mapping. */
  correctedFromKey?: string
  correctedFromLabel?: string
  createdAt: string
}

export function createMappingLearning(
  mapping: PdfFieldMapping,
  feedback: "up" | "down",
  correctedFrom?: { key: string; label: string },
): PdfMappingLearning {
  return {
    id: `learning-${mapping.id}-${Date.now()}`,
    pdfExcerpt: mapping.pdfExcerpt.trim(),
    variableKey: mapping.variableKey,
    variableLabel: mapping.variableLabel,
    feedback,
    correctedFromKey: correctedFrom?.key,
    correctedFromLabel: correctedFrom?.label,
    createdAt: new Date().toISOString(),
  }
}

export function describeMappingLearnings(learnings: PdfMappingLearning[]): string {
  if (learnings.length === 0) return ""

  const confirmed = learnings.filter((l) => l.feedback === "up").length
  const corrected = learnings.filter((l) => l.feedback === "down").length

  const parts: string[] = []
  if (confirmed > 0) {
    parts.push(
      `${confirmed} confirmed mapping${confirmed === 1 ? "" : "s"} saved for future PDFs`,
    )
  }
  if (corrected > 0) {
    parts.push(
      `${corrected} correction${corrected === 1 ? "" : "s"} recorded so the AI maps similar text better next time`,
    )
  }
  return parts.join(". ") + "."
}

export function makeLearningAssistantMessage(
  learnings: PdfMappingLearning[],
): string | null {
  const summary = describeMappingLearnings(learnings)
  if (!summary) return null

  const latest = learnings[learnings.length - 1]
  if (latest.feedback === "down" && latest.correctedFromLabel) {
    return `Got it — I'll map text like "${truncate(latest.pdfExcerpt, 48)}" to **${latest.variableLabel}** instead of ${latest.correctedFromLabel} on future uploads. ${summary}`
  }

  if (latest.feedback === "up") {
    return `Thanks — I'll keep mapping "${truncate(latest.pdfExcerpt, 48)}" to **${latest.variableLabel}**. ${summary}`
  }

  return summary
}

function truncate(text: string, max: number): string {
  const trimmed = text.replace(/\s+/g, " ").trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max - 1)}…`
}

export function removeMappingLearnings(
  learnings: PdfMappingLearning[],
  mappingId: string,
): PdfMappingLearning[] {
  const prefix = `learning-${mappingId}-`
  return learnings.filter((learning) => !learning.id.startsWith(prefix))
}
