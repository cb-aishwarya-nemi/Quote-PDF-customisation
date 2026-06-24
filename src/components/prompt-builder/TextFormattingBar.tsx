import { useTextFormattingStore } from "@/store/text-formatting-store"
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

function isFormatActive(command: string): boolean {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

function runFormat(command: string, value?: string) {
  const editor = useTextFormattingStore.getState().activeEditor
  if (!editor) return
  editor.focus()
  document.execCommand(command, false, value)
}

type FormatButtonProps = {
  label: string
  active?: boolean
  onPress: () => void
  children: React.ReactNode
}

function FormatButton({ label, active, onPress, children }: FormatButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => {
        e.preventDefault()
        onPress()
      }}
      className={`flex size-7 items-center justify-center rounded-md transition-colors ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  )
}

function FormattingControls() {
  const [, refresh] = useState(0)
  const activeEditor = useTextFormattingStore((s) => s.activeEditor)

  useEffect(() => {
    if (!activeEditor) return
    const onSelectionChange = () => refresh((n) => n + 1)
    document.addEventListener("selectionchange", onSelectionChange)
    return () => document.removeEventListener("selectionchange", onSelectionChange)
  }, [activeEditor])

  const handleLink = () => {
    const url = window.prompt("Enter link URL")
    if (!url?.trim()) return
    runFormat("createLink", url.trim())
  }

  return (
    <>
      <FormatButton
        label="Bold"
        active={isFormatActive("bold")}
        onPress={() => runFormat("bold")}
      >
        <Bold className="size-3.5" />
      </FormatButton>
      <FormatButton
        label="Italic"
        active={isFormatActive("italic")}
        onPress={() => runFormat("italic")}
      >
        <Italic className="size-3.5" />
      </FormatButton>
      <FormatButton
        label="Underline"
        active={isFormatActive("underline")}
        onPress={() => runFormat("underline")}
      >
        <Underline className="size-3.5" />
      </FormatButton>
      <FormatButton
        label="Strikethrough"
        active={isFormatActive("strikeThrough")}
        onPress={() => runFormat("strikeThrough")}
      >
        <Strikethrough className="size-3.5" />
      </FormatButton>

      <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />

      <FormatButton label="Insert link" onPress={handleLink}>
        <Link2 className="size-3.5" />
      </FormatButton>

      <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden />

      <FormatButton
        label="Bullet list"
        active={isFormatActive("insertUnorderedList")}
        onPress={() => runFormat("insertUnorderedList")}
      >
        <List className="size-3.5" />
      </FormatButton>
      <FormatButton
        label="Numbered list"
        active={isFormatActive("insertOrderedList")}
        onPress={() => runFormat("insertOrderedList")}
      >
        <ListOrdered className="size-3.5" />
      </FormatButton>
    </>
  )
}

type BarShellProps = {
  className?: string
}

function BarShell({ className = "" }: BarShellProps) {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const setToolbarRef = useTextFormattingStore((s) => s.setToolbarRef)

  useEffect(() => {
    setToolbarRef(toolbarRef.current)
    return () => setToolbarRef(null)
  }, [setToolbarRef])

  return (
    <div
      ref={toolbarRef}
      data-formatting-toolbar
      className={`flex items-center gap-1 ${className}`}
      role="toolbar"
      aria-label="Text formatting"
    >
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Format
      </span>
      <FormattingControls />
    </div>
  )
}

/** Fixed below the builder header — always on screen while a field is active. */
export function TextFormattingBarFixed() {
  const isActive = useTextFormattingStore((s) => s.isFormattingActive)
  if (!isActive) return null

  return createPortal(
    <div className="fixed inset-x-0 top-[49px] z-[200] border-b border-gray-200 bg-white px-4 py-2 shadow-md">
      <div className="mx-auto flex max-w-4xl justify-center">
        <BarShell />
      </div>
    </div>,
    document.body,
  )
}

/** Inline row above the document canvas. */
export function TextFormattingBarInline() {
  const isActive = useTextFormattingStore((s) => s.isFormattingActive)
  if (!isActive) return null

  return (
    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/40 px-3 py-2">
      <BarShell />
    </div>
  )
}
