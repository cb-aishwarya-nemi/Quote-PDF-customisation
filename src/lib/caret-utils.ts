export function getCaretCharacterOffsetWithin(element: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0

  const range = selection.getRangeAt(0)
  const preRange = range.cloneRange()
  preRange.selectNodeContents(element)
  preRange.setEnd(range.endContainer, range.endOffset)
  return preRange.toString().length
}

export function setCaretCharacterOffsetWithin(
  element: HTMLElement,
  offset: number,
): void {
  const selection = window.getSelection()
  if (!selection) return

  const range = document.createRange()
  let current = 0
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode() as Text | null

  while (node) {
    const length = node.textContent?.length ?? 0
    if (current + length >= offset) {
      range.setStart(node, offset - current)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      return
    }
    current += length
    node = walker.nextNode() as Text | null
  }

  range.selectNodeContents(element)
  range.collapse(false)
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
