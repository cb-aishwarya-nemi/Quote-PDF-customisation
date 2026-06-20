import { createId } from "@/lib/create-id"
import { BLOCK_VARIANTS } from "@/lib/block-variants"
import { blocksForSource, blocksForVariant } from "@/lib/block-catalog"
import type {
  BuilderBlock,
  BuilderBlockType,
  BuilderTemplate,
  ConditionalSegment,
} from "@/types/prompt-builder"
import type { BlockType } from "@/types/template"

const VARIANT_TO_BUILDER: Record<BlockType, BuilderBlockType> = {
  header: "quote_summary_header",
  quote_details: "contract_details",
  billed_to: "billed_to",
  company_details: "contract_details",
  tcv_billing: "tcv_summary",
  pricing: "pricing",
  signature: "signature",
  terms: "terms",
}

const defaultTermsSegments = (): ConditionalSegment[] => [
  {
    id: createId("seg"),
    condition: null,
    text: "This quote is valid for 30 days from the date above. Payment terms are Net-30 unless otherwise specified. Services commence upon signed order form.",
  },
  {
    id: createId("seg"),
    condition: {
      field: "deal_type",
      operator: "is",
      value: "termination",
      label: "Termination",
    },
    text: "Services wind down on the termination effective date. Final invoice reflects usage through that date. Prepaid credits are settled per the master agreement.",
  },
  {
    id: createId("seg"),
    condition: {
      field: "deal_type",
      operator: "is",
      value: "amendment",
      label: "Amendment",
    },
    text: "This amendment supersedes conflicting terms in the prior order form. All other terms remain in full force.",
  },
  {
    id: createId("seg"),
    condition: {
      field: "customer_region",
      operator: "is",
      value: "APAC",
      label: "APAC",
    },
    text: "APAC customers: Payment in USD. Local consumption tax may apply. Wire transfer fees are borne by the customer unless prepaid terms apply.",
  },
]

function defaultContent(type: BuilderBlockType): Record<string, unknown> {
  switch (type) {
    case "quote_summary_header":
      return {
        showLogo: true,
        logoVariant: "default",
        logoDisplayCondition: null,
        backgroundImageUrl: "",
        backgroundImageFileName: "",
        title: "Quote Summary",
        quoteNumber: "QT-2026-0142",
        issued: "Jun 12, 2026",
        validUntil: "Jul 12, 2026",
        customerName: "Acme Corp",
        preparedForLabel: "Prepared for",
        quoteNumberLabel: "Quote #",
        issuedLabel: "Issued",
        validUntilLabel: "Valid until",
        validShortLabel: "Valid",
      }
    case "tcv_summary":
      return {
        label: "Total contract value",
        inlineLabel: "TCV",
        oneTimeLabel: "One-time",
        recurringLabel: "Recurring / mo",
        termMonthsLabel: "Term (months)",
        amount: "$127,200",
        subtitle: "over 24 months",
        oneTime: "$8,500",
        recurring: "$4,950 / mo",
        termMonths: "24",
        emphasized: false,
      }
    case "billed_to":
      return {
        sectionLabel: "Billed to",
        contactColumnLabel: "Primary contact",
        name: "Acme Corp",
        contactName: "Jane Cooper",
        contact: "jane.cooper@acme.com",
        address: "100 Market Street, San Francisco, CA 94105",
      }
    case "contract_details":
      return {
        fieldLabels: {
          term: "Term",
          startDate: "Start date",
          billingCycle: "Billing cycle",
          paymentTerms: "Payment terms",
          salesperson: "Sales contact",
        },
        term: "36 months",
        startDate: "Jul 1, 2026",
        billingCycle: "Annual",
        paymentTerms: "Net-30",
        salesperson: "Jordan Lee",
      }
    case "pricing":
      return {
        label: "Line items",
        itemColumnLabel: "Item",
        amountColumnLabel: "Amount",
        subtotalLabel: "Subtotal",
        rows: [
          {
            item: "Enterprise Platform — Annual",
            amount: "$48,000",
            description: "Annual subscription for up to 250 named seats.",
          },
          {
            item: "Premium Support",
            amount: "$12,000",
            description: "24×5 support with dedicated CSM and QBRs.",
          },
          {
            item: "Implementation services",
            amount: "$8,500",
            description: "One-time onboarding, migration, and configuration.",
          },
        ],
        subtotal: "$68,500",
      }
    case "entitlements":
      return {
        label: "Entitlements & usage",
        nameColumnLabel: "Entitlement",
        limitColumnLabel: "Included",
        notesColumnLabel: "Notes",
        rows: [
          {
            name: "Platform seats",
            limit: "250 users",
            notes: "Named seats; overage billed monthly at list rate.",
          },
          {
            name: "API calls",
            limit: "5M / month",
            notes: "Metered usage with 10% burst allowance.",
          },
          {
            name: "Premium support",
            limit: "24×5",
            notes: "Dedicated CSM and quarterly business reviews.",
          },
        ],
      }
    case "terms":
      return {
        sectionLabel: "Terms & conditions",
        segments: defaultTermsSegments(),
      }
    case "custom_text":
      return { text: "Add your custom text here." }
    case "custom_table":
      return {
        headers: ["Column A", "Column B"],
        rows: [
          ["Value 1", "Value 2"],
          ["Value 3", "Value 4"],
        ],
      }
    case "custom_image":
      return { alt: "Uploaded asset", caption: "Figure caption", placeholder: true }
    case "signature":
      return {
        label: "Authorized signature",
        customerLabel: "Customer signature",
        vendorLabel: "Vendor signature",
        acceptanceLabel: "Acceptance",
        dateLabel: "Date",
        footerText:
          "By signing, the customer agrees to the terms and pricing in this quote.",
        showDate: true,
      }
    case "ae_profile":
      return {
        sectionLabel: "Your account executive",
        name: "Jordan Lee",
        title: "Account Executive",
        email: "jordan.lee@chargebee.com",
        phone: "+1 (415) 555-0142",
      }
    default:
      return {}
  }
}

function createBuilderBlock(type: BuilderBlockType, order: number): BuilderBlock {
  const defaultVariant =
    type === "signature"
      ? (BLOCK_VARIANTS[type].find((v) => v.id === "dual_party")?.id ?? "dual_party")
      : (BLOCK_VARIANTS[type][0]?.id ?? "classic")
  return {
    id: createId("block"),
    type,
    order,
    content: {
      variant: defaultVariant,
      displayCondition: null,
      ...defaultContent(type),
    },
  }
}

function mapVariantBlock(type: BlockType, order: number): BuilderBlock {
  const builderType = VARIANT_TO_BUILDER[type] ?? "custom_text"
  return createBuilderBlock(builderType, order)
}

/** Header first; strip legacy upload-image blocks placed above it. */
export function normalizeBuilderBlocks(blocks: BuilderBlock[]): BuilderBlock[] {
  const headerIndex = blocks.findIndex(
    (block) => block.type === "quote_summary_header",
  )
  if (headerIndex < 0) {
    return blocks.map((block, index) => ({ ...block, order: index }))
  }

  const withoutLeadingImages = blocks.filter((block, index) => {
    if (index >= headerIndex) return true
    return block.type !== "custom_image"
  })

  const nextHeaderIndex = withoutLeadingImages.findIndex(
    (block) => block.type === "quote_summary_header",
  )
  if (nextHeaderIndex <= 0) {
    return withoutLeadingImages.map((block, index) => ({ ...block, order: index }))
  }

  const header = withoutLeadingImages[nextHeaderIndex]
  const rest = withoutLeadingImages.filter((_, index) => index !== nextHeaderIndex)
  return [header, ...rest].map((block, index) => ({ ...block, order: index }))
}

export function createStandaloneBuilderBlock(
  type: BuilderBlockType,
  order: number,
): BuilderBlock {
  return createBuilderBlock(type, order)
}

export function createBuilderTemplate(
  id: string,
  options?: { variantId?: string; presetId?: string; name?: string },
): BuilderTemplate {
  const name = options?.name ?? "Untitled quote template"

  let blocks: BuilderBlock[]

  const presetTypes = options?.presetId
    ? blocksForSource({ presetId: options.presetId })
    : []

  if (presetTypes.length > 0) {
    blocks = presetTypes.map((t, i) => mapVariantBlock(t, i))
  } else if (options?.variantId) {
    const types = blocksForVariant(options.variantId)
    blocks = types.map((t, i) => mapVariantBlock(t, i))

    if (options.variantId === "v1") {
      const pricing = blocks.find((b) => b.type === "pricing")
      if (pricing) pricing.content.label = "Investment summary"
    }
    if (options.variantId === "v3") {
      blocks.splice(1, 0, createBuilderBlock("ae_profile", 1))
      blocks.forEach((b, i) => {
        b.order = i
      })
    }
  } else {
    blocks = [
      createBuilderBlock("quote_summary_header", 0),
      createBuilderBlock("billed_to", 1),
      createBuilderBlock("contract_details", 2),
      createBuilderBlock("pricing", 3),
      createBuilderBlock("entitlements", 4),
      createBuilderBlock("tcv_summary", 5),
      createBuilderBlock("terms", 6),
      createBuilderBlock("signature", 7),
      createBuilderBlock("ae_profile", 8),
    ]
  }

  return {
    id,
    name,
    variantId: options?.variantId,
    presetId: options?.presetId,
    blocks: normalizeBuilderBlocks(blocks),
  }
}
