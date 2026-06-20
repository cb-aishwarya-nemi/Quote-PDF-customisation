import {
  useCanEditBlockContent,
  useIsPreviewMode,
} from "@/hooks/use-builder-editor-mode"
import { useEffect, useRef } from "react"

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
}: Props) {
  const isPreview = useIsPreviewMode()
  const canEdit = blockId ? useCanEditBlockContent(blockId) : true
  const isReadOnly =
    readOnly === true ||
    isPreview ||
    (blockId !== undefined && !canEdit)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isReadOnly || !ref.current) return
    if (ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value, isReadOnly])

  if (isReadOnly) {
    if (!value && placeholder) {
      return (
        <span className={`text-gray-300 ${className}`}>{placeholder}</span>
      )
    }
    return <span className={className}>{value}</span>
  }

  const editableAffordance = !hoverAffordance
    ? "outline-none focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200"
    : multiline
      ? "block w-full cursor-text rounded px-1 -mx-1 outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200"
      : "inline-block w-fit max-w-full cursor-text rounded px-0.5 -mx-0.5 outline-none transition-[background-color,box-shadow] duration-150 hover:bg-blue-50/55 hover:ring-1 hover:ring-inset hover:ring-blue-200/80 focus:bg-blue-50/55 focus:ring-1 focus:ring-blue-200 empty:min-w-[2ch]"

  return (
    <div
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      title={hoverAffordance ? "Click to edit" : undefined}
      onBlur={(e) => onChange(e.currentTarget.textContent ?? "")}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={`${editableAffordance} empty:before:text-gray-300 empty:before:content-[attr(data-placeholder)] ${className}`}
    />
  )
}
