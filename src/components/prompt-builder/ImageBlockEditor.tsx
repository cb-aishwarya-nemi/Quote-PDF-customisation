import { PdfPageImportPicker } from "@/components/prompt-builder/PdfPageImportPicker"
import {
  AddTextOverlayButton,
  ImageWithOverlays,
  createDefaultOverlay,
} from "@/components/prompt-builder/ImageWithOverlays"
import { useCanEditBlockContent, useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
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
  type ImageTextOverlay,
  type ImportedPdfPage,
} from "@/types/image-block"
import {
  FileText,
  ImageIcon,
  Layers,
  Loader2,
  Replace,
  Upload,
  X,
} from "lucide-react"
import { useRef, useState, useEffect, type ReactNode } from "react"

const ACCEPT = IMAGE_BLOCK_ACCEPT

type PendingPdf = {
  fileName: string
  pdfDataUrl: string
  pageCount: number
  initialSelected?: number[]
}

type Props = {
  blockId: string
  content: Record<string, unknown>
  caption?: ReactNode
}

export function ImageBlockEditor({ blockId, content: raw, caption }: Props) {
  const isPreview = useIsPreviewMode()
  const canEdit = useCanEditBlockContent(blockId)
  const isReadOnly = isPreview || !canEdit
  const updateBlockContent = usePromptBuilderStore((s) => s.updateBlockContent)
  const pendingImagePdfImport = usePromptBuilderStore(
    (s) => s.pendingImagePdfImport,
  )
  const clearPendingImagePdfImport = usePromptBuilderStore(
    (s) => s.clearPendingImagePdfImport,
  )
  const content = parseImageBlockContent(raw)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingPdf, setPendingPdf] = useState<PendingPdf | null>(null)
  const [showPagePicker, setShowPagePicker] = useState(false)

  const hasMedia = imageBlockHasMedia(content)
  const displayedPages = getDisplayedPages(content)
  const overlays = content.textOverlays ?? []
  const storedUploadError =
    typeof raw.uploadError === "string" ? raw.uploadError : null

  useEffect(() => {
    if (!pendingImagePdfImport || pendingImagePdfImport.blockId !== blockId) {
      return
    }
    setPendingPdf({
      fileName: pendingImagePdfImport.fileName,
      pdfDataUrl: pendingImagePdfImport.pdfDataUrl,
      pageCount: pendingImagePdfImport.pageCount,
    })
    setShowPagePicker(true)
    clearPendingImagePdfImport()
  }, [blockId, pendingImagePdfImport, clearPendingImagePdfImport])

  const applyContent = (patch: Partial<ImageBlockContent>) => {
    updateBlockContent(blockId, {
      ...raw,
      ...patch,
      placeholder: false,
    })
  }

  const setOverlays = (textOverlays: ImageTextOverlay[]) => {
    applyContent({ textOverlays })
  }

  const addOverlay = () => {
    setOverlays([...overlays, createDefaultOverlay()])
  }

  const updateOverlay = (id: string, patch: Partial<ImageTextOverlay>) => {
    setOverlays(overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  const removeOverlay = (id: string) => {
    setOverlays(overlays.filter((o) => o.id !== id))
  }

  const applyPdfImport = (importedPages: ImportedPdfPage[]) => {
    const selectedPages = importedPages.map((p) => p.page)
    applyContent({
      fileName: pendingPdf?.fileName ?? content.fileName,
      mediaType: "pdf",
      pdfDataUrl: pendingPdf?.pdfDataUrl ?? content.pdfDataUrl,
      pageCount: pendingPdf?.pageCount ?? content.pageCount,
      importedPages,
      selectedPages,
      selectedPage: selectedPages[0],
      previewUrl: importedPages[0]?.previewUrl,
    })
    setPendingPdf(null)
    setShowPagePicker(false)
  }

  const clearMedia = () => {
    updateBlockContent(blockId, {
      variant: content.variant ?? "standard",
      alt: content.alt ?? "Uploaded asset",
      placeholder: true,
      fileName: undefined,
      mediaType: undefined,
      previewUrl: undefined,
      pdfDataUrl: undefined,
      pageCount: undefined,
      selectedPage: undefined,
      selectedPages: undefined,
      importedPages: undefined,
      textOverlays: undefined,
    })
    setPendingPdf(null)
    setShowPagePicker(false)
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

  const openPagePickerForExisting = () => {
    if (!content.pdfDataUrl || !content.pageCount) return
    setPendingPdf({
      fileName: content.fileName ?? "Document.pdf",
      pdfDataUrl: content.pdfDataUrl,
      pageCount: content.pageCount,
      initialSelected: content.selectedPages,
    })
    setShowPagePicker(true)
  }

  const openPicker = () => inputRef.current?.click()

  const pagePicker =
    showPagePicker && pendingPdf ? (
      <PdfPageImportPicker
        fileName={pendingPdf.fileName}
        pdfDataUrl={pendingPdf.pdfDataUrl}
        pageCount={pendingPdf.pageCount}
        initialSelected={pendingPdf.initialSelected}
        onConfirm={applyPdfImport}
        onCancel={() => {
          setShowPagePicker(false)
          setPendingPdf(null)
        }}
      />
    ) : null

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT}
      className="hidden"
      onChange={(e) => {
        void handleFiles(e.target.files)
        e.target.value = ""
      }}
    />
  )

  if (!hasMedia) {
    if (isReadOnly) {
      return (
        <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-[12px] text-gray-400">
          Image or PDF block — no asset uploaded
        </div>
      )
    }

    if (loading) {
      return (
        <>
          {pagePicker}
          {hiddenInput}
          <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-6">
            <Loader2 className="size-5 animate-spin text-blue-500" />
            <span className="ml-2 text-[12px] text-gray-500">Processing file…</span>
          </div>
        </>
      )
    }

    const displayError = error ?? storedUploadError

    return (
      <>
        {pagePicker}
        <div className="space-y-2">
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
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
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
            <p className="mt-1 text-[11px] text-gray-500">
              PDFs open a page picker · add text overlays after upload
            </p>
          </div>
          {hiddenInput}
          {displayError && (
            <p className="text-[11px] text-red-600" role="alert">
              {displayError}
            </p>
          )}
        </div>
      </>
    )
  }

  const isPdf = content.mediaType === "pdf"
  const pageCount = content.pageCount ?? 1
  const importedCount = displayedPages.length

  if (isReadOnly) {
    return (
      <div className="space-y-2">
        {displayedPages.length > 1 ? (
          displayedPages.map(({ page, previewUrl }) => (
            <div key={page} className="space-y-1">
              <p className="text-[10px] font-medium text-gray-400">Page {page}</p>
              <img
                src={previewUrl}
                alt={`${content.fileName ?? "PDF"} page ${page}`}
                className="w-full rounded border border-gray-100"
              />
            </div>
          ))
        ) : (
          <img
            src={displayedPages[0]?.previewUrl ?? content.previewUrl ?? ""}
            alt={content.alt ?? content.fileName ?? "Uploaded asset"}
            className="w-full rounded border border-gray-100"
          />
        )}
        {caption}
      </div>
    )
  }

  return (
    <>
      {pagePicker}
      <div className="space-y-2">
        {/* File name above the image */}
        <div className="flex min-w-0 items-center gap-2">
          {isPdf ? (
            <FileText className="size-3.5 shrink-0 text-red-500" />
          ) : (
            <ImageIcon className="size-3.5 shrink-0 text-blue-500" />
          )}
          <p className="truncate text-[12px] font-medium text-gray-800">
            {content.fileName}
          </p>
          {isPdf && (
            <span className="shrink-0 text-[11px] text-gray-500">
              {importedCount} of {pageCount} pages
            </span>
          )}
        </div>

        {/* Image(s) — no wrapper chrome */}
        {displayedPages.length > 1 ? (
          <div className="space-y-6">
            {displayedPages.map(({ page, previewUrl }) => (
              <div key={page} className="space-y-1">
                <p className="text-[10px] font-medium text-gray-400">
                  Page {page}
                </p>
                <ImageWithOverlays
                  src={previewUrl}
                  alt={`${content.fileName ?? "PDF"} page ${page}`}
                  overlays={overlays}
                  onUpdateOverlay={updateOverlay}
                  onRemoveOverlay={removeOverlay}
                />
              </div>
            ))}
          </div>
        ) : (
          <ImageWithOverlays
            src={displayedPages[0]?.previewUrl ?? content.previewUrl ?? ""}
            alt={content.alt ?? content.fileName ?? "Uploaded asset"}
            overlays={overlays}
            onUpdateOverlay={updateOverlay}
            onRemoveOverlay={removeOverlay}
          />
        )}

        {caption}

        {/* Properties / actions below the image */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {overlays.length > 0 && (
            <span className="text-[11px] text-gray-500">
              {overlays.length} text {overlays.length === 1 ? "overlay" : "overlays"}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <AddTextOverlayButton onClick={addOverlay} />
            {isPdf && pageCount > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openPagePickerForExisting()
                }}
                className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
                title="Change imported pages"
              >
                <Layers className="size-3" />
                Pages
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                openPicker()
              }}
              className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
              title="Replace file"
            >
              <Replace className="size-3" />
              Replace
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearMedia()
              }}
              className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              title="Remove"
              aria-label="Remove file"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {hiddenInput}

        {error && (
          <p className="text-[11px] text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  )
}
