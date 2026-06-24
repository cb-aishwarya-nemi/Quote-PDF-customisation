import { PdfPageImportPicker } from "@/components/prompt-builder/PdfPageImportPicker"
import { useIsTemplateEditMode } from "@/hooks/use-builder-editor-mode"
import { findCustomPage } from "@/lib/template-pages"
import {
  isImageFile,
  isPdfFile,
  preparePdfUpload,
} from "@/lib/pdf-page-render"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import {
  getDisplayedPages,
  IMAGE_BLOCK_ACCEPT,
  imageBlockHasMedia,
  parseImageBlockContent,
  type ImageBlockContent,
  type ImportedPdfPage,
} from "@/types/image-block"
import { PageCanvasDeleteControls } from "@/components/prompt-builder/RemovePageButton"
import { Loader2, Replace, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type PendingPdf = {
  fileName: string
  pdfDataUrl: string
  pdfBytes?: ArrayBuffer
  pageCount: number
  initialSelected?: number[]
}

type Props = {
  pageId: string
}

const PAGE_SHELL =
  "relative min-w-0 rounded-xl border bg-white transition-all border-transparent hover:border-blue-300 hover:shadow-[0_4px_16px_-4px_rgba(37,99,235,0.22)] hover:ring-1 hover:ring-blue-100"

export function CustomPageEditor({ pageId }: Props) {
  const template = usePromptBuilderStore((s) => s.template)
  const updatePage = usePromptBuilderStore((s) => s.updatePage)
  const pendingIntroPdfImport = usePromptBuilderStore(
    (s) => s.pendingIntroPdfImport,
  )
  const clearPendingIntroPdfImport = usePromptBuilderStore(
    (s) => s.clearPendingIntroPdfImport,
  )
  const isTemplateEdit = useIsTemplateEditMode()

  const inputRef = useRef<HTMLInputElement>(null)
  const pendingPdfRef = useRef<PendingPdf | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingPdf, setPendingPdf] = useState<PendingPdf | null>(null)
  const [showPagePicker, setShowPagePicker] = useState(false)

  const customPage = template ? findCustomPage(template, pageId) : undefined

  useEffect(() => {
    if (!pendingIntroPdfImport || pendingIntroPdfImport.pageId !== pageId) return
    const { pageId: _pageId, ...prepared } = pendingIntroPdfImport
    if (!prepared.pdfBytes && !prepared.pdfDataUrl) return
    pendingPdfRef.current = prepared
    setPendingPdf(prepared)
    setShowPagePicker(true)
    clearPendingIntroPdfImport()
  }, [pendingIntroPdfImport, pageId, clearPendingIntroPdfImport])

  if (!customPage) return null

  const content = parseImageBlockContent(
    (customPage.content ?? {}) as Record<string, unknown>,
  )
  const hasMedia = imageBlockHasMedia(content)
  const displayedPages = getDisplayedPages(content)
  const isReadOnly = !isTemplateEdit

  const applyContent = (patch: Partial<ImageBlockContent>) => {
    updatePage(pageId, { ...patch, placeholder: false })
  }

  const closePagePicker = () => {
    pendingPdfRef.current = null
    setPendingPdf(null)
    setShowPagePicker(false)
  }

  const applyPdfImport = (importedPages: ImportedPdfPage[]) => {
    const source = pendingPdfRef.current ?? pendingPdf
    if (!source || importedPages.length === 0) {
      setError("Could not import the selected PDF pages.")
      closePagePicker()
      return
    }

    const selectedPages = importedPages.map((page) => page.page)
    applyContent({
      fileName: source.fileName,
      mediaType: "pdf",
      pdfDataUrl: source.pdfDataUrl,
      pageCount: source.pageCount,
      importedPages,
      selectedPages,
      selectedPage: selectedPages[0],
      previewUrl: importedPages[0]?.previewUrl,
    })
    closePagePicker()
    setError(null)
  }

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    try {
      if (isPdfFile(file)) {
        const prepared = await preparePdfUpload(file)
        pendingPdfRef.current = prepared
        setPendingPdf(prepared)
        setShowPagePicker(true)
        return
      }

      if (isImageFile(file)) {
        const reader = new FileReader()
        const previewUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(String(reader.result ?? ""))
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        })
        applyContent({
          fileName: file.name,
          mediaType: "image",
          previewUrl,
          pdfDataUrl: undefined,
          pageCount: undefined,
          selectedPage: undefined,
          selectedPages: undefined,
          importedPages: undefined,
        })
        return
      }

      throw new Error("Unsupported file type")
    } catch {
      setError("Could not load file. Use a PDF or image (PNG, JPG, GIF, WebP).")
    } finally {
      setLoading(false)
    }
  }

  const openPicker = () => inputRef.current?.click()

  const pagePicker =
    showPagePicker && pendingPdf
      ? createPortal(
          <PdfPageImportPicker
            fileName={pendingPdf.fileName}
            pdfSource={pendingPdf.pdfBytes ?? pendingPdf.pdfDataUrl}
            pageCount={pendingPdf.pageCount}
            initialSelected={pendingPdf.initialSelected}
            onConfirm={applyPdfImport}
            onCancel={closePagePicker}
          />,
          document.body,
        )
      : null

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={IMAGE_BLOCK_ACCEPT}
      className="hidden"
      onChange={(e) => {
        void handleFiles(e.target.files)
        e.target.value = ""
      }}
    />
  )

  const hoverControls = isTemplateEdit ? (
    <div className="pointer-events-none absolute right-2 top-2 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover/page:opacity-100 group-focus-within/page:opacity-100">
      <div className="group/replace relative pointer-events-auto">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openPicker()
          }}
          className="rounded-md border border-gray-200 bg-white p-1 text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-700"
          aria-label="Replace page asset"
        >
          <Replace className="size-3.5" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-md group-hover/replace:block"
        >
          Replace
        </span>
      </div>
    </div>
  ) : null

  const mediaPreview =
    displayedPages.length > 1 ? (
      <div className="space-y-0">
        {displayedPages.map(({ page, previewUrl }) => (
          <img
            key={page}
            src={previewUrl}
            alt=""
            className="block w-full"
          />
        ))}
      </div>
    ) : (
      <img
        src={displayedPages[0]?.previewUrl ?? content.previewUrl ?? ""}
        alt=""
        className="block w-full"
      />
    )

  const uploadZone = (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") openPicker()
      }}
      onClick={openPicker}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(true)
      }}
      onDragLeave={(e) => {
        e.stopPropagation()
        setDragOver(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragOver(false)
        void handleFiles(e.dataTransfer.files)
      }}
      className={`flex min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
        dragOver
          ? "border-blue-400 bg-blue-50/60"
          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-50/80"
      }`}
    >
      {loading ? (
        <Loader2 className="size-7 animate-spin text-blue-500" />
      ) : (
        <Upload className="size-7 text-gray-400" strokeWidth={1.5} />
      )}
      <p className="mt-3 text-[13px] font-medium text-gray-700">
        {loading ? "Processing file…" : "Upload image or PDF"}
      </p>
      <p className="mt-1 max-w-xs text-[11px] text-gray-500">
        PDFs open a page picker
      </p>
    </div>
  )

  return (
    <>
      {pagePicker}
      <div className="group/page relative" onClick={(e) => e.stopPropagation()}>
        <PageCanvasDeleteControls pageId={pageId} />
        {!hasMedia ? (
          isReadOnly ? (
            <div className="flex min-h-[120px] items-center justify-center text-[12px] text-gray-400">
              No asset uploaded
            </div>
          ) : (
            <>
              {uploadZone}
              {hiddenInput}
              {error && (
                <p className="mt-2 text-[11px] text-red-600" role="alert">
                  {error}
                </p>
              )}
            </>
          )
        ) : isReadOnly ? (
          mediaPreview
        ) : (
          <div className={PAGE_SHELL}>
            {hoverControls}
            {mediaPreview}
            {hiddenInput}
            {error && (
              <p className="px-3 pb-3 text-[11px] text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}

/** @deprecated Use CustomPageEditor */
export function IntroPageEditor({ pageId }: Props) {
  return <CustomPageEditor pageId={pageId} />
}
