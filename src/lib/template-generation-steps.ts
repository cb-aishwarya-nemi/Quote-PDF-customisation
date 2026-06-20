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

export function makeGenerationSummaryMessage(
  stepLabels: string[],
): ChatMessage {
  const steps = stepLabels.map((step) => `✓ ${step}`).join("\n")
  return {
    id: "generation-summary",
    role: "assistant",
    content: `I've generated your quote template. Here's what I did:\n\n${steps}\n\nYour template is ready to refine — ask me to adjust layout, copy, or conditional sections.`,
    timestamp: new Date().toISOString(),
  }
}
