import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { VariableOptionsMenu } from "@/components/prompt-builder/VariableOptionsMenu"
import { useCanEditBlockContent, useIsAdminPreview } from "@/hooks/use-builder-editor-mode"
import {
  getVariableDef,
  getVariableFallbacks,
  getVariableKeyOverrides,
  isVariableRemoved,
  normalizeVariableKey,
  resolveVariableDef,
  resolveVariableDisplayValue,
  type VariableFieldDef,
} from "@/lib/derive-template-variables"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlockType } from "@/types/prompt-builder"

type Props = {
  blockId: string
  blockType: BuilderBlockType
  field: string
  value: string
  onChange: (value: string) => void
  className?: string
  multiline?: boolean
  placeholder?: string
  /** When parent already renders the human label (e.g. QUOTE #) */
  showFieldLabel?: boolean
  layout?: "stacked" | "inline"
  /** Override lookup — pricing rows, custom text */
  variableDef?: VariableFieldDef
}

export function VariableField({
  blockId,
  blockType,
  field,
  value,
  onChange,
  className = "",
  multiline,
  placeholder,
  showFieldLabel = false,
  layout = "stacked",
  variableDef,
}: Props) {
  const isAdminPreview = useIsAdminPreview()
  const canEdit = useCanEditBlockContent(blockId)
  const blockContent = usePromptBuilderStore(
    (s) => s.template?.blocks.find((b) => b.id === blockId)?.content,
  )
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const content = blockContent ?? {}
  const baseDef = variableDef ?? getVariableDef(blockType, field)
  const removed = baseDef ? isVariableRemoved(content, field) : false
  const def = removed ? baseDef : resolveVariableDef(blockType, field, content, baseDef)

  const displayValue = resolveVariableDisplayValue(value, content, field)
  /** Always hug text so the variable pill sits immediately after the value. */
  const useHugWidth = true

  if (isAdminPreview || !canEdit) {
    const display = displayValue || placeholder || "—"
    if (layout === "inline") {
      return <span className={`whitespace-nowrap ${className}`}>{display}</span>
    }
    return (
      <div className="w-fit max-w-full">
        {showFieldLabel && def && (
          <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            {def.label}
          </span>
        )}
        <span
          className={`${multiline ? "whitespace-pre-wrap" : "whitespace-nowrap"} ${className}`}
        >
          {display}
        </span>
      </div>
    )
  }

  if (!baseDef) {
    return (
      <InlineEditable
        blockId={blockId}
        value={value}
        onChange={onChange}
        className={className}
        multiline={multiline}
        placeholder={placeholder}
        width={useHugWidth ? "hug" : "full"}
      />
    )
  }

  const handleKeyChange = (newKey: string) => {
    const overrides = getVariableKeyOverrides(content)
    updateBlockField(blockId, "variableKeys", {
      ...overrides,
      [field]: normalizeVariableKey(newKey),
    })
  }

  const handleFallbackChange = (next: string) => {
    const fallbacks = getVariableFallbacks(content)
    updateBlockField(blockId, "variableFallbacks", { ...fallbacks, [field]: next })
  }

  const handleRemove = () => {
    const removedMap = { ...(content.variableRemoved as Record<string, true> | undefined) }
    updateBlockField(blockId, "variableRemoved", { ...removedMap, [field]: true })
  }

  const handleRestore = () => {
    const removedMap = { ...(content.variableRemoved as Record<string, true> | undefined) }
    const next = { ...removedMap }
    delete next[field]
    updateBlockField(blockId, "variableRemoved", next)
  }

  const resolvedDef =
    def ?? resolveVariableDef(blockType, field, content, baseDef) ?? baseDef

  const variablePill = (
    <VariableOptionsMenu
      fieldLabel={resolvedDef.label}
      variableKey={resolvedDef.key}
      category={resolvedDef.category}
      fallbackValue={getVariableFallbacks(content)[field] ?? ""}
      removed={removed}
      onKeyChange={handleKeyChange}
      onFallbackChange={handleFallbackChange}
      onRemove={handleRemove}
      onRestore={handleRestore}
    />
  )

  const editable = (
    <InlineEditable
      blockId={blockId}
      value={value}
      onChange={onChange}
      className={className}
      multiline={multiline}
      placeholder={placeholder}
      width={useHugWidth ? "hug" : "full"}
    />
  )

  if (layout === "inline") {
    return (
      <span className="inline-flex shrink-0 items-baseline gap-1.5 whitespace-nowrap">
        {editable}
        {variablePill}
      </span>
    )
  }

  return (
    <div className={useHugWidth ? "w-fit max-w-full" : "min-w-0 w-full"}>
      {showFieldLabel && (
        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          {resolvedDef.label}
        </span>
      )}
      <div className="inline-flex max-w-full items-start gap-1.5">
        {editable}
        <span className="shrink-0">{variablePill}</span>
      </div>
    </div>
  )
}
