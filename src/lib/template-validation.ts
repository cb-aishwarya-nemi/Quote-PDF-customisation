import type { BuilderBlock, BuilderTemplate } from "@/types/prompt-builder"

export type TemplateValidationIssue = {
  id: string
  severity: "warning" | "info"
  /** Two-line message shown in the agent action area */
  messageLines: [string, string]
  blockId?: string
  action?: {
    prompt: string
  }
}

const ALLOWED_AFTER_SIGNATURE: BuilderBlock["type"][] = ["ae_profile"]

const CLOSING_BLOCK_TYPES: BuilderBlock["type"][] = [
  "terms",
  "pricing",
  "tcv_summary",
  "entitlements",
]

export function deriveTemplateValidationIssues(
  template: BuilderTemplate | null,
): TemplateValidationIssue[] {
  if (!template) return []

  const issues: TemplateValidationIssue[] = []
  const blocks = template.blocks
  const signatureIndex = blocks.findIndex((b) => b.type === "signature")

  if (signatureIndex === -1) {
    issues.push({
      id: "missing-signature",
      severity: "warning",
      messageLines: [
        "Most quote templates include a signature block at the end.",
        "Would you like to add one?",
      ],
      action: {
        prompt: "Add a signature block at the end of the template",
      },
    })
    return issues
  }

  const signatureBlock = blocks[signatureIndex]
  const afterSignature = blocks.slice(signatureIndex + 1)
  const disallowedAfter = afterSignature.filter(
    (b) => !ALLOWED_AFTER_SIGNATURE.includes(b.type),
  )
  const lastClosingIndex = blocks.reduce(
    (max, block, index) =>
      CLOSING_BLOCK_TYPES.includes(block.type) ? Math.max(max, index) : max,
    -1,
  )
  const signatureTooEarly =
    lastClosingIndex !== -1 && signatureIndex < lastClosingIndex

  if (signatureTooEarly || disallowedAfter.length > 0) {
    issues.push({
      id: "signature-placement",
      severity: "warning",
      messageLines: [
        "Signature blocks generally fit at the end of the quote,",
        "after pricing and terms. Would you like to move it?",
      ],
      blockId: signatureBlock.id,
      action: {
        prompt: "Move signature to the end of the template",
      },
    })
  }

  return issues
}

export function signatureBlockNeedsPageBreak(block: BuilderBlock): boolean {
  return block.type === "signature"
}
