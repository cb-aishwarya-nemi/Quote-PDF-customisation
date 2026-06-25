import {
  getVariableCatalog,
  getVariableDummyValue,
  normalizeVariableKey,
} from "@/lib/derive-template-variables"
import type { TemplateVariableCategory } from "@/types/prompt-builder"

export const MERGE_FIELD_SELECTOR = "[data-merge-key]"

const MERGE_FIELD_TOKEN_PATTERN = /\{\{([^{}\s]+)\}\}/g

const CATEGORY_BADGE_STYLES: Record<TemplateVariableCategory, string> = {
  quote: "bg-blue-50 text-blue-700 ring-blue-100",
  customer: "bg-violet-50 text-violet-700 ring-violet-100",
  contract: "bg-amber-50 text-amber-800 ring-amber-100",
  pricing: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  people: "bg-slate-100 text-slate-700 ring-slate-200",
  routing: "bg-orange-50 text-orange-800 ring-orange-100",
  custom: "bg-gray-100 text-gray-600 ring-gray-200",
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function categoryFromKey(key: string): TemplateVariableCategory {
  if (key.startsWith("customer.")) return "customer"
  if (key.startsWith("contract.")) return "contract"
  if (key.startsWith("ae.")) return "people"
  if (key.startsWith("custom.")) return "custom"
  if (key.startsWith("deal.")) return "routing"
  if (key.includes("line_items")) return "pricing"
  return "quote"
}

export function mergeFieldToken(key: string): string {
  return `{{${normalizeVariableKey(key)}}}`
}

export function mergeFieldTokenLength(key: string): number {
  return mergeFieldToken(key).length
}

export function getMergeFieldKey(element: Element): string | null {
  return element.getAttribute("data-merge-key")
}

export function renderMergeFieldChipHtml(key: string): string {
  const normalized = normalizeVariableKey(key)
  const sample = escapeHtml(getVariableDummyValue(normalized))
  const catalogEntry = getVariableCatalog().find((entry) => entry.key === normalized)
  const label = catalogEntry?.label ?? normalized
  const category = categoryFromKey(normalized)
  const pillClass = CATEGORY_BADGE_STYLES[category]
  const title = escapeHtml(`${label} · {{${normalized}}}`)

  return `<span contenteditable="false" data-merge-key="${escapeHtml(normalized)}" class="inline-merge-field inline-flex max-w-full items-baseline gap-1 align-baseline" title="${title}"><span class="merge-field-sample">${sample}</span><span class="merge-field-pill inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 font-mono text-[9px] font-medium ring-1 ring-inset ${pillClass}">{ }</span></span>`
}

export function expandMergeFieldTokensInText(text: string): string {
  return text.replace(MERGE_FIELD_TOKEN_PATTERN, (_match, key: string) =>
    renderMergeFieldChipHtml(key),
  )
}

function expandMergeFieldsInRichHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html")
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  let current = walker.nextNode()
  while (current) {
    textNodes.push(current as Text)
    current = walker.nextNode()
  }

  for (const node of textNodes) {
    const source = node.textContent ?? ""
    if (!MERGE_FIELD_TOKEN_PATTERN.test(source)) continue

    MERGE_FIELD_TOKEN_PATTERN.lastIndex = 0
    const fragment = doc.createDocumentFragment()
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = MERGE_FIELD_TOKEN_PATTERN.exec(source)) !== null) {
      if (match.index > lastIndex) {
        fragment.appendChild(
          doc.createTextNode(source.slice(lastIndex, match.index)),
        )
      }
      const template = doc.createElement("template")
      template.innerHTML = renderMergeFieldChipHtml(match[1] ?? "")
      fragment.appendChild(template.content.firstChild!.cloneNode(true))
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < source.length) {
      fragment.appendChild(doc.createTextNode(source.slice(lastIndex)))
    }

    node.replaceWith(fragment)
  }

  return doc.body.innerHTML
}

export function expandMergeFieldsInHtml(html: string): string {
  if (!html) return ""
  if (!MERGE_FIELD_TOKEN_PATTERN.test(html)) return html
  MERGE_FIELD_TOKEN_PATTERN.lastIndex = 0
  if (/<[a-z][\s>]/i.test(html)) {
    return expandMergeFieldsInRichHtml(html)
  }
  return expandMergeFieldTokensInText(html)
}

export function serializeMergeFieldsInHtml(html: string): string {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  doc.body.querySelectorAll(MERGE_FIELD_SELECTOR).forEach((chip) => {
    const key = chip.getAttribute("data-merge-key")
    if (!key) {
      chip.remove()
      return
    }
    chip.replaceWith(doc.createTextNode(mergeFieldToken(key)))
  })
  return doc.body.innerHTML
}

export function serializedNodeLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").length
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return 0

  const element = node as HTMLElement
  const key = getMergeFieldKey(element)
  if (key) return mergeFieldTokenLength(key)
  if (element.tagName === "BR") return 1

  return Array.from(element.childNodes).reduce(
    (sum, child) => sum + serializedNodeLength(child),
    0,
  )
}

export function getEditableSerializedText(element: HTMLElement): string {
  const parts: string[] = []

  const walk = (parent: Node) => {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        parts.push(child.textContent ?? "")
        continue
      }

      if (child.nodeType !== Node.ELEMENT_NODE) continue

      const el = child as HTMLElement
      const key = getMergeFieldKey(el)
      if (key) {
        parts.push(mergeFieldToken(key))
        continue
      }

      if (el.tagName === "BR") {
        parts.push("\n")
        continue
      }

      walk(el)
    }
  }

  walk(element)
  return parts.join("")
}

export function readSerializedEditorValue(element: HTMLElement): string {
  return serializeMergeFieldsInHtml(element.innerHTML)
}
