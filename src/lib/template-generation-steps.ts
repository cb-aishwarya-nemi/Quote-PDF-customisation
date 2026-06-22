import { mockBusinessProfile } from "@/mock/data"
import type { ChatMessage } from "@/types/prompt-builder"

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
