import {
  DEFAULT_QUOTE_TEMPLATE_NAME,
  normalizeBuilderBlocks,
} from "@/lib/create-builder-template"
import type { BuilderTemplate } from "@/types/prompt-builder"

export type CreationContext = {
  creationBrief?: string
  uploadedFileNames?: string[]
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function stripTrailingQuote(value: string): string {
  return value.replace(/\s+quote$/i, "").trim()
}

function ensureQuoteSuffix(value: string, maxLength = 56): string {
  const trimmed = value.trim()
  if (!trimmed) return DEFAULT_QUOTE_TEMPLATE_NAME
  const withQuote = /quote$/i.test(trimmed) ? trimmed : `${trimmed} quote`
  if (withQuote.length <= maxLength) return withQuote
  const base = stripTrailingQuote(withQuote)
  return `${base.slice(0, maxLength - 6).trim()} quote`
}

function deriveNameFromBrief(brief: string): string {
  const lower = brief.toLowerCase()
  const parts: string[] = []

  if (/amendment/i.test(lower)) parts.push("Amendment")
  else if (/renewal/i.test(lower)) parts.push("Renewal")
  else if (/termination|wind.?down/i.test(lower)) parts.push("Termination")
  else if (/expansion|co-?term/i.test(lower)) parts.push("Expansion")
  else if (/new business|new deal/i.test(lower)) parts.push("New business")

  if (/enterprise/i.test(lower)) parts.push("enterprise")
  else if (/\bsmb\b|small business/i.test(lower)) parts.push("SMB")

  if (/\beu\b|europe|germany|localized/i.test(lower)) parts.push("EU")
  else if (/apac|asia pacific/i.test(lower)) parts.push("APAC")
  else if (/\bus\b|united states|america/i.test(lower)) parts.push("US")

  if (/one.?pager|compact|short form/i.test(lower)) parts.push("one-pager")

  if (parts.length >= 2) {
    return ensureQuoteSuffix(titleCase(parts.join(" ")))
  }

  const clause = brief.split(/[.,;—–-]/)[0]?.trim() ?? brief
  const cleaned = titleCase(
    clause
      .replace(/^(create|build|make|need|want|looking for|a|an|the)\s+/gi, "")
      .replace(/\btemplate\b/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
  )

  if (!cleaned) return DEFAULT_QUOTE_TEMPLATE_NAME
  return ensureQuoteSuffix(cleaned)
}

function deriveNameFromFileName(fileName: string): string {
  const base = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(
      /\b(quote|proposal|order form|orderform|template|pdf|final|draft|signed|copy|v\d+)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim()

  const titled = titleCase(base)
  if (!titled) return DEFAULT_QUOTE_TEMPLATE_NAME
  return ensureQuoteSuffix(titled)
}

export function deriveTemplateName(context: CreationContext): string {
  const brief = context.creationBrief?.trim()
  if (brief) return deriveNameFromBrief(brief)

  const fileName = context.uploadedFileNames?.find((name) => name.trim().length > 0)
  if (fileName) return deriveNameFromFileName(fileName)

  return DEFAULT_QUOTE_TEMPLATE_NAME
}

export function applyCreationContextToTemplate(
  template: BuilderTemplate,
  context: CreationContext,
): BuilderTemplate {
  const hasContext =
    Boolean(context.creationBrief?.trim()) ||
    Boolean(context.uploadedFileNames?.length)

  if (!hasContext) return template

  return {
    ...template,
    name: deriveTemplateName(context),
    blocks: normalizeBuilderBlocks(template.blocks),
  }
}
