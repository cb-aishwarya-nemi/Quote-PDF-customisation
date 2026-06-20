import { isBlockLocked } from "@/lib/block-lock"
import type { BuilderTemplate } from "@/types/prompt-builder"
import { PREVIEW_SCENARIOS } from "@/types/prompt-builder"

export const DEMO_USER_PROMPT =
  "Prepare this template for our global sales team demo"

export const DEMO_WELCOME_MESSAGE = `Hi — I'm your Chargebee assistant. I can reshape layouts, add regional terms, lock blocks for Sales, and open scenario previews.

Use the suggested prompts below, or describe what you want in the chat.`

type DemoStoreActions = {
  template: BuilderTemplate | null
  setBlockVariant: (blockId: string, variant: string) => void
  updateBlockField: (blockId: string, field: string, value: unknown) => void
  setBlockLocked: (blockId: string, locked: boolean) => void
  addBlock: (type: "entitlements", afterId?: string) => void
  setActiveScenario: (scenario: (typeof PREVIEW_SCENARIOS)[number]) => void
  openPreview: () => void
  setSelectedBlockId: (id: string | null) => void
}

export function applyAgentDemoChanges(actions: DemoStoreActions): string[] {
  const { template } = actions
  if (!template) return []

  const changes: string[] = []

  const header = template.blocks.find((b) => b.type === "quote_summary_header")
  const tcv = template.blocks.find((b) => b.type === "tcv_summary")
  const terms = template.blocks.find((b) => b.type === "terms")
  const pricing = template.blocks.find((b) => b.type === "pricing")
  const pricingId = pricing?.id

  if (header && String(header.content.variant ?? "classic") !== "centered") {
    actions.setBlockVariant(header.id, "centered")
    changes.push("Centered the quote summary header")
  }

  if (tcv) {
    if (String(tcv.content.variant ?? "classic") !== "cards") {
      actions.setBlockVariant(tcv.id, "cards")
    }
    if (tcv.content.emphasized !== true) {
      actions.updateBlockField(tcv.id, "emphasized", true)
    }
    changes.push("Emphasized TCV with metric cards")
  }

  if (terms && !isBlockLocked(terms.content)) {
    actions.setBlockLocked(terms.id, true)
    changes.push("Locked Terms & conditions — Sales can't edit at quote time")
  }

  if (pricing && !isBlockLocked(pricing.content)) {
    actions.setBlockLocked(pricing.id, true)
    changes.push("Locked the pricing table for Sales")
  }

  if (!template.blocks.some((b) => b.type === "entitlements")) {
    actions.addBlock("entitlements", pricingId)
    changes.push("Added an entitlements block after pricing")
  }

  if (terms) {
    actions.setSelectedBlockId(terms.id)
  }

  return changes
}

export function finishAgentPreview(
  actions: DemoStoreActions,
  scenarioId: string,
) {
  const scenario = PREVIEW_SCENARIOS.find((s) => s.id === scenarioId)
  if (scenario) actions.setActiveScenario(scenario)
  actions.openPreview()
}

export const AGENT_PREVIEW_DELAY_MS = 1400

export function scheduleAgentPreview(
  getActions: () => DemoStoreActions,
  scenarioId: string,
) {
  setTimeout(
    () => finishAgentPreview(getActions(), scenarioId),
    AGENT_PREVIEW_DELAY_MS,
  )
}

export function finishAgentDemoPreview(actions: DemoStoreActions) {
  finishAgentPreview(actions, "new-de")
}

export function formatDemoReply(changes: string[]): string {
  if (changes.length === 0) {
    return "Your template already looks sales-ready. Opening preview on Germany · EU — watch the VAT clause appear when the scenario matches."
  }

  return [
    "Done — I tuned this template for a global sales team:",
    "",
    ...changes.map((c) => `• ${c}`),
    "",
    "Opening preview on Germany · EU next — watch the VAT clause appear when the region matches.",
  ].join("\n")
}
