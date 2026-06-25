import {
  findBlockIndex,
} from "@/lib/block-layout-helpers"
import {
  analyzeTermsConditionalOverlap,
  describeTermsConditionalOverlapMessage,
} from "@/lib/terms-segments"
import type { BuilderBlock, BuilderTemplate, ConditionalSegment } from "@/types/prompt-builder"
import { PREVIEW_SCENARIOS } from "@/types/prompt-builder"

export type TemplateValidationIssue = {
  id: string
  severity: "warning" | "info"
  message: string
  blockId?: string
  action?: {
    label: string
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

function pushIssue(
  issues: TemplateValidationIssue[],
  issue: TemplateValidationIssue,
) {
  if (issues.some((entry) => entry.id === issue.id)) return
  issues.push(issue)
}

export function deriveTemplateValidationIssues(
  template: BuilderTemplate | null,
): TemplateValidationIssue[] {
  if (!template) return []

  const issues: TemplateValidationIssue[] = []
  const blocks = template.blocks

  const billedToIndex = findBlockIndex(blocks, "billed_to")
  const contractIndex = findBlockIndex(blocks, "contract_details")
  const pricingIndex = findBlockIndex(blocks, "pricing")
  const tcvIndex = findBlockIndex(blocks, "tcv_summary")
  const termsIndex = findBlockIndex(blocks, "terms")
  const signatureIndex = findBlockIndex(blocks, "signature")

  if (pricingIndex >= 0 && billedToIndex >= 0 && pricingIndex < billedToIndex) {
    pushIssue(issues, {
      id: "pricing-before-billed-to",
      severity: "warning",
      message:
        "Pricing appears before the customer billing section. Most quotes introduce the customer first — reorder?",
      blockId: blocks[pricingIndex].id,
      action: {
        label: "Put billing first",
        prompt: "Move billed to before the pricing table",
      },
    })
  }

  if (pricingIndex >= 0 && contractIndex >= 0 && pricingIndex < contractIndex) {
    pushIssue(issues, {
      id: "pricing-before-contract-details",
      severity: "warning",
      message:
        "Pricing is listed before contract details. Deal terms usually come before line items — reorder?",
      blockId: blocks[pricingIndex].id,
      action: {
        label: "Put contract details first",
        prompt: "Move contract details before the pricing table",
      },
    })
  }

  if (tcvIndex >= 0 && tcvIndex <= 1) {
    pushIssue(issues, {
      id: "tcv-too-early",
      severity: "info",
      message:
        "Total contract value is near the top of the quote. Most templates place TCV after customer and contract sections.",
      blockId: blocks[tcvIndex].id,
    })
  }

  if (termsIndex >= 0 && pricingIndex >= 0 && termsIndex < pricingIndex) {
    pushIssue(issues, {
      id: "terms-before-pricing",
      severity: "warning",
      message:
        "Terms & conditions appear before pricing. Legal clauses usually follow the commercial sections — move terms down?",
      blockId: blocks[termsIndex].id,
      action: {
        label: "Move terms down",
        prompt: "Move terms and conditions after pricing",
      },
    })
  } else if (termsIndex >= 0 && termsIndex <= 2) {
    pushIssue(issues, {
      id: "terms-too-early",
      severity: "warning",
      message:
        "Terms & conditions are near the top of the quote. Legal text usually sits after pricing — move terms down?",
      blockId: blocks[termsIndex].id,
      action: {
        label: "Move terms down",
        prompt: "Move terms and conditions after pricing",
      },
    })
  }

  if (termsIndex >= 0) {
    const termsBlock = blocks[termsIndex]
    const segments = (termsBlock.content.segments as ConditionalSegment[]) ?? []
    const overlap = analyzeTermsConditionalOverlap(segments, PREVIEW_SCENARIOS)
    if (overlap.hasOverlap) {
      pushIssue(issues, {
        id: "terms-conditional-overlap",
        severity: "warning",
        message: describeTermsConditionalOverlapMessage(overlap),
        blockId: termsBlock.id,
        action: {
          label: "Review clause order",
          prompt: "Help me fix overlapping conditional terms clauses",
        },
      })
    }
  }

  if (signatureIndex === -1) {
    pushIssue(issues, {
      id: "missing-signature",
      severity: "warning",
      message:
        "Most quote templates include a signature block at the end. Would you like to add one?",
      action: {
        label: "Add signature block",
        prompt: "Add a signature block at the end of the template",
      },
    })
  } else {
    const signatureBlock = blocks[signatureIndex]
    const afterSignature = blocks.slice(signatureIndex + 1)
    const disallowedAfter = afterSignature.filter(
      (block) => !ALLOWED_AFTER_SIGNATURE.includes(block.type),
    )
    const lastClosingIndex = blocks.reduce(
      (max, block, index) =>
        CLOSING_BLOCK_TYPES.includes(block.type) ? Math.max(max, index) : max,
      -1,
    )
    const signatureTooEarly =
      lastClosingIndex !== -1 && signatureIndex < lastClosingIndex

    if (signatureTooEarly || disallowedAfter.length > 0) {
      pushIssue(issues, {
        id: "signature-placement",
        severity: "warning",
        message:
          "Signature blocks generally fit at the end of the quote, after pricing and terms. Would you like to move it?",
        blockId: signatureBlock.id,
        action: {
          label: "Move signature to end",
          prompt: "Move signature to the end of the template",
        },
      })
    }
  }

  return issues
}

export type BlockLayoutHint = {
  issueId: string
  canvasMessage: string
}

export type CanvasLayoutBanner = {
  issueId: string
  message: string
  action?: {
    label: string
    prompt: string
  }
}

function addBlockHint(
  map: Map<string, BlockLayoutHint[]>,
  blockId: string,
  hint: BlockLayoutHint,
) {
  const existing = map.get(blockId) ?? []
  if (existing.some((entry) => entry.issueId === hint.issueId)) return
  map.set(blockId, [...existing, hint])
}

export function deriveLayoutVisualHints(
  template: BuilderTemplate | null,
  ignoredIssueIds: ReadonlySet<string> = new Set(),
): {
  blockHints: Map<string, BlockLayoutHint[]>
  canvasBanners: CanvasLayoutBanner[]
} {
  const blockHints = new Map<string, BlockLayoutHint[]>()
  const canvasBanners: CanvasLayoutBanner[] = []

  if (!template) return { blockHints, canvasBanners }

  const blocks = template.blocks
  const issues = deriveTemplateValidationIssues(template).filter(
    (issue) =>
      issue.severity === "warning" &&
      issue.action &&
      !ignoredIssueIds.has(issue.id),
  )

  for (const issue of issues) {
    switch (issue.id) {
      case "pricing-before-billed-to": {
        const pricingIndex = findBlockIndex(blocks, "pricing")
        const billedToIndex = findBlockIndex(blocks, "billed_to")
        if (pricingIndex >= 0) {
          addBlockHint(blockHints, blocks[pricingIndex].id, {
            issueId: issue.id,
            canvasMessage: "Pricing usually follows customer billing",
          })
        }
        if (billedToIndex >= 0) {
          addBlockHint(blockHints, blocks[billedToIndex].id, {
            issueId: issue.id,
            canvasMessage: "Customer billing usually comes before pricing",
          })
        }
        break
      }
      case "pricing-before-contract-details": {
        const pricingIndex = findBlockIndex(blocks, "pricing")
        const contractIndex = findBlockIndex(blocks, "contract_details")
        if (pricingIndex >= 0) {
          addBlockHint(blockHints, blocks[pricingIndex].id, {
            issueId: issue.id,
            canvasMessage: "Pricing usually follows contract details",
          })
        }
        if (contractIndex >= 0) {
          addBlockHint(blockHints, blocks[contractIndex].id, {
            issueId: issue.id,
            canvasMessage: "Contract details usually come before pricing",
          })
        }
        break
      }
      case "tcv-too-early": {
        const tcvIndex = findBlockIndex(blocks, "tcv_summary")
        if (tcvIndex >= 0) {
          addBlockHint(blockHints, blocks[tcvIndex].id, {
            issueId: issue.id,
            canvasMessage: "TCV usually follows customer and contract sections",
          })
        }
        break
      }
      case "terms-before-pricing":
      case "terms-too-early": {
        const termsIndex = findBlockIndex(blocks, "terms")
        if (termsIndex >= 0) {
          addBlockHint(blockHints, blocks[termsIndex].id, {
            issueId: issue.id,
            canvasMessage: "Terms usually follow pricing",
          })
        }
        break
      }
      case "terms-conditional-overlap": {
        if (issue.blockId) {
          addBlockHint(blockHints, issue.blockId, {
            issueId: issue.id,
            canvasMessage: "Overlapping conditions — first match wins",
          })
        }
        break
      }
      case "signature-placement": {
        const signatureIndex = findBlockIndex(blocks, "signature")
        if (signatureIndex >= 0) {
          addBlockHint(blockHints, blocks[signatureIndex].id, {
            issueId: issue.id,
            canvasMessage: "Signature usually closes the quote",
          })
        }
        break
      }
      case "missing-signature":
        canvasBanners.push({
          issueId: issue.id,
          message: issue.message,
          action: issue.action,
        })
        break
      default:
        if (issue.blockId) {
          addBlockHint(blockHints, issue.blockId, {
            issueId: issue.id,
            canvasMessage: issue.message,
          })
        }
        break
    }
  }

  return { blockHints, canvasBanners }
}

export function signatureBlockNeedsPageBreak(block: BuilderBlock): boolean {
  return block.type === "signature"
}
