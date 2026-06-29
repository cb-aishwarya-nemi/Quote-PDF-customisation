import { CanvasPageDocumentShell } from "@/components/prompt-builder/CanvasPageDocumentShell"
import {
  CanvasDocumentActions,
  CanvasInlineToolbar,
  CanvasToolbarRow,
} from "@/components/prompt-builder/QuoteCanvasStrip"
import { CustomPageEditor } from "@/components/prompt-builder/IntroPageEditor"
import { IntroPageSection } from "@/components/prompt-builder/IntroPageSection"
import { PageBlockCanvas } from "@/components/prompt-builder/PageBlockCanvas"
import { CANVAS_DOCUMENT_MAX_WIDTH, BUILDER_WORKFLOW_TABS_OFFSET_CLASS, BUILDER_WORKSPACE_BG } from "@/lib/canvas-constants"
import { getBlocksForPage, getCustomPageKind } from "@/lib/page-blocks"
import {
  deriveTemplatePages,
  findCustomPage,
  QUOTE_PAGE_ID,
  resolveCustomPages,
} from "@/lib/template-pages"
import { groupBlocksForLayout } from "@/lib/block-layout"
import { useRevealOnScrollUp } from "@/hooks/use-reveal-on-scroll-up"
import { useBuilderScrollContainerRef } from "@/components/prompt-builder/builder-scroll-container"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"

function scrollElementToTopOfContainer(
  scrollEl: HTMLElement,
  targetEl: HTMLElement,
  insetTop = 12,
) {
  const scrollRect = scrollEl.getBoundingClientRect()
  const targetRect = targetEl.getBoundingClientRect()
  const nextTop = scrollEl.scrollTop + (targetRect.top - scrollRect.top) - insetTop
  scrollEl.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" })
}

const INTRO_HOVER_CLEAR_MS = 300

export function QuoteCanvasArea() {
  const documentRef = useRef<HTMLDivElement>(null)
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const registerScrollContainer = useBuilderScrollContainerRef()
  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      setScrollElement(node)
      registerScrollContainer(node)
    },
    [registerScrollContainer],
  )
  const actionsAnchorRef = useRef<HTMLDivElement>(null)
  const { showFloating: showFloatingActions } = useRevealOnScrollUp(
    scrollElement,
    actionsAnchorRef,
  )

  const template = usePromptBuilderStore((s) => s.template)
  const activePageId = usePromptBuilderStore((s) => s.activePageId)
  const setActivePageId = usePromptBuilderStore((s) => s.setActivePageId)
  const editorMode = usePromptBuilderStore((s) => s.editorMode)
  const selectedBlockId = usePromptBuilderStore((s) => s.selectedBlockId)
  const clearSelection = usePromptBuilderStore((s) => s.setSelectedBlockId)
  const isPreview = editorMode === "preview"
  const isSales = editorMode === "sales"
  const showWorkflowTabs =
    usePromptBuilderStore((s) => s.pdfFieldMappings.length) > 0

  const [introAddZoneHover, setIntroAddZoneHover] = useState(false)
  const hoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageSectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const firstPageRef = useRef<HTMLDivElement | null>(null)
  const scrollSyncLockRef = useRef(false)
  const activePageIdRef = useRef(activePageId)
  const scrollFromObserverRef = useRef(false)
  const prevEditorModeRef = useRef(editorMode)

  activePageIdRef.current = activePageId

  useLayoutEffect(() => {
    const enteredPreview =
      editorMode === "preview" && prevEditorModeRef.current !== "preview"
    prevEditorModeRef.current = editorMode

    if (!enteredPreview) return

    const scrollEl = scrollElement
    const targetEl = firstPageRef.current ?? actionsAnchorRef.current
    if (!scrollEl || !targetEl) return

    requestAnimationFrame(() => {
      scrollElementToTopOfContainer(scrollEl, targetEl)
    })
  }, [editorMode, scrollElement])

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
    }, INTRO_HOVER_CLEAR_MS)
  }, [cancelHoverClear])

  useEffect(() => () => cancelHoverClear(), [cancelHoverClear])

  const setIntroZoneHover = useCallback(
    (active: boolean) => {
      if (active) {
        cancelHoverClear()
        setIntroAddZoneHover(true)
      } else {
        scheduleHoverClear(() => setIntroAddZoneHover(false))
      }
    },
    [cancelHoverClear, scheduleHoverClear],
  )

  const pages = useMemo(
    () => (template ? deriveTemplatePages(template) : []),
    [template],
  )

  useEffect(() => {
    if (scrollFromObserverRef.current) {
      scrollFromObserverRef.current = false
      return
    }

    const section = pageSectionRefs.current[activePageId]
    const scrollEl = scrollElement
    if (!section || !scrollEl) return

    const scrollRect = scrollEl.getBoundingClientRect()
    const sectionRect = section.getBoundingClientRect()
    const alreadyVisible =
      sectionRect.top >= scrollRect.top - 24 &&
      sectionRect.top <= scrollRect.top + scrollRect.height * 0.4

    if (alreadyVisible) return

    scrollSyncLockRef.current = true
    section.scrollIntoView({ behavior: "smooth", block: "start" })
    const timer = setTimeout(() => {
      scrollSyncLockRef.current = false
    }, 600)
    return () => clearTimeout(timer)
  }, [activePageId, scrollElement])

  useEffect(() => {
    const scrollEl = scrollElement
    if (!scrollEl || pages.length <= 1) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollSyncLockRef.current) return

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const topEntry = visible[0]
        if (!topEntry) return

        const pageId = topEntry.target.getAttribute("data-page-id")
        if (pageId && pageId !== activePageIdRef.current) {
          scrollFromObserverRef.current = true
          setActivePageId(pageId)
        }
      },
      {
        root: scrollEl,
        threshold: [0.25, 0.5, 0.75],
      },
    )

    for (const page of pages) {
      const section = pageSectionRefs.current[page.id]
      if (section) observer.observe(section)
    }

    return () => observer.disconnect()
  }, [pages, setActivePageId, scrollElement])

  if (!template) return null

  const customPages = resolveCustomPages(template)
  const hasCustomPages = customPages.length > 0
  const quoteBlocks = getBlocksForPage(template, QUOTE_PAGE_ID)
  const quoteLayoutRows = groupBlocksForLayout(quoteBlocks)
  const firstQuoteBlockIds =
    quoteLayoutRows.length > 0
      ? quoteLayoutRows[0].type === "pair"
        ? [quoteLayoutRows[0].left.id, quoteLayoutRows[0].right.id]
        : [quoteLayoutRows[0].block.id]
      : []

  const showIntroPageAdd =
    editorMode === "edit" &&
    !isSales &&
    !hasCustomPages &&
    quoteLayoutRows.length > 0 &&
    (introAddZoneHover ||
      (selectedBlockId !== null &&
        firstQuoteBlockIds.includes(selectedBlockId)))

  const showIntroHoverBridge =
    editorMode === "edit" &&
    !isSales &&
    !hasCustomPages &&
    quoteLayoutRows.length > 0

  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{ backgroundColor: BUILDER_WORKSPACE_BG }}
      onClick={() => !isPreview && clearSelection(null)}
    >
      {showFloatingActions && (
        <div
          className={`pointer-events-none absolute inset-x-0 z-30 px-6 pt-3 ${
            showWorkflowTabs ? BUILDER_WORKFLOW_TABS_OFFSET_CLASS : "top-0"
          }`}
        >
          <div
            className="pointer-events-auto mx-auto w-full"
            style={{ maxWidth: CANVAS_DOCUMENT_MAX_WIDTH }}
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

      <div
        ref={setScrollRef}
        className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3"
      >
        <div
          className="mx-auto w-full"
          style={{ maxWidth: CANVAS_DOCUMENT_MAX_WIDTH }}
        >
          <CanvasInlineToolbar
            documentRef={documentRef}
            anchorRef={actionsAnchorRef}
            suppressActions={showFloatingActions}
          />

          <div className="space-y-8">
            {pages.map((page, pageIndex) => {
              const isFirstPage = pageIndex === 0
              const showPreviewScenarioStrip = isPreview && isFirstPage

              if (page.kind === "custom") {
                const customPage = findCustomPage(template, page.id)
                const pageKind = customPage
                  ? getCustomPageKind(customPage)
                  : "intro"

                return (
                  <div
                    key={page.id}
                    ref={(node) => {
                      pageSectionRefs.current[page.id] = node
                      if (isFirstPage) firstPageRef.current = node
                    }}
                    data-page-id={page.id}
                  >
                    {pageKind === "blocks" ? (
                      <PageBlockCanvas
                        template={template}
                        pageId={page.id}
                        isPreview={isPreview}
                        isSales={isSales}
                        showPreviewScenarioStrip={showPreviewScenarioStrip}
                        onFrameClick={
                          !isPreview ? (e) => e.stopPropagation() : undefined
                        }
                      />
                    ) : (
                      <CanvasPageDocumentShell
                        pageId={page.id}
                        showPreviewScenarioStrip={showPreviewScenarioStrip}
                        onClick={!isPreview ? (e) => e.stopPropagation() : undefined}
                      >
                        <CustomPageEditor pageId={page.id} />
                      </CanvasPageDocumentShell>
                    )}
                  </div>
                )
              }

              return (
                <div
                  key={page.id}
                  ref={(node) => {
                    pageSectionRefs.current[page.id] = node
                    if (isFirstPage) firstPageRef.current = node
                  }}
                  data-page-id={page.id}
                >
                  {!isPreview && !isSales && !hasCustomPages && (
                    <>
                      <IntroPageSection
                        showAddDivider={showIntroPageAdd}
                        onInsertHover={setIntroZoneHover}
                      />

                      {showIntroHoverBridge && (
                        <div
                          className="relative z-10 -mt-1 h-3"
                          onPointerEnter={() => setIntroZoneHover(true)}
                          onPointerLeave={() => setIntroZoneHover(false)}
                          aria-hidden
                        />
                      )}
                    </>
                  )}

                  <PageBlockCanvas
                    template={template}
                    pageId={QUOTE_PAGE_ID}
                    isPreview={isPreview}
                    isSales={isSales}
                    exportRef={documentRef}
                    showPreviewScenarioStrip={showPreviewScenarioStrip}
                    onFrameClick={
                      !isPreview ? (e) => e.stopPropagation() : undefined
                    }
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
