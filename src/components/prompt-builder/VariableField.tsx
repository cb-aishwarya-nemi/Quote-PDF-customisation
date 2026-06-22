import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { VariableOptionsMenu } from "@/components/prompt-builder/VariableOptionsMenu"
import { useCanEditBlockContent, useIsAdminPreview } from "@/hooks/use-builder-editor-mode"
import {
  getVariableDef,
  getVariableFallbacks,
  getVariableKeyOverrides,
  isVariableRemoved,
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
  /** Multiline fields hug text width instead of stretching the row */
  hugContents?: boolean
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
  hugContents = false,
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

  if (isAdminPreview || !canEdit) {
    const display = displayValue || placeholder || "—"
    if (layout === "inline") {
      return <span className={`whitespace-nowrap ${className}`}>{display}</span>
    }
    return (
      <div className={hugContents ? "w-fit max-w-full" : "min-w-0"}>
        {showFieldLabel && def && (
          <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            {def.label}
          </span>
        )}
        <span className={`${multiline ? "whitespace-pre-wrap" : ""} ${className}`}>
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
      />
    )
  }

  const handleKeyChange = (newKey: string) => {
    const overrides = getVariableKeyOverrides(content)
    updateBlockField(blockId, "variableKeys", { ...overrides, [field]: newKey })
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
      width={multiline && hugContents ? "hug" : "full"}
    />
  )

  if (layout === "inline") {
    return (
      <span className="inline-flex shrink-0 items-baseline gap-1.5">
        {editable}
        {variablePill}
      </span>
    )
  }

  return (
    <div className={hugContents ? "w-fit max-w-full" : "min-w-0"}>
      {showFieldLabel && (
        <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-400">
          {resolvedDef.label}
        </span>
      )}
      <div
        className={`${
          hugContents ? "inline-flex w-fit max-w-full" : "flex"
        } gap-1.5 ${multiline ? "items-start" : "items-baseline"}`}
      >
        {editable}
        <span className="shrink-0">{variablePill}</span>
      </div>
    </div>
  )
}
