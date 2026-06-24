import { useTextFormattingStore } from "@/store/text-formatting-store"
import { useEffect } from "react"

const INLINE_EDITABLE_SELECTOR = '[data-inline-editable="true"]'

function resolveEditor(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof HTMLElement)) return null
  return target.closest(INLINE_EDITABLE_SELECTOR) as HTMLElement | null
}

function isToolbarFocusTarget(node: Node | null): boolean {
  if (!node || !(node instanceof Node)) return false
  const { toolbarRef } = useTextFormattingStore.getState()
  if (toolbarRef?.contains(node)) return true
  return Boolean(
    node instanceof HTMLElement && node.closest("[data-formatting-toolbar]"),
  )
}

/** Tracks focus across all InlineEditable fields. */
export function useTextFormattingFocusBridge() {
  useEffect(() => {
    const registerFromTarget = (target: EventTarget | null) => {
      const editor = resolveEditor(target)
      if (!editor) return
      const multiline = editor.dataset.multiline === "true"
      useTextFormattingStore.getState().register(editor, multiline)
    }

    const onMouseDown = (event: MouseEvent) => {
      registerFromTarget(event.target)
    }

    const onFocusIn = (event: FocusEvent) => {
      registerFromTarget(event.target)
    }

    const onFocusOut = () => {
      window.setTimeout(() => {
        const { activeEditor } = useTextFormattingStore.getState()
        if (!activeEditor) return
        const focused = document.activeElement
        if (activeEditor === focused || activeEditor.contains(focused)) return
        if (isToolbarFocusTarget(focused)) return
        useTextFormattingStore.getState().unregister(activeEditor)
      }, 0)
    }

    document.addEventListener("mousedown", onMouseDown, true)
    document.addEventListener("focusin", onFocusIn, true)
    document.addEventListener("focusout", onFocusOut, true)
    return () => {
      document.removeEventListener("mousedown", onMouseDown, true)
      document.removeEventListener("focusin", onFocusIn, true)
      document.removeEventListener("focusout", onFocusOut, true)
    }
  }, [])
}
