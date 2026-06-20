import { useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import { useEffect, useRef } from "react"

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
}

export function InlineEditable({
  value,
  onChange,
  className = "",
  multiline,
  placeholder,
}: Props) {
  const isPreview = useIsPreviewMode()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isPreview || !ref.current) return
    if (ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value, isPreview])

  if (isPreview) {
    if (!value && placeholder) {
      return (
        <span className={`text-gray-300 ${className}`}>{placeholder}</span>
      )
    }
    return <span className={className}>{value}</span>
  }

  return (
    <div
      ref={ref}
      role="textbox"
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onChange(e.currentTarget.textContent ?? "")}
      onKeyDown={(e) => {
        if (!multiline && e.key === "Enter") {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={`outline-none empty:before:text-gray-300 empty:before:content-[attr(data-placeholder)] focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200 ${className}`}
    />
  )
}
