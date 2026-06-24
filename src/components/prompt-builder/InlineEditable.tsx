import { InlineFormattingToolbar } from "@/components/prompt-builder/InlineFormattingToolbar"
import { VariableCatalogPicker } from "@/components/prompt-builder/VariableCatalogPicker"
import {
  useCanEditBlockContent,
  useIsAdminPreview,
} from "@/hooks/use-builder-editor-mode"
import {
  findVariableTriggerStart,
  getCaretCharacterOffsetWithin,
  setCaretCharacterOffsetWithin,
} from "@/lib/caret-utils"
import { normalizeVariableKey } from "@/lib/derive-template-variables"
import { toEditableHtml, toPlainText } from "@/lib/rich-text"
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
  const triggerStartRef = useRef<number | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(
    null,
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (isReadOnly || !ref.current) return
    const html = toEditableHtml(value)
    if (ref.current.innerHTML !== html) {
      ref.current.innerHTML = html
    }
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

    const rect = range.getBoundingClientRect()
    setPickerPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    })
  }, [])

  const tryOpenVariablePicker = useCallback(() => {
    if (!enableVariablePicker || isReadOnly || !ref.current) return

    const caret = getCaretCharacterOffsetWithin(ref.current)
    const text = toPlainText(ref.current.innerHTML)
    const triggerStart = findVariableTriggerStart(text, caret)
    if (triggerStart === null) {
      setPickerOpen(false)
      triggerStartRef.current = null
      return
    }

    triggerStartRef.current = triggerStart
    updatePickerPosition()
    setPickerOpen(true)
  }, [enableVariablePicker, isReadOnly, updatePickerPosition])

  const closePicker = useCallback(() => {
    setPickerOpen(false)
    triggerStartRef.current = null
  }, [])

  const handleVariableSelect = useCallback(
    (key: string) => {
      const el = ref.current
      const triggerStart = triggerStartRef.current
      if (!el || triggerStart === null) return

      const normalizedKey = normalizeVariableKey(key)
      const text = toPlainText(el.innerHTML)
      const caret = getCaretCharacterOffsetWithin(el)
      const insertion = `{{${normalizedKey}}}`
      const nextText =
        text.slice(0, triggerStart) + insertion + text.slice(caret)

      el.innerHTML = toEditableHtml(nextText)
      onChange(el.innerHTML)

      const nextCaret = triggerStart + insertion.length
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
      closePicker()
    }

    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [closePicker, pickerOpen])

  const shouldKeepFocus = (relatedTarget: EventTarget | null) => {
    const related = relatedTarget as Node | null
    if (!related) return false
    if (menuRef.current?.contains(related)) return true
    if (toolbarRef.current?.contains(related)) return true
    if (related instanceof HTMLElement && related.closest("[data-formatting-toolbar]")) {
      return true
    }
    if (useTextFormattingStore.getState().toolbarRef?.contains(related)) {
      return true
    }
    return false
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

  if (isReadOnly) {
    if (!value && placeholder) {
      return (
        <span className={`text-gray-300 ${className}`}>{placeholder}</span>
      )
    }
    return (
      <span
        className={`${multiline ? "whitespace-pre-wrap" : "whitespace-nowrap"} [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
        dangerouslySetInnerHTML={{ __html: toEditableHtml(value) }}
      />
    )
  }

  const editableAffordance = !hoverAffordance
    ? width === "full"
      ? multiline
        ? "block w-full min-w-0 outline-none focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200"
        : "block w-full min-w-0 whitespace-nowrap outline-none focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200"
      : "whitespace-nowrap outline-none focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200"
    : multiline
      ? width === "hug"
        ? "inline-block w-max max-w-full shrink-0 cursor-text rounded px-1 -mx-1 align-top whitespace-pre-wrap outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200"
        : "block w-full cursor-text rounded px-1 -mx-1 outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200 whitespace-pre-wrap"
      : width === "full"
        ? "block w-full min-w-0 cursor-text whitespace-nowrap rounded px-0.5 -mx-0.5 outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200 empty:min-w-[2ch]"
        : "inline-block w-fit max-w-full shrink-0 cursor-text whitespace-nowrap rounded px-0.5 -mx-0.5 outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200 empty:min-w-[2ch]"

  const picker =
    pickerOpen &&
    createPortal(
      <div
        ref={menuRef}
        className="fixed z-[250]"
        style={{ top: pickerPos.top, left: pickerPos.left }}
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
      className={`relative ${
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
          onChange(e.currentTarget.innerHTML)
          closePicker()
          scheduleDeactivate()
        }}
        onInput={() => {
          tryOpenVariablePicker()
        }}
        onKeyDown={(e) => {
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

          if (e.key === "{") {
            requestAnimationFrame(() => tryOpenVariablePicker())
          }
        }}
        className={`${editableAffordance} [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 empty:before:text-gray-300 empty:before:content-[attr(data-placeholder)] ${className}`}
      />
      {picker}
      {formattingToolbar}
    </div>
  )
}
