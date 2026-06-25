import { InlineFormattingToolbar } from "@/components/prompt-builder/InlineFormattingToolbar"
import { VariableCatalogPicker } from "@/components/prompt-builder/VariableCatalogPicker"
import {
  useCanEditBlockContent,
  useIsAdminPreview,
} from "@/hooks/use-builder-editor-mode"
import {
  findBraceTriggerInEditor,
  getCaretCharacterOffsetWithin,
  getEditableSerializedText,
  replaceBraceWithVariableAtSelection,
  setCaretCharacterOffsetWithin,
} from "@/lib/caret-utils"
import { normalizeVariableKey } from "@/lib/derive-template-variables"
import { mergeFieldToken, readSerializedEditorValue } from "@/lib/merge-field-html"
import { toEditableHtml } from "@/lib/rich-text"
import { useTextFormattingStore } from "@/store/text-formatting-store"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

function isSelectionInList(): boolean {
  const selection = window.getSelection()
  if (!selection?.anchorNode) return false
  const node =
    selection.anchorNode.nodeType === Node.TEXT_NODE
      ? selection.anchorNode.parentElement
      : (selection.anchorNode as HTMLElement)
  return Boolean(node?.closest("ul, ol"))
}

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
  blockId?: string
  readOnly?: boolean
  /** Show hover/focus edit affordance. Off when parent already signals editability. */
  hoverAffordance?: boolean
  /** Multiline width — hug intrinsic text width or fill the parent row */
  width?: "full" | "hug"
  /** `manual` — line breaks only on Enter; `wrap` — soft-wrap at container edge */
  lineBreaks?: "wrap" | "manual"
  /** Enable `{` / `{ }` variable picker while typing */
  enableVariablePicker?: boolean
  /** Show formatting toolbar while this field is focused */
  enableFormatting?: boolean
}

export function InlineEditable({
  value,
  onChange,
  className = "",
  multiline,
  placeholder,
  blockId,
  readOnly,
  hoverAffordance = true,
  width = "full",
  lineBreaks = "wrap",
  enableVariablePicker = true,
  enableFormatting = true,
}: Props) {
  const isAdminPreview = useIsAdminPreview()
  const canEditContent = useCanEditBlockContent(blockId ?? "")
  const isReadOnly =
    readOnly === true ||
    isAdminPreview ||
    (blockId !== undefined && !canEditContent)
  const ref = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const blurTimerRef = useRef<number | null>(null)
  const pickerBlurTimerRef = useRef<number | null>(null)
  const triggerStartRef = useRef<number | null>(null)
  const pickerOpenRef = useRef(false)
  const pendingBraceOpenRef = useRef(false)
  const [isFocused, setIsFocused] = useState(false)
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(
    null,
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    return () => {
      if (pickerBlurTimerRef.current !== null) {
        window.clearTimeout(pickerBlurTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    pickerOpenRef.current = pickerOpen
  }, [pickerOpen])

  useEffect(() => {
    if (isReadOnly || !ref.current) return
    const el = ref.current
    const active = document.activeElement
    if (el === active || el.contains(active) || pickerOpenRef.current) return
    if (readSerializedEditorValue(el) === value) return
    el.innerHTML = toEditableHtml(value)
  }, [value, isReadOnly])

  const updateToolbarPos = useCallback(() => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setToolbarPos({
      top: Math.max(8, rect.top - 44),
      left: Math.max(8, rect.left),
    })
  }, [])

  useLayoutEffect(() => {
    if (!isFocused || !enableFormatting) {
      setToolbarPos(null)
      return
    }

    updateToolbarPos()
    const onReposition = () => updateToolbarPos()
    window.addEventListener("scroll", onReposition, true)
    window.addEventListener("resize", onReposition)
    return () => {
      window.removeEventListener("scroll", onReposition, true)
      window.removeEventListener("resize", onReposition)
    }
  }, [enableFormatting, isFocused, updateToolbarPos])

  const activateFormatting = useCallback(() => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current)
      blurTimerRef.current = null
    }
    if (!enableFormatting || !ref.current) return
    setIsFocused(true)
    useTextFormattingStore
      .getState()
      .register(ref.current, Boolean(multiline))
  }, [enableFormatting, multiline])

  const deactivateFormatting = useCallback(() => {
    setIsFocused(false)
    if (ref.current) {
      useTextFormattingStore.getState().unregister(ref.current)
    }
  }, [])

  const updatePickerPosition = useCallback(() => {
    const selection = window.getSelection()
    if (!selection?.rangeCount || !ref.current) return

    const range = selection.getRangeAt(0)
    if (!ref.current.contains(range.startContainer)) return

    const caretRect = range.getBoundingClientRect()
    const fallbackRect = ref.current.getBoundingClientRect()
    const hasCaretBox = caretRect.width > 0 || caretRect.height > 0
    setPickerPos({
      top: (hasCaretBox ? caretRect.bottom : fallbackRect.bottom) + 4,
      left: hasCaretBox ? caretRect.left : fallbackRect.left,
    })
  }, [])

  useLayoutEffect(() => {
    if (pickerOpen) {
      updatePickerPosition()
    }
  }, [pickerOpen, updatePickerPosition])

  const tryOpenVariablePicker = useCallback((skipCloseIfPending = false) => {
    if (!enableVariablePicker || isReadOnly || !ref.current) return

    const trigger = findBraceTriggerInEditor(ref.current)
    if (trigger === null) {
      if (skipCloseIfPending && pendingBraceOpenRef.current) {
        pendingBraceOpenRef.current = false
        return
      }
      setPickerOpen(false)
      triggerStartRef.current = null
      return
    }

    pendingBraceOpenRef.current = false
    triggerStartRef.current = trigger.plainTextStart
    updatePickerPosition()
    setPickerOpen(true)
  }, [enableVariablePicker, isReadOnly, updatePickerPosition])

  /** Open immediately on `{` keydown — before the character lands in the DOM. */
  const openVariablePickerForBrace = useCallback(() => {
    if (!enableVariablePicker || isReadOnly || !ref.current) return
    triggerStartRef.current = getCaretCharacterOffsetWithin(ref.current)
    pendingBraceOpenRef.current = true
    updatePickerPosition()
    pickerOpenRef.current = true
    setPickerOpen(true)
  }, [enableVariablePicker, isReadOnly, updatePickerPosition])

  const closePicker = useCallback(() => {
    pendingBraceOpenRef.current = false
    setPickerOpen(false)
    triggerStartRef.current = null
  }, [])

  const handleVariableSelect = useCallback(
    (key: string) => {
      const el = ref.current
      if (!el) return

      const token = mergeFieldToken(normalizeVariableKey(key))

      if (replaceBraceWithVariableAtSelection(el, token)) {
        const serialized = readSerializedEditorValue(el)
        el.innerHTML = toEditableHtml(serialized)
        onChange(serialized)
        closePicker()
        return
      }

      const triggerStart = triggerStartRef.current
      if (triggerStart === null) return

      const text = getEditableSerializedText(el)
      const caret = getCaretCharacterOffsetWithin(el)
      const nextText = text.slice(0, triggerStart) + token + text.slice(caret)

      el.innerHTML = toEditableHtml(nextText)
      onChange(nextText)

      const nextCaret = triggerStart + token.length
      requestAnimationFrame(() => {
        el.focus()
        setCaretCharacterOffsetWithin(el, nextCaret)
      })

      closePicker()
    },
    [closePicker, onChange],
  )

  useEffect(() => {
    if (!pickerOpen) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      if (ref.current) onChange(readSerializedEditorValue(ref.current))
      closePicker()
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [closePicker, onChange, pickerOpen])

  const shouldKeepFocus = (relatedTarget: EventTarget | null) => {
    const related = relatedTarget as Node | null
    if (!related) return false
    if (menuRef.current?.contains(related)) return true
    if (toolbarRef.current?.contains(related)) return true
    if (related instanceof HTMLElement && related.closest("[data-variable-picker]")) {
      return true
    }
    if (related instanceof HTMLElement && related.closest("[data-formatting-toolbar]")) {
      return true
    }
    if (useTextFormattingStore.getState().toolbarRef?.contains(related)) {
      return true
    }
    return false
  }

  const isFocusInsidePicker = () => {
    const active = document.activeElement
    if (!active) return false
    return Boolean(
      menuRef.current?.contains(active) ||
        (active instanceof HTMLElement && active.closest("[data-variable-picker]")),
    )
  }

  const handleEditorBlur = (el: HTMLDivElement) => {
    if (pickerBlurTimerRef.current !== null) {
      window.clearTimeout(pickerBlurTimerRef.current)
    }

    pickerBlurTimerRef.current = window.setTimeout(() => {
      pickerBlurTimerRef.current = null
      const active = document.activeElement

      if (el === active || el.contains(active)) return
      if (shouldKeepFocus(active)) return
      if (isFocusInsidePicker()) return
      if (toolbarRef.current?.contains(active)) return
      if (
        active instanceof HTMLElement &&
        active.closest("[data-formatting-toolbar]")
      ) {
        return
      }

      if (pickerOpenRef.current) return

      onChange(readSerializedEditorValue(el))
      closePicker()
      scheduleDeactivate()
    }, 50)
  }

  const scheduleDeactivate = () => {
    if (blurTimerRef.current !== null) {
      window.clearTimeout(blurTimerRef.current)
    }
    blurTimerRef.current = window.setTimeout(() => {
      blurTimerRef.current = null
      const active = document.activeElement
      if (ref.current === active || ref.current?.contains(active)) return
      if (toolbarRef.current?.contains(active)) return
      if (
        active instanceof HTMLElement &&
        active.closest("[data-formatting-toolbar]")
      ) {
        return
      }
      deactivateFormatting()
    }, 0)
  }

  const whitespaceClass =
    multiline && lineBreaks === "manual"
      ? "whitespace-pre"
      : multiline
        ? "whitespace-pre-wrap"
        : "whitespace-nowrap"

  const editCursorClass = "cursor-text"

  if (isReadOnly) {
    if (!value && placeholder) {
      return (
        <span className={`text-gray-300 ${className}`}>{placeholder}</span>
      )
    }
    return (
      <span
        className={`${whitespaceClass} [&_.inline-merge-field]:mx-0.5 [&_.merge-field-sample]:text-inherit [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
        dangerouslySetInnerHTML={{ __html: toEditableHtml(value) }}
      />
    )
  }

  const editableAffordance = !hoverAffordance
    ? width === "full"
      ? multiline
        ? `block w-full min-w-0 outline-none focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200 ${editCursorClass}`
        : `block w-full min-w-0 whitespace-nowrap outline-none focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200 ${editCursorClass}`
      : `whitespace-nowrap outline-none focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200 ${editCursorClass}`
    : multiline
      ? width === "hug"
        ? `inline-block w-max max-w-full shrink-0 rounded px-1 -mx-1 align-top ${whitespaceClass} outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200 ${editCursorClass}`
        : `block w-full rounded px-1 -mx-1 outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200 ${whitespaceClass} ${editCursorClass}`
      : width === "full"
        ? `block w-full min-w-0 whitespace-nowrap rounded px-0.5 -mx-0.5 outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200 empty:min-w-[2ch] ${editCursorClass}`
        : `inline-block w-fit max-w-full shrink-0 whitespace-nowrap rounded px-0.5 -mx-0.5 outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200 empty:min-w-[2ch] ${editCursorClass}`

  const picker =
    pickerOpen &&
    createPortal(
      <div
        ref={menuRef}
        data-variable-picker
        className="fixed z-[250]"
        style={{ top: pickerPos.top, left: pickerPos.left }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <VariableCatalogPicker
          title="Insert variable"
          onSelect={(key) => handleVariableSelect(key)}
        />
      </div>,
      document.body,
    )

  const formattingToolbar =
    enableFormatting &&
    isFocused &&
    toolbarPos &&
    createPortal(
      <div
        ref={toolbarRef}
        data-formatting-toolbar
        className="fixed z-[300]"
        style={{ top: toolbarPos.top, left: toolbarPos.left }}
      >
        <InlineFormattingToolbar editorRef={ref} />
      </div>,
      document.body,
    )

  return (
    <div
      className={`relative ${editCursorClass} ${
        width === "full" ? "min-w-0 w-full" : "w-max max-w-full shrink-0"
      }`}
    >
      <div
        ref={ref}
        role="textbox"
        contentEditable
        suppressContentEditableWarning
        data-inline-editable="true"
        data-multiline={multiline ? "true" : "false"}
        data-placeholder={placeholder}
        title={hoverAffordance ? "Click to edit" : undefined}
        tabIndex={0}
        onMouseDown={(e) => {
          e.stopPropagation()
          activateFormatting()
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
        onFocus={activateFormatting}
        onBlur={(e) => {
          if (shouldKeepFocus(e.relatedTarget)) return
          handleEditorBlur(e.currentTarget)
        }}
        onBeforeInput={(e) => {
          if (enableVariablePicker && !isReadOnly && e.data === "{") {
            openVariablePickerForBrace()
          }
        }}
        onInput={() => {
          requestAnimationFrame(() => {
            tryOpenVariablePicker(true)
          })
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === "Escape" && pickerOpen) {
            e.preventDefault()
            closePicker()
            return
          }

          if (!multiline && e.key === "Enter") {
            if (isSelectionInList()) return
            e.preventDefault()
            e.currentTarget.blur()
            return
          }

          if (
            e.key === "{" ||
            (e.key === "[" && e.shiftKey) ||
            (e.code === "BracketLeft" && e.shiftKey)
          ) {
            openVariablePickerForBrace()
          }
        }}
        className={`${editableAffordance} [&_.inline-merge-field]:mx-0.5 [&_.merge-field-sample]:text-inherit [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 empty:before:text-gray-300 empty:before:content-[attr(data-placeholder)] ${className}`}
      />
      {picker}
      {formattingToolbar}
    </div>
  )
}
