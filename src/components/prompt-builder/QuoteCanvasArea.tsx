import {
  AddBesideBlockDivider,
  AddBlockDivider,
} from "@/components/prompt-builder/AddBlockDivider"
import { BuilderBlockView } from "@/components/prompt-builder/BuilderBlockView"
import {
  BuilderDragOverlayLabel,
  BuilderBlockRow,
  SortableBuilderBlock,
} from "@/components/prompt-builder/SortableBuilderBlock"
import {
  CanvasDocumentActions,
  CanvasInlineToolbar,
  CanvasToolbarRow,
} from "@/components/prompt-builder/QuoteCanvasStrip"
import { TemplateDocumentFrame } from "@/components/prompt-builder/TemplateDocumentFrame"
import { CANVAS_DOCUMENT_MAX_WIDTH } from "@/lib/canvas-constants"
import {
  canAddBesideBlock,
  groupBlocksForLayout,
} from "@/lib/block-layout"
import { signatureBlockNeedsPageBreak } from "@/lib/template-validation"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { blockIsVisible } from "@/types/prompt-builder"
import type { BuilderBlock } from "@/types/prompt-builder"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"

function useFloatingActionsOnScrollUp(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  anchorRef: React.RefObject<HTMLDivElement | null>,
) {
  const [showFloating, setShowFloating] = useState(false)
  const lastScrollTop = useRef(0)
  const anchorVisibleRef = useRef(true)

  useEffect(() => {
    const scrollEl = scrollRef.current
    const anchorEl = anchorRef.current
    if (!scrollEl || !anchorEl) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        anchorVisibleRef.current = entry.isIntersecting
        if (entry.isIntersecting) setShowFloating(false)
      },
      { root: scrollEl, threshold: 0 },
    )
    observer.observe(anchorEl)

    const onScroll = () => {
      const scrollTop = scrollEl.scrollTop
      const delta = scrollTop - lastScrollTop.current

      if (anchorVisibleRef.current) {
        setShowFloating(false)
      } else if (delta < -4) {
        setShowFloating(true)
      } else if (delta > 4) {
        setShowFloating(false)
      }

      lastScrollTop.current = scrollTop
    }

    scrollEl.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      observer.disconnect()
      scrollEl.removeEventListener("scroll", onScroll)
    }
  }, [scrollRef, anchorRef])

  return showFloating
}

function renderPreviewRow(
  row: ReturnType<typeof groupBlocksForLayout>[number],
  activeScenario: Parameters<typeof blockIsVisible>[1],
  key: string,
) {
  if (row.type === "pair") {
    const leftVisible = blockIsVisible(
      (row.left.content.displayCondition ?? null) as Parameters<
        typeof blockIsVisible
      >[0],
      activeScenario,
    )
    const rightVisible = blockIsVisible(
      (row.right.content.displayCondition ?? null) as Parameters<
        typeof blockIsVisible
      >[0],
      activeScenario,
    )

    if (!leftVisible && !rightVisible) return null

    if (leftVisible && rightVisible) {
      return (
        <BuilderBlockRow key={key}>
          <PreviewBlockCell block={row.left} />
          <PreviewBlockCell block={row.right} />
        </BuilderBlockRow>
      )
    }

    const block = leftVisible ? row.left : row.right
    return <PreviewBlockCell key={key} block={block} />
  }

  const visible = blockIsVisible(
    (row.block.content.displayCondition ?? null) as Parameters<
      typeof blockIsVisible
    >[0],
    activeScenario,
  )
  if (!visible) return null
  return <PreviewBlockCell key={key} block={row.block} />
}

function PreviewBlockCell({
  block,
  className,
}: {
  block: BuilderBlock
  className?: string
}) {
  return (
    <div
      className={`${signatureBlockNeedsPageBreak(block) ? "break-before-page pt-8" : ""} ${className ?? ""}`}
    >
      <BuilderBlockView block={block} />
    </div>
  )
}

export function QuoteCanvasArea() {
  const documentRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const actionsAnchorRef = useRef<HTMLDivElement>(null)
  const showFloatingActions = useFloatingActionsOnScrollUp(
    scrollRef,
    actionsAnchorRef,
  )

  const template = usePromptBuilderStore((s) => s.template)
  const editorMode = usePromptBuilderStore((s) => s.editorMode)
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const reorderBlocks = usePromptBuilderStore((s) => s.reorderBlocks)
  const clearSelection = usePromptBuilderStore((s) => s.setSelectedBlockId)
  const isPreview = editorMode === "preview"
  const isSales = editorMode === "sales"

  const [activeDragBlock, setActiveDragBlock] = useState<BuilderBlock | null>(
    null,
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const blocks = template?.blocks ?? []
  const layoutRows = useMemo(() => groupBlocksForLayout(blocks), [blocks])
  const blockIds = useMemo(() => blocks.map((block) => block.id), [blocks])

  const visiblePreviewRows = useMemo(() => {
    if (!template) return []
    return layoutRows
      .map((row, index) =>
        renderPreviewRow(row, activeScenario, `preview-row-${index}`),
      )
      .filter(Boolean)
  }, [layoutRows, activeScenario, template])

  const handleDragStart = (event: DragStartEvent) => {
    const block = event.active.data.current?.block as BuilderBlock | undefined
    setActiveDragBlock(block ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragBlock(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const fromIndex = blocks.findIndex((block) => block.id === active.id)
    const toIndex = blocks.findIndex((block) => block.id === over.id)
    if (fromIndex >= 0 && toIndex >= 0) {
      reorderBlocks(fromIndex, toIndex)
    }
  }

  if (!template) return null

  const editCanvas = (
    <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
      {layoutRows.map((row) => {
        if (row.type === "pair") {
          return (
            <Fragment key={`${row.left.id}-${row.right.id}`}>
              <BuilderBlockRow>
                <SortableBuilderBlock block={row.left} />
                <SortableBuilderBlock block={row.right} />
              </BuilderBlockRow>
              {!isSales && <AddBlockDivider afterId={row.right.id} />}
            </Fragment>
          )
        }

        const blockIndex = blocks.findIndex((entry) => entry.id === row.block.id)
        const nextBlock = blocks[blockIndex + 1]
        const showBesideAdd = !isSales && canAddBesideBlock(row.block, nextBlock)

        return (
          <Fragment key={row.block.id}>
            <div
              className={`group/row relative ${row.block.type === "billed_to" ? "pr-2" : ""}`}
            >
              <SortableBuilderBlock block={row.block} />
              {showBesideAdd && (
                <AddBesideBlockDivider
                  blockId={row.block.id}
                  alwaysVisible={row.block.type === "billed_to"}
                />
              )}
            </div>
            {!isSales && <AddBlockDivider afterId={row.block.id} />}
          </Fragment>
        )
      })}
    </SortableContext>
  )

  return (
    <div
      className="relative flex min-w-0 flex-1 flex-col bg-[#e8eaed]"
      onClick={() => !isPreview && clearSelection(null)}
    >
      {showFloatingActions && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-6 pt-3">
          <div
            className="pointer-events-auto mx-auto w-full pl-7"
            style={{ maxWidth: CANVAS_DOCUMENT_MAX_WIDTH + 28 }}
          >
            {isPreview ? (
              <CanvasToolbarRow documentRef={documentRef} variant="floating" />
            ) : (
              <div className="flex justify-end">
                <CanvasDocumentActions
                  documentRef={documentRef}
                  variant="floating"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6 pt-3">
        <div
          className="mx-auto w-full pl-7"
          style={{ maxWidth: CANVAS_DOCUMENT_MAX_WIDTH + 28 }}
        >
          <CanvasInlineToolbar
            documentRef={documentRef}
            anchorRef={actionsAnchorRef}
          />

          {isPreview ? (
            <TemplateDocumentFrame exportRef={documentRef}>
              {visiblePreviewRows.length === 0 ? (
                <p className="py-12 text-center text-[13px] text-gray-500">
                  No blocks visible for{" "}
                  <span className="font-medium text-gray-700">
                    {activeScenario.label}
                  </span>
                  . Switch scenario or ask the agent to adjust display conditions.
                </p>
              ) : (
                visiblePreviewRows.map((row, index) => (
                  <div
                    key={`visible-${index}`}
                    className={index > 0 ? "mt-6 border-t border-gray-100 pt-6" : ""}
                  >
                    {row}
                  </div>
                ))
              )}
            </TemplateDocumentFrame>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <TemplateDocumentFrame
                exportRef={documentRef}
                onClick={(e) => e.stopPropagation()}
              >
                {editCanvas}
              </TemplateDocumentFrame>
              <DragOverlay>
                {activeDragBlock ? (
                  <BuilderDragOverlayLabel block={activeDragBlock} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  )
}
