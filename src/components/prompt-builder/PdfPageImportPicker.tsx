import {
  renderPdfPageThumbnail,
  renderPdfPagesToDataUrls,
  type PdfSource,
} from "@/lib/pdf-page-render"
import { Check, Loader2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

type Props = {
  fileName: string
  pdfSource: PdfSource
  pageCount: number
  initialSelected?: number[]
  onConfirm: (pages: { page: number; previewUrl: string }[]) => void
  onCancel: () => void
}

type ThumbState = {
  loading: boolean
  url?: string
  error?: string
}

export function PdfPageImportPicker({
  fileName,
  pdfSource,
  pageCount,
  initialSelected,
  onConfirm,
  onCancel,
}: Props) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(initialSelected?.length ? initialSelected : [1]),
  )
  const [thumbs, setThumbs] = useState<Record<number, ThumbState>>({})
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const loadThumb = useCallback(
    async (page: number) => {
      setThumbs((prev) => ({
        ...prev,
        [page]: { loading: true },
      }))
      try {
        const url = await renderPdfPageThumbnail(pdfSource, page)
        setThumbs((prev) => ({
          ...prev,
          [page]: { loading: false, url },
        }))
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Preview failed"
        setThumbs((prev) => ({
          ...prev,
          [page]: { loading: false, error: message },
        }))
      }
    },
    [pdfSource],
  )

  useEffect(() => {
    let cancelled = false

    async function loadAllThumbs() {
      for (let page = 1; page <= pageCount; page += 1) {
        if (cancelled) return
        await loadThumb(page)
      }
    }

    void loadAllThumbs()
    return () => {
      cancelled = true
    }
  }, [pageCount, loadThumb])

  const togglePage = (page: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(page)) {
        if (next.size > 1) next.delete(page)
      } else {
        next.add(page)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)))
  }

  const handleConfirm = async () => {
    const pages = [...selected].sort((a, b) => a - b)
    if (!pages.length) return

    setImporting(true)
    setImportError(null)
    try {
      const imported = await renderPdfPagesToDataUrls(pdfSource, pages)
      if (!imported.length) {
        throw new Error("No pages were rendered")
      }
      onConfirm(imported)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not import the selected pages. Try again."
      setImportError(message)
    } finally {
      setImporting(false)
    }
  }

  const selectedCount = selected.size

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        e.stopPropagation()
        onCancel()
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-import-title"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-4 py-3">
          <div className="min-w-0 pr-3">
            <p
              id="pdf-import-title"
              className="text-[14px] font-semibold text-gray-900"
            >
              Choose pages to import
            </p>
            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {fileName} · {pageCount} {pageCount === 1 ? "page" : "pages"}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
          <p className="text-[11px] text-gray-600">
            {selectedCount} of {pageCount} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set([1]))}
              className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => {
              const isSelected = selected.has(page)
              const thumb = thumbs[page]
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => togglePage(page)}
                  className={`group relative overflow-hidden rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="aspect-[3/4] bg-gray-100">
                    {thumb?.loading && (
                      <div className="flex h-full items-center justify-center">
                        <Loader2 className="size-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {thumb?.url && (
                      <img
                        src={thumb.url}
                        alt={`Page ${page}`}
                        className="h-full w-full object-contain"
                      />
                    )}
                    {thumb?.error && (
                      <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-gray-400">
                        Preview failed
                      </div>
                    )}
                  </div>
                  <div
                    className={`flex items-center justify-between px-1.5 py-1 text-[10px] font-medium ${
                      isSelected ? "bg-blue-50 text-blue-800" : "bg-white text-gray-600"
                    }`}
                  >
                    <span>Page {page}</span>
                    {isSelected && <Check className="size-3" strokeWidth={2.5} />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-4 py-3">
          {importError && (
            <p className="mr-auto text-[11px] text-red-600">{importError}</p>
          )}
          <button
            type="button"
            onClick={onCancel}
            disabled={importing}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={importing || selectedCount === 0}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {importing && <Loader2 className="size-3.5 animate-spin" />}
            Import {selectedCount} {selectedCount === 1 ? "page" : "pages"}
          </button>
        </div>
      </div>
    </div>
  )
}
