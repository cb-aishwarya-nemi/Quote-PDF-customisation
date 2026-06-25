import { expandMergeFieldsInHtml, serializeMergeFieldsInHtml } from "@/lib/merge-field-html"

const RICH_TEXT_PATTERN =
  /<(?:b|strong|i|em|u|s|strike|del|ul|ol|li|br|p|div|span|a)\b[\s>]/i

export function isRichText(value: string): boolean {
  return RICH_TEXT_PATTERN.test(value)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** Plain text → safe HTML for contentEditable / read-only render. */
export function toEditableHtml(value: string): string {
  if (!value) return ""
  if (isRichText(value)) {
    return expandMergeFieldsInHtml(value)
  }
  return expandMergeFieldsInHtml(escapeHtml(value).replace(/\n/g, "<br>"))
}

/** Strip tags for plain-text fallbacks (search, variables). */
export function toPlainText(value: string): string {
  if (!value) return ""
  const serialized = serializeMergeFieldsInHtml(value)
  if (!isRichText(serialized)) return serialized
  const doc = new DOMParser().parseFromString(serialized, "text/html")
  return doc.body.textContent ?? ""
}

export { serializeMergeFieldsInHtml }
