import { hasConditions } from "@/lib/segment-conditions"
import { TEMPLATE_NAME_PLACEHOLDER } from "@/lib/create-builder-template"
import { templateRequiresPublishConditions } from "@/lib/template-routing"
import { deriveTemplateValidationIssues } from "@/lib/template-validation"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import type { BuilderTemplate } from "@/types/prompt-builder"

export type PublishChecklistAction = {
  label: string
  type: "prompt" | "highlight-conditions"
  prompt?: string
}

export type PublishChecklistItem = {
  id: string
  label: string
  /** Shown while the agent is actively checking this item */
  checkingLabel: string
  checked: boolean
  blocking: boolean
  nextStep: string
  action?: PublishChecklistAction
}

function hasBlock(template: BuilderTemplate, type: BuilderTemplate["blocks"][number]["type"]) {
  return template.blocks.some((block) => block.type === type)
}

function hasMeaningfulTemplateName(name: string) {
  const trimmed = name.trim()
  if (trimmed.length < 2) return false
  const lower = trimmed.toLowerCase()
  if (lower === "untitled template") return false
  if (lower === TEMPLATE_NAME_PLACEHOLDER.toLowerCase()) return false
  return true
}

export function derivePublishChecklist(input: {
  template: BuilderTemplate
  library: PublishedBuilderTemplate[]
  ignoredValidationIssueIds: readonly string[]
}): PublishChecklistItem[] {
  const { template, library, ignoredValidationIssueIds } = input
  const items: PublishChecklistItem[] = []

  items.push({
    id: "template-name",
    label: "Template has a name",
    checkingLabel: "Checking if the template has a name…",
    checked: hasMeaningfulTemplateName(template.name),
    blocking: true,
    nextStep: "Enter a descriptive name in the header so your team can find this template.",
  })

  if (templateRequiresPublishConditions(library, template.displayCondition ?? null)) {
    items.push({
      id: "routing-conditions",
      label: "Routing conditions defined",
      checkingLabel: "Checking routing conditions…",
      checked: hasConditions(template.displayCondition ?? null),
      blocking: true,
      nextStep:
        "More than one template exists — define when this PDF should be used for a quote.",
      action: {
        label: "Set conditions",
        type: "highlight-conditions",
      },
    })
  }

  items.push({
    id: "billed-to-block",
    label: "Billed to included",
    checkingLabel: "Checking for a Billed to section…",
    checked: hasBlock(template, "billed_to"),
    blocking: true,
    nextStep: "Add a Billed to block with the customer billing address.",
    action: {
      label: "Add Billed to",
      type: "prompt",
      prompt: "Add a billed to block",
    },
  })

  items.push({
    id: "sender-address-block",
    label: "Sender address included",
    checkingLabel: "Checking for a sender address…",
    checked: hasBlock(template, "company_details"),
    blocking: true,
    nextStep: "Add a Company details block with your organization's From address.",
    action: {
      label: "Add sender address",
      type: "prompt",
      prompt: "Add a company details block",
    },
  })

  items.push({
    id: "entitlements-block",
    label: "Entitlements included",
    checkingLabel: "Checking for entitlements…",
    checked: hasBlock(template, "entitlements"),
    blocking: true,
    nextStep: "Add an entitlements block to show what's included in the quote.",
    action: {
      label: "Add entitlements",
      type: "prompt",
      prompt: "Add an entitlements block",
    },
  })

  items.push({
    id: "signature-block",
    label: "Signature included",
    checkingLabel: "Checking for a signature block…",
    checked: hasBlock(template, "signature"),
    blocking: true,
    nextStep: "Add a signature block for customer and vendor sign-off.",
    action: {
      label: "Add signature",
      type: "prompt",
      prompt: "Add a signature block at the end of the template",
    },
  })

  items.push({
    id: "ae-details-block",
    label: "AE details included",
    checkingLabel: "Checking for AE details…",
    checked: hasBlock(template, "ae_profile"),
    blocking: true,
    nextStep: "Add an AE details block so customers know who to contact.",
    action: {
      label: "Add AE details",
      type: "prompt",
      prompt: "Add an AE profile block",
    },
  })

  const validationIssues = deriveTemplateValidationIssues(template).filter(
    (issue) =>
      issue.severity === "warning" &&
      !ignoredValidationIssueIds.includes(issue.id) &&
      issue.id !== "missing-signature",
  )

  for (const issue of validationIssues) {
    items.push({
      id: issue.id,
      label: issueLabelForValidation(issue.id),
      checkingLabel: checkingLabelForValidation(issue.id),
      checked: false,
      blocking: true,
      nextStep: issue.message,
      action: issue.action
        ? {
            label: issue.action.label,
            type: "prompt",
            prompt: issue.action.prompt,
          }
        : undefined,
    })
  }

  return items
}

function issueLabelForValidation(issueId: string): string {
  switch (issueId) {
    case "pricing-before-billed-to":
      return "Customer billing before pricing"
    case "pricing-before-contract-details":
      return "Contract details before pricing"
    case "terms-before-pricing":
    case "terms-too-early":
      return "Terms placed after commercial sections"
    case "terms-conditional-overlap":
      return "Conditional clauses don't overlap"
    case "missing-signature":
      return "Signature block included"
    case "signature-placement":
      return "Signature at end of quote"
    default:
      return "Layout review"
  }
}

function checkingLabelForValidation(issueId: string): string {
  switch (issueId) {
    case "pricing-before-billed-to":
      return "Checking block order — billing vs pricing…"
    case "pricing-before-contract-details":
      return "Checking block order — contract details vs pricing…"
    case "terms-before-pricing":
    case "terms-too-early":
      return "Checking terms placement…"
    case "terms-conditional-overlap":
      return "Checking conditional clause rules…"
    case "missing-signature":
      return "Checking for a signature block…"
    case "signature-placement":
      return "Checking signature placement…"
    default:
      return "Reviewing layout…"
  }
}

export function publishChecklistCanPublish(items: PublishChecklistItem[]): boolean {
  return items.every((item) => !item.blocking || item.checked)
}
