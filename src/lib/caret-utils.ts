import {
  getEditableSerializedText,
  getMergeFieldKey,
  mergeFieldTokenLength,
} from "@/lib/merge-field-html"

/** Plain text from a live contentEditable — aligned with caret offset math. */
export function getEditablePlainText(element: HTMLElement): string {
  return element.innerText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

export function getCaretCharacterOffsetWithin(element: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0

  const range = selection.getRangeAt(0)
  if (!element.contains(range.startContainer)) return 0

  const preRange = range.cloneRange()
  preRange.selectNodeContents(element)
  preRange.setEnd(range.startContainer, range.startOffset)

  const container = document.createElement("div")
  container.appendChild(preRange.cloneContents())
  return getEditableSerializedText(container).length
}

function localTextBeforeCaret(range: Range): string {
  const { startContainer, startOffset } = range
  if (startContainer.nodeType !== Node.TEXT_NODE) return ""
  return (startContainer.textContent ?? "").slice(0, startOffset)
}

function braceTriggerLength(before: string): number {
  const pair = before.match(/\{\s*\}$/)
  if (pair) return pair[0].length
  if (before.endsWith("{")) return 1
  return 0
}

export type BraceTriggerMatch = {
  plainTextStart: number
  plainTextCaret: number
}

/** Resolve `{` / `{ }` trigger using plain text plus local text-node fallback. */
export function findBraceTriggerInEditor(
  element: HTMLElement,
): BraceTriggerMatch | null {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return null

  const range = selection.getRangeAt(0)
  if (!element.contains(range.startContainer)) return null

  const plainTextCaret = getCaretCharacterOffsetWithin(element)
  const text = getEditableSerializedText(element)
  let plainTextStart = findVariableTriggerStart(text, plainTextCaret)

  if (plainTextStart === null) {
    const localBefore = localTextBeforeCaret(range)
    const triggerLen = braceTriggerLength(localBefore)
    if (triggerLen > 0) {
      plainTextStart = plainTextCaret - triggerLen
    }
  }

  if (plainTextStart === null) {
    const before = text.slice(0, plainTextCaret)
    const braceAt = before.lastIndexOf("{")
    if (braceAt !== -1 && plainTextCaret - braceAt <= 4) {
      plainTextStart = braceAt
    }
  }

  if (plainTextStart === null) return null
  return { plainTextStart, plainTextCaret }
}

/** Replace `{` / `{ }` at the caret inside a single text node when possible. */
export function replaceBraceWithVariableAtSelection(
  element: HTMLElement,
  insertion: string,
): boolean {
  const selection = window.getSelection()
  if (!selection?.rangeCount) return false

  const range = selection.getRangeAt(0)
  if (!element.contains(range.startContainer)) return false
  if (range.startContainer.nodeType !== Node.TEXT_NODE) return false

  const textNode = range.startContainer as Text
  const offset = range.startOffset
  const content = textNode.textContent ?? ""
  const triggerLen = braceTriggerLength(content.slice(0, offset))
  if (triggerLen === 0) return false

  textNode.textContent =
    content.slice(0, offset - triggerLen) + insertion + content.slice(offset)

  const nextOffset = offset - triggerLen + insertion.length
  range.setStart(textNode, nextOffset)
  range.collapse(true)
  selection.removeAllRanges()
  selection.addRange(range)
  return true
}

export function setCaretCharacterOffsetWithin(
  element: HTMLElement,
  offset: number,
): void {
  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()
  let current = 0
  let found = false

  const placeCaret = (node: Node, nodeOffset: number) => {
    range.setStart(node, nodeOffset)
    range.collapse(true)
    found = true
  }

  const walk = (parent: Node) => {
    for (const child of Array.from(parent.childNodes)) {
      if (found) return

      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? ""
        const length = text.length
        if (current + length >= offset) {
          placeCaret(child, offset - current)
          return
        }
        current += length
        continue
      }

      if (child.nodeType !== Node.ELEMENT_NODE) continue

      const el = child as HTMLElement
      const mergeKey = getMergeFieldKey(el)
      if (mergeKey) {
        const length = mergeFieldTokenLength(mergeKey)
        if (current + length >= offset) {
          range.setStartAfter(el)
          range.collapse(true)
          found = true
          return
        }
        current += length
        continue
      }

      if (el.tagName === "BR") {
        if (current + 1 >= offset) {
          if (offset > current) {
            range.setStartAfter(el)
          } else {
            range.setStartBefore(el)
          }
          range.collapse(true)
          found = true
          return
        }
        current += 1
        continue
      }

      walk(el)
    }
  }

  walk(element)

  if (!found) {
    range.selectNodeContents(element)
    range.collapse(false)
  }

  selection.removeAllRanges()
  selection.addRange(range)
}

/** Returns start offset of `{` or `{ }` trigger immediately before the caret. */
export function findVariableTriggerStart(
  text: string,
  caretOffset: number,
): number | null {
  const before = text.slice(0, caretOffset)
  const bracePair = before.match(/\{\s*\}$/)
  if (bracePair) return caretOffset - bracePair[0].length
  if (before.endsWith("{")) return caretOffset - 1
  return null
}

export { getEditableSerializedText } from "@/lib/merge-field-html"
