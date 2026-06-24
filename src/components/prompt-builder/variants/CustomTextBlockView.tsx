import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

export function CustomTextBlockView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "standard")
  const text = String(c.text ?? "")

  const editor = (
    <InlineEditable
      blockId={block.id}
      value={text}
      onChange={(value) => onField("text", value)}
      className={
        variant === "callout"
          ? "text-[13px] leading-relaxed text-blue-950"
          : variant === "pull_quote"
            ? "text-[15px] font-medium italic leading-relaxed text-gray-800"
            : "text-[13px] leading-relaxed text-gray-700"
      }
      placeholder="Add text…"
      multiline
    />
  )

  if (variant === "callout") {
    return (
      <div className="flex gap-3 rounded-r-lg border-l-4 border-blue-500 bg-blue-50/50 px-4 py-3">
        {editor}
      </div>
    )
  }

  if (variant === "pull_quote") {
    return (
      <blockquote className="border-y border-gray-200 py-4 text-center">
        <span className="font-serif text-[28px] leading-none text-gray-300">
          &ldquo;
        </span>
        <div className="mx-auto max-w-md">{editor}</div>
      </blockquote>
    )
  }

  return editor
}
