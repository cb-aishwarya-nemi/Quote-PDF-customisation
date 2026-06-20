import {
  acceptImportFiles,
  detectImportCategoryLabel,
  IMPORT_ACCEPT,
} from "@/lib/import-upload-categories"
import { FileText, ImageIcon, Upload, X } from "lucide-react"
import { useRef, useState } from "react"

type Props = {
  files: File[]
  onFilesAdded: (files: File[]) => void
  onRemove: (index: number) => void
  compact?: boolean
}

const FILE_TYPE_HINTS = [
  "Quote PDFs",
  "Order forms",
  "Brand guidelines",
  "Logos & assets",
]

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(file: File) {
  if (file.type.startsWith("image/")) {
    return <ImageIcon className="size-4 shrink-0 text-violet-500" />
  }
  return <FileText className="size-4 shrink-0 text-red-400" />
}

export function UploadZone({
  files,
  onFilesAdded,
  onRemove,
  compact = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return
    const accepted = acceptImportFiles(incoming)
    if (accepted.length) onFilesAdded(accepted)
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`rounded-xl border-2 border-dashed px-5 transition-colors ${
          compact ? "py-7" : "py-9"
        } ${
          dragOver
            ? "border-violet-400 bg-violet-50/60"
            : files.length > 0
              ? "border-gray-200 bg-white"
              : "border-gray-200 bg-gray-50/80"
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex size-11 items-center justify-center rounded-full ${
              dragOver ? "bg-violet-100" : "bg-white ring-1 ring-gray-200"
            }`}
          >
            <Upload
              className={`size-5 ${dragOver ? "text-violet-600" : "text-gray-400"}`}
              strokeWidth={1.75}
            />
          </div>
          <p className="mt-3 text-[14px] font-semibold text-gray-900">
            Drag and drop your files here
          </p>
          <p className="mt-1 max-w-sm text-[12px] leading-relaxed text-gray-500">
            Add everything in one go — we&apos;ll sort quote PDFs, order forms,
            brand guidelines, and assets automatically.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {FILE_TYPE_HINTS.map((hint) => (
              <span
                key={hint}
                className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200"
              >
                {hint}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 text-[12px] font-medium text-blue-600 hover:text-blue-800"
          >
            Or browse files
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={IMPORT_ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              {fileIcon(file)}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-medium text-gray-900">
                    {file.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                    {detectImportCategoryLabel(file)}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
