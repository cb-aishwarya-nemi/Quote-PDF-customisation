import {
  CanvasDocumentActions,
  CanvasInlineToolbar,
  CanvasToolbarRow,
} from "@/components/prompt-builder/QuoteCanvasStrip"
import { CustomPageEditor } from "@/components/prompt-builder/IntroPageEditor"
import { IntroPageSection } from "@/components/prompt-builder/IntroPageSection"
import { PageBlockCanvas } from "@/components/prompt-builder/PageBlockCanvas"
import { TemplateDocumentFrame } from "@/components/prompt-builder/TemplateDocumentFrame"
import { CANVAS_DOCUMENT_MAX_WIDTH } from "@/lib/canvas-constants"
import { getBlocksForPage, getCustomPageKind } from "@/lib/page-blocks"
import {
  deriveTemplatePages,
  findCustomPage,
  QUOTE_PAGE_ID,
  resolveCustomPages,
} from "@/lib/template-pages"
import { groupBlocksForLayout } from "@/lib/block-layout"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

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

const INTRO_HOVER_CLEAR_MS = 300

export function QuoteCanvasArea() {
  const documentRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const actionsAnchorRef = useRef<HTMLDivElement>(null)
  const showFloatingActions = useFloatingActionsOnScrollUp(
    scrollRef,
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

  const [introAddZoneHover, setIntroAddZoneHover] = useState(false)
  const hoverClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pageSectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollSyncLockRef = useRef(false)

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
    const section = pageSectionRefs.current[activePageId]
    const scrollEl = scrollRef.current
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
  }, [activePageId])

  useEffect(() => {
    const scrollEl = scrollRef.current
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
        if (pageId && pageId !== activePageId) {
          setActivePageId(pageId)
        }
      },
      {
        root: scrollEl,
        threshold: [0.15, 0.35, 0.55, 0.75],
      },
    )

    for (const page of pages) {
      const section = pageSectionRefs.current[page.id]
      if (section) observer.observe(section)
    }

    return () => observer.disconnect()
  }, [pages, activePageId, setActivePageId])

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
      className="relative flex min-w-0 flex-1 flex-col bg-[#e8eaed]"
      onClick={() => !isPreview && clearSelection(null)}
    >
      {showFloatingActions && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-6 pt-3">
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-6 pt-3">
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
            {pages.map((page) => {
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
                    }}
                    data-page-id={page.id}
                  >
                    {pageKind === "blocks" ? (
                      <PageBlockCanvas
                        template={template}
                        pageId={page.id}
                        pageNumber={page.pageNumber}
                        isPreview={isPreview}
                        isSales={isSales}
                        onFrameClick={
                          !isPreview ? (e) => e.stopPropagation() : undefined
                        }
                      />
                    ) : (
                      <TemplateDocumentFrame
                        pageNumber={page.pageNumber}
                        onClick={!isPreview ? (e) => e.stopPropagation() : undefined}
                      >
                        <CustomPageEditor pageId={page.id} />
                      </TemplateDocumentFrame>
                    )}
                  </div>
                )
              }

              return (
                <div
                  key={page.id}
                  ref={(node) => {
                    pageSectionRefs.current[page.id] = node
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
                          className="relative z-10 -mt-2 h-10"
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
                    pageNumber={page.pageNumber}
                    isPreview={isPreview}
                    isSales={isSales}
                    exportRef={documentRef}
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
