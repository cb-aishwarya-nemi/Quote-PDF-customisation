import { FileText, Upload, X } from "lucide-react"
import { useRef, useState } from "react"

type Props = {
  files: File[]
  onFilesAdded: (files: File[]) => void
  onRemove: (index: number) => void
  compact?: boolean
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
    const pdfs = Array.from(incoming).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    )
    if (pdfs.length) onFilesAdded(pdfs)
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
        }}
        onClick={() => inputRef.current?.click()}
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
        className={`cursor-pointer rounded-lg border-2 border-dashed px-6 text-center transition-colors ${
          compact ? "py-8" : "py-10"
        } ${
          dragOver
            ? "border-blue-400 bg-blue-50/50"
            : "border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-50"
        }`}
      >
        <Upload className="mx-auto size-8 text-gray-400" strokeWidth={1.5} />
        <p className="mt-3 text-[14px] font-medium text-gray-700">
          Drop quote PDFs or order forms here
        </p>
        <p className="mt-1 text-[12px] text-gray-500">
          or click to browse · PDF only · multiple files supported
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
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
              <FileText className="size-4 shrink-0 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-gray-900">
                  {file.name}
                </p>
                <p className="text-[11px] text-gray-500">{formatSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(index)
                }}
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
