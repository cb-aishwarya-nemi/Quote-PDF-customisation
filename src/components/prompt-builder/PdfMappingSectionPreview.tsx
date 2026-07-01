import { buildSectionPdfHighlights } from "@/lib/pdf-text-highlights"
import type { PdfFieldMappingSection } from "@/lib/pdf-field-mappings"
import { openPdfMappingViewerWindow } from "@/lib/pdf-mapping-viewer-session"
import { FileSearch, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready"
      thumbnailDataUrl: string
    }
  | { status: "error" }

function useSectionPdfThumbnail(
  pdfSource: string | null,
  mappings: PdfFieldMappingSection["mappings"],
  enabled: boolean,
) {
  const [state, setState] = useState<PreviewState>({ status: "idle" })

  useEffect(() => {
    if (!enabled || !pdfSource) {
      setState({ status: "idle" })
      return
    }

    let cancelled = false
    setState({ status: "loading" })

    buildSectionPdfHighlights(pdfSource, mappings)
      .then((result) => {
        if (cancelled) return
        setState({
          status: "ready",
          thumbnailDataUrl: result.thumbnailDataUrl,
        })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })

    return () => {
      cancelled = true
    }
  }, [enabled, mappings, pdfSource])

  return state
}

export function PdfMappingSectionThumbnail({
  section,
  pdfSource,
  className = "",
}: {
  section: PdfFieldMappingSection
  pdfSource: string | null
  className?: string
}) {
  const preview = useSectionPdfThumbnail(
    pdfSource,
    section.mappings,
    Boolean(pdfSource),
  )

  const canPreview = Boolean(pdfSource)

  const openPreview = () => {
    if (!canPreview || !pdfSource) return
    openPdfMappingViewerWindow({
      sectionId: section.id,
      sectionLabel: section.label,
      mappings: section.mappings,
      pdfSource,
    })
  }

  return (
    <button
      type="button"
      onClick={openPreview}
      disabled={!canPreview}
      className={`group/thumb relative shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-sm transition-colors hover:border-blue-300 hover:ring-2 hover:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      aria-label={`Preview PDF highlights for ${section.label}`}
      title={
        canPreview
          ? "View PDF extraction highlights in a new window"
          : "Upload PDF to preview highlights"
      }
    >
      <div className="flex h-[88px] w-[68px] items-center justify-center">
        {preview.status === "ready" ? (
          <img
            src={preview.thumbnailDataUrl}
            alt=""
            className="size-full object-cover object-top"
          />
        ) : preview.status === "loading" ? (
          <Loader2 className="size-4 animate-spin text-gray-400" />
        ) : (
          <FileSearch className="size-4 text-gray-400 group-hover/thumb:text-blue-600" />
        )}
      </div>
      {canPreview && (
        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[9px] font-medium text-white opacity-0 transition-opacity group-hover/thumb:opacity-100">
          PDF
        </span>
      )}
    </button>
  )
}
