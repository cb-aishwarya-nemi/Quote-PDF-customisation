import { buildSectionPdfHighlights } from "@/lib/pdf-text-highlights"
import type { PdfFieldMapping } from "@/lib/pdf-field-mappings"
import { Loader2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type PreviewState =
  | { status: "loading" }
  | {
      status: "ready"
      pages: Awaited<ReturnType<typeof buildSectionPdfHighlights>>["pages"]
      scrollTarget: Awaited<
        ReturnType<typeof buildSectionPdfHighlights>
      >["scrollTarget"]
    }
  | { status: "error" }

type Props = {
  sectionLabel: string
  pdfSource: string
  mappings: PdfFieldMapping[]
}

export function PdfMappingSectionViewer({
  sectionLabel,
  pdfSource,
  mappings,
}: Props) {
  const hasScrolledRef = useRef(false)
  const [preview, setPreview] = useState<PreviewState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    setPreview({ status: "loading" })

    buildSectionPdfHighlights(pdfSource, mappings)
      .then((result) => {
        if (cancelled) return
        setPreview({
          status: "ready",
          pages: result.pages,
          scrollTarget: result.scrollTarget,
        })
      })
      .catch(() => {
        if (!cancelled) setPreview({ status: "error" })
      })

    return () => {
      cancelled = true
    }
  }, [mappings, pdfSource])

  useEffect(() => {
    hasScrolledRef.current = false
  }, [sectionLabel])

  useEffect(() => {
    if (preview.status !== "ready" || hasScrolledRef.current) return

    const scrollTarget = preview.scrollTarget
    if (!scrollTarget) return

    const frame = window.requestAnimationFrame(() => {
      const anchor = document.getElementById(
        `pdf-highlight-anchor-${scrollTarget.pageNumber}`,
      )
      anchor?.scrollIntoView({ behavior: "smooth", block: "center" })
      hasScrolledRef.current = true
    })

    return () => window.cancelAnimationFrame(frame)
  }, [preview])

  const highlightCount = mappings.filter(
    (mapping) => mapping.mappedValue.trim() || mapping.pdfExcerpt.trim(),
  ).length

  return (
    <div className="flex min-h-screen flex-col bg-[#e8eaed]">
      <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-[16px] font-semibold text-gray-900">
          PDF extraction — {sectionLabel}
        </h1>
        <p className="mt-1 text-[12px] text-gray-500">
          Yellow highlights show where AI matched {highlightCount} field
          {highlightCount === 1 ? "" : "s"} in your uploaded PDF.
        </p>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {preview.status === "loading" && (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        )}

        {preview.status === "error" && (
          <div className="mx-auto max-w-[760px] rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-[13px] text-gray-500">
            Could not load PDF highlights for this section.
          </div>
        )}

        {preview.status === "ready" && (
          <div className="mx-auto flex max-w-[760px] flex-col gap-6">
            {preview.pages.map((page) => {
              const clusterCenter = page.rects.length
                ? page.rects.reduce(
                    (sum, rect) => sum + rect.top + rect.height / 2,
                    0,
                  ) / page.rects.length
                : null
              const anchorRatio =
                clusterCenter != null ? clusterCenter / page.height : null

              return (
                <figure
                  key={page.pageNumber}
                  id={`pdf-preview-page-${page.pageNumber}`}
                  className="relative overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5"
                >
                  <figcaption className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-medium text-gray-600">
                    Page {page.pageNumber}
                    {page.rects.length > 0
                      ? ` · ${page.rects.length} highlight${page.rects.length === 1 ? "" : "s"}`
                      : ""}
                  </figcaption>
                  <div className="relative">
                    <img
                      src={page.imageDataUrl}
                      alt={`PDF page ${page.pageNumber} with extraction highlights`}
                      className="block w-full"
                    />
                    {anchorRatio != null && (
                      <div
                        id={`pdf-highlight-anchor-${page.pageNumber}`}
                        data-highlight-anchor
                        className="pointer-events-none absolute left-0 h-px w-full scroll-mt-24"
                        style={{ top: `${anchorRatio * 100}%` }}
                        aria-hidden
                      />
                    )}
                  </div>
                </figure>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
