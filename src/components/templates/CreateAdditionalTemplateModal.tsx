import { TEMPLATE_CREATION_POINTS } from "@/components/templates/template-creation-confidence"
import {
  acceptImportFiles,
  IMPORT_ACCEPT,
} from "@/lib/import-upload-categories"
import { Sparkles, Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  open: boolean
  onClose: () => void
  onGenerate: (files: File[]) => void
}

export function CreateAdditionalTemplateModal({
  open,
  onClose,
  onGenerate,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (!open) return
    setFiles([])
    setDragOver(false)
  }, [open])

  if (!open) return null

  const handleIncoming = (incoming: FileList | null) => {
    if (!incoming?.length) return
    const accepted = acceptImportFiles(incoming)
    if (accepted.length) setFiles((prev) => [...prev, ...accepted])
  }

  const resetAndClose = () => {
    setFiles([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={resetAndClose}
      />

      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[620px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-2 pt-5">
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold text-gray-900">
              New quote PDF template
            </h2>
            <p className="mt-1 text-[13px] text-gray-500">
              Upload a sample quote and AI will match layout, blocks, and styling.
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                inputRef.current?.click()
              }
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragOver(false)
              handleIncoming(event.dataTransfer.files)
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50/50"
                : "border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <Upload className="size-5 text-gray-500" strokeWidth={1.75} />
            </div>
            <p className="mt-3 text-[13px] font-medium text-gray-900">
              Drop customer proposals, quote PDFs, or brand assets
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              or click to browse · PDF, DOCX, PNG, JPG, SVG · up to 20 MB each
            </p>
            {files.length > 0 && (
              <p className="mt-3 text-[12px] font-medium text-blue-700">
                {files.length} file{files.length > 1 ? "s" : ""} ready
              </p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={IMPORT_ACCEPT}
              multiple
              className="hidden"
              onChange={(event) => {
                handleIncoming(event.target.files)
                event.target.value = ""
              }}
            />
          </div>

          <ul className="mt-5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {TEMPLATE_CREATION_POINTS.map((text) => (
              <li
                key={text}
                className="flex items-center gap-2 text-[11px] text-gray-500"
              >
                <span className="size-1 shrink-0 rounded-full bg-gray-300" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <p className="min-w-0 text-[11px] text-gray-500">
            Takes about 30 seconds. Edit/review before publishing.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onGenerate(files)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              <Sparkles className="size-4" />
              Generate template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
