import { BLOCK_VARIANTS } from "@/lib/block-variants"
import type {
  BuilderBlock,
  BuilderTemplate,
  ChatMessage,
  ConditionalSegment,
  PreviewScenario,
} from "@/types/prompt-builder"
import { segmentHasConditionValue } from "@/lib/segment-conditions"

export type AgentSuggestion = {
  id: string
  label: string
  prompt: string
  priority: number
}

const BLOCK_LABELS: Record<string, string> = {
  quote_summary_header: "quote summary",
  tcv_summary: "TCV summary",
  billed_to: "billed to",
  contract_details: "contract details",
  pricing: "pricing table",
  entitlements: "entitlements",
  terms: "terms",
  custom_text: "text block",
  custom_table: "table",
  custom_image: "image block",
  signature: "signature",
  ae_profile: "AE profile",
}

function hasBlock(template: BuilderTemplate, type: BuilderBlock["type"]) {
  return template.blocks.some((b) => b.type === type)
}

function getBlock(template: BuilderTemplate, type: BuilderBlock["type"]) {
  return template.blocks.find((b) => b.type === type)
}

function variantOf(block: BuilderBlock | undefined) {
  if (!block) return ""
  const options = BLOCK_VARIANTS[block.type]
  return String(block.content.variant ?? options[0]?.id ?? "")
}

function termsSegments(template: BuilderTemplate) {
  const terms = getBlock(template, "terms")
  return (terms?.content.segments as ConditionalSegment[]) ?? []
}

function hasConditionValue(template: BuilderTemplate, field: string, value: string) {
  return termsSegments(template).some((s) =>
    segmentHasConditionValue(s.condition, field, value),
  )
}

function hasDealTypeCondition(template: BuilderTemplate, dealType: string) {
  return termsSegments(template).some((s) =>
    segmentHasConditionValue(s.condition, "deal_type", dealType),
  )
}

function scenarioDealType(scenario: PreviewScenario) {
  return scenario.values.deal_type ?? "new_business"
}

function push(
  list: AgentSuggestion[],
  suggestion: AgentSuggestion,
  usedPrompts: Set<string>,
) {
  if (usedPrompts.has(suggestion.prompt.toLowerCase())) return
  if (list.some((s) => s.id === suggestion.id)) return
  list.push(suggestion)
}

function suggestVariant(
  list: AgentSuggestion[],
  block: BuilderBlock,
  variantId: string,
  label: string,
  usedPrompts: Set<string>,
) {
  if (variantOf(block) === variantId) return
  const option = BLOCK_VARIANTS[block.type].find((v) => v.id === variantId)
  if (!option) return
  push(
    list,
    {
      id: `${block.type}-${variantId}`,
      label,
      prompt: `Switch the ${BLOCK_LABELS[block.type]} to ${option.label.toLowerCase()} layout`,
      priority: 75,
    },
    usedPrompts,
  )
}

export function deriveAgentSuggestions(input: {
  template: BuilderTemplate | null
  selectedBlockId: string | null
  activeScenario: PreviewScenario
  messages: ChatMessage[]
}): AgentSuggestion[] {
  const { template, selectedBlockId, activeScenario, messages } = input
  if (!template) return []

  const suggestions: AgentSuggestion[] = []
  const usedPrompts = new Set(
    messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase()),
  )

  push(
    suggestions,
    {
      id: "list-variables",
      label: "List merge variables",
      prompt: "What variables are in this template?",
      priority: 40,
    },
    usedPrompts,
  )

  if (!hasBlock(template, "ae_profile")) {
    push(
      suggestions,
      {
        id: "add-ae",
        label: "Add AE profile",
        prompt: "Add an AE profile block",
        priority: 70,
      },
      usedPrompts,
    )
  }

  if (!hasBlock(template, "signature")) {
    push(
      suggestions,
      {
        id: "add-signature",
        label: "Add signature",
        prompt: "Add a signature block",
        priority: 65,
      },
      usedPrompts,
    )
  }

  if (
    !hasConditionValue(template, "customer_region", "DE") ||
    !hasConditionValue(template, "customer_region", "APAC")
  ) {
    push(
      suggestions,
      {
        id: "add-regional-terms",
        label: "Regional T&C clauses",
        prompt: "Add conditional terms for Germany and APAC",
        priority: 80,
      },
      usedPrompts,
    )
  }

  if (!hasBlock(template, "entitlements")) {
    push(
      suggestions,
      {
        id: "add-entitlements",
        label: "Add entitlements",
        prompt: "Add an entitlements block to explain what's included",
        priority: 72,
      },
      usedPrompts,
    )
  }

  const dealType = scenarioDealType(activeScenario)
  if (dealType === "expansion" && !hasDealTypeCondition(template, "expansion")) {
    push(
      suggestions,
      {
        id: "expansion-terms",
        label: "Expansion co-term clause",
        prompt: "Add expansion co-termination terms",
        priority: 90,
      },
      usedPrompts,
    )
  }

  if (dealType === "termination" && !hasDealTypeCondition(template, "termination")) {
    push(
      suggestions,
      {
        id: "termination-terms",
        label: "Wind-down clause",
        prompt: "Add termination wind-down terms",
        priority: 90,
      },
      usedPrompts,
    )
  }

  if (activeScenario.id === "new-de" && !hasConditionValue(template, "customer_region", "DE")) {
    push(
      suggestions,
      {
        id: "de-vat",
        label: "German VAT clause",
        prompt: "Add a German VAT clause for EU customers",
        priority: 92,
      },
      usedPrompts,
    )
  }

  if (activeScenario.id === "new-apac" && !hasConditionValue(template, "customer_region", "APAC")) {
    push(
      suggestions,
      {
        id: "apac-terms",
        label: "APAC payment clause",
        prompt: "Add an APAC payment terms paragraph",
        priority: 92,
      },
      usedPrompts,
    )
  }

  if (activeScenario.id === "new-us" && activeScenario.values.payment_terms === "Net-30") {
    push(
      suggestions,
      {
        id: "preview-de",
        label: "Preview Germany scenario",
        prompt: "What should I check for Germany customers?",
        priority: 35,
      },
      usedPrompts,
    )
  }

  const selected = template.blocks.find((b) => b.id === selectedBlockId)

  if (selected) {
    switch (selected.type) {
      case "quote_summary_header":
        suggestVariant(
          suggestions,
          selected,
          "centered",
          "Centered header",
          usedPrompts,
        )
        suggestVariant(
          suggestions,
          selected,
          "minimal",
          "Minimal header",
          usedPrompts,
        )
        break
      case "tcv_summary":
        suggestVariant(
          suggestions,
          selected,
          "cards",
          "Metric cards TCV",
          usedPrompts,
        )
        suggestVariant(
          suggestions,
          selected,
          "inline",
          "Inline TCV strip",
          usedPrompts,
        )
        push(
          suggestions,
          {
            id: "emphasize-tcv",
            label: "Emphasize TCV",
            prompt: "Emphasize the TCV summary block",
            priority: 88,
          },
          usedPrompts,
        )
        break
      case "billed_to":
        suggestVariant(suggestions, selected, "two_column", "Split layout", usedPrompts)
        suggestVariant(suggestions, selected, "card", "Card layout", usedPrompts)
        break
      case "contract_details":
        suggestVariant(suggestions, selected, "timeline", "Timeline layout", usedPrompts)
        suggestVariant(suggestions, selected, "list", "Definition list", usedPrompts)
        break
      case "pricing":
        suggestVariant(suggestions, selected, "quote", "Quote-style pricing", usedPrompts)
        suggestVariant(suggestions, selected, "compact", "Compact pricing", usedPrompts)
        suggestVariant(
          suggestions,
          selected,
          "with_descriptions",
          "Line item descriptions",
          usedPrompts,
        )
        break
      case "entitlements":
        suggestVariant(suggestions, selected, "list", "Narrative entitlements", usedPrompts)
        suggestVariant(suggestions, selected, "compact", "Compact entitlements", usedPrompts)
        break
      case "terms":
        suggestVariant(suggestions, selected, "numbered", "Numbered terms", usedPrompts)
        suggestVariant(suggestions, selected, "legal", "Legal dense terms", usedPrompts)
        push(
          suggestions,
          {
            id: "add-conditional-paragraph",
            label: "Add conditional clause",
            prompt: "Add a conditional terms paragraph for this scenario",
            priority: 86,
          },
          usedPrompts,
        )
        break
      case "ae_profile":
        suggestVariant(suggestions, selected, "banner", "AE banner", usedPrompts)
        suggestVariant(suggestions, selected, "inline", "Inline AE row", usedPrompts)
        break
      case "signature":
        suggestVariant(suggestions, selected, "dual_party", "Dual-party signature", usedPrompts)
        suggestVariant(suggestions, selected, "boxed", "Order form signature", usedPrompts)
        suggestVariant(suggestions, selected, "single", "Single-line signature", usedPrompts)
        break
      case "custom_image":
        suggestVariant(suggestions, selected, "full_bleed", "Full bleed image", usedPrompts)
        suggestVariant(suggestions, selected, "framed", "Framed image", usedPrompts)
        break
      case "custom_text":
        suggestVariant(suggestions, selected, "callout", "Callout text", usedPrompts)
        suggestVariant(suggestions, selected, "pull_quote", "Pull quote", usedPrompts)
        break
      default:
        break
    }
  } else {
    const tcv = getBlock(template, "tcv_summary")
    if (tcv && variantOf(tcv) !== "cards") {
      push(
        suggestions,
        {
          id: "tcv-cards-global",
          label: "Metric cards TCV",
          prompt: "Switch TCV to metric cards layout",
          priority: 55,
        },
        usedPrompts,
      )
    }
  }

  if (!hasBlock(template, "custom_text")) {
    push(
      suggestions,
      {
        id: "add-text",
        label: "Add custom text",
        prompt: "Add a custom text block",
        priority: 45,
      },
      usedPrompts,
    )
  }

  if (suggestions.length === 0) {
    push(
      suggestions,
      {
        id: "validate-preview",
        label: "Validate in preview",
        prompt: "What should I check in preview before publishing?",
        priority: 50,
      },
      usedPrompts,
    )
    push(
      suggestions,
      {
        id: "deal-type-scenarios",
        label: "Check deal-type scenarios",
        prompt: "Help me validate this template for different deal types",
        priority: 48,
      },
      usedPrompts,
    )
  }

  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5)
}
