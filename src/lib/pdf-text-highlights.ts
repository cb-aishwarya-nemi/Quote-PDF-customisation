import { loadPdfDocument, type PdfSource } from "@/lib/pdf-page-render"
import type { PdfFieldMapping } from "@/lib/pdf-field-mappings"

export type PdfHighlightRect = {
  left: number
  top: number
  width: number
  height: number
}

export type PdfPageHighlights = {
  pageNumber: number
  width: number
  height: number
  imageDataUrl: string
  rects: PdfHighlightRect[]
}

export type PdfHighlightScrollTarget = {
  pageNumber: number
  /** Highlight cluster center as a fraction of page height (0–1). */
  anchorRatio: number
}

function highlightClusterCenter(rects: PdfHighlightRect[]): number | null {
  if (rects.length === 0) return null
  const minTop = Math.min(...rects.map((rect) => rect.top))
  const maxBottom = Math.max(...rects.map((rect) => rect.top + rect.height))
  return (minTop + maxBottom) / 2
}

type TextItem = {
  str?: string
  transform?: number[]
  width?: number
  height?: number
}

function normalizeSearchText(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase()
}

function itemRect(
  item: TextItem,
  viewport: { width: number; height: number },
): PdfHighlightRect {
  const transform = item.transform ?? [1, 0, 0, 1, 0, 0]
  const x = transform[4] ?? 0
  const y = transform[5] ?? 0
  const height = item.height || Math.abs(transform[3] ?? 12)
  const width = item.width || Math.max(height * 2, 12)

  return {
    left: x,
    top: viewport.height - y - height,
    width,
    height,
  }
}

function findRectsInItems(
  items: TextItem[],
  searchText: string,
  viewport: { width: number; height: number },
): PdfHighlightRect[] {
  const normalizedSearch = normalizeSearchText(searchText)
  if (normalizedSearch.length < 2) return []

  const fragments = items
    .map((item, index) => ({
      index,
      normalized: normalizeSearchText(item.str ?? ""),
    }))
    .filter((fragment) => fragment.normalized)

  if (fragments.length === 0) return []

  let concatenated = ""
  const indexMap: number[] = []

  for (const fragment of fragments) {
    if (concatenated.length > 0) {
      concatenated += " "
      indexMap.push(-1)
    }
    for (const char of fragment.normalized) {
      concatenated += char
      indexMap.push(fragment.index)
    }
  }

  const rects: PdfHighlightRect[] = []
  let start = 0

  while (start <= concatenated.length - normalizedSearch.length) {
    const matchIndex = concatenated.indexOf(normalizedSearch, start)
    if (matchIndex < 0) break

    const endIndex = matchIndex + normalizedSearch.length - 1
    const itemIndices = new Set<number>()

    for (let i = matchIndex; i <= endIndex; i += 1) {
      const itemIndex = indexMap[i]
      if (itemIndex >= 0) itemIndices.add(itemIndex)
    }

    for (const itemIndex of itemIndices) {
      rects.push(itemRect(items[itemIndex], viewport))
    }

    start = matchIndex + 1
  }

  return dedupeRects(rects)
}

function dedupeRects(rects: PdfHighlightRect[]): PdfHighlightRect[] {
  const seen = new Set<string>()
  return rects.filter((rect) => {
    const key = `${Math.round(rect.left)}:${Math.round(rect.top)}:${Math.round(rect.width)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function mappingSearchTerms(mapping: PdfFieldMapping): string[] {
  const terms = new Set<string>()
  const mapped = mapping.mappedValue?.trim()

  if (mapped) {
    terms.add(mapped)
    const firstLine = mapped.split("\n")[0]?.trim()
    if (firstLine && firstLine.length >= 3) terms.add(firstLine)
    if (mapped.length > 48) terms.add(mapped.slice(0, 48))
    if (mapped.length > 72) terms.add(mapped.slice(0, 72))
  }

  const excerpt = mapping.pdfExcerpt
    .replace(/^…+/g, "")
    .replace(/…+$/g, "")
    .trim()
  if (excerpt.length >= 3) terms.add(excerpt)

  return [...terms].sort((a, b) => b.length - a.length)
}

function findRectsForMapping(
  items: TextItem[],
  mapping: PdfFieldMapping,
  viewport: { width: number; height: number },
): PdfHighlightRect[] {
  for (const term of mappingSearchTerms(mapping)) {
    const rects = findRectsInItems(items, term, viewport)
    if (rects.length > 0) return rects
  }
  return []
}

function drawHighlightRects(
  context: CanvasRenderingContext2D,
  rects: PdfHighlightRect[],
) {
  for (const rect of rects) {
    const padding = 2
    context.fillStyle = "rgba(250, 204, 21, 0.38)"
    context.strokeStyle = "rgba(202, 138, 4, 0.85)"
    context.lineWidth = 1
    context.fillRect(
      rect.left - padding,
      rect.top - padding,
      rect.width + padding * 2,
      rect.height + padding * 2,
    )
    context.strokeRect(
      rect.left - padding,
      rect.top - padding,
      rect.width + padding * 2,
      rect.height + padding * 2,
    )
  }
}

async function renderPdfPageWithHighlights(
  pdfSource: PdfSource,
  pageNumber: number,
  rects: PdfHighlightRect[],
  scale: number,
): Promise<{ imageDataUrl: string; width: number; height: number }> {
  const pdf = await loadPdfDocument(pdfSource)
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) throw new Error("Canvas not supported")

  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))

  await page.render({ canvas, viewport }).promise
  drawHighlightRects(context, rects)

  return {
    imageDataUrl: canvas.toDataURL("image/png"),
    width: viewport.width,
    height: viewport.height,
  }
}

export async function buildSectionPdfHighlights(
  pdfSource: PdfSource,
  mappings: PdfFieldMapping[],
  previewScale = 1.35,
  thumbnailScale = 0.3,
): Promise<{
  thumbnailDataUrl: string
  pages: PdfPageHighlights[]
  scrollTarget: PdfHighlightScrollTarget | null
}> {
  const pdf = await loadPdfDocument(pdfSource)
  const pageRects = new Map<number, PdfHighlightRect[]>()

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()
    const items = content.items as TextItem[]
    const rects: PdfHighlightRect[] = []

    for (const mapping of mappings) {
      rects.push(...findRectsForMapping(items, mapping, viewport))
    }

    pageRects.set(pageNumber, dedupeRects(rects))
  }

  const pages: PdfPageHighlights[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const rects = pageRects.get(pageNumber) ?? []
    const scaledRects = rects.map((rect) => ({
      left: rect.left * previewScale,
      top: rect.top * previewScale,
      width: rect.width * previewScale,
      height: rect.height * previewScale,
    }))
    const rendered = await renderPdfPageWithHighlights(
      pdfSource,
      pageNumber,
      scaledRects,
      previewScale,
    )
    pages.push({
      pageNumber,
      width: rendered.width,
      height: rendered.height,
      imageDataUrl: rendered.imageDataUrl,
      rects: scaledRects,
    })
  }

  const primaryHighlightedPage = pages.find((page) => page.rects.length > 0)
  const primaryPageNumber = primaryHighlightedPage?.pageNumber ?? 1
  const primaryRects = (pageRects.get(primaryPageNumber) ?? []).map((rect) => ({
    left: rect.left * thumbnailScale,
    top: rect.top * thumbnailScale,
    width: rect.width * thumbnailScale,
    height: rect.height * thumbnailScale,
  }))
  const thumbnail = await renderPdfPageWithHighlights(
    pdfSource,
    primaryPageNumber,
    primaryRects,
    thumbnailScale,
  )

  const scrollPage = primaryHighlightedPage ?? pages[0]
  const clusterCenter = scrollPage
    ? highlightClusterCenter(scrollPage.rects)
    : null

  return {
    thumbnailDataUrl: thumbnail.imageDataUrl,
    pages,
    scrollTarget: scrollPage
      ? {
          pageNumber: scrollPage.pageNumber,
          anchorRatio:
            clusterCenter != null ? clusterCenter / scrollPage.height : 0.2,
        }
      : null,
  }
}
