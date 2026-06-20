import { VariableField } from "@/components/prompt-builder/VariableField"
import { getCustomTextVariableDef } from "@/lib/derive-template-variables"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  onField: (field: string, value: string) => void
}

export function CustomTextBlockView({ block, onField }: Props) {
  const c = block.content
  const variant = String(c.variant ?? "standard")
  const variableDef = getCustomTextVariableDef(block.id)

  if (variant === "callout") {
    return (
      <div className="flex gap-3 rounded-r-lg border-l-4 border-blue-500 bg-blue-50/50 px-4 py-3">
        <VariableField
          blockType="custom_text"
          field="text"
          variableDef={variableDef}
          value={String(c.text ?? "")}
          onChange={(v) => onField("text", v)}
          multiline
          showFieldLabel
          className="text-[13px] leading-relaxed text-blue-950"
        />
      </div>
    )
  }

  if (variant === "pull_quote") {
    return (
      <blockquote className="border-y border-gray-200 py-4 text-center">
        <span className="font-serif text-[28px] leading-none text-gray-300">
          &ldquo;
        </span>
        <VariableField
          blockType="custom_text"
          field="text"
          variableDef={variableDef}
          value={String(c.text ?? "")}
          onChange={(v) => onField("text", v)}
          multiline
          className="mx-auto max-w-md text-[15px] font-medium italic leading-relaxed text-gray-800"
        />
      </blockquote>
    )
  }

  return (
    <VariableField
      blockType="custom_text"
      field="text"
      variableDef={variableDef}
      value={String(c.text ?? "")}
      onChange={(v) => onField("text", v)}
      multiline
      showFieldLabel
      className="text-[13px] leading-relaxed text-gray-700"
    />
  )
}
