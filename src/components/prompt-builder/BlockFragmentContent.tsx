import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { VariableField } from "@/components/prompt-builder/VariableField"
import { useCanEditBlockContent, useIsAdminPreview } from "@/hooks/use-builder-editor-mode"
import {
  getFragmentFieldValue,
  INLINE_FRAGMENT_DRAG_SOURCE,
  resolveFragmentVariableDef,
} from "@/lib/content-fragments"
import type { BuilderBlock, InlineFragment } from "@/types/prompt-builder"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

type Props = {
  block: BuilderBlock
  fragments: InlineFragment[]
  onUpdateFragment: (id: string, patch: Partial<InlineFragment>) => void
  onRemoveFragment: (id: string) => void
  onFieldChange: (field: string, value: string) => void
  textClassName?: string
}

function SortableFragmentRow({
  block,
  fragment,
  canEdit,
  isAdminPreview,
  onUpdate,
  onRemove,
  onFieldChange,
  textClassName,
}: {
  block: BuilderBlock
  fragment: InlineFragment
  canEdit: boolean
  isAdminPreview: boolean
  onUpdate: (patch: Partial<InlineFragment>) => void
  onRemove: () => void
  onFieldChange: (field: string, value: string) => void
  textClassName?: string
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: fragment.id,
    disabled: !canEdit,
    data: {
      source: INLINE_FRAGMENT_DRAG_SOURCE,
      blockId: block.id,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const c = block.content

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/frag-row flex items-start gap-1 ${
        isDragging ? "relative z-10 opacity-90" : ""
      }`}
    >
      {canEdit && (
        <button
          type="button"
          className="mt-0.5 flex size-5 shrink-0 cursor-grab touch-none items-center justify-center text-gray-300 opacity-0 transition-all hover:text-gray-600 active:cursor-grabbing group-hover/frag-row:opacity-100"
          aria-label="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        {fragment.kind === "text" ? (
          <InlineEditable
            blockId={block.id}
            value={fragment.text}
            onChange={(text) => onUpdate({ text } as Partial<InlineFragment>)}
            className={`min-w-0 ${textClassName ?? "text-[13px] leading-relaxed text-gray-800"}`}
            placeholder="Text"
            readOnly={isAdminPreview || !canEdit}
            multiline
          />
        ) : (
          <VariableField
            blockId={block.id}
            blockType={block.type}
            field={fragment.field}
            variableDef={resolveFragmentVariableDef(
              block.type,
              block.id,
              fragment,
              c,
            )}
            value={getFragmentFieldValue(c, fragment.field)}
            onChange={(value) => onFieldChange(fragment.field, value)}
            layout={fragment.field === "address" ? "stacked" : "inline"}
            multiline={fragment.field === "address"}
            hugContents={fragment.field === "address"}
            className={textClassName ?? "text-[13px] text-gray-800"}
          />
        )}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-gray-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover/frag-row:opacity-100"
          aria-label="Remove"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export function BlockFragmentContent({
  block,
  fragments,
  onUpdateFragment,
  onRemoveFragment,
  onFieldChange,
  textClassName,
}: Props) {
  const canEdit = useCanEditBlockContent(block.id)
  const isAdminPreview = useIsAdminPreview()

  if (fragments.length === 0) {
    return null
  }

  return (
    <SortableContext
      items={fragments.map((f) => f.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className="space-y-3">
        {fragments.map((fragment) => (
          <SortableFragmentRow
            key={fragment.id}
            block={block}
            fragment={fragment}
            canEdit={canEdit}
            isAdminPreview={isAdminPreview}
            onUpdate={(patch) => onUpdateFragment(fragment.id, patch)}
            onRemove={() => onRemoveFragment(fragment.id)}
            onFieldChange={onFieldChange}
            textClassName={textClassName}
          />
        ))}
      </div>
    </SortableContext>
  )
}
