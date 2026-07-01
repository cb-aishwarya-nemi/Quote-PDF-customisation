import type { PdfFieldMapping } from "@/lib/pdf-field-mappings"

const STORAGE_KEY_PREFIX = "pdf-mapping-viewer:"

export type PdfMappingViewerSession = {
  sectionId: string
  sectionLabel: string
  mappings: PdfFieldMapping[]
  pdfSource: string
}

export function writePdfMappingViewerSession(
  payload: PdfMappingViewerSession,
): void {
  localStorage.setItem(
    `${STORAGE_KEY_PREFIX}${payload.sectionId}`,
    JSON.stringify(payload),
  )
}

export function readPdfMappingViewerSession(
  sectionId: string,
): PdfMappingViewerSession | null {
  const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sectionId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as PdfMappingViewerSession
  } catch {
    return null
  }
}

export function clearPdfMappingViewerSession(sectionId: string): void {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${sectionId}`)
}

const VIEWER_WINDOW_NAME = "pdfMappingViewer"

function popupWindowFeatures(width = 960, height = 900): string {
  const w = Math.min(width, window.screen.availWidth - 48)
  const h = Math.min(height, window.screen.availHeight - 48)
  const left = Math.max(0, Math.round((window.screen.availWidth - w) / 2))
  const top = Math.max(0, Math.round((window.screen.availHeight - h) / 2))

  return [
    `width=${w}`,
    `height=${h}`,
    `left=${left}`,
    `top=${top}`,
    "popup=yes",
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
    "scrollbars=yes",
    "resizable=yes",
  ].join(",")
}

export function openPdfMappingViewerWindow(
  payload: PdfMappingViewerSession,
): void {
  writePdfMappingViewerSession(payload)
  const url = `/pdf-mapping/view?section=${encodeURIComponent(payload.sectionId)}`
  const viewerWindow = window.open(
    url,
    VIEWER_WINDOW_NAME,
    popupWindowFeatures(),
  )
  viewerWindow?.focus()
}
