import { createId } from "@/lib/create-id"
import {
  getBlockFieldDefs,
  getCustomTextVariableDef,
  getVariableCatalog,
  getVariableDef,
  normalizeVariableKey,
  type VariableFieldDef,
} from "@/lib/derive-template-variables"
import type { BuilderBlock, BuilderBlockType, InlineFragment } from "@/types/prompt-builder"

export const INLINE_FRAGMENTS_KEY = "inlineFragments"

export const INLINE_FRAGMENT_DRAG_SOURCE = "inline-fragment" as const

export function parseInlineFragments(
  content: Record<string, unknown>,
): InlineFragment[] | null {
  const raw = content[INLINE_FRAGMENTS_KEY]
  if (!Array.isArray(raw)) return null
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null
      const row = entry as Record<string, unknown>
      const id = typeof row.id === "string" ? row.id : createId("frag")
      if (row.kind === "text") {
        return {
          id,
          kind: "text" as const,
          text: typeof row.text === "string" ? row.text : "",
        }
      }
      if (row.kind === "variable" && typeof row.field === "string") {
        return {
          id,
          kind: "variable" as const,
          field: row.field,
          variableKey:
            typeof row.variableKey === "string" ? row.variableKey : undefined,
        }
      }
      return null
    })
    .filter((entry): entry is InlineFragment => entry !== null)
}

export function defaultInlineFragments(block: BuilderBlock): InlineFragment[] {
  const c = block.content
  const type = block.type

  switch (type) {
    case "custom_text":
      return [
        {
          id: createId("frag"),
          kind: "text",
          text: String(c.text ?? ""),
        },
      ]
    case "quote_summary_header":
      return [
        { id: createId("frag"), kind: "text", text: String(c.title ?? "Quote Summary") },
        {
          id: createId("frag"),
          kind: "variable",
          field: "quoteNumber",
          variableKey: "quote.number",
        },
        {
          id: createId("frag"),
          kind: "variable",
          field: "issued",
          variableKey: "quote.issued_date",
        },
        {
          id: createId("frag"),
          kind: "variable",
          field: "validUntil",
          variableKey: "quote.valid_until",
        },
        {
          id: createId("frag"),
          kind: "variable",
          field: "customerName",
          variableKey: "customer.name",
        },
      ]
    case "company_logo":
      return [
        {
          id: createId("frag"),
          kind: "variable",
          field: "companyName",
          variableKey: "company.name",
        },
      ]
    default: {
      const defs = getBlockFieldDefs(type)
      if (defs.length === 0) {
        return [{ id: createId("frag"), kind: "text", text: "" }]
      }
      return defs.slice(0, 4).map((def) => ({
        id: createId("frag"),
        kind: "variable" as const,
        field: def.field,
        variableKey: def.key,
      }))
    }
  }
}

export function resolveInlineFragments(block: BuilderBlock): InlineFragment[] {
  const parsed = parseInlineFragments(block.content)
  if (parsed) {
    if (block.type === "custom_text") {
      return parsed.map((fragment) => {
        if (fragment.kind === "variable" && fragment.field === "text") {
          const text = getFragmentFieldValue(block.content, "text")
          return { id: fragment.id, kind: "text" as const, text }
        }
        return fragment
      })
    }
    return parsed
  }
  if (block.type === "custom_image") return []
  return defaultInlineFragments(block)
}

export function resolveFragmentVariableDef(
  blockType: BuilderBlockType,
  blockId: string,
  fragment: Extract<InlineFragment, { kind: "variable" }>,
  _content: Record<string, unknown>,
): VariableFieldDef | undefined {
  if (fragment.variableKey) {
    const key = normalizeVariableKey(fragment.variableKey)
    const catalog = getVariableCatalog().find((e) => e.key === key)
    if (catalog) {
      return {
        field: fragment.field,
        key: catalog.key,
        label: catalog.label,
        category: catalog.category,
      }
    }
  }

  if (blockType === "custom_text" && fragment.field === "text") {
    return getCustomTextVariableDef(blockId)
  }

  return getVariableDef(blockType, fragment.field)
}

export function getFragmentFieldValue(
  content: Record<string, unknown>,
  field: string,
): string {
  const value = content[field]
  return value == null ? "" : String(value)
}

export function createTextFragment(text = ""): InlineFragment {
  return { id: createId("frag"), kind: "text", text }
}

export function createVariableFragment(
  variableKey: string,
  _label: string,
  existingFields: Set<string>,
): Extract<InlineFragment, { kind: "variable" }> {
  const normalized = normalizeVariableKey(variableKey)
  const key =
    getVariableCatalog().find((e) => e.key === normalized)?.key ?? normalized

  for (const blockType of [
    "company_address",
    "quote_summary_header",
    "tcv_summary",
    "billed_to",
    "contract_details",
    "pricing",
    "entitlements",
    "ae_profile",
  ] as const) {
    const def = getBlockFieldDefs(blockType).find((d) => d.key === key)
    if (def && !existingFields.has(def.field)) {
      return {
        id: createId("frag"),
        kind: "variable",
        field: def.field,
        variableKey: key,
      }
    }
  }

  let field = `var_${createId("f").slice(0, 8)}`
  while (existingFields.has(field)) {
    field = `var_${createId("f").slice(0, 8)}`
  }

  return {
    id: createId("frag"),
    kind: "variable",
    field,
    variableKey: key,
  }
}

export function hasPersistedInlineFragments(
  content: Record<string, unknown>,
): boolean {
  return parseInlineFragments(content) !== null
}
