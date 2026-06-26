import {
  createBuilderBlockWithContent,
  createBuilderTemplate,
  mergeBlockContent,
  normalizeBuilderBlocks,
} from "@/lib/create-builder-template"
import { createId } from "@/lib/create-id"
import { deriveTemplateNameFromFiles } from "@/lib/derive-template-from-creation"
import {
  extractTextFromPdfFile,
  pickPrimaryQuotePdf,
  type PdfDocumentText,
} from "@/lib/pdf-text-extract"
import { isImageFile, readFileAsDataUrl } from "@/lib/pdf-page-render"
import type {
  BuilderBlock,
  BuilderBlockType,
  BuilderTemplate,
  ConditionalSegment,
} from "@/types/prompt-builder"
import { buildCompletePdfFieldMappings, type PdfFieldMapping } from "@/lib/pdf-field-mappings"

export type PdfExtractionSummary = {
  sourceFileName: string
  pageCount: number
  detectedSections: BuilderBlockType[]
  filledBlocks: BuilderBlockType[]
  usedFallback: boolean
  fieldMappings: PdfFieldMapping[]
}

type SectionAnchor = {
  type: BuilderBlockType
  index: number
  label: string
}

const SECTION_DEFINITIONS: {
  type: BuilderBlockType
  patterns: RegExp[]
}[] = [
  {
    type: "terms",
    patterns: [
      /\bterms\s*(?:and|&)\s*conditions\b/i,
      /\bgeneral\s+terms\b/i,
      /\blegal\s+(?:terms|notice)\b/i,
    ],
  },
  {
    type: "signature",
    patterns: [
      /\b(?:authorized|authorised)\s+signature\b/i,
      /\bcustomer\s+signature\b/i,
      /\bacceptance\s+signature\b/i,
      /\bsign(?:ature)?\s+here\b/i,
    ],
  },
  {
    type: "entitlements",
    patterns: [/\bentitlements?\b/i, /\bincluded\s+usage\b/i, /\busage\s+limits?\b/i],
  },
  {
    type: "pricing",
    patterns: [
      /\bline\s+items?\b/i,
      /\bpricing\s+(?:table|summary)\b/i,
      /\binvestment\s+summary\b/i,
      /\b(?:item|description)\s+.*\bamount\b/i,
    ],
  },
  {
    type: "tcv_summary",
    patterns: [
      /\btotal\s+contract\s+value\b/i,
      /\btotal\s+value\b/i,
      /\b(?:tcv|acv)\b/i,
      /\bannual\s+contract\s+value\b/i,
    ],
  },
  {
    type: "contract_details",
    patterns: [
      /\bcontract\s+details\b/i,
      /\bdeal\s+terms\b/i,
      /\bpayment\s+terms\b/i,
      /\bbilling\s+cycle\b/i,
      /\bcontract\s+(?:term|length)\b/i,
    ],
  },
  {
    type: "billed_to",
    patterns: [/\bbill(?:ed|ing)?\s+to\b/i, /\bprepared\s+for\b/i, /\bcustomer\s+details\b/i],
  },
  {
    type: "ae_profile",
    patterns: [
      /\baccount\s+executive\b/i,
      /\byour\s+(?:sales\s+)?(?:rep|representative|contact)\b/i,
      /\bsales\s+contact\b/i,
    ],
  },
]

const CANONICAL_BLOCK_ORDER: BuilderBlockType[] = [
  "company_logo",
  "company_details",
  "tcv_summary",
  "billed_to",
  "contract_details",
  "pricing",
  "terms",
  "entitlements",
  "signature",
  "ae_profile",
]

const CURRENCY =
  /\$\s?[\d,]+(?:\.\d{2})?(?:\s*(?:\/\s*(?:mo|month|yr|year)))?/i
const CURRENCY_GLOBAL =
  /\$\s?[\d,]+(?:\.\d{2})?(?:\s*(?:\/\s*(?:mo|month|yr|year)))?/gi

function countCurrencyMatches(text: string): number {
  return [...text.matchAll(CURRENCY_GLOBAL)].length
}
const EMAIL = /[\w.+-]+@[\w.-]+\.\d{2,}/i

function findSectionAnchors(text: string): SectionAnchor[] {
  const anchors: SectionAnchor[] = []

  for (const definition of SECTION_DEFINITIONS) {
    let best: SectionAnchor | null = null
    for (const pattern of definition.patterns) {
      const match = pattern.exec(text)
      if (match?.index !== undefined) {
        const candidate = {
          type: definition.type,
          index: match.index,
          label: match[0],
        }
        if (!best || candidate.index < best.index) {
          best = candidate
        }
      }
    }
    if (best) anchors.push(best)
  }

  return anchors.sort((a, b) => a.index - b.index)
}

function sectionTextBetween(
  text: string,
  start: number,
  end: number,
): string {
  return text.slice(start, end).trim()
}

function readField(sectionText: string, labels: string[]): string | undefined {
  for (const label of labels) {
    const re = new RegExp(`\\b${label}\\s*:?\\s*([^\\n]+)`, "i")
    const match = re.exec(sectionText)
    if (match?.[1]?.trim()) return match[1].trim()
  }
  return undefined
}

function parseBilledTo(sectionText: string): Record<string, unknown> {
  const lines = sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const body = lines
    .slice(1)
    .filter((line) => !EMAIL.test(line) && !/^bill(?:ed|ing)?\s+to/i.test(line))

  const email = sectionText.match(EMAIL)?.[0]
  const name =
    readField(sectionText, ["bill(?:ed|ing)?\\s+to", "prepared\\s+for", "customer"]) ??
    body[0]

  return {
    name: name ?? undefined,
    contact: email,
    contactName: email ? body.find((line) => !line.includes("@")) : undefined,
    address: body.slice(email ? 1 : 1, 4).join("\n") || undefined,
  }
}

function parsePricing(sectionText: string): Record<string, unknown> {
  const rows: { item: string; amount: string; description: string }[] = []
  const lines = sectionText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 200)

  for (const line of lines) {
    if (/^(subtotal|total|tax|discount|amount due)/i.test(line)) continue
    const amounts = [...line.matchAll(CURRENCY_GLOBAL)].map((m) => m[0])
    if (amounts.length === 0) continue
    const amount = amounts[amounts.length - 1]
    const item = line.replace(CURRENCY, "").replace(/\s+/g, " ").trim()
    if (item.length < 2) continue
    rows.push({ item, amount, description: "" })
  }

  const subtotalLine = lines.find((line) => /^subtotal/i.test(line))
  const subtotal = subtotalLine?.match(CURRENCY)?.[0]

  return {
    rows: rows.slice(0, 12),
    subtotal,
    label: /investment/i.test(sectionText) ? "Investment summary" : "Line items",
  }
}

function parseTcv(sectionText: string): Record<string, unknown> {
  const amount = sectionText.match(CURRENCY)?.[0]
  const months = sectionText.match(/(\d+)\s*months?/i)?.[1]
  const recurring = sectionText.match(/\$\s?[\d,]+(?:\.\d{2})?\s*\/\s*(?:mo|month)/i)?.[0]

  return {
    amount,
    subtitle: months ? `over ${months} months` : undefined,
    recurring,
    termMonths: months,
  }
}

function parseContractDetails(sectionText: string): Record<string, unknown> {
  return {
    term: readField(sectionText, ["term", "contract\\s+term", "contract\\s+length"]),
    startDate: readField(sectionText, ["start\\s+date", "effective\\s+date"]),
    billingCycle: readField(sectionText, ["billing\\s+cycle"]),
    paymentTerms: readField(sectionText, ["payment\\s+terms"]),
    salesperson: readField(sectionText, [
      "sales(?:person|\\s+contact|\\s+rep)",
      "account\\s+executive",
    ]),
  }
}

function parseTerms(sectionText: string): Record<string, unknown> {
  const cleaned = sectionText
    .replace(/^terms\s*(?:and|&)\s*conditions\s*:?\s*/i, "")
    .replace(/^general\s+terms\s*:?\s*/i, "")
    .trim()

  if (cleaned.length < 80) return {}

  const segments: ConditionalSegment[] = [
    {
      id: createId("seg"),
      condition: null,
      text: cleaned.slice(0, 6000),
    },
  ]

  return { segments }
}

function parseEntitlements(sectionText: string): Record<string, unknown> {
  const rows: { name: string; limit: string; notes: string }[] = []
  const lines = sectionText.split("\n").map((line) => line.trim()).filter(Boolean)

  for (const line of lines.slice(1, 10)) {
    if (/^entitlement|^included|^notes/i.test(line)) continue
    const parts = line.split(/\s{2,}|\t|·|•/).map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 2) {
      rows.push({
        name: parts[0],
        limit: parts[1],
        notes: parts[2] ?? "",
      })
    }
  }

  return rows.length > 0 ? { rows } : {}
}

function parseAeProfile(sectionText: string): Record<string, unknown> {
  const email = sectionText.match(EMAIL)?.[0]
  const phone = sectionText.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]
  const name =
    readField(sectionText, ["account\\s+executive", "sales\\s+contact", "your\\s+contact"]) ??
    sectionText
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 2 && !EMAIL.test(line) && !phone?.includes(line))

  return {
    name,
    email,
    phone,
    title: /account executive/i.test(sectionText) ? "Account Executive" : undefined,
  }
}

function parseCompanyAddress(firstPageLines: string[]): Record<string, unknown> {
  const topLines = firstPageLines.slice(0, 14).filter(Boolean)
  if (topLines.length === 0) return {}

  const taxId = topLines
    .join("\n")
    .match(/(?:tax\s*id|ein|vat(?:\s+number)?)\s*[#:]?\s*([\w-]+)/i)?.[1]

  const name = topLines.find(
    (line) =>
      line.length > 2 &&
      !/^(quote|proposal|order form)/i.test(line) &&
      !/(tax\s*id|ein|vat)/i.test(line),
  )

  const addressLines = topLines.filter(
    (line) =>
      line !== name &&
      !/(tax\s*id|ein|vat)/i.test(line) &&
      !/^(quote|proposal)/i.test(line),
  )

  return {
    name,
    address: addressLines.slice(0, 4).join("\n") || undefined,
    taxId: taxId ? `Tax ID ${taxId}` : undefined,
  }
}

function parseSectionContent(
  type: BuilderBlockType,
  sectionText: string,
  doc: PdfDocumentText,
): Record<string, unknown> {
  switch (type) {
    case "billed_to":
      return parseBilledTo(sectionText)
    case "pricing":
      return parsePricing(sectionText)
    case "tcv_summary":
      return parseTcv(sectionText)
    case "contract_details":
      return parseContractDetails(sectionText)
    case "terms":
      return parseTerms(sectionText)
    case "entitlements":
      return parseEntitlements(sectionText)
    case "ae_profile":
      return parseAeProfile(sectionText)
    case "company_details":
      return parseCompanyAddress(doc.pages[0]?.lines ?? [])
    default:
      return {}
  }
}

function hasUsefulContent(overrides: Record<string, unknown>): boolean {
  return Object.values(overrides).some((value) => {
    if (value == null) return false
    if (typeof value === "string") return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === "object") return Object.keys(value as object).length > 0
    return true
  })
}

function orderDetectedBlocks(
  anchors: SectionAnchor[],
  extraTypes: BuilderBlockType[] = [],
): BuilderBlockType[] {
  const seen = new Set<BuilderBlockType>()
  const ordered: BuilderBlockType[] = []

  const add = (type: BuilderBlockType) => {
    if (seen.has(type)) return
    seen.add(type)
    ordered.push(type)
  }

  add("company_logo")
  add("company_details")

  for (const anchor of anchors) {
    add(anchor.type)
  }

  for (const type of extraTypes) {
    add(type)
  }

  for (const type of CANONICAL_BLOCK_ORDER) {
    add(type)
  }

  return ordered
}

function buildBlocksFromDocument(
  doc: PdfDocumentText,
  logoAsset?: { logoUrl: string; logoFileName: string },
): { blocks: BuilderBlock[]; summary: Omit<PdfExtractionSummary, "sourceFileName" | "pageCount" | "fieldMappings"> } {
  const anchors = findSectionAnchors(doc.fullText)
  const pricingFallback =
    anchors.every((anchor) => anchor.type !== "pricing") &&
    countCurrencyMatches(doc.fullText) >= 3
      ? (["pricing"] as BuilderBlockType[])
      : []

  const blockTypes = orderDetectedBlocks(anchors, pricingFallback)
  const detectedSections = anchors.map((anchor) => anchor.type)
  const filledBlocks: BuilderBlockType[] = []
  const pricingOverrides =
    pricingFallback.length > 0 ? parsePricing(doc.fullText) : null

  const blocks = blockTypes.map((type, order) => {
    const anchor = anchors.find((entry) => entry.type === type)
    const anchorIndex = anchor?.index ?? -1
    const nextAnchor = anchors.find(
      (entry) => entry.index > anchorIndex && entry.type !== type,
    )
    const endIndex =
      anchorIndex >= 0
        ? (nextAnchor?.index ?? doc.fullText.length)
        : doc.fullText.length

    let sectionText = ""
    if (anchorIndex >= 0) {
      sectionText = sectionTextBetween(doc.fullText, anchorIndex, endIndex)
    } else if (type === "company_details") {
      sectionText = doc.pages[0]?.text ?? ""
    } else if (type === "pricing" && pricingOverrides) {
      sectionText = doc.fullText
    }

    const overrides = parseSectionContent(type, sectionText, doc)

    if (type === "company_logo" && logoAsset) {
      Object.assign(overrides, logoAsset)
    }

    if (type === "pricing" && pricingOverrides && !anchor) {
      Object.assign(overrides, pricingOverrides)
    }

    if (hasUsefulContent(overrides)) {
      filledBlocks.push(type)
    }

    return createBuilderBlockWithContent(type, order, overrides)
  })

  return {
    blocks,
    summary: {
      detectedSections,
      filledBlocks,
      usedFallback: anchors.length === 0,
    },
  }
}

export async function extractTemplateFromFiles(
  templateId: string,
  files: File[],
  onProgress?: (step: string) => void,
): Promise<{ template: BuilderTemplate; summary: PdfExtractionSummary | null }> {
  const pdfFile = pickPrimaryQuotePdf(files)

  if (!pdfFile) {
    onProgress?.("No PDF found — using default block layout")
    const name = deriveTemplateNameFromFiles(files)
    return {
      template: createBuilderTemplate(templateId, { name }),
      summary: null,
    }
  }

  onProgress?.(`Reading ${pdfFile.name}`)
  const doc = await extractTextFromPdfFile(pdfFile)

  onProgress?.("Extracting text and section markers")
  const logoFile = files.find((file) => isImageFile(file))
  let logoAsset: { logoUrl: string; logoFileName: string } | undefined
  if (logoFile) {
    onProgress?.(`Importing logo from ${logoFile.name}`)
    logoAsset = {
      logoUrl: await readFileAsDataUrl(logoFile),
      logoFileName: logoFile.name,
    }
  }

  // Yield so the UI can paint before synchronous block mapping.
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 0)
  })

  onProgress?.("Mapping sections to template blocks")
  const { blocks, summary } = buildBlocksFromDocument(doc, logoAsset)

  onProgress?.("Applying layout rules")
  const name = deriveTemplateNameFromFiles(files)
  const defaultTemplate = createBuilderTemplate(templateId, { name })
  const extractedByType = new Map(blocks.map((block) => [block.type, block]))

  const mergedBlocks = defaultTemplate.blocks.map((block) => {
    const extracted = extractedByType.get(block.type)
    if (!extracted) return block
    return {
      ...block,
      content: mergeBlockContent(block.content, extracted.content),
    }
  })

  const template: BuilderTemplate = {
    ...defaultTemplate,
    blocks: normalizeBuilderBlocks(mergedBlocks),
  }

  const extractedTemplate: BuilderTemplate = {
    ...defaultTemplate,
    blocks: normalizeBuilderBlocks(blocks),
  }
  const fieldMappings = buildCompletePdfFieldMappings(
    extractedTemplate,
    template,
    doc.fullText,
  )

  return {
    template,
    summary: {
      sourceFileName: doc.fileName,
      pageCount: doc.pageCount,
      ...summary,
      fieldMappings,
    },
  }
}
