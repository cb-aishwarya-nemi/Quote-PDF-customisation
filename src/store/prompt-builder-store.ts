import { BLOCK_VARIANTS } from "@/lib/block-variants"
import { isBlockLocked } from "@/lib/block-lock"
import {
  isImageFile,
  isPdfFile,
  preparePdfUpload,
  readFileAsDataUrl,
} from "@/lib/pdf-page-render"
import {
  createConditionRule,
  segmentHasConditionValue,
} from "@/lib/segment-conditions"
import { createStandaloneBuilderBlock, normalizeBuilderBlocks } from "@/lib/create-builder-template"
import {
  findBlockIndex,
  moveBlockAfterType,
  moveBlockBeforeType,
  moveBlockToStart,
} from "@/lib/block-layout-helpers"
import {
  normalizeBlockLayout,
  setBlockLayoutColumn,
} from "@/lib/block-layout"
import {
  formatVariablesListReply,
} from "@/lib/derive-template-variables"
import { createId } from "@/lib/create-id"
import {
  makeCreationBriefReply,
  makeGenerationSummaryMessage,
} from "@/lib/template-generation-steps"
import {
  applyAgentDemoChanges,
  DEMO_USER_PROMPT,
  DEMO_WELCOME_MESSAGE,
  finishAgentDemoPreview,
  formatDemoReply,
  scheduleAgentPreview,
} from "@/lib/agent-demo-flow"
import type {
  BlockDisplayCondition,
  BuilderBlock,
  BuilderBlockType,
  BuilderTemplate,
  ChatMessage,
  ConditionalSegment,
  PreviewScenario,
} from "@/types/prompt-builder"
import { PREVIEW_SCENARIOS } from "@/types/prompt-builder"
import { arrayMove } from "@dnd-kit/sortable"
import { create } from "zustand"

export type BuilderEditorMode = "edit" | "preview" | "sales"
export type PreviewPersona = "admin" | "sales"

export function isSalesRestrictedEditor(
  editorMode: BuilderEditorMode,
  previewPersona: PreviewPersona,
): boolean {
  return (
    editorMode === "sales" ||
    (editorMode === "preview" && previewPersona === "sales")
  )
}

function blockLockedInSalesMode(
  editorMode: BuilderEditorMode,
  previewPersona: PreviewPersona,
  block: BuilderBlock | undefined,
): boolean {
  return isSalesRestrictedEditor(editorMode, previewPersona) && isBlockLocked(block?.content)
}

function findTemplateBlock(
  template: BuilderTemplate | null,
  blockId: string,
): BuilderBlock | undefined {
  return template?.blocks.find((b) => b.id === blockId)
}
function findBlockByType(template: BuilderTemplate, type: BuilderBlock["type"]) {
  return template.blocks.find((b) => b.type === type)
}

function switchVariant(
  get: () => PromptBuilderStore,
  set: (partial: Partial<PromptBuilderStore> | ((s: PromptBuilderStore) => Partial<PromptBuilderStore>)) => void,
  type: BuilderBlock["type"],
  variantId: string,
  label: string,
): string | null {
  const { template } = get()
  if (!template) return null
  const block = findBlockByType(template, type)
  if (!block) return null
  get().setBlockVariant(block.id, variantId)
  set({ selectedBlockId: block.id })
  return `Switched the ${label} to the ${variantId.replace(/_/g, " ")} layout. Check the canvas preview.`
}

function applyBlockOrder(
  set: (partial: Partial<PromptBuilderStore> | ((s: PromptBuilderStore) => Partial<PromptBuilderStore>)) => void,
  blocks: BuilderBlock[],
  selectedBlockId?: string | null,
) {
  set((s) => {
    if (!s.template) return s
    return {
      template: {
        ...s.template,
        blocks: normalizeBlockLayout(blocks).map((block, index) => ({
          ...block,
          order: index,
        })),
      },
      selectedBlockId: selectedBlockId ?? s.selectedBlockId,
    }
  })
}

function tryLayoutFixReply(
  lower: string,
  template: BuilderTemplate,
  set: (partial: Partial<PromptBuilderStore> | ((s: PromptBuilderStore) => Partial<PromptBuilderStore>)) => void,
): string | null {
  const apply = (
    blocks: BuilderBlock[] | null,
    message: string,
    blockType?: BuilderBlockType,
  ): string | null => {
    if (!blocks) return null
    const block = blockType
      ? blocks.find((entry) => entry.type === blockType)
      : undefined
    applyBlockOrder(set, blocks, block?.id ?? null)
    return message
  }

  if (
    (lower.includes("quote summary") || lower.includes("summary header")) &&
    lower.includes("top")
  ) {
    return apply(
      moveBlockToStart(template.blocks, "quote_summary_header"),
      "Moved the quote summary header to the top.",
      "quote_summary_header",
    )
  }

  if (lower.includes("billed to") && lower.includes("before") && lower.includes("pricing")) {
    return apply(
      moveBlockBeforeType(template.blocks, "billed_to", "pricing"),
      "Moved billed to ahead of the pricing table.",
      "billed_to",
    )
  }

  if (
    lower.includes("contract details") &&
    lower.includes("before") &&
    lower.includes("pricing")
  ) {
    return apply(
      moveBlockBeforeType(template.blocks, "contract_details", "pricing"),
      "Moved contract details ahead of the pricing table.",
      "contract_details",
    )
  }

  if (lower.includes("tcv") && lower.includes("after") && lower.includes("pricing")) {
    return apply(
      moveBlockAfterType(template.blocks, "tcv_summary", "pricing"),
      "Moved the TCV summary after pricing so buyers see line items before the total.",
      "tcv_summary",
    )
  }

  if (
    lower.includes("entitlements") &&
    lower.includes("after") &&
    lower.includes("pricing")
  ) {
    return apply(
      moveBlockAfterType(template.blocks, "entitlements", "pricing"),
      "Moved entitlements after the pricing table.",
      "entitlements",
    )
  }

  if (lower.includes("terms") && lower.includes("after") && lower.includes("pricing")) {
    const { blocks } = template
    const entitlementsIndex = findBlockIndex(blocks, "entitlements")
    const pricingIndex = findBlockIndex(blocks, "pricing")
    if (entitlementsIndex >= 0 && pricingIndex >= 0 && entitlementsIndex > pricingIndex) {
      return apply(
        moveBlockAfterType(blocks, "terms", "entitlements"),
        "Moved terms and conditions after the commercial sections.",
        "terms",
      )
    }
    return apply(
      moveBlockAfterType(blocks, "terms", "pricing"),
      "Moved terms and conditions after pricing.",
      "terms",
    )
  }

  if (
    (lower.includes("ae profile") || lower.includes("ae")) &&
    lower.includes("after") &&
    lower.includes("signature")
  ) {
    return apply(
      moveBlockAfterType(template.blocks, "ae_profile", "signature"),
      "Moved the AE profile after the signature block.",
      "ae_profile",
    )
  }

  return null
}

type PromptBuilderStore = {
  template: BuilderTemplate | null
  selectedBlockId: string | null
  editorMode: BuilderEditorMode
  previewPersona: PreviewPersona
  activeScenario: PreviewScenario
  messages: ChatMessage[]
  isAgentTyping: boolean
  ignoredValidationIssueIds: string[]
  /** PDF picked during add-block flow — opens page picker on the new block */
  pendingImagePdfImport: {
    blockId: string
    fileName: string
    pdfDataUrl: string
    pageCount: number
  } | null

  initTemplate: (
    template: BuilderTemplate,
    options?: { generationStepLabels?: string[]; creationBrief?: string },
  ) => void
  openPreview: () => void
  closePreview: () => void
  setPreviewPersona: (persona: PreviewPersona) => void
  openSalesEdit: () => void
  closeSalesEdit: () => void
  setTemplateName: (name: string) => void
  setTemplateDisplayCondition: (condition: BlockDisplayCondition) => void
  setSelectedBlockId: (id: string | null) => void
  setActiveScenario: (scenario: PreviewScenario) => void
  updateBlockContent: (blockId: string, content: Record<string, unknown>) => void
  updateBlockField: (blockId: string, field: string, value: unknown) => void
  addBlock: (type: BuilderBlockType, afterId?: string) => void
  addBlockBeside: (blockId: string, type: BuilderBlockType) => void
  addImageBlockFromFile: (file: File, afterId?: string) => void
  addImageBlockFromFileBeside: (file: File, blockId: string) => void
  clearPendingImagePdfImport: () => void
  removeBlock: (blockId: string) => void
  reorderBlocks: (from: number, to: number) => void
  setBlockVariant: (blockId: string, variant: string) => void
  setBlockDisplayCondition: (
    blockId: string,
    condition: BlockDisplayCondition,
  ) => void
  setBlockLocked: (blockId: string, locked: boolean) => void
  cycleBlockVariant: (blockId: string) => void
  updateSegment: (
    blockId: string,
    segmentId: string,
    patch: Partial<ConditionalSegment>,
  ) => void
  addSegment: (blockId: string, segment: ConditionalSegment) => void
  removeSegment: (blockId: string, segmentId: string) => void
  ignoreValidationIssue: (issueId: string) => void
  sendMessage: (text: string) => void
}

function agentReply(
  text: string,
  get: () => PromptBuilderStore,
  set: (partial: Partial<PromptBuilderStore> | ((s: PromptBuilderStore) => Partial<PromptBuilderStore>)) => void,
): string {
  const lower = text.toLowerCase()
  const { template, selectedBlockId, activeScenario } = get()
  if (!template) return "No template loaded."

  if (
    lower.includes("variable") ||
    lower.includes("merge field") ||
    lower.includes("what fields") ||
    lower.includes("list fields") ||
    lower.includes("list merge")
  ) {
    return formatVariablesListReply(template)
  }

  const layoutFixReply = tryLayoutFixReply(lower, template, set)
  if (layoutFixReply) return layoutFixReply

  if (
    lower.includes("germany") &&
    (lower.includes("check") || lower.includes("should"))
  ) {
    const missing = !findBlockByType(template, "terms") ||
      !((findBlockByType(template, "terms")?.content.segments as ConditionalSegment[]) ?? []).some(
        (s) => segmentHasConditionValue(s.condition, "customer_region", "DE"),
      )
    if (missing) {
      return "For Germany customers, add a conditional VAT clause under Terms, verify billing address fields, and preview with the Germany · EU scenario chip."
    }
    return "Germany scenario looks covered — review the conditional terms segment and billing fields on the canvas."
  }

  if (lower.includes("remind") && lower.includes("logo")) {
    const header = findBlockByType(template, "quote_summary_header")
    if (header) set({ selectedBlockId: header.id })
    return "Your company logo appears at the top of the quote summary header — it uses your brand from setup."
  }

  if (lower.includes("image block") || (lower.includes("logo") && lower.includes("add"))) {
    const header = findBlockByType(template, "quote_summary_header")
    if (header) set({ selectedBlockId: header.id })
    return "Logo placement is in the quote summary header at the top of the document."
  }

  const variantMatchers: {
    match: (s: string) => boolean
    type: BuilderBlock["type"]
    variantId: string
    label: string
  }[] = [
    {
      match: (s) => s.includes("metric cards") || s.includes("tcv") && s.includes("cards"),
      type: "tcv_summary",
      variantId: "cards",
      label: "TCV summary",
    },
    {
      match: (s) => s.includes("inline") && s.includes("tcv"),
      type: "tcv_summary",
      variantId: "inline",
      label: "TCV summary",
    },
    {
      match: (s) => s.includes("centered") && s.includes("header"),
      type: "quote_summary_header",
      variantId: "centered",
      label: "quote summary",
    },
    {
      match: (s) => s.includes("minimal") && s.includes("header"),
      type: "quote_summary_header",
      variantId: "minimal",
      label: "quote summary",
    },
    {
      match: (s) => s.includes("split") && s.includes("billed"),
      type: "billed_to",
      variantId: "two_column",
      label: "billed to",
    },
    {
      match: (s) => s.includes("card") && s.includes("billed"),
      type: "billed_to",
      variantId: "card",
      label: "billed to",
    },
    {
      match: (s) => s.includes("timeline"),
      type: "contract_details",
      variantId: "timeline",
      label: "contract details",
    },
    {
      match: (s) => s.includes("definition list"),
      type: "contract_details",
      variantId: "list",
      label: "contract details",
    },
    {
      match: (s) => s.includes("quote-style") || s.includes("quote style") || s.includes("dotted"),
      type: "pricing",
      variantId: "quote",
      label: "pricing table",
    },
    {
      match: (s) => s.includes("compact") && s.includes("pricing"),
      type: "pricing",
      variantId: "compact",
      label: "pricing table",
    },
    {
      match: (s) =>
        s.includes("description") &&
        (s.includes("line item") || s.includes("pricing")),
      type: "pricing",
      variantId: "with_descriptions",
      label: "pricing table",
    },
    {
      match: (s) => s.includes("numbered") && s.includes("terms"),
      type: "terms",
      variantId: "numbered",
      label: "terms",
    },
    {
      match: (s) => s.includes("legal dense") || (s.includes("legal") && s.includes("terms")),
      type: "terms",
      variantId: "legal",
      label: "terms",
    },
    {
      match: (s) => s.includes("banner") && s.includes("ae"),
      type: "ae_profile",
      variantId: "banner",
      label: "AE profile",
    },
    {
      match: (s) => s.includes("inline") && s.includes("ae"),
      type: "ae_profile",
      variantId: "inline",
      label: "AE profile",
    },
    {
      match: (s) => s.includes("boxed") && s.includes("signature"),
      type: "signature",
      variantId: "boxed",
      label: "signature",
    },
    {
      match: (s) =>
        (s.includes("dual-party") || s.includes("dual party") || s.includes("countersign")) &&
        s.includes("signature"),
      type: "signature",
      variantId: "dual_party",
      label: "signature",
    },
    {
      match: (s) => s.includes("single") && s.includes("signature"),
      type: "signature",
      variantId: "single",
      label: "signature",
    },
    {
      match: (s) => s.includes("full bleed"),
      type: "custom_image",
      variantId: "full_bleed",
      label: "image block",
    },
    {
      match: (s) => s.includes("framed") && s.includes("image"),
      type: "custom_image",
      variantId: "framed",
      label: "image block",
    },
    {
      match: (s) => s.includes("callout"),
      type: "custom_text",
      variantId: "callout",
      label: "text block",
    },
    {
      match: (s) => s.includes("pull quote"),
      type: "custom_text",
      variantId: "pull_quote",
      label: "text block",
    },
  ]

  for (const { match, type, variantId, label } of variantMatchers) {
    if (match(lower)) {
      const reply = switchVariant(get, set, type, variantId, label)
      if (reply) return reply
    }
  }

  if (
    lower.includes("switch the") &&
    lower.includes("layout")
  ) {
    const selected = template.blocks.find((b) => b.id === selectedBlockId)
    if (selected) {
      const options = BLOCK_VARIANTS[selected.type]
      const target = options.find((o) => lower.includes(o.label.toLowerCase()))
      if (target) {
        get().setBlockVariant(selected.id, target.id)
        return `Updated the selected block to ${target.label}.`
      }
    }
  }

  if (
    lower.includes("conditional") &&
    (lower.includes("paragraph") || lower.includes("clause") || lower.includes("terms"))
  ) {
    const terms = findBlockByType(template, "terms")
    if (terms) {
      const region = activeScenario.values.customer_region
      const label =
        activeScenario.id === "new-de"
          ? "Germany"
          : activeScenario.id === "new-apac"
            ? "APAC"
            : "United States"
      get().addSegment(terms.id, {
        id: createId("seg"),
        condition: [
          {
            ...createConditionRule("customer_region"),
            value: region,
            label,
          },
        ],
        text: `Add ${label}-specific terms for the ${activeScenario.label} scenario.`,
      })
      set({ selectedBlockId: terms.id })
      return `Added a conditional paragraph for ${activeScenario.label}. Edit the text and condition on the canvas.`
    }
  }

  if (lower.includes("german") && lower.includes("vat")) {
    const terms = findBlockByType(template, "terms")
    if (terms) {
      const segments = (terms.content.segments as ConditionalSegment[]) ?? []
      const added = !segments.some((s) =>
        segmentHasConditionValue(s.condition, "customer_region", "DE"),
      )
      if (added) {
        get().addSegment(terms.id, {
          id: createId("seg"),
          condition: [
            {
              ...createConditionRule("customer_region"),
              value: "DE",
              label: "Germany",
            },
          ],
          text: "German customers: VAT applies at 19%. Invoices must include your USt-IdNr.",
        })
      }
      if (!isBlockLocked(terms.content)) {
        get().setBlockLocked(terms.id, true)
      }
      set({ selectedBlockId: terms.id })
      scheduleAgentPreview(get, "new-de")
      if (added) {
        return "Added a German VAT clause under Terms and locked the block for Sales.\n\nOpening preview on Germany · EU — the VAT paragraph appears when the customer region matches."
      }
      return "The German VAT clause is already in place and Terms are locked.\n\nOpening preview on Germany · EU so you can verify the clause renders."
    }
  }

  if (lower.includes("apac") && (lower.includes("payment") || lower.includes("paragraph"))) {
    const terms = findBlockByType(template, "terms")
    if (terms) {
      const segments = (terms.content.segments as ConditionalSegment[]) ?? []
      if (!segments.some((s) => segmentHasConditionValue(s.condition, "customer_region", "APAC"))) {
        get().addSegment(terms.id, {
          id: createId("seg"),
          condition: [
            {
              ...createConditionRule("customer_region"),
              value: "APAC",
              label: "APAC",
            },
          ],
          text: "APAC customers: Payment in USD. Wire transfer fees borne by the customer unless prepaid.",
        })
      }
      set({ selectedBlockId: terms.id })
      return "Added an APAC payment terms paragraph. Switch to the APAC · Prepaid scenario to preview."
    }
  }

  if (lower.includes("german") || lower.includes("germany") || lower.includes("apac") || lower.includes("region")) {
    const terms = findBlockByType(template, "terms")
    if (terms) {
      const segments = (terms.content.segments as ConditionalSegment[]) ?? []
      const hasDe = segments.some((s) =>
        segmentHasConditionValue(s.condition, "customer_region", "DE"),
      )
      const hasApac = segments.some((s) =>
        segmentHasConditionValue(s.condition, "customer_region", "APAC"),
      )
      if (!hasDe) {
        get().addSegment(terms.id, {
          id: createId("seg"),
          condition: [
            {
              ...createConditionRule("customer_region"),
              value: "DE",
              label: "Germany",
            },
          ],
          text: "German customers: VAT applies at 19%. Include USt-IdNr on invoices.",
        })
      }
      if (!hasApac) {
        get().addSegment(terms.id, {
          id: createId("seg"),
          condition: [
            {
              ...createConditionRule("customer_region"),
              value: "APAC",
              label: "APAC",
            },
          ],
          text: "APAC customers: Payment in USD. Local tax may apply.",
        })
      }
      set({ selectedBlockId: terms.id })
      return "Added conditional terms segments for Germany and APAC. Click each segment on the canvas to edit inline."
    }
  }

  if (lower.includes("tcv") || lower.includes("contract value") || lower.includes("emphasize")) {
    const tcv = findBlockByType(template, "tcv_summary")
    if (tcv) {
      get().setBlockVariant(tcv.id, "cards")
      get().updateBlockField(tcv.id, "emphasized", true)
      set({ selectedBlockId: tcv.id })
      return "Emphasized the TCV summary with the metric cards layout. Edit amounts directly on the canvas."
    }
  }

  if (
    lower.includes("expansion") &&
    (lower.includes("co-term") || lower.includes("coterm") || lower.includes("terms"))
  ) {
    const terms = findBlockByType(template, "terms")
    if (terms) {
      const segments = (terms.content.segments as ConditionalSegment[]) ?? []
      const added = !segments.some((s) =>
        segmentHasConditionValue(s.condition, "deal_type", "expansion"),
      )
      if (added) {
        get().addSegment(terms.id, {
          id: createId("seg"),
          condition: [
            {
              ...createConditionRule("deal_type"),
              value: "expansion",
              label: "Expansion",
            },
          ],
          text: "This expansion co-terms with the existing subscription. Prorated charges apply from the effective date.",
        })
      }
      if (!isBlockLocked(terms.content)) {
        get().setBlockLocked(terms.id, true)
      }
      set({ selectedBlockId: terms.id })
      scheduleAgentPreview(get, "exp-eu")
      if (added) {
        return "Added an expansion co-termination clause and locked Terms for Sales.\n\nOpening preview on EU · Co-term add-on — the co-term paragraph appears when deal type is Expansion."
      }
      return "The expansion co-term clause is already in place and Terms are locked.\n\nOpening preview on EU · Co-term add-on so you can verify it renders."
    }
  }

  if (
    lower.includes("termination") &&
    (lower.includes("wind-down") || lower.includes("wind down") || lower.includes("terms"))
  ) {
    const terms = findBlockByType(template, "terms")
    if (terms) {
      const segments = (terms.content.segments as ConditionalSegment[]) ?? []
      if (!segments.some((s) => segmentHasConditionValue(s.condition, "deal_type", "termination"))) {
        get().addSegment(terms.id, {
          id: createId("seg"),
          condition: [
            {
              ...createConditionRule("deal_type"),
              value: "termination",
              label: "Termination",
            },
          ],
          text: "Services wind down on the termination effective date. Final invoice reflects usage through that date.",
        })
      }
      set({ selectedBlockId: terms.id })
      return "Added a termination wind-down clause. Preview with the Termination · US scenario."
    }
  }

  if (lower.includes("entitlement")) {
    const hasEnt = template.blocks.some((b) => b.type === "entitlements")
    if (!hasEnt) {
      const pricing = findBlockByType(template, "pricing")
      get().addBlock("entitlements", pricing?.id)
      return "Added an entitlements block after pricing to explain what's included in the offer."
    }
    set({
      selectedBlockId: findBlockByType(template, "entitlements")?.id ?? null,
    })
    return "The entitlements block is on the canvas — edit rows inline to explain usage and limits."
  }

  if (lower.includes("signature")) {
    const hasSig = template.blocks.some((b) => b.type === "signature")
    if (!hasSig) {
      get().addBlock("signature")
      return "Added a signature block at the end of the template."
    }
    if (lower.includes("end") || lower.includes("last") || lower.includes("move")) {
      const sig = findBlockByType(template, "signature")
      if (sig) {
        set((s) => {
          if (!s.template) return s
          const blocks = s.template.blocks.filter((b) => b.id !== sig.id)
          blocks.push(sig)
          return {
            template: {
              ...s.template,
              blocks: blocks.map((b, i) => ({ ...b, order: i })),
            },
            selectedBlockId: sig.id,
          }
        })
        return "Moved the signature block to the end of the template."
      }
    }
    return "A signature block is already on the canvas."
  }

  if (lower.includes("ae") || lower.includes("account executive")) {
    const hasAe = template.blocks.some((b) => b.type === "ae_profile")
    if (!hasAe) {
      get().addBlock("ae_profile")
      return "Added an AE profile block with name, email, and phone. Edit the fields inline."
    }
    set({ selectedBlockId: template.blocks.find((b) => b.type === "ae_profile")?.id ?? null })
    return "The AE profile block is on the canvas — click to edit details inline."
  }

  if (lower.includes("table")) {
    get().addBlock("custom_table")
    return "Inserted a custom table block. Edit headers and cells directly on the canvas."
  }

  if (
    lower.includes("prepare this template") ||
    lower.includes("run demo") ||
    lower.includes("global sales team demo") ||
    lower.includes("sales-ready demo")
  ) {
    const changes = applyAgentDemoChanges(get())
    setTimeout(() => finishAgentDemoPreview(get()), 1400)
    return formatDemoReply(changes)
  }

  if (lower.includes("lock") && (lower.includes("terms") || lower.includes("legal"))) {
    const terms = findBlockByType(template, "terms")
    if (terms) {
      get().setBlockLocked(terms.id, true)
      set({ selectedBlockId: terms.id })
      return "Locked the Terms & conditions block. Sales won't be able to edit it at quote creation."
    }
  }

  if (lower.includes("text block") || lower.includes("custom text")) {
    get().addBlock("custom_text")
    return "Added a custom text block. Click the text on the canvas to edit."
  }

  return "I updated the template based on your request. Select any block on the canvas to edit content inline, or open Preview to check conditional sections for a scenario."
}

export const usePromptBuilderStore = create<PromptBuilderStore>((set, get) => ({
  template: null,
  selectedBlockId: null,
  editorMode: "edit",
  previewPersona: "admin",
  activeScenario: PREVIEW_SCENARIOS[0],
  messages: [],
  isAgentTyping: false,
  ignoredValidationIssueIds: [],
  pendingImagePdfImport: null,

  initTemplate: (template, options) => {
    const brief = options?.creationBrief?.trim()
    const now = new Date().toISOString()

    let messages: ChatMessage[]

    if (brief) {
      messages = [
        ...(options?.generationStepLabels?.length
          ? [makeGenerationSummaryMessage(options.generationStepLabels)]
          : []),
        {
          id: "creation-user",
          role: "user",
          content: brief,
          timestamp: now,
        },
        makeCreationBriefReply(brief),
      ]
    } else if (options?.generationStepLabels?.length) {
      messages = [
        makeGenerationSummaryMessage(options.generationStepLabels),
        {
          id: "welcome",
          role: "assistant",
          content:
            "Use the suggested prompts below to reshape the template, or type what you want in the chat.",
          timestamp: now,
        },
      ]
    } else {
      messages = [
        {
          id: "welcome",
          role: "assistant",
          content: DEMO_WELCOME_MESSAGE,
          timestamp: now,
        },
      ]
    }

    set({
      template: {
        ...template,
        blocks: normalizeBuilderBlocks(template.blocks),
      },
      selectedBlockId: null,
      editorMode: "edit",
      previewPersona: "admin",
      messages,
      activeScenario: PREVIEW_SCENARIOS[0],
      pendingImagePdfImport: null,
      ignoredValidationIssueIds: [],
    })
  },

  openPreview: () =>
    set({ editorMode: "preview", previewPersona: "admin", selectedBlockId: null }),

  closePreview: () => set({ editorMode: "edit", previewPersona: "admin" }),

  setPreviewPersona: (persona) => set({ previewPersona: persona }),

  openSalesEdit: () => set({ editorMode: "sales", selectedBlockId: null }),

  closeSalesEdit: () => set({ editorMode: "edit" }),

  setTemplateName: (name) =>
    set((s) =>
      s.template ? { template: { ...s.template, name } } : s,
    ),

  setTemplateDisplayCondition: (condition) =>
    set((s) =>
      s.template
        ? { template: { ...s.template, displayCondition: condition } }
        : s,
    ),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  setActiveScenario: (scenario) => set({ activeScenario: scenario }),

  updateBlockContent: (blockId, content) =>
    set((s) => {
      if (!s.template) return s
      const block = findTemplateBlock(s.template, blockId)
      if (blockLockedInSalesMode(s.editorMode, s.previewPersona, block)) return s
      return {
        template: {
          ...s.template,
          blocks: s.template.blocks.map((b) =>
            b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b,
          ),
        },
      }
    }),

  updateBlockField: (blockId, field, value) =>
    set((s) => {
      if (!s.template) return s
      const block = findTemplateBlock(s.template, blockId)
      if (
        field !== "locked" &&
        blockLockedInSalesMode(s.editorMode, s.previewPersona, block)
      ) {
        return s
      }
      return {
        template: {
          ...s.template,
          blocks: s.template.blocks.map((b) =>
            b.id === blockId
              ? { ...b, content: { ...b.content, [field]: value } }
              : b,
          ),
        },
      }
    }),

  addBlock: (type, afterId) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s
      const blocks = [...s.template.blocks]
      const newBlock = createStandaloneBuilderBlock(type, blocks.length)
      if (afterId === "__start__") {
        blocks.splice(0, 0, newBlock)
      } else if (afterId) {
        const idx = blocks.findIndex((b) => b.id === afterId)
        blocks.splice(idx + 1, 0, newBlock)
      } else {
        blocks.push(newBlock)
      }
      return {
        template: {
          ...s.template,
          blocks: normalizeBlockLayout(blocks).map((b, i) => ({ ...b, order: i })),
        },
        selectedBlockId: newBlock.id,
      }
    }),

  addBlockBeside: (blockId, type) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s
      const blocks = [...s.template.blocks]
      const index = blocks.findIndex((b) => b.id === blockId)
      if (index < 0) return s

      const leftBlock = blocks[index]
      const nextBlock = blocks[index + 1]
      if (nextBlock && String(nextBlock.content.layoutColumn) === "right") return s

      blocks[index] = setBlockLayoutColumn(leftBlock, "left")
      const newBlock = setBlockLayoutColumn(
        createStandaloneBuilderBlock(type, blocks.length),
        "right",
      )
      blocks.splice(index + 1, 0, newBlock)

      return {
        template: {
          ...s.template,
          blocks: normalizeBlockLayout(blocks).map((b, i) => ({ ...b, order: i })),
        },
        selectedBlockId: newBlock.id,
      }
    }),

  addImageBlockFromFile: (file, afterId) => {
    get().addBlock("custom_image", afterId)
    const blockId = get().selectedBlockId
    if (!blockId) return

    void (async () => {
      try {
        if (isImageFile(file)) {
          const previewUrl = await readFileAsDataUrl(file)
          get().updateBlockContent(blockId, {
            fileName: file.name,
            mediaType: "image",
            previewUrl,
            placeholder: false,
          })
          return
        }

        if (isPdfFile(file)) {
          const prepared = await preparePdfUpload(file)
          set({
            pendingImagePdfImport: {
              blockId,
              fileName: prepared.fileName,
              pdfDataUrl: prepared.pdfDataUrl,
              pageCount: prepared.pageCount,
            },
          })
          return
        }

        get().updateBlockContent(blockId, {
          uploadError: "Use a PDF or image (PNG, JPG, GIF, WebP).",
        })
      } catch {
        get().updateBlockContent(blockId, {
          uploadError: "Could not load file. Use a PDF or image (PNG, JPG, GIF, WebP).",
        })
      }
    })()
  },

  addImageBlockFromFileBeside: (file, blockId) => {
    get().addBlockBeside(blockId, "custom_image")
    const selectedId = get().selectedBlockId
    if (!selectedId) return

    void (async () => {
      try {
        if (isImageFile(file)) {
          const previewUrl = await readFileAsDataUrl(file)
          get().updateBlockContent(selectedId, {
            fileName: file.name,
            mediaType: "image",
            previewUrl,
            placeholder: false,
          })
          return
        }

        if (isPdfFile(file)) {
          const prepared = await preparePdfUpload(file)
          set({
            pendingImagePdfImport: {
              blockId: selectedId,
              fileName: prepared.fileName,
              pdfDataUrl: prepared.pdfDataUrl,
              pageCount: prepared.pageCount,
            },
          })
          return
        }

        get().updateBlockContent(selectedId, {
          uploadError: "Use a PDF or image (PNG, JPG, GIF, WebP).",
        })
      } catch {
        get().updateBlockContent(selectedId, {
          uploadError: "Could not load file. Use a PDF or image (PNG, JPG, GIF, WebP).",
        })
      }
    })()
  },

  clearPendingImagePdfImport: () => set({ pendingImagePdfImport: null }),

  removeBlock: (blockId) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s
      const blocks = normalizeBlockLayout(
        s.template.blocks.filter((b) => b.id !== blockId),
      )
      return {
        template: {
          ...s.template,
          blocks: blocks.map((b, i) => ({ ...b, order: i })),
        },
        selectedBlockId:
          s.selectedBlockId === blockId ? null : s.selectedBlockId,
      }
    }),

  reorderBlocks: (from, to) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s
      const blocks = normalizeBlockLayout(arrayMove(s.template.blocks, from, to))
      return {
        template: {
          ...s.template,
          blocks: blocks.map((b, i) => ({ ...b, order: i })),
        },
      }
    }),

  setBlockVariant: (blockId, variant) => {
    if (get().editorMode !== "edit") return
    get().updateBlockField(blockId, "variant", variant)
  },

  setBlockDisplayCondition: (blockId, condition) => {
    if (get().editorMode !== "edit") return
    get().updateBlockField(blockId, "displayCondition", condition)
  },

  setBlockLocked: (blockId, locked) => {
    if (get().editorMode !== "edit") return
    get().updateBlockField(blockId, "locked", locked)
  },

  cycleBlockVariant: (blockId) => {
    if (get().editorMode !== "edit") return
    const { template } = get()
    if (!template) return
    const block = template.blocks.find((b) => b.id === blockId)
    if (!block) return
    const options = BLOCK_VARIANTS[block.type]
    const current = String(block.content.variant ?? options[0]?.id)
    const idx = options.findIndex((o) => o.id === current)
    const next = options[(idx + 1) % options.length]
    get().setBlockVariant(blockId, next.id)
  },

  updateSegment: (blockId, segmentId, patch) =>
    set((s) => {
      if (!s.template) return s
      const block = findTemplateBlock(s.template, blockId)
      if (blockLockedInSalesMode(s.editorMode, s.previewPersona, block)) return s
      return {
        template: {
          ...s.template,
          blocks: s.template.blocks.map((b) => {
            if (b.id !== blockId || b.type !== "terms") return b
            const segments = (b.content.segments as ConditionalSegment[]) ?? []
            return {
              ...b,
              content: {
                ...b.content,
                segments: segments.map((seg) =>
                  seg.id === segmentId ? { ...seg, ...patch } : seg,
                ),
              },
            }
          }),
        },
      }
    }),

  addSegment: (blockId, segment) =>
    set((s) => {
      if (!s.template || s.editorMode !== "edit") return s
      return {
        template: {
          ...s.template,
          blocks: s.template.blocks.map((b) => {
            if (b.id !== blockId || b.type !== "terms") return b
            const segments = (b.content.segments as ConditionalSegment[]) ?? []
            return {
              ...b,
              content: { ...b.content, segments: [...segments, segment] },
            }
          }),
        },
      }
    }),

  removeSegment: (blockId, segmentId) =>
    set((s) => {
      if (!s.template || s.editorMode !== "edit") return s
      return {
        template: {
          ...s.template,
          blocks: s.template.blocks.map((b) => {
            if (b.id !== blockId || b.type !== "terms") return b
            const segments = (b.content.segments as ConditionalSegment[]) ?? []
            return {
              ...b,
              content: {
                ...b.content,
                segments: segments.filter((seg) => seg.id !== segmentId),
              },
            }
          }),
        },
      }
    }),

  ignoreValidationIssue: (issueId) =>
    set((s) => ({
      ignoredValidationIssueIds: s.ignoredValidationIssueIds.includes(issueId)
        ? s.ignoredValidationIssueIds
        : [...s.ignoredValidationIssueIds, issueId],
    })),

  sendMessage: (text) => {
    const userMsg: ChatMessage = {
      id: createId("msg"),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    }
    set((s) => ({
      messages: [...s.messages, userMsg],
      isAgentTyping: true,
    }))

    const delay = text === DEMO_USER_PROMPT ? 1100 : 700

    setTimeout(() => {
      const reply = agentReply(text, get, set)
      const assistantMsg: ChatMessage = {
        id: createId("msg"),
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      }
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isAgentTyping: false,
      }))
    }, delay)
  },
}))
