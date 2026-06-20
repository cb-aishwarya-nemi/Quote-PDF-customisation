import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { VariableOptionsMenu } from "@/components/prompt-builder/VariableOptionsMenu"
import { useCanEditBlockContent, useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import {
  getVariableDef,
  getVariableFallback,
  getVariableFallbacks,
  getVariableKeyOverrides,
  isVariableRemoved,
  resolveVariableDef,
  resolveVariableDisplayValue,
  type VariableFieldDef,
} from "@/lib/derive-template-variables"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlockType, TemplateVariableCategory } from "@/types/prompt-builder"

const CATEGORY_FIELD_STYLES: Record<TemplateVariableCategory, string> = {
  quote:
    "border-blue-200/80 bg-blue-50/40 focus-within:bg-blue-50/70 focus-within:ring-blue-200",
  customer:
    "border-violet-200/80 bg-violet-50/40 focus-within:bg-violet-50/70 focus-within:ring-violet-200",
  contract:
    "border-amber-200/80 bg-amber-50/40 focus-within:bg-amber-50/70 focus-within:ring-amber-200",
  pricing:
    "border-emerald-200/80 bg-emerald-50/40 focus-within:bg-emerald-50/70 focus-within:ring-emerald-200",
  people:
    "border-slate-200 bg-slate-50/60 focus-within:bg-slate-50 focus-within:ring-slate-200",
  routing:
    "border-orange-200/80 bg-orange-50/40 focus-within:bg-orange-50/70 focus-within:ring-orange-200",
  custom:
    "border-gray-200 bg-gray-50/60 focus-within:bg-gray-50 focus-within:ring-gray-200",
}

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
  const isPreview = useIsPreviewMode()
  const canEdit = useCanEditBlockContent(blockId)
  const blockContent = usePromptBuilderStore(
    (s) => s.template?.blocks.find((b) => b.id === blockId)?.content,
  )
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const content = blockContent ?? {}
  const baseDef = variableDef ?? getVariableDef(blockType, field)
  const removed = baseDef ? isVariableRemoved(content, field) : false
  const def = removed ? baseDef : resolveVariableDef(blockType, field, content, baseDef)
  const fallback = getVariableFallback(content, field)

  const displayValue = resolveVariableDisplayValue(value, content, field)

  if (isPreview || !canEdit) {
    const display = displayValue || placeholder || "—"
    if (layout === "inline") {
      return <span className={className}>{display}</span>
    }
    return (
      <div className="min-w-0">
        {showFieldLabel && def && (
          <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-gray-400">
            {def.label}
          </span>
        )}
        <span className={className}>{display}</span>
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

  const variableMenu = (
    <VariableOptionsMenu
      fieldLabel={resolvedDef.label}
      variableKey={resolvedDef.key}
      category={resolvedDef.category}
      fallbackValue={fallback}
      removed={removed}
      onKeyChange={handleKeyChange}
      onFallbackChange={handleFallbackChange}
      onRemove={handleRemove}
      onRestore={handleRestore}
    />
  )

  if (removed) {
    if (layout === "inline") {
      return (
        <span className="inline-flex flex-wrap items-baseline gap-1">
          <InlineEditable
            blockId={blockId}
            value={value}
            onChange={onChange}
            className={className}
            multiline={multiline}
            placeholder={placeholder}
          />
          {variableMenu}
        </span>
      )
    }

    return (
      <div className="min-w-0">
        {(showFieldLabel || layout === "stacked") && (
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {showFieldLabel && (
              <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
                {resolvedDef.label}
              </span>
            )}
            {variableMenu}
          </div>
        )}
        <InlineEditable
          blockId={blockId}
          value={value}
          onChange={onChange}
          className={className}
          multiline={multiline}
          placeholder={placeholder}
        />
      </div>
    )
  }

  const fieldShell = CATEGORY_FIELD_STYLES[resolvedDef.category]

  if (layout === "inline") {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-1">
        <span
          className={`inline-block rounded border border-dashed px-1 py-px transition-colors hover:border-solid ${fieldShell}`}
        >
          <InlineEditable
            blockId={blockId}
            value={value}
            onChange={onChange}
            className={className}
            multiline={multiline}
            placeholder={placeholder}
            hoverAffordance={false}
          />
        </span>
        {variableMenu}
        {fallback.trim() && (
          <span className="text-[9px] text-gray-400" title="Fallback set">
            fb: {fallback}
          </span>
        )}
      </span>
    )
  }

  return (
    <div className="min-w-0">
      {(showFieldLabel || layout === "stacked") && (
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {showFieldLabel && (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
              {resolvedDef.label}
            </span>
          )}
          {variableMenu}
          {fallback.trim() && (
            <span className="text-[9px] text-gray-400" title="Fallback value">
              fallback: {fallback}
            </span>
          )}
        </div>
      )}
      <div
        className={`rounded-md border border-dashed px-1.5 py-0.5 ring-1 ring-transparent transition-colors hover:border-solid focus-within:ring-2 ${fieldShell}`}
      >
        <InlineEditable
          blockId={blockId}
          value={value}
          onChange={onChange}
          className={className}
          multiline={multiline}
          placeholder={placeholder}
          hoverAffordance={false}
        />
      </div>
    </div>
  )
}
