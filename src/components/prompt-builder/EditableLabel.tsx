import { InlineEditable } from "@/components/prompt-builder/InlineEditable"

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
  as?: "inline" | "block"
  blockId?: string
}

export function EditableLabel({
  value,
  onChange,
  className = "",
  as = "inline",
  blockId,
}: Props) {
  return (
    <InlineEditable
      value={value}
      onChange={onChange}
      blockId={blockId}
      className={`${as === "block" ? "block" : "inline"} ${className}`}
    />
  )
}

export function SectionLabel({
  value,
  onChange,
  className = "",
  blockId,
}: Omit<Props, "as">) {
  return (
    <EditableLabel
      value={value}
      onChange={onChange}
      blockId={blockId}
      as="block"
      className={`text-[10px] font-semibold uppercase tracking-wider text-gray-400 ${className}`}
    />
  )
}
