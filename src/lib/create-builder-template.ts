import { createId } from "@/lib/create-id"
import { BLOCK_VARIANTS, LOGO_VARIANTS } from "@/lib/block-variants"
import { enforceBlockLayoutRules } from "@/lib/block-layout"
import { defaultLayoutColumnForType } from "@/lib/block-layout-rules"
import { blocksForSource, blocksForVariant } from "@/lib/block-catalog"
import type {
  BuilderBlock,
  BuilderBlockType,
  BuilderTemplate,
  ConditionalSegment,
} from "@/types/prompt-builder"
import type { BlockType } from "@/types/template"

const VARIANT_TO_BUILDER: Partial<Record<BlockType, BuilderBlockType>> = {
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
    case "company_logo":
      return {
        showLogo: true,
        logoVariant: "default",
        logoUrl: "",
        logoFileName: "",
        logoDisplayCondition: null,
      }
    case "company_address":
      return {
        sectionLabel: "From",
        name: "Acme Software Inc.",
        address: "548 Market St, Suite 400\nSan Francisco, CA 94104",
        taxId: "Tax ID 94-1234567",
        entity: "Acme Software Inc. (Delaware)",
      }
    case "quote_summary_header":
      return {
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
        backgroundImageUrl: "",
        backgroundImageFileName: "",
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
      : type === "company_logo"
        ? (LOGO_VARIANTS[0]?.id ?? "default")
        : (BLOCK_VARIANTS[type][0]?.id ?? "classic")
  return {
    id: createId("block"),
    type,
    order,
    content: {
      variant: defaultVariant,
      displayCondition: null,
      layoutColumn: defaultLayoutColumnForType(type),
      ...defaultContent(type),
    },
  }
}

function mapVariantBlock(type: BlockType, order: number): BuilderBlock | null {
  if (type === "header") return null
  const builderType = VARIANT_TO_BUILDER[type] ?? "custom_text"
  return createBuilderBlock(builderType, order)
}

function mapVariantBlocks(types: BlockType[]): BuilderBlock[] {
  return types.flatMap((type, index) => {
    const block = mapVariantBlock(type, index)
    return block ? [block] : []
  })
}

/** Stationery first; strip unsupported blocks and legacy images above stationery. */
export function normalizeBuilderBlocks(blocks: BuilderBlock[]): BuilderBlock[] {
  const filtered = blocks.filter((block) => block.type !== "quote_summary_header")

  const STATIONERY: BuilderBlockType[] = ["company_logo", "company_address"]

  const anchorIndex = filtered.findIndex((block) => STATIONERY.includes(block.type))
  const withoutLeadingImages =
    anchorIndex < 0
      ? filtered
      : filtered.filter((block, index) => {
          if (index >= anchorIndex) return true
          return block.type !== "custom_image"
        })

  const stationery = STATIONERY.flatMap((type) =>
    withoutLeadingImages.filter((block) => block.type === type),
  )
  const rest = withoutLeadingImages.filter(
    (block) => !STATIONERY.includes(block.type),
  )

  const ordered =
    stationery.length > 0 ? [...stationery, ...rest] : withoutLeadingImages

  return enforceBlockLayoutRules(ordered).map((block, index) => ({
    ...block,
    order: index,
  }))
}

export function createStandaloneBuilderBlock(
  type: BuilderBlockType,
  order: number,
): BuilderBlock {
  return createBuilderBlock(type, order)
}

export const DEFAULT_QUOTE_TEMPLATE_NAME = "Standard business quote"

export function createBuilderTemplate(
  id: string,
  options?: { variantId?: string; presetId?: string; name?: string },
): BuilderTemplate {
  const name = options?.name ?? DEFAULT_QUOTE_TEMPLATE_NAME

  let blocks: BuilderBlock[]

  const presetTypes = options?.presetId
    ? blocksForSource({ presetId: options.presetId })
    : []

  if (presetTypes.length > 0) {
    blocks = mapVariantBlocks(presetTypes)
  } else if (options?.variantId) {
    blocks = mapVariantBlocks(blocksForVariant(options.variantId))

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
      createBuilderBlock("company_logo", 0),
      createBuilderBlock("company_address", 1),
      createBuilderBlock("tcv_summary", 2),
      createBuilderBlock("billed_to", 3),
      createBuilderBlock("contract_details", 4),
      createBuilderBlock("pricing", 5),
      createBuilderBlock("terms", 6),
      createBuilderBlock("entitlements", 7),
      createBuilderBlock("signature", 8),
      createBuilderBlock("ae_profile", 9),
    ]
  }

  return {
    id,
    name,
    variantId: options?.variantId,
    presetId: options?.presetId,
    displayCondition: null,
    blocks: normalizeBuilderBlocks(blocks),
  }
}
