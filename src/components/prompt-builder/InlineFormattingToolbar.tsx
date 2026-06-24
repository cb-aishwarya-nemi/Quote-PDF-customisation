import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
} from "lucide-react"
import { useEffect, useState, type ReactNode, type RefObject } from "react"

function isFormatActive(command: string): boolean {
  try {
    return document.queryCommandState(command)
  } catch {
    return false
  }
}

type Props = {
  editorRef: RefObject<HTMLElement | null>
  className?: string
}

function FormatButton({
  label,
  active,
  onPress,
  children,
}: {
  label: string
  active?: boolean
  onPress: () => void
  children: ReactNode
}) {
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

export function InlineFormattingToolbar({
  editorRef,
  className = "",
}: Props) {
  const [, refresh] = useState(0)

  useEffect(() => {
    const onSelectionChange = () => refresh((n) => n + 1)
    document.addEventListener("selectionchange", onSelectionChange)
    return () => document.removeEventListener("selectionchange", onSelectionChange)
  }, [])

  const runFormat = (command: string, value?: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.focus()
    document.execCommand(command, false, value)
  }

  const handleLink = () => {
    const url = window.prompt("Enter link URL")
    if (!url?.trim()) return
    runFormat("createLink", url.trim())
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-md ${className}`}
      role="toolbar"
      aria-label="Text formatting"
      onMouseDown={(e) => e.preventDefault()}
    >
      <span className="mr-1 text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        Format
      </span>
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
      <span className="mx-0.5 h-5 w-px bg-gray-200" aria-hidden />
      <FormatButton label="Insert link" onPress={handleLink}>
        <Link2 className="size-3.5" />
      </FormatButton>
      <span className="mx-0.5 h-5 w-px bg-gray-200" aria-hidden />
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
    </div>
  )
}
