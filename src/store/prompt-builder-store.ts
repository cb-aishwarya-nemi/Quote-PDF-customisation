import { BLOCK_VARIANTS } from "@/lib/block-variants"
import {
  createConditionRule,
  segmentHasConditionValue,
} from "@/lib/segment-conditions"
import { createStandaloneBuilderBlock } from "@/lib/create-builder-template"
import {
  buildVariablesWelcomeMessage,
  formatVariablesListReply,
} from "@/lib/derive-template-variables"
import { createId } from "@/lib/create-id"
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
import { create } from "zustand"

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

export type BuilderEditorMode = "edit" | "preview"

type PromptBuilderStore = {
  template: BuilderTemplate | null
  selectedBlockId: string | null
  editorMode: BuilderEditorMode
  activeScenario: PreviewScenario
  messages: ChatMessage[]
  isAgentTyping: boolean

  initTemplate: (template: BuilderTemplate) => void
  openPreview: () => void
  closePreview: () => void
  setTemplateName: (name: string) => void
  setSelectedBlockId: (id: string | null) => void
  setActiveScenario: (scenario: PreviewScenario) => void
  updateBlockContent: (blockId: string, content: Record<string, unknown>) => void
  updateBlockField: (blockId: string, field: string, value: unknown) => void
  addBlock: (type: BuilderBlockType, afterId?: string) => void
  removeBlock: (blockId: string) => void
  setBlockVariant: (blockId: string, variant: string) => void
  setBlockDisplayCondition: (
    blockId: string,
    condition: BlockDisplayCondition,
  ) => void
  cycleBlockVariant: (blockId: string) => void
  updateSegment: (
    blockId: string,
    segmentId: string,
    patch: Partial<ConditionalSegment>,
  ) => void
  addSegment: (blockId: string, segment: ConditionalSegment) => void
  removeSegment: (blockId: string, segmentId: string) => void
  sendMessage: (text: string) => void
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I can help refine this quote template. Add blocks and I'll identify merge variables automatically.",
  timestamp: new Date().toISOString(),
}

function makeWelcomeMessage(template: BuilderTemplate): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    content: buildVariablesWelcomeMessage(template),
    timestamp: new Date().toISOString(),
  }
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
    const image = findBlockByType(template, "custom_image")
    if (image) {
      set({ selectedBlockId: image.id })
      return "Select the image block on the canvas and upload your company logo or brand PDF."
    }
    get().addBlock("custom_image")
    return "Added an image block — click it on the canvas to upload your logo."
  }

  if (lower.includes("image block") || (lower.includes("logo") && lower.includes("add"))) {
    const hasImage = template.blocks.some((b) => b.type === "custom_image")
    if (!hasImage) {
      get().addBlock("custom_image")
      return "Added an image block for your logo. Upload an image or PDF on the canvas."
    }
    set({ selectedBlockId: findBlockByType(template, "custom_image")?.id ?? null })
    return "An image block is already on the template — upload your asset directly on the canvas."
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
        activeScenario.id === "de"
          ? "Germany"
          : activeScenario.id === "apac"
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
      if (!segments.some((s) => segmentHasConditionValue(s.condition, "customer_region", "DE"))) {
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
      set({ selectedBlockId: terms.id })
      return "Added a German VAT clause under Terms. Preview with the Germany · EU scenario."
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

  if (lower.includes("signature")) {
    const hasSig = template.blocks.some((b) => b.type === "signature")
    if (!hasSig) {
      get().addBlock("signature")
      return "Added a signature block at the end of the template."
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
  activeScenario: PREVIEW_SCENARIOS[0],
  messages: [WELCOME],
  isAgentTyping: false,

  initTemplate: (template) =>
    set({
      template,
      selectedBlockId: null,
      editorMode: "edit",
      messages: [makeWelcomeMessage(template)],
      activeScenario: PREVIEW_SCENARIOS[0],
    }),

  openPreview: () => set({ editorMode: "preview", selectedBlockId: null }),

  closePreview: () => set({ editorMode: "edit" }),

  setTemplateName: (name) =>
    set((s) =>
      s.template ? { template: { ...s.template, name } } : s,
    ),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  setActiveScenario: (scenario) => set({ activeScenario: scenario }),

  updateBlockContent: (blockId, content) =>
    set((s) => {
      if (!s.template) return s
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
      if (!s.template) return s
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
          blocks: blocks.map((b, i) => ({ ...b, order: i })),
        },
        selectedBlockId: newBlock.id,
      }
    }),

  removeBlock: (blockId) =>
    set((s) => {
      if (!s.template) return s
      return {
        template: {
          ...s.template,
          blocks: s.template.blocks
            .filter((b) => b.id !== blockId)
            .map((b, i) => ({ ...b, order: i })),
        },
        selectedBlockId:
          s.selectedBlockId === blockId ? null : s.selectedBlockId,
      }
    }),

  setBlockVariant: (blockId, variant) =>
    get().updateBlockField(blockId, "variant", variant),

  setBlockDisplayCondition: (blockId, condition) =>
    get().updateBlockField(blockId, "displayCondition", condition),

  cycleBlockVariant: (blockId) => {
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
      if (!s.template) return s
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
      if (!s.template) return s
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
    }, 700)
  },
}))
