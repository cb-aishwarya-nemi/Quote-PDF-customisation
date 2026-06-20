export type ImageBlockMediaType = "image" | "pdf"

export type ImageTextOverlayAlign = "left" | "center" | "right"

export type ImageTextOverlayStyle = "light" | "dark" | "pill"

export type ImageTextOverlay = {
  id: string
  text: string
  /** 0–100, horizontal anchor */
  x: number
  /** 0–100, vertical anchor */
  y: number
  align: ImageTextOverlayAlign
  style: ImageTextOverlayStyle
}

export type ImportedPdfPage = {
  page: number
  previewUrl: string
}

export type ImageBlockContent = {
  variant?: string
  placeholder?: boolean
  alt?: string
  fileName?: string
  mediaType?: ImageBlockMediaType
  previewUrl?: string
  pdfDataUrl?: string
  pageCount?: number
  selectedPage?: number
  selectedPages?: number[]
  importedPages?: ImportedPdfPage[]
  textOverlays?: ImageTextOverlay[]
}

export function parseImageBlockContent(
  raw: Record<string, unknown>,
): ImageBlockContent {
  const importedPages = parseImportedPages(raw.importedPages)

  return {
    variant: raw.variant != null ? String(raw.variant) : undefined,
    placeholder: raw.placeholder === true,
    alt: raw.alt != null ? String(raw.alt) : undefined,
    fileName: raw.fileName != null ? String(raw.fileName) : undefined,
    mediaType:
      raw.mediaType === "pdf" || raw.mediaType === "image"
        ? raw.mediaType
        : undefined,
    previewUrl: raw.previewUrl != null ? String(raw.previewUrl) : undefined,
    pdfDataUrl: raw.pdfDataUrl != null ? String(raw.pdfDataUrl) : undefined,
    pageCount:
      typeof raw.pageCount === "number" ? raw.pageCount : undefined,
    selectedPage:
      typeof raw.selectedPage === "number" ? raw.selectedPage : undefined,
    selectedPages: parseSelectedPages(raw.selectedPages, importedPages, raw),
    importedPages,
    textOverlays: parseTextOverlays(raw.textOverlays),
  }
}

function parseTextOverlays(raw: unknown): ImageTextOverlay[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const overlays = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const o = item as ImageTextOverlay
      if (typeof o.id !== "string" || typeof o.text !== "string") return null
      return {
        id: o.id,
        text: o.text,
        x: typeof o.x === "number" ? o.x : 50,
        y: typeof o.y === "number" ? o.y : 50,
        align:
          o.align === "left" || o.align === "right" ? o.align : "center",
        style:
          o.style === "light" || o.style === "dark" ? o.style : "pill",
      } satisfies ImageTextOverlay
    })
    .filter((o): o is ImageTextOverlay => o != null)
  return overlays.length ? overlays : undefined
}

function parseImportedPages(raw: unknown): ImportedPdfPage[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const pages = raw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const page = (item as ImportedPdfPage).page
      const previewUrl = (item as ImportedPdfPage).previewUrl
      if (typeof page !== "number" || typeof previewUrl !== "string") return null
      return { page, previewUrl }
    })
    .filter((p): p is ImportedPdfPage => p != null)
    .sort((a, b) => a.page - b.page)
  return pages.length ? pages : undefined
}

function parseSelectedPages(
  raw: unknown,
  importedPages: ImportedPdfPage[] | undefined,
  content: Record<string, unknown>,
): number[] | undefined {
  if (Array.isArray(raw)) {
    const pages = raw.filter((n): n is number => typeof n === "number").sort((a, b) => a - b)
    if (pages.length) return pages
  }
  if (importedPages?.length) {
    return importedPages.map((p) => p.page)
  }
  if (typeof content.selectedPage === "number") {
    return [content.selectedPage]
  }
  return undefined
}

export function imageBlockHasMedia(content: ImageBlockContent): boolean {
  return Boolean(content.previewUrl || content.importedPages?.length)
}

export function getDisplayedPages(content: ImageBlockContent): ImportedPdfPage[] {
  if (content.importedPages?.length) return content.importedPages
  if (content.previewUrl && content.selectedPage) {
    return [{ page: content.selectedPage, previewUrl: content.previewUrl }]
  }
  if (content.previewUrl) {
    return [{ page: 1, previewUrl: content.previewUrl }]
  }
  return []
}

export const OVERLAY_POSITION_PRESETS: {
  id: string
  label: string
  x: number
  y: number
  align: ImageTextOverlayAlign
}[] = [
  { id: "top-left", label: "Top left", x: 8, y: 10, align: "left" },
  { id: "top-center", label: "Top", x: 50, y: 10, align: "center" },
  { id: "center", label: "Center", x: 50, y: 50, align: "center" },
  { id: "bottom-center", label: "Bottom", x: 50, y: 88, align: "center" },
  { id: "bottom-right", label: "Bottom right", x: 92, y: 88, align: "right" },
]
