import { InlineEditable } from "@/components/prompt-builder/InlineEditable"

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
  as?: "inline" | "block"
}

export function EditableLabel({
  value,
  onChange,
  className = "",
  as = "inline",
}: Props) {
  return (
    <InlineEditable
      value={value}
      onChange={onChange}
      className={`outline-none focus:rounded focus:bg-blue-50/50 focus:ring-1 focus:ring-blue-200 ${
        as === "block" ? "block" : "inline"
      } ${className}`}
    />
  )
}

export function SectionLabel({
  value,
  onChange,
  className = "",
}: Omit<Props, "as">) {
  return (
    <EditableLabel
      value={value}
      onChange={onChange}
      as="block"
      className={`text-[10px] font-semibold uppercase tracking-wider text-gray-400 ${className}`}
    />
  )
}
