import { derivePublishChecklist, publishChecklistCanPublish } from "@/lib/publish-checklist"
import { PUBLISH_INTERSTITIAL_MS } from "@/lib/publish-flow"
import { findPreviewCustomer, scenarioForPreviewCustomer } from "@/data/preview-customers"
import { createId } from "@/lib/create-id"
import { flushBuilderAutosave } from "@/lib/builder-autosave"
import { withPersistedPdfImport } from "@/lib/template-pdf-import"
import { normalizeDocumentFooter } from "@/lib/document-footer"
import {
  INLINE_FRAGMENTS_KEY,
  resolveInlineFragments,
} from "@/lib/content-fragments"
import {
  createBlankBlocksPage,
  normalizeTemplatePages,
  normalizeTemplatePageOrder,
  QUOTE_PAGE_ID,
  resolveCustomPages,
} from "@/lib/template-pages"
import {
  findBlockInTemplate,
  findBlockPageId,
  getAddableBlockTypesForPage,
  getBlocksForPage,
  getCustomPageKind,
  INTRO_ONLY_BLOCK_TYPES,
  resolveBlockEditPageId,
  setBlocksForPage,
} from "@/lib/page-blocks"
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
  hasConditions,
  segmentHasConditionValue,
} from "@/lib/segment-conditions"
import { createStandaloneBuilderBlock, normalizeBuilderBlocks } from "@/lib/create-builder-template"
import { ADDABLE_BLOCKS } from "@/lib/block-variants"
import {
  findBlockIndex,
  moveBlockAfterType,
  moveBlockBeforeType,
  moveSignatureToClosingPosition,
  resolveDefaultAddBlockIndex,
} from "@/lib/block-layout-helpers"
import {
  blocksAreActivePair,
  enforceBlockLayoutRules,
  removeBlockFromLayout,
  setBlockCanvasWidth as applyBlockCanvasWidth,
  setBlockLayoutColumn,
} from "@/lib/block-layout"
import {
  applyBlockDrop,
  type BlockDropTarget,
} from "@/lib/block-layout-drag"
import { canBlocksFormPair } from "@/lib/block-layout-rules"
import {
  formatVariablesListReply,
} from "@/lib/derive-template-variables"
import {
  makeCreationBriefReply,
  makeExtractionSummaryMessage,
  makeGenerationSummaryMessage,
  makePdfVariableMappingMessage,
} from "@/lib/template-generation-steps"
import {
  applyPdfMappingToTemplate,
  ensurePdfFieldMappingsReviewSet,
  getMappableVariables,
  normalizePdfFieldMapping,
  type PdfFieldMapping,
} from "@/lib/pdf-field-mappings"
import {
  createMappingLearning,
  makeLearningAssistantMessage,
  removeMappingLearnings,
  type PdfMappingLearning,
} from "@/lib/pdf-mapping-learnings"
import type { PdfExtractionSummary } from "@/lib/pdf-template-extractor"
import {
  applyTermsVariantToSegments,
  analyzeTermsConditionalOverlap,
  describeTermsConditionalOverlapMessage,
} from "@/lib/terms-segments"
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
  DocumentFooterConfig,
  PreviewScenario,
} from "@/types/prompt-builder"
import { PREVIEW_SCENARIOS } from "@/types/prompt-builder"
import { arrayMove } from "@dnd-kit/sortable"
import { create } from "zustand"
import { useTemplateLibraryStore, type PublishedBuilderTemplate } from "@/store/template-library-store"

export type BuilderEditorMode = "edit" | "preview" | "sales"
export type PreviewPersona = "admin" | "sales"

export type BuilderWorkflowTab = "data_mapping" | "canvas"

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
  return findBlockInTemplate(template, blockId)
}

function normalizePageBlocks(blocks: BuilderBlock[]): BuilderBlock[] {
  return enforceBlockLayoutRules(blocks).map((block, index) => ({
    ...block,
    order: index,
  }))
}

function applyPageBlocks(
  set: (partial: Partial<PromptBuilderStore> | ((s: PromptBuilderStore) => Partial<PromptBuilderStore>)) => void,
  pageId: string,
  blocks: BuilderBlock[],
  selectedBlockId?: string | null,
) {
  set((s) => {
    if (!s.template) return s
    return {
      template: setBlocksForPage(s.template, pageId, normalizePageBlocks(blocks)),
      selectedBlockId: selectedBlockId ?? s.selectedBlockId,
    }
  })
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
  pageId: string = QUOTE_PAGE_ID,
) {
  applyPageBlocks(set, pageId, blocks, selectedBlockId)
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
    (lower.includes("terms") || lower.includes("conditions"))
  ) {
    return apply(
      moveBlockAfterType(template.blocks, "entitlements", "terms"),
      "Moved entitlements after terms and conditions.",
      "entitlements",
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
    (lower.includes("signature") || lower.includes("sign-off")) &&
    lower.includes("before") &&
    lower.includes("ae")
  ) {
    return apply(
      moveBlockBeforeType(template.blocks, "signature", "ae_profile"),
      "Moved the signature block before AE details.",
      "signature",
    )
  }

  if (
    (lower.includes("ae profile") || lower.includes("ae")) &&
    lower.includes("after") &&
    lower.includes("signature")
  ) {
    return apply(
      moveBlockAfterType(template.blocks, "ae_profile", "signature"),
      "Moved AE details after the signature block.",
      "ae_profile",
    )
  }

  if (
    (lower.includes("signature") || lower.includes("sign-off")) &&
    (lower.includes("end") || lower.includes("last") || lower.includes("move"))
  ) {
    return apply(
      moveSignatureToClosingPosition(template.blocks),
      "Moved the signature block to the closing section before AE details.",
      "signature",
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
  activePreviewCustomerId: string | null
  messages: ChatMessage[]
  isAgentTyping: boolean
  ignoredValidationIssueIds: string[]
  conditionStripHighlighted: boolean
  /** PDF picked during add-block flow — opens page picker on the new block */
  pendingImagePdfImport: {
    blockId: string
    fileName: string
    pdfDataUrl: string
    pdfBytes: ArrayBuffer
    pageCount: number
  } | null
  /** PDF picked for intro page — opens page picker when intro editor mounts */
  pendingIntroPdfImport: {
    pageId: string
    fileName: string
    pdfDataUrl: string
    pdfBytes?: ArrayBuffer
    pageCount: number
  } | null
  pdfFieldMappings: PdfFieldMapping[]
  pdfSourceFileName: string | null
  pdfSourceDataUrl: string | null
  pdfMappingLearnings: PdfMappingLearning[]
  builderWorkflowTab: BuilderWorkflowTab

  initTemplate: (
    template: BuilderTemplate,
    options?: {
      generationStepLabels?: string[]
      creationBrief?: string
      extractionSummary?: PdfExtractionSummary
    },
  ) => void
  openPreview: () => void
  closePreview: () => void
  setPreviewPersona: (persona: PreviewPersona) => void
  openSalesEdit: () => void
  closeSalesEdit: () => void
  setTemplateName: (name: string) => void
  setTemplateDisplayCondition: (condition: BlockDisplayCondition) => void
  highlightConditionStrip: () => void
  clearConditionStripHighlight: () => void
  setDocumentFooter: (patch: Partial<DocumentFooterConfig>) => void
  addPage: (anchorPageId?: string, position?: "after" | "before") => void
  addIntroPage: () => void
  updatePage: (pageId: string, content: Record<string, unknown>) => void
  updateIntroPage: (content: Record<string, unknown>) => void
  removePage: (pageId: string) => void
  removeIntroPage: () => void
  reorderPages: (fromIndex: number, toIndex: number) => void
  activePageId: string
  setActivePageId: (pageId: string) => void
  setSelectedBlockId: (id: string | null) => void
  setBuilderWorkflowTab: (tab: BuilderWorkflowTab) => void
  ensurePdfFieldMappingsReviewSet: () => void
  updatePdfFieldMapping: (
    id: string,
    patch: Partial<Pick<PdfFieldMapping, "pdfExcerpt" | "mappedValue">>,
  ) => void
  remapPdfFieldMapping: (id: string, variableId: string) => void
  setPdfMappingFeedback: (id: string, feedback: "up" | "down" | null) => void
  setActiveScenario: (scenario: PreviewScenario) => void
  setActivePreviewCustomer: (customerId: string | null) => void
  updateBlockContent: (blockId: string, content: Record<string, unknown>) => void
  updateBlockField: (blockId: string, field: string, value: unknown) => void
  reorderInlineFragments: (
    blockId: string,
    activeFragmentId: string,
    overFragmentId: string,
  ) => void
  addBlock: (type: BuilderBlockType, afterId?: string, pageId?: string) => void
  addBlockBeside: (blockId: string, type: BuilderBlockType, pageId?: string) => void
  addBlockBesideLeft: (blockId: string, type: BuilderBlockType, pageId?: string) => void
  addImageBlockFromFile: (file: File, afterId?: string, pageId?: string) => void
  addImageBlockFromFileBeside: (file: File, blockId: string) => void
  addImageBlockFromFileBesideLeft: (file: File, blockId: string) => void
  clearPendingImagePdfImport: () => void
  setPendingIntroPdfImport: (payload: {
    pageId: string
    fileName: string
    pdfDataUrl: string
    pdfBytes?: ArrayBuffer
    pageCount: number
  }) => void
  clearPendingIntroPdfImport: () => void
  removeBlock: (blockId: string) => void
  reorderBlocks: (from: number, to: number, pageId?: string) => void
  moveBlockDrop: (
    blockId: string,
    target: BlockDropTarget,
    pageId?: string,
  ) => void
  setBlockCanvasWidth: (blockId: string, width: "half" | "full") => void
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
  reorderSegments: (
    blockId: string,
    activeSegmentId: string,
    overSegmentId: string,
  ) => void
  ignoreValidationIssue: (issueId: string) => void
  sendMessage: (text: string) => void
  assistantExpandTick: number
  publishingTemplateName: string | null
  requestPublish: () => void
  confirmPublish: () => PublishedBuilderTemplate | null
  publishTemplate: (
    onComplete: (result: PublishedBuilderTemplate | null) => void,
  ) => void
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
    lower.includes("overlapping") &&
    (lower.includes("terms") ||
      lower.includes("conditional") ||
      lower.includes("clause"))
  ) {
    const terms = findBlockByType(template, "terms")
    if (!terms) {
      return "Add a Terms & conditions block first, then add conditional clauses."
    }

    const segments = (terms.content.segments as ConditionalSegment[]) ?? []
    const overlap = analyzeTermsConditionalOverlap(segments, PREVIEW_SCENARIOS)
    set({ selectedBlockId: terms.id })

    if (!overlap.hasOverlap) {
      return "No overlapping conditional clauses right now. Drag segments to set priority if you add more — the first match wins."
    }

    return `${describeTermsConditionalOverlapMessage(overlap)}\n\nDrag segments in the Terms block to set priority. Narrow conditions so only the intended clause matches each scenario.`
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
    const logoBlock = findBlockByType(template, "company_logo")
    if (logoBlock) set({ selectedBlockId: logoBlock.id })
    return "Your company logo is the first block on the quote — click it to upload or replace your mark."
  }

  if (lower.includes("image block") || (lower.includes("logo") && lower.includes("add"))) {
    const logoBlock = findBlockByType(template, "company_logo")
    if (logoBlock) set({ selectedBlockId: logoBlock.id })
    return "Logo placement is in the Company logo block at the top of the document."
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
      match: (s) => s.includes("table") && s.includes("terms"),
      type: "terms",
      variantId: "table",
      label: "terms",
    },
    {
      match: (s) =>
        (s.includes("legal dense") ||
          s.includes("content dense") ||
          (s.includes("legal") && s.includes("terms"))) &&
        !s.includes("numbered") &&
        !s.includes("table"),
      type: "terms",
      variantId: "dense",
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
      const terms = findBlockByType(template, "terms")
      const pricing = findBlockByType(template, "pricing")
      get().addBlock("entitlements", terms?.id ?? pricing?.id)
      return "Added an entitlements block after terms to explain what's included in the offer."
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
          const nextBlocks = moveSignatureToClosingPosition(s.template.blocks)
          if (!nextBlocks) return s
          return {
            template: {
              ...s.template,
              blocks: nextBlocks.map((b, i) => ({ ...b, order: i })),
            },
            selectedBlockId: sig.id,
          }
        })
        const hasAe = template.blocks.some((b) => b.type === "ae_profile")
        return hasAe
          ? "Moved the signature block before AE details."
          : "Moved the signature block to the end of the template."
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
  activePreviewCustomerId: "cust-zenith",
  messages: [],
  isAgentTyping: false,
  ignoredValidationIssueIds: [],
  conditionStripHighlighted: false,
  assistantExpandTick: 0,
  publishingTemplateName: null,
  pendingImagePdfImport: null,
  pendingIntroPdfImport: null,
  pdfFieldMappings: [],
  pdfSourceFileName: null,
  pdfSourceDataUrl: null,
  pdfMappingLearnings: [],
  builderWorkflowTab: "canvas",
  activePageId: QUOTE_PAGE_ID,

  initTemplate: (template, options) => {
    const brief = options?.creationBrief?.trim()
    const now = new Date().toISOString()

    let messages: ChatMessage[]

    const summaryMessage =
      options?.extractionSummary && options.generationStepLabels?.length
        ? makeExtractionSummaryMessage(
            options.generationStepLabels,
            options.extractionSummary,
          )
        : options?.generationStepLabels?.length
          ? makeGenerationSummaryMessage(options.generationStepLabels)
          : null

    const mappingMessage = options?.extractionSummary
      ? makePdfVariableMappingMessage(options.extractionSummary)
      : null

    if (brief) {
      messages = [
        ...(summaryMessage ? [summaryMessage] : []),
        ...(mappingMessage ? [mappingMessage] : []),
        {
          id: "creation-user",
          role: "user",
          content: brief,
          timestamp: now,
        },
        makeCreationBriefReply(brief),
      ]
    } else if (summaryMessage) {
      messages = [
        summaryMessage,
        ...(mappingMessage ? [mappingMessage] : []),
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

    const normalizedTemplate = normalizeTemplatePages({
      ...template,
      blocks: normalizeBuilderBlocks(template.blocks),
    })
    const persistedPdfImport = normalizedTemplate.pdfImport
    const rawMappings = (
      options?.extractionSummary?.fieldMappings ??
      persistedPdfImport?.fieldMappings ??
      []
    ).map(normalizePdfFieldMapping)
    const pdfFieldMappings = ensurePdfFieldMappingsReviewSet(
      rawMappings,
      normalizedTemplate,
    )
    const pdfSourceFileName =
      options?.extractionSummary?.sourceFileName ??
      persistedPdfImport?.sourceFileName ??
      null
    const pdfSourceDataUrl =
      options?.extractionSummary?.sourcePdfDataUrl ??
      persistedPdfImport?.sourcePdfDataUrl ??
      null
    const pdfMappingLearnings = persistedPdfImport?.mappingLearnings ?? []
    const isFreshPdfUpload = Boolean(options?.extractionSummary)

    const defaultCustomer = findPreviewCustomer("cust-zenith")
    const defaultScenario =
      (defaultCustomer && scenarioForPreviewCustomer(defaultCustomer)) ??
      PREVIEW_SCENARIOS[0]

    set({
      template: normalizedTemplate,
      selectedBlockId: null,
      editorMode: "edit",
      previewPersona: "admin",
      messages,
      activeScenario: defaultScenario,
      activePreviewCustomerId: defaultCustomer?.id ?? null,
      pendingImagePdfImport: null,
      pendingIntroPdfImport: null,
      pdfFieldMappings,
      pdfSourceFileName,
      pdfSourceDataUrl,
      pdfMappingLearnings,
      builderWorkflowTab:
        isFreshPdfUpload && pdfFieldMappings.length > 0
          ? "data_mapping"
          : "canvas",
      ignoredValidationIssueIds: [],
      conditionStripHighlighted: false,
      activePageId: QUOTE_PAGE_ID,
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
    set((s) => {
      if (!s.template || s.editorMode !== "edit") return s
      const next = {
        template: { ...s.template, displayCondition: condition },
      }
      if (hasConditions(condition)) {
        return { ...next, conditionStripHighlighted: false }
      }
      return next
    }),

  highlightConditionStrip: () => set({ conditionStripHighlighted: true }),

  clearConditionStripHighlight: () => set({ conditionStripHighlighted: false }),

  setDocumentFooter: (patch) =>
    set((s) =>
      s.template
        ? {
            template: {
              ...s.template,
              documentFooter: normalizeDocumentFooter({
                ...s.template.documentFooter,
                ...patch,
              }),
            },
          }
        : s,
    ),

  addPage: (anchorPageId, position = "after") =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) {
        return s
      }

      const template = normalizeTemplatePages(s.template)
      const customPages = resolveCustomPages(template)
      const order = normalizeTemplatePageOrder(template)
      const anchorIndex =
        anchorPageId != null ? order.indexOf(anchorPageId) : -1
      const quoteIndex = order.indexOf(QUOTE_PAGE_ID)
      const insertIndex =
        anchorIndex >= 0
          ? position === "before"
            ? anchorIndex
            : anchorIndex + 1
          : quoteIndex >= 0
            ? quoteIndex
            : order.length

      if (customPages.length === 0) {
        const page = createBlankBlocksPage(1)
        const nextOrder = [
          ...order.slice(0, insertIndex),
          page.id,
          ...order.slice(insertIndex),
        ]

        return {
          template: {
            ...template,
            customPages: [page],
            pageOrder: nextOrder,
            introPage: undefined,
          },
          activePageId: page.id,
          selectedBlockId: null,
        }
      }

      const page = createBlankBlocksPage(customPages.length + 1)
      const nextOrder = [
        ...order.slice(0, insertIndex),
        page.id,
        ...order.slice(insertIndex),
      ]

      return {
        template: {
          ...template,
          customPages: [...customPages, page],
          pageOrder: nextOrder,
          introPage: undefined,
        },
        activePageId: page.id,
        selectedBlockId: null,
      }
    }),

  addIntroPage: () => get().addPage(),

  updatePage: (pageId, content) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) {
        return s
      }
      const template = normalizeTemplatePages(s.template)
      const customPages = resolveCustomPages(template)
      const index = customPages.findIndex((page) => page.id === pageId)
      if (index < 0) return s

      const page = customPages[index]
      if (getCustomPageKind(page) !== "intro") return s

      const nextPages = customPages.map((entry, i) =>
        i === index
          ? {
              ...entry,
              content: { ...(entry.content ?? {}), ...content },
            }
          : entry,
      )

      return {
        template: {
          ...template,
          customPages: nextPages,
          introPage: undefined,
        },
      }
    }),

  updateIntroPage: (content) => {
    const template = get().template
    if (!template) return
    const firstCustom = resolveCustomPages(template)[0]
    if (firstCustom) get().updatePage(firstCustom.id, content)
  },

  removePage: (pageId) => {
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) {
        return s
      }
      if (pageId === QUOTE_PAGE_ID) return s

      const selectedOnDeletedPage =
        s.selectedBlockId != null &&
        findBlockPageId(s.template, s.selectedBlockId) === pageId

      const customPages = resolveCustomPages(s.template).filter(
        (page) => page.id !== pageId,
      )
      const order = normalizeTemplatePageOrder({
        ...s.template,
        customPages,
        introPage: null,
      }).filter((id) => id !== pageId)

      return {
        template: normalizeTemplatePages({
          ...s.template,
          customPages,
          pageOrder: order,
          introPage: null,
        }),
        activePageId:
          s.activePageId === pageId ? QUOTE_PAGE_ID : s.activePageId,
        selectedBlockId:
          s.activePageId === pageId || selectedOnDeletedPage
            ? null
            : s.selectedBlockId,
        pendingIntroPdfImport:
          s.pendingIntroPdfImport?.pageId === pageId
            ? null
            : s.pendingIntroPdfImport,
      }
    })
    flushBuilderAutosave()
  },

  removeIntroPage: () => {
    const template = get().template
    if (!template) return
    const firstCustom = resolveCustomPages(template)[0]
    if (firstCustom) get().removePage(firstCustom.id)
  },

  reorderPages: (fromIndex, toIndex) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) {
        return s
      }
      if (fromIndex === toIndex) return s
      const order = normalizeTemplatePageOrder(s.template)
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= order.length ||
        toIndex >= order.length
      ) {
        return s
      }
      return {
        template: normalizeTemplatePages({
          ...s.template,
          pageOrder: arrayMove(order, fromIndex, toIndex),
        }),
      }
    }),

  setSelectedBlockId: (id) => set({ selectedBlockId: id }),

  setBuilderWorkflowTab: (tab) => set({ builderWorkflowTab: tab }),

  ensurePdfFieldMappingsReviewSet: () =>
    set((s) => {
      if (!s.template || s.pdfFieldMappings.length === 0) return s
      const pdfFieldMappings = ensurePdfFieldMappingsReviewSet(
        s.pdfFieldMappings,
        s.template,
      )
      const unchanged =
        pdfFieldMappings.length === s.pdfFieldMappings.length &&
        pdfFieldMappings.every(
          (mapping, index) =>
            mapping.id === s.pdfFieldMappings[index]?.id &&
            mapping.pdfExcerpt === s.pdfFieldMappings[index]?.pdfExcerpt &&
            mapping.status === s.pdfFieldMappings[index]?.status &&
            mapping.feedback === s.pdfFieldMappings[index]?.feedback,
        )
      if (unchanged) return s
      return { pdfFieldMappings }
    }),

  updatePdfFieldMapping: (id, patch) =>
    set((s) => {
      if (!s.template) return s
      const index = s.pdfFieldMappings.findIndex((mapping) => mapping.id === id)
      if (index < 0) return s

      const current = s.pdfFieldMappings[index]
      const nextMapping = normalizePdfFieldMapping({
        ...current,
        ...patch,
        source:
          current.source === "user" ||
          patch.mappedValue !== undefined ||
          patch.pdfExcerpt !== undefined
            ? "user"
            : current.source,
        status:
          (current.status === "unmapped" || patch.mappedValue !== undefined) &&
          (patch.mappedValue?.trim() ?? current.mappedValue.trim())
            ? "mapped"
            : current.status,
      })

      if (patch.pdfExcerpt !== undefined && current.status === "unmapped") {
        nextMapping.mappedValue = patch.pdfExcerpt.trim()
      }

      if (patch.mappedValue !== undefined && patch.mappedValue.trim()) {
        if (!nextMapping.pdfExcerpt.trim()) {
          nextMapping.pdfExcerpt = patch.mappedValue.trim()
        }
      }

      const pdfFieldMappings = [...s.pdfFieldMappings]
      pdfFieldMappings[index] = nextMapping

      const template = nextMapping.mappedValue.trim()
        ? applyPdfMappingToTemplate(s.template, nextMapping)
        : s.template
      return { template, pdfFieldMappings }
    }),

  remapPdfFieldMapping: (id, variableId) =>
    set((s) => {
      if (!s.template) return s
      const index = s.pdfFieldMappings.findIndex((mapping) => mapping.id === id)
      if (index < 0) return s

      const current = s.pdfFieldMappings[index]
      const variable = getMappableVariables(s.template).find(
        (item) => item.id === variableId,
      )
      if (!variable) return s

      const correctedFrom =
        current.variableKey !== variable.key
          ? { key: current.variableKey, label: current.variableLabel }
          : undefined

      const resolvedValue =
        current.mappedValue.trim() || current.pdfExcerpt.trim()

      const nextMapping = normalizePdfFieldMapping({
        ...current,
        id: `${variable.blockId}:${variable.field}:${variable.key}`,
        blockId: variable.blockId,
        blockType: variable.blockType,
        blockLabel: variable.blockLabel,
        field: variable.field,
        variableKey: variable.key,
        variableLabel: variable.label,
        category: variable.category,
        source: "user",
        feedback: current.feedback === "down" ? "down" : current.feedback,
        mappedValue: resolvedValue,
        status: "mapped",
      })

      const pdfFieldMappings = s.pdfFieldMappings.map((mapping, mappingIndex) =>
        mappingIndex === index ? nextMapping : mapping,
      )

      let pdfMappingLearnings = s.pdfMappingLearnings
      let messages = s.messages

      if (current.feedback === "down" && correctedFrom) {
        const learning = createMappingLearning(nextMapping, "down", correctedFrom)
        pdfMappingLearnings = [...pdfMappingLearnings, learning]
        const reply = makeLearningAssistantMessage(pdfMappingLearnings)
        if (reply) {
          messages = [
            ...messages,
            {
              id: learning.id,
              role: "assistant" as const,
              content: reply,
              timestamp: learning.createdAt,
            },
          ]
        }
      }

      const template = nextMapping.mappedValue.trim()
        ? applyPdfMappingToTemplate(s.template, nextMapping)
        : s.template

      return { template, pdfFieldMappings, pdfMappingLearnings, messages }
    }),

  setPdfMappingFeedback: (id, feedback) =>
    set((s) => {
      const index = s.pdfFieldMappings.findIndex((mapping) => mapping.id === id)
      if (index < 0) return s

      const current = s.pdfFieldMappings[index]
      if (current.feedback === feedback) return s

      const removedLearningIds = s.pdfMappingLearnings
        .filter((learning) => learning.id.startsWith(`learning-${id}-`))
        .map((learning) => learning.id)

      const pdfFieldMappings = [...s.pdfFieldMappings]
      pdfFieldMappings[index] = { ...current, feedback }

      const pdfMappingLearnings = removeMappingLearnings(
        s.pdfMappingLearnings,
        id,
      )
      const messages = s.messages.filter(
        (message) =>
          message.role !== "assistant" ||
          !removedLearningIds.includes(message.id),
      )

      if (!feedback) {
        return { pdfFieldMappings, pdfMappingLearnings, messages }
      }

      const learning = createMappingLearning(current, feedback)
      const nextLearnings = [...pdfMappingLearnings, learning]
      const reply = makeLearningAssistantMessage(nextLearnings)
      const nextMessages = reply
        ? [
            ...messages,
            {
              id: learning.id,
              role: "assistant" as const,
              content: reply,
              timestamp: learning.createdAt,
            },
          ]
        : messages

      return {
        pdfFieldMappings,
        pdfMappingLearnings: nextLearnings,
        messages: nextMessages,
      }
    }),

  setActivePageId: (pageId) =>
    set({ activePageId: pageId, selectedBlockId: null }),

  setActiveScenario: (scenario) => set({ activeScenario: scenario }),

  setActivePreviewCustomer: (customerId) =>
    set((state) => {
      const customer = findPreviewCustomer(customerId)
      const scenario = customer ? scenarioForPreviewCustomer(customer) : null
      return {
        activePreviewCustomerId: customer?.id ?? null,
        activeScenario: scenario ?? state.activeScenario,
      }
    }),

  updateBlockContent: (blockId, content) =>
    set((s) => {
      if (!s.template) return s
      const block = findTemplateBlock(s.template, blockId)
      if (blockLockedInSalesMode(s.editorMode, s.previewPersona, block)) return s
      if (!block) return s

      const quoteIndex = s.template.blocks.findIndex((b) => b.id === blockId)
      if (quoteIndex >= 0) {
        const blocks = s.template.blocks.map((b) =>
          b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b,
        )
        return { template: { ...s.template, blocks } }
      }

      const customPages = resolveCustomPages(s.template).map((page) => {
        if (!page.blocks?.some((b) => b.id === blockId)) return page
        return {
          ...page,
          blocks: page.blocks.map((b) =>
            b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b,
          ),
        }
      })

      return {
        template: { ...s.template, customPages, introPage: undefined },
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
      if (!block) return s

      const patchBlock = (b: BuilderBlock) =>
        b.id === blockId
          ? { ...b, content: { ...b.content, [field]: value } }
          : b

      const quoteIndex = s.template.blocks.findIndex((b) => b.id === blockId)
      if (quoteIndex >= 0) {
        return {
          template: {
            ...s.template,
            blocks: s.template.blocks.map(patchBlock),
          },
        }
      }

      const customPages = resolveCustomPages(s.template).map((page) => {
        if (!page.blocks?.some((b) => b.id === blockId)) return page
        return { ...page, blocks: page.blocks.map(patchBlock) }
      })

      return {
        template: { ...s.template, customPages, introPage: undefined },
      }
    }),

  reorderInlineFragments: (blockId, activeFragmentId, overFragmentId) =>
    set((s) => {
      if (!s.template) return s
      const block = findTemplateBlock(s.template, blockId)
      if (!block) return s

      const fragments = resolveInlineFragments(block)
      const fromIndex = fragments.findIndex((f) => f.id === activeFragmentId)
      const toIndex = fragments.findIndex((f) => f.id === overFragmentId)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return s

      const nextFragments = arrayMove(fragments, fromIndex, toIndex)
      const patchBlock = (b: BuilderBlock) =>
        b.id === blockId
          ? {
              ...b,
              content: { ...b.content, [INLINE_FRAGMENTS_KEY]: nextFragments },
            }
          : b

      const quoteIndex = s.template.blocks.findIndex((b) => b.id === blockId)
      if (quoteIndex >= 0) {
        return {
          template: {
            ...s.template,
            blocks: s.template.blocks.map(patchBlock),
          },
        }
      }

      const customPages = resolveCustomPages(s.template).map((page) => {
        if (!page.blocks?.some((b) => b.id === blockId)) return page
        return { ...page, blocks: page.blocks.map(patchBlock) }
      })

      return {
        template: { ...s.template, customPages, introPage: undefined },
      }
    }),

  addBlock: (type, afterId, pageId) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s
      if (!ADDABLE_BLOCKS.some((entry) => entry.type === type)) return s
      if (INTRO_ONLY_BLOCK_TYPES.includes(type)) return s

      const targetPageId =
        pageId ??
        (afterId && afterId !== "__start__"
          ? findBlockPageId(s.template, afterId)
          : undefined) ??
        resolveBlockEditPageId(s.template, s.activePageId)
      const allowed = getAddableBlockTypesForPage(s.template, targetPageId)
      if (!allowed.includes(type)) return s

      const blocks = [...getBlocksForPage(s.template, targetPageId)]
      const newBlock = createStandaloneBuilderBlock(type, blocks.length)
      if (afterId === "__start__") {
        blocks.splice(0, 0, newBlock)
      } else if (afterId) {
        const idx = blocks.findIndex((b) => b.id === afterId)
        blocks.splice(idx + 1, 0, newBlock)
      } else {
        blocks.splice(resolveDefaultAddBlockIndex(blocks, type), 0, newBlock)
      }
      return {
        template: setBlocksForPage(s.template, targetPageId, normalizePageBlocks(blocks)),
        selectedBlockId: newBlock.id,
        activePageId: targetPageId,
      }
    }),

  addBlockBeside: (blockId, type, pageId) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s
      if (!ADDABLE_BLOCKS.some((entry) => entry.type === type)) return s
      if (INTRO_ONLY_BLOCK_TYPES.includes(type)) return s

      const targetPageId =
        pageId ??
        findBlockPageId(s.template, blockId) ??
        resolveBlockEditPageId(s.template, s.activePageId)
      const allowed = getAddableBlockTypesForPage(s.template, targetPageId)
      if (!allowed.includes(type)) return s

      const blocks = [...getBlocksForPage(s.template, targetPageId)]
      const index = blocks.findIndex((b) => b.id === blockId)
      if (index < 0) return s

      const leftBlock = blocks[index]
      const nextBlock = blocks[index + 1]
      if (nextBlock && blocksAreActivePair(leftBlock, nextBlock)) return s
      if (!canBlocksFormPair(leftBlock, type)) return s

      blocks[index] = setBlockLayoutColumn(leftBlock, "left")
      const newBlock = setBlockLayoutColumn(
        createStandaloneBuilderBlock(type, blocks.length),
        "right",
      )
      blocks.splice(index + 1, 0, newBlock)

      return {
        template: setBlocksForPage(s.template, targetPageId, normalizePageBlocks(blocks)),
        selectedBlockId: newBlock.id,
        activePageId: targetPageId,
      }
    }),

  addBlockBesideLeft: (blockId, type, pageId) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s
      if (!ADDABLE_BLOCKS.some((entry) => entry.type === type)) return s
      if (INTRO_ONLY_BLOCK_TYPES.includes(type)) return s

      const targetPageId =
        pageId ??
        findBlockPageId(s.template, blockId) ??
        resolveBlockEditPageId(s.template, s.activePageId)
      const allowed = getAddableBlockTypesForPage(s.template, targetPageId)
      if (!allowed.includes(type)) return s

      const blocks = [...getBlocksForPage(s.template, targetPageId)]
      const index = blocks.findIndex((b) => b.id === blockId)
      if (index < 0) return s

      const anchor = blocks[index]
      const prev = blocks[index - 1]
      if (prev && blocksAreActivePair(prev, anchor)) return s

      const leftStub = {
        type,
        content: { layoutColumn: "left" },
      } as unknown as BuilderBlock
      if (!canBlocksFormPair(leftStub, anchor.type)) return s

      const newBlock = setBlockLayoutColumn(
        createStandaloneBuilderBlock(type, blocks.length),
        "left",
      )
      blocks[index] = setBlockLayoutColumn(anchor, "right")
      blocks.splice(index, 0, newBlock)

      return {
        template: setBlocksForPage(s.template, targetPageId, normalizePageBlocks(blocks)),
        selectedBlockId: newBlock.id,
        activePageId: targetPageId,
      }
    }),

  addImageBlockFromFile: (file, afterId, pageId) => {
    get().addBlock("custom_image", afterId, pageId)
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
              pdfBytes: prepared.pdfBytes,
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
              pdfBytes: prepared.pdfBytes,
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

  addImageBlockFromFileBesideLeft: (file, blockId) => {
    get().addBlockBesideLeft(blockId, "custom_image")
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
              pdfBytes: prepared.pdfBytes,
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

  setPendingIntroPdfImport: (payload) => set({ pendingIntroPdfImport: payload }),

  clearPendingIntroPdfImport: () => set({ pendingIntroPdfImport: null }),

  removeBlock: (blockId) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s

      if (s.template.blocks.some((b) => b.id === blockId)) {
        const blocks = normalizePageBlocks(
          removeBlockFromLayout(s.template.blocks, blockId),
        )
        return {
          template: { ...s.template, blocks },
          selectedBlockId:
            s.selectedBlockId === blockId ? null : s.selectedBlockId,
        }
      }

      const customPages = resolveCustomPages(s.template).map((page) => {
        if (!page.blocks?.some((b) => b.id === blockId)) return page
        return {
          ...page,
          blocks: normalizePageBlocks(
            removeBlockFromLayout(page.blocks, blockId),
          ),
        }
      })

      return {
        template: { ...s.template, customPages, introPage: undefined },
        selectedBlockId:
          s.selectedBlockId === blockId ? null : s.selectedBlockId,
      }
    }),

  reorderBlocks: (from, to, pageId) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s

      const targetPageId =
        pageId ?? resolveBlockEditPageId(s.template, s.activePageId)
      const blocks = normalizePageBlocks(
        arrayMove(getBlocksForPage(s.template, targetPageId), from, to),
      )
      return { template: setBlocksForPage(s.template, targetPageId, blocks) }
    }),

  moveBlockDrop: (blockId, target, pageId) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) {
        return s
      }

      const targetPageId =
        pageId ?? resolveBlockEditPageId(s.template, s.activePageId)
      const currentBlocks = getBlocksForPage(s.template, targetPageId)
      const nextBlocks = applyBlockDrop(currentBlocks, blockId, target)
      if (nextBlocks === currentBlocks) return s

      const normalized = normalizePageBlocks(nextBlocks)
      const pageChanged =
        normalized.length !== currentBlocks.length ||
        normalized.some(
          (block, index) =>
            block.id !== currentBlocks[index]?.id ||
            block.content.layoutColumn !== currentBlocks[index]?.content.layoutColumn,
        )
      if (!pageChanged) return s

      return {
        template: setBlocksForPage(s.template, targetPageId, normalized),
      }
    }),

  setBlockCanvasWidth: (blockId, width) =>
    set((s) => {
      if (!s.template || isSalesRestrictedEditor(s.editorMode, s.previewPersona)) return s

      if (s.template.blocks.some((b) => b.id === blockId)) {
        const blocks = normalizePageBlocks(
          applyBlockCanvasWidth(s.template.blocks, blockId, width),
        )
        return { template: { ...s.template, blocks } }
      }

      const customPages = resolveCustomPages(s.template).map((page) => {
        if (!page.blocks?.some((b) => b.id === blockId)) return page
        return {
          ...page,
          blocks: normalizePageBlocks(
            applyBlockCanvasWidth(page.blocks, blockId, width),
          ),
        }
      })

      return {
        template: { ...s.template, customPages, introPage: undefined },
      }
    }),

  setBlockVariant: (blockId, variant) => {
    if (get().editorMode !== "edit") return
    const block = findTemplateBlock(get().template, blockId)
    get().updateBlockField(blockId, "variant", variant)
    if (block?.type === "company_logo") {
      get().updateBlockField(blockId, "logoVariant", variant)
    }
    if (block?.type === "terms") {
      const segments = (block.content.segments as ConditionalSegment[]) ?? []
      get().updateBlockField(
        blockId,
        "segments",
        applyTermsVariantToSegments(segments, variant),
      )
    }
  },

  setBlockDisplayCondition: (blockId, condition) => {
    if (get().editorMode !== "edit") return
    get().updateBlockField(blockId, "displayCondition", condition)
    const block = findTemplateBlock(get().template, blockId)
    if (block?.type === "company_logo") {
      get().updateBlockField(blockId, "logoDisplayCondition", condition)
    }
  },

  setBlockLocked: (blockId, locked) => {
    if (get().editorMode !== "edit") return
    get().updateBlockField(blockId, "locked", locked)
  },

  cycleBlockVariant: (blockId) => {
    if (get().editorMode !== "edit") return
    const { template } = get()
    if (!template) return
    const block = findTemplateBlock(template, blockId)
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

  reorderSegments: (blockId, activeSegmentId, overSegmentId) =>
    set((s) => {
      if (!s.template || s.editorMode !== "edit") return s
      const block = findTemplateBlock(s.template, blockId)
      if (!block || block.type !== "terms") return s

      const segments = (block.content.segments as ConditionalSegment[]) ?? []
      const fromIndex = segments.findIndex((seg) => seg.id === activeSegmentId)
      const toIndex = segments.findIndex((seg) => seg.id === overSegmentId)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return s

      const nextSegments = arrayMove(segments, fromIndex, toIndex)
      const patchBlock = (b: BuilderBlock) =>
        b.id === blockId
          ? { ...b, content: { ...b.content, segments: nextSegments } }
          : b

      const quoteIndex = s.template.blocks.findIndex((b) => b.id === blockId)
      if (quoteIndex >= 0) {
        return {
          template: {
            ...s.template,
            blocks: s.template.blocks.map(patchBlock),
          },
        }
      }

      const customPages = resolveCustomPages(s.template).map((page) => {
        if (!page.blocks?.some((b) => b.id === blockId)) return page
        return { ...page, blocks: page.blocks.map(patchBlock) }
      })

      return {
        template: { ...s.template, customPages, introPage: undefined },
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

  requestPublish: () => {
    const { template, messages } = get()
    if (!template) return

    useTemplateLibraryStore.getState().ensureInitialized()
    const library = useTemplateLibraryStore.getState().publishedTemplates
    const existing = library.find((entry) => entry.id === template.id)
    const isRepublish = existing?.status === "published"

    const now = new Date().toISOString()
    const userMsg: ChatMessage = {
      id: createId("msg"),
      role: "user",
      content: isRepublish
        ? "Save and publish this template"
        : "Publish this template",
      timestamp: now,
    }
    const assistantMsg: ChatMessage = {
      id: createId("msg"),
      role: "assistant",
      content: "",
      timestamp: now,
      kind: "publish_checklist",
    }

    set((s) => ({
      messages: [...messages, userMsg, assistantMsg],
      assistantExpandTick: s.assistantExpandTick + 1,
    }))
  },

  confirmPublish: () => {
    const {
      template,
      ignoredValidationIssueIds,
      pdfFieldMappings,
      pdfSourceFileName,
      pdfSourceDataUrl,
      pdfMappingLearnings,
    } = get()
    if (!template) return null

    useTemplateLibraryStore.getState().ensureInitialized()
    const library = useTemplateLibraryStore.getState().publishedTemplates
    const persistableTemplate = withPersistedPdfImport(template, {
      pdfFieldMappings,
      pdfSourceFileName,
      pdfSourceDataUrl,
      pdfMappingLearnings,
    })
    const items = derivePublishChecklist({
      template: persistableTemplate,
      library,
      ignoredValidationIssueIds,
    })

    if (!publishChecklistCanPublish(items)) return null

    return useTemplateLibraryStore
      .getState()
      .publishBuilderTemplate(persistableTemplate)
  },

  publishTemplate: (onComplete) => {
    const { template } = get()
    if (!template) {
      onComplete(null)
      return
    }

    const name = template.name.trim() || "Untitled template"
    useTemplateLibraryStore.getState().ensureInitialized()
    set({ publishingTemplateName: name })

    window.setTimeout(() => {
      const published = get().confirmPublish()
      set({ publishingTemplateName: null })
      onComplete(published)
    }, PUBLISH_INTERSTITIAL_MS)
  },
}))
