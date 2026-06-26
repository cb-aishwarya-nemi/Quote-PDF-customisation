import { mockBusinessProfile } from "@/mock/data"
import type { PdfExtractionSummary } from "@/lib/pdf-template-extractor"
import { BLOCK_TYPE_LABELS } from "@/lib/derive-template-variables"
import type { BuilderBlockType, ChatMessage } from "@/types/prompt-builder"

export function getGenerationBusinessType(): string {
  return (
    mockBusinessProfile.attributes.find((a) => a.label === "Industry")?.value ??
    "your business"
  )
}

export function buildGenerationStepLabels(
  hasUploads: boolean,
  businessType = getGenerationBusinessType(),
): string[] {
  const shared = [
    "Analysing your business context",
    `Selecting layout for ${businessType}`,
    "Applying sensible defaults in your brand style",
    "Drafting template",
  ]
  return hasUploads ? ["Reading files you uploaded", ...shared] : shared
}

function pastTenseGenerationStep(label: string): string {
  if (label === "Reading uploaded PDF") {
    return "Read the uploaded PDF"
  }
  if (label === "Extracting text and section markers") {
    return "Extracted text and section markers"
  }
  if (label === "Mapping sections to template blocks") {
    return "Mapped sections to template blocks"
  }
  if (label === "Applying layout rules") {
    return "Applied layout rules"
  }
  if (label === "Reading files you uploaded") {
    return "Read the files you uploaded"
  }
  if (label === "Analysing your business context") {
    return "Analysed your business context"
  }
  if (label.startsWith("Selecting layout for ")) {
    return label.replace("Selecting layout for ", "Selected layout for ")
  }
  if (label === "Applying sensible defaults in your brand style") {
    return "Applied sensible defaults in your brand style"
  }
  if (label === "Drafting template") {
    return "Drafted your template"
  }
  return label
}

export function makePdfVariableMappingMessage(
  summary: PdfExtractionSummary,
): ChatMessage | null {
  if (!summary.fieldMappings.length) return null

  return {
    id: "pdf-variable-mapping",
    role: "assistant",
    kind: "pdf_variable_mapping",
    content: `Mapped ${summary.fieldMappings.length} field${summary.fieldMappings.length === 1 ? "" : "s"} from your PDF. Review them in the Data mapping tab, then continue to the template canvas.`,
    timestamp: new Date().toISOString(),
  }
}

export function makeExtractionSummaryMessage(
  stepLabels: string[],
  summary: PdfExtractionSummary,
): ChatMessage {
  const steps = stepLabels
    .map((step) => `✓ ${pastTenseGenerationStep(step)}`)
    .join("\n")

  const sectionLabels = summary.detectedSections
    .map((type) => BLOCK_TYPE_LABELS[type as BuilderBlockType] ?? type)
    .join(", ")

  const filledLabels = summary.filledBlocks
    .map((type) => BLOCK_TYPE_LABELS[type as BuilderBlockType] ?? type)
    .join(", ")

  const detailLines = [
    `Source: **${summary.sourceFileName}** (${summary.pageCount} page${summary.pageCount === 1 ? "" : "s"})`,
    sectionLabels
      ? `Detected sections: ${sectionLabels}`
      : "No clear section markers — applied the standard block layout.",
    filledLabels ? `Pre-filled from PDF: ${filledLabels}` : null,
  ].filter(Boolean)

  return {
    id: "generation-summary",
    role: "assistant",
    content: `I've extracted a quote template from your PDF. Here's what I did:\n\n${steps}\n\n${detailLines.join("\n")}\n\nReview each block in the studio — extracted copy is a starting point and may need light edits.`,
    timestamp: new Date().toISOString(),
  }
}

export function makeGenerationSummaryMessage(
  stepLabels: string[],
): ChatMessage {
  const steps = stepLabels
    .map((step) => `✓ ${pastTenseGenerationStep(step)}`)
    .join("\n")
  return {
    id: "generation-summary",
    role: "assistant",
    content: `I've generated your quote template. Here's what I did:\n\n${steps}\n\nYour template is ready to refine — ask me to adjust layout, copy, or conditional sections.`,
    timestamp: new Date().toISOString(),
  }
}

export function makeCreationBriefReply(brief: string): ChatMessage {
  return {
    id: "creation-brief-reply",
    role: "assistant",
    content: `I'll shape this draft for:\n\n"${brief.trim()}"\n\nReview the layout in the studio — ask me to adjust sections, copy, or deal-specific clauses anytime.`,
    timestamp: new Date().toISOString(),
  }
}
