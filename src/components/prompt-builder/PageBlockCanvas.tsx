import {
  AddBesideBlockDivider,
  AddBlockDivider,
} from "@/components/prompt-builder/AddBlockDivider"
import { BuilderBlockView } from "@/components/prompt-builder/BuilderBlockView"
import { BlockBackgroundShell } from "@/components/prompt-builder/BlockBackgroundShell"
import { BlockChrome } from "@/components/prompt-builder/BlockChrome"
import { CanvasLayoutBanner } from "@/components/prompt-builder/CanvasLayoutBanner"
import {
  BuilderDragOverlayLabel,
  BuilderBlockRow,
  SortableBuilderBlock,
} from "@/components/prompt-builder/SortableBuilderBlock"
import { LayoutColumnDropSlot } from "@/components/prompt-builder/LayoutColumnDropSlot"
import { PageCanvasDeleteControls } from "@/components/prompt-builder/RemovePageButton"
import { TemplateDocumentFrame } from "@/components/prompt-builder/TemplateDocumentFrame"
import { useIsSalesPreview } from "@/hooks/use-builder-editor-mode"
import {
  columnDropId,
  findColumnDropTarget,
} from "@/lib/block-layout-drag"
import { blockAllowsHalfWidth } from "@/lib/block-layout-rules"
import {
  canAddBesideBlock,
  getLayoutColumn,
  groupBlocksForLayout,
  type BlockLayoutRow,
} from "@/lib/block-layout"
import { hasBlockBackground } from "@/lib/block-background"
import { canvasCollisionDetection } from "@/lib/canvas-collision-detection"
import { INLINE_FRAGMENT_DRAG_SOURCE } from "@/lib/content-fragments"
import { BlockPageEmptyState } from "@/components/prompt-builder/BlockPageEmptyState"
import {
  getAddableBlockTypesForPage,
  getBlocksForPage,
  isBlockCustomPage,
} from "@/lib/page-blocks"
import { isQuotePageId } from "@/lib/template-pages"
import { signatureBlockNeedsPageBreak } from "@/lib/template-validation"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { blockIsVisible, templateAppliesToScenario } from "@/types/prompt-builder"
import type { BuilderBlock, BuilderTemplate } from "@/types/prompt-builder"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Fragment, useCallback, useMemo, useRef, useState } from "react"

const INSERT_AT_START = "__start__"
const INSERT_AT_END = "__end__"

function ColumnDropRow({
  insertBeforeBlockId,
  visible,
}: {
  insertBeforeBlockId: string
  visible: boolean
}) {
  if (!visible) return null

  return (
    <div className="grid grid-cols-2 gap-4 py-1">
      <LayoutColumnDropSlot
        id={columnDropId("left", insertBeforeBlockId)}
        label="Left column"
      />
      <LayoutColumnDropSlot
        id={columnDropId("right", insertBeforeBlockId)}
        label="Right column"
      />
    </div>
  )
}

function blockIdsForRow(row: BlockLayoutRow): string[] {
  if (row.type === "pair") return [row.left.id, row.right.id]
  return [row.block.id]
}

function lastBlockIdForRow(row: BlockLayoutRow): string {
  if (row.type === "pair") return row.right.id
  return row.block.id
}

function PreviewBlockCell({
  block,
  className,
  interactive = false,
}: {
  block: BuilderBlock
  className?: string
  interactive?: boolean
}) {
  const view = <BuilderBlockView block={block} />
  const hasBg = hasBlockBackground(block.content)

  return (
    <div
      className={`${signatureBlockNeedsPageBreak(block) ? "break-before-page pt-8" : ""} ${className ?? ""}`}
    >
      {interactive ? (
        <BlockChrome block={block}>{view}</BlockChrome>
      ) : hasBg ? (
        <BlockBackgroundShell block={block}>{view}</BlockBackgroundShell>
      ) : (
        view
      )}
    </div>
  )
}

function renderPreviewRow(
  row: ReturnType<typeof groupBlocksForLayout>[number],
  activeScenario: Parameters<typeof blockIsVisible>[1],
  key: string,
  interactive: boolean,
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
          <PreviewBlockCell block={row.left} interactive={interactive} />
          <PreviewBlockCell block={row.right} interactive={interactive} />
        </BuilderBlockRow>
      )
    }

    const block = leftVisible ? row.left : row.right
    return <PreviewBlockCell key={key} block={block} interactive={interactive} />
  }

  const visible = blockIsVisible(
    (row.block.content.displayCondition ?? null) as Parameters<
      typeof blockIsVisible
    >[0],
    activeScenario,
  )
  if (!visible) return null

  if (getLayoutColumn(row.block.content) === "left") {
    return (
      <div key={key} className="grid grid-cols-2 items-start gap-4">
        <PreviewBlockCell block={row.block} interactive={interactive} />
      </div>
    )
  }

  if (getLayoutColumn(row.block.content) === "right") {
    return (
      <div key={key} className="grid grid-cols-2 items-start gap-4">
        <div />
        <PreviewBlockCell block={row.block} interactive={interactive} />
      </div>
    )
  }

  return <PreviewBlockCell key={key} block={row.block} interactive={interactive} />
}

type Props = {
  template: BuilderTemplate
  pageId: string
  isPreview: boolean
  isSales: boolean
  exportRef?: React.Ref<HTMLDivElement>
  onFrameClick?: (event: React.MouseEvent) => void
}

export function PageBlockCanvas({
  template,
  pageId,
  isPreview,
  isSales,
  exportRef,
  onFrameClick,
}: Props) {
  const editorMode = usePromptBuilderStore((s) => s.editorMode)
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const reorderBlocks = usePromptBuilderStore((s) => s.reorderBlocks)
  const reorderInlineFragments = usePromptBuilderStore((s) => s.reorderInlineFragments)
  const moveBlockDrop = usePromptBuilderStore((s) => s.moveBlockDrop)
  const selectedBlockId = usePromptBuilderStore((s) => s.selectedBlockId)
  const isSalesPreview = useIsSalesPreview()

  const [activeDragBlock, setActiveDragBlock] = useState<BuilderBlock | null>(null)
  const lastColumnDropIdRef = useRef<string | null>(null)
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null)
  const [hoveredInsertKey, setHoveredInsertKey] = useState<string | null>(null)
  const hoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const blocks = getBlocksForPage(template, pageId)
  const allowedBlockTypes = getAddableBlockTypesForPage(template, pageId)
  const layoutRows = useMemo(() => groupBlocksForLayout(blocks), [blocks])
  const blockIds = useMemo(() => blocks.map((block) => block.id), [blocks])

  const cancelHoverClear = useCallback(() => {
    if (hoverClearTimerRef.current) {
      clearTimeout(hoverClearTimerRef.current)
      hoverClearTimerRef.current = null
    }
  }, [])

  const scheduleHoverClear = useCallback((clearFn: () => void) => {
    cancelHoverClear()
    hoverClearTimerRef.current = setTimeout(() => {
      clearFn()
      hoverClearTimerRef.current = null
    }, 300)
  }, [cancelHoverClear])

  const isInsertRevealed = useCallback(
    (insertKey: string, neighborBlockIds: string[]) => {
      if (hoveredInsertKey === insertKey) return true
      if (selectedBlockId && neighborBlockIds.includes(selectedBlockId)) {
        return true
      }
      if (hoveredBlockId && neighborBlockIds.includes(hoveredBlockId)) {
        return true
      }
      return false
    },
    [hoveredInsertKey, selectedBlockId, hoveredBlockId],
  )

  const blockHoverHandlers = useCallback(
    (blockId: string) => ({
      onPointerEnter: () => {
        cancelHoverClear()
        setHoveredBlockId(blockId)
      },
      onPointerLeave: () => {
        scheduleHoverClear(() => setHoveredBlockId(null))
      },
    }),
    [cancelHoverClear, scheduleHoverClear],
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const visiblePreviewRows = useMemo(() => {
    if (!templateAppliesToScenario(template, activeScenario)) return []
    return layoutRows
      .map((row, index) =>
        renderPreviewRow(
          row,
          activeScenario,
          `preview-row-${pageId}-${index}`,
          isSalesPreview,
        ),
      )
      .filter(Boolean)
  }, [layoutRows, activeScenario, template, isSalesPreview, pageId])

  const templateAppliesInPreview = templateAppliesToScenario(
    template,
    activeScenario,
  )

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.source === INLINE_FRAGMENT_DRAG_SOURCE) return
    const block = event.active.data.current?.block as BuilderBlock | undefined
    lastColumnDropIdRef.current = null
    setActiveDragBlock(block ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    if (event.active.data.current?.source === INLINE_FRAGMENT_DRAG_SOURCE) return

    const columnTarget = findColumnDropTarget(
      event.over?.id,
      event.collisions?.map((collision) => collision.id),
    )
    if (columnTarget && event.over?.id != null) {
      lastColumnDropIdRef.current = String(event.over.id)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.data.current?.source === INLINE_FRAGMENT_DRAG_SOURCE) {
      setActiveDragBlock(null)
      lastColumnDropIdRef.current = null
      if (!over || active.id === over.id) return
      if (over.data.current?.source !== INLINE_FRAGMENT_DRAG_SOURCE) return
      const blockId = active.data.current?.blockId as string | undefined
      const overBlockId = over.data.current?.blockId as string | undefined
      if (!blockId || blockId !== overBlockId) return
      reorderInlineFragments(blockId, String(active.id), String(over.id))
      return
    }

    const draggedId = String(active.id)
    if (!blocks.some((block) => block.id === draggedId)) {
      setActiveDragBlock(null)
      lastColumnDropIdRef.current = null
      return
    }

    const columnTarget =
      findColumnDropTarget(
        over?.id,
        event.collisions?.map((collision) => collision.id),
      ) ??
      findColumnDropTarget(lastColumnDropIdRef.current)

    lastColumnDropIdRef.current = null
    setActiveDragBlock(null)

    if (columnTarget) {
      moveBlockDrop(draggedId, columnTarget, pageId)
      return
    }

    if (!over || active.id === over.id) return

    const overBlockId = String(over.id)
    const overIndex = blocks.findIndex((block) => block.id === overBlockId)
    if (overIndex < 0) return

    const fromIndex = blocks.findIndex((block) => block.id === draggedId)
    if (fromIndex >= 0) {
      reorderBlocks(fromIndex, overIndex, pageId)
    }
  }

  const showColumnDrops = Boolean(
    activeDragBlock && blockAllowsHalfWidth(activeDragBlock.type),
  )

  const firstRowBlockIds =
    layoutRows.length > 0 ? blockIdsForRow(layoutRows[0]) : []

  const isEmptyBlockPage =
    blocks.length === 0 &&
    (isQuotePageId(pageId) || isBlockCustomPage(template, pageId))

  const previewContent = !templateAppliesInPreview ? (
    <div className="py-12 text-center">
      <p className="text-[13px] text-gray-700">
        This template doesn&apos;t apply to{" "}
        <span className="font-medium">{activeScenario.label}</span>.
      </p>
    </div>
  ) : visiblePreviewRows.length === 0 ? (
    isEmptyBlockPage ? (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-6 text-center">
        <p className="text-[13px] text-gray-500">This page has no blocks yet.</p>
      </div>
    ) : (
      <p className="py-12 text-center text-[13px] text-gray-500">
        No blocks visible for{" "}
        <span className="font-medium text-gray-700">{activeScenario.label}</span>.
      </p>
    )
  ) : (
    visiblePreviewRows.map((row, index) => (
      <div
        key={`visible-${pageId}-${index}`}
        className={index > 0 ? "mt-6 border-t border-gray-100 pt-6" : ""}
      >
        {row}
      </div>
    ))
  )

  const editCanvas = (
    <>
      <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
        {!isSales && (
          <>
            <ColumnDropRow
              insertBeforeBlockId={INSERT_AT_START}
              visible={showColumnDrops}
            />
            <AddBlockDivider
              pageId={pageId}
              allowedTypes={allowedBlockTypes}
              atStart
              visible={
                !showColumnDrops &&
                (layoutRows.length === 0 ||
                  isInsertRevealed(INSERT_AT_START, firstRowBlockIds))
              }
              onInsertHover={(active) =>
                setHoveredInsertKey(active ? INSERT_AT_START : null)
              }
            />
          </>
        )}
        {layoutRows.map((row, rowIndex) => {
          const currentBlockIds = blockIdsForRow(row)
          const nextRow =
            rowIndex < layoutRows.length - 1 ? layoutRows[rowIndex + 1] : null
          const nextBlockIds = nextRow ? blockIdsForRow(nextRow) : []
          const insertAfterId = lastBlockIdForRow(row)
          const insertNeighbors = [...currentBlockIds, ...nextBlockIds]
          const insertBeforeNextId = nextRow
            ? blockIdsForRow(nextRow)[0]
            : INSERT_AT_END

          if (row.type === "pair") {
            return (
              <Fragment key={`${row.left.id}-${row.right.id}`}>
                <BuilderBlockRow>
                  <SortableBuilderBlock
                    block={row.left}
                    {...blockHoverHandlers(row.left.id)}
                  />
                  <SortableBuilderBlock
                    block={row.right}
                    {...blockHoverHandlers(row.right.id)}
                  />
                </BuilderBlockRow>
                {!isSales && (
                  <>
                    <ColumnDropRow
                      insertBeforeBlockId={insertBeforeNextId}
                      visible={showColumnDrops}
                    />
                    <AddBlockDivider
                      pageId={pageId}
                      allowedTypes={allowedBlockTypes}
                      afterId={insertAfterId}
                      visible={
                        !showColumnDrops &&
                        isInsertRevealed(insertAfterId, insertNeighbors)
                      }
                      onInsertHover={(active) =>
                        setHoveredInsertKey(active ? insertAfterId : null)
                      }
                    />
                  </>
                )}
              </Fragment>
            )
          }

          const blockIndex = blocks.findIndex((entry) => entry.id === row.block.id)
          const nextBlock = blocks[blockIndex + 1]
          const showBesideAdd = !isSales && canAddBesideBlock(row.block, nextBlock)
          const layoutColumn = getLayoutColumn(row.block.content)
          const halfColumn = layoutColumn === "left" || layoutColumn === "right"

          return (
            <Fragment key={row.block.id}>
              <div
                className={`group/row relative ${
                  halfColumn ? "grid grid-cols-2 items-start gap-4" : ""
                }`}
              >
                {layoutColumn === "right" &&
                  (showColumnDrops ? (
                    <LayoutColumnDropSlot
                      id={columnDropId("left", row.block.id)}
                      label="Left column"
                    />
                  ) : (
                    <div aria-hidden />
                  ))}
                <SortableBuilderBlock
                  block={row.block}
                  {...blockHoverHandlers(row.block.id)}
                />
                {layoutColumn === "left" &&
                  (showColumnDrops ? (
                    <LayoutColumnDropSlot
                      id={columnDropId("right", `pair:${row.block.id}`)}
                      label="Right column"
                    />
                  ) : showBesideAdd ? (
                    <AddBesideBlockDivider
                      blockId={row.block.id}
                      pageId={pageId}
                      allowedTypes={allowedBlockTypes}
                      betweenColumns
                    />
                  ) : (
                    <div aria-hidden />
                  ))}
                {showBesideAdd && layoutColumn !== "left" && (
                  <AddBesideBlockDivider
                    blockId={row.block.id}
                    pageId={pageId}
                    allowedTypes={allowedBlockTypes}
                  />
                )}
              </div>
              {!isSales && (
                <>
                  <ColumnDropRow
                    insertBeforeBlockId={insertBeforeNextId}
                    visible={showColumnDrops}
                  />
                  <AddBlockDivider
                    pageId={pageId}
                    allowedTypes={allowedBlockTypes}
                    afterId={insertAfterId}
                    visible={
                      !showColumnDrops &&
                      isInsertRevealed(insertAfterId, insertNeighbors)
                    }
                    onInsertHover={(active) =>
                      setHoveredInsertKey(active ? insertAfterId : null)
                    }
                  />
                </>
              )}
            </Fragment>
          )
        })}
      </SortableContext>
      {editorMode === "edit" && <CanvasLayoutBanner />}
    </>
  )

  const wrapPage = (content: React.ReactNode) => (
    <div className="group/page relative" onClick={(event) => event.stopPropagation()}>
      <PageCanvasDeleteControls pageId={pageId} />
      {content}
    </div>
  )

  if (isPreview) {
    return wrapPage(
      <TemplateDocumentFrame
        exportRef={exportRef}
        onClick={onFrameClick}
        pageId={pageId}
      >
        {previewContent}
      </TemplateDocumentFrame>,
    )
  }

  if (isEmptyBlockPage && !isSales) {
    return wrapPage(
      <TemplateDocumentFrame
        exportRef={exportRef}
        onClick={onFrameClick}
        pageId={pageId}
      >
        <BlockPageEmptyState pageId={pageId} allowedTypes={allowedBlockTypes} />
      </TemplateDocumentFrame>,
    )
  }

  return wrapPage(
    <DndContext
      sensors={sensors}
      collisionDetection={canvasCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <TemplateDocumentFrame
        exportRef={exportRef}
        onClick={onFrameClick}
        pageId={pageId}
      >
        {editCanvas}
      </TemplateDocumentFrame>
      <DragOverlay>
        {activeDragBlock ? (
          <BuilderDragOverlayLabel block={activeDragBlock} />
        ) : null}
      </DragOverlay>
    </DndContext>,
  )
}
