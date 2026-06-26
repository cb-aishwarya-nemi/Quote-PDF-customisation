import { PageThumbnailPreview } from "@/components/prompt-builder/PageThumbnailPreview"
import { useIsSalesMode, useIsTemplateEditMode } from "@/hooks/use-builder-editor-mode"
import {
  deriveTemplatePages,
  findCustomPage,
  type TemplatePageItem,
} from "@/lib/template-pages"
import { getCustomPageKind } from "@/lib/page-blocks"
import type { TemplatePageId } from "@/types/prompt-builder"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import {
  getDisplayedPages,
  imageBlockHasMedia,
  parseImageBlockContent,
} from "@/types/image-block"
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { RemovePageButton } from "@/components/prompt-builder/RemovePageButton"
import { BookOpen, FileText, GripVertical } from "lucide-react"

function PageInsertLine({
  onAdd,
  position = "below",
}: {
  onAdd: () => void
  position?: "above" | "below"
}) {
  const label =
    position === "above" ? "Add page above" : "Add page below"

  return (
    <div
      className="pointer-events-none max-h-0 overflow-hidden py-0 opacity-0 transition-all duration-150 group-hover/page-item:pointer-events-auto group-hover/page-item:max-h-4 group-hover/page-item:py-1.5 group-hover/page-item:opacity-100"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center px-0.5"
        aria-label={label}
        title={label}
      >
        <span className="h-0.5 w-full rounded-full bg-blue-300 transition-colors hover:bg-blue-500" />
      </button>
    </div>
  )
}

function CustomPageThumbnail({ pageId }: { pageId: string }) {
  const template = usePromptBuilderStore((s) => s.template)
  const customPage = template ? findCustomPage(template, pageId) : undefined

  if (customPage && getCustomPageKind(customPage) === "blocks") {
    const blocks = customPage.blocks ?? []
    if (blocks.length > 0 && template) {
      return (
        <div className="h-full w-full overflow-hidden bg-gradient-to-b from-[#eef0f3] to-[#e4e7eb] p-1.5">
          <PageThumbnailPreview
            template={{ ...template, blocks }}
            compact
            fill
          />
        </div>
      )
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-slate-50 to-slate-100 px-2 text-center">
        <FileText className="size-4 text-slate-400" strokeWidth={1.5} />
        <span className="text-[9px] font-medium text-slate-500">
          {customPage?.label ?? "Blank page"}
        </span>
      </div>
    )
  }

  const content = parseImageBlockContent(
    (customPage?.content ?? {}) as Record<string, unknown>,
  )
  const hasMedia = imageBlockHasMedia(content)
  const previewUrl =
    getDisplayedPages(content)[0]?.previewUrl ?? content.previewUrl

  if (hasMedia && previewUrl) {
    return (
      <img
        src={previewUrl}
        alt="Page preview"
        className="h-full w-full object-cover object-top"
      />
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-slate-50 to-slate-100 px-2 text-center">
      <BookOpen className="size-4 text-slate-400" strokeWidth={1.5} />
      <span className="text-[9px] font-medium text-slate-500">
        {customPage?.label ?? "Page 1"}
      </span>
    </div>
  )
}

function QuotePageThumbnail() {
  const template = usePromptBuilderStore((s) => s.template)
  if (!template) return null

  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-b from-[#eef0f3] to-[#e4e7eb] p-1.5">
      <PageThumbnailPreview template={template} compact fill />
    </div>
  )
}

type PageCardProps = {
  page: TemplatePageItem
  selected: boolean
  sortable: boolean
  canDelete: boolean
  onSelect: () => void
}

function SortablePageCard({
  page,
  selected,
  sortable,
  canDelete,
  onSelect,
}: PageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled: !sortable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/page relative ${isDragging ? "z-10 opacity-90" : ""}`}
    >
      {sortable && (
        <button
          type="button"
          className="absolute -left-0.5 top-3 z-10 flex size-5 cursor-grab items-center justify-center text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover/page:opacity-100 active:cursor-grabbing"
          aria-label={`Drag to reorder ${page.label} page`}
          onClick={(event) => event.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
      )}

      {canDelete && <RemovePageButton pageId={page.id} variant="panel" />}

      <button
        type="button"
        onClick={onSelect}
        className={`w-full rounded-lg border p-2 text-left transition-all ${
          selected
            ? "border-blue-400 bg-blue-50/50 shadow-sm ring-1 ring-blue-200/80"
            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }`}
      >
        <div className="mb-2 aspect-[3/4] overflow-hidden rounded-md border border-gray-200/80 bg-white shadow-sm">
          {page.kind === "custom" ? (
            <CustomPageThumbnail pageId={page.id} />
          ) : (
            <QuotePageThumbnail />
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-0.5">
          <span
            className={`truncate text-[12px] font-medium ${
              selected ? "text-blue-900" : "text-gray-800"
            }`}
          >
            {page.label}
          </span>
          <span
            className={`shrink-0 text-[10px] tabular-nums ${
              selected ? "text-blue-600" : "text-gray-400"
            }`}
          >
            {page.pageNumber}
          </span>
        </div>
      </button>
    </div>
  )
}

export function PagesPanel() {
  const template = usePromptBuilderStore((s) => s.template)
  const activePageId = usePromptBuilderStore((s) => s.activePageId)
  const setActivePageId = usePromptBuilderStore((s) => s.setActivePageId)
  const addPage = usePromptBuilderStore((s) => s.addPage)
  const reorderPages = usePromptBuilderStore((s) => s.reorderPages)
  const isTemplateEdit = useIsTemplateEditMode()
  const isSales = useIsSalesMode()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  if (!template || isSales) return null

  const pages = deriveTemplatePages(template)
  const canReorder = isTemplateEdit && pages.length > 1
  const canDeletePages = isTemplateEdit

  const handleSelectPage = (pageId: TemplatePageId) => {
    setActivePageId(pageId)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const fromIndex = pages.findIndex((page) => page.id === active.id)
    const toIndex = pages.findIndex((page) => page.id === over.id)
    if (fromIndex >= 0 && toIndex >= 0) {
      reorderPages(fromIndex, toIndex)
    }
  }

  return (
    <aside className="flex w-[124px] shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="size-3.5 shrink-0 text-gray-500" strokeWidth={1.75} />
          <h2 className="text-[13px] font-semibold text-gray-900">Pages</h2>
          <span className="ml-auto rounded-full bg-gray-200/80 px-2 py-0.5 text-[10px] font-medium tabular-nums text-gray-600">
            {pages.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pages.map((page) => page.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0 pl-1">
              {pages.map((page) => (
                <div key={page.id} className="group/page-item">
                  {isTemplateEdit && (
                    <PageInsertLine
                      position="above"
                      onAdd={() => addPage(page.id, "before")}
                    />
                  )}
                  <SortablePageCard
                    page={page}
                    selected={activePageId === page.id}
                    sortable={canReorder}
                    canDelete={canDeletePages && page.kind === "custom"}
                    onSelect={() => handleSelectPage(page.id)}
                  />
                  {isTemplateEdit && (
                    <PageInsertLine
                      position="below"
                      onAdd={() => addPage(page.id, "after")}
                    />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

    </aside>
  )
}
