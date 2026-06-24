import {
  acceptImportFiles,
  IMPORT_ACCEPT,
} from "@/lib/import-upload-categories"
import { TEMPLATE_CREATION_POINTS } from "@/components/templates/template-creation-confidence"
import {
  Check,
  Sparkles,
  Upload,
  X,
} from "lucide-react"
import { useRef, useState } from "react"

const FOOTER_HIGHLIGHTS = [
  "Tone & layout learned from your uploads",
  "Sensible defaults when assets are missing",
  "Every block editable in the studio",
] as const

type Props = {
  open: boolean
  onClose: () => void
  onGenerate: (files: File[]) => void
  dismissible?: boolean
}

export function CreateQuoteTemplateModal({
  open,
  onClose,
  onGenerate,
  dismissible = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  if (!open) return null

  const handleIncoming = (incoming: FileList | null) => {
    if (!incoming?.length) return
    const accepted = acceptImportFiles(incoming)
    if (accepted.length) setFiles((prev) => [...prev, ...accepted])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {dismissible ? (
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
        />
      ) : (
        <div className="absolute inset-0 bg-black/40" aria-hidden />
      )}

      <div className="relative w-full max-w-[620px]">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          )}

          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-6 pb-5 pt-6">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-50 via-sky-50 to-blue-100/80 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
              <Sparkles className="size-3 text-blue-500" />
              Ready to generate
            </span>

            <h2 className="mt-3 text-[20px] font-semibold leading-snug text-gray-900">
              Let's build your quote pdf template
            </h2>
            <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-gray-500">
              Built from proven quote patterns and tailored to your business.
              You can update it anytime.
            </p>

            <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TEMPLATE_CREATION_POINTS.map((text) => (
                <li
                  key={text}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/40 px-3 py-2.5 text-[12px] text-gray-700"
                >
                  <span className="size-1 shrink-0 rounded-full bg-gray-400" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2">
                <h3 className="text-[12px] font-medium text-gray-600">
                  Add documents
                </h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  Optional
                </span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  handleIncoming(e.dataTransfer.files)
                }}
                className={`mt-3 flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed px-4 py-4 transition-colors ${
                  dragOver
                    ? "border-gray-400 bg-gray-100"
                    : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100/80"
                }`}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-gray-200">
                  <Upload className="size-4 text-gray-500" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-gray-900">
                    Drop customer proposals, quote PDFs, order forms
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    PDF, DOCX, PNG, JPG, SVG · up to 20 MB each
                  </p>
                  {files.length > 0 && (
                    <p className="mt-1.5 text-[11px] font-medium text-gray-700">
                      {files.length} file{files.length > 1 ? "s" : ""} added
                    </p>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept={IMPORT_ACCEPT}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleIncoming(e.target.files)
                    e.target.value = ""
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
            <p className="min-w-0 text-[11px] leading-snug text-gray-500">
              Takes about 30 seconds. Edit/review before publishing.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {dismissible && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
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

        <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
          {FOOTER_HIGHLIGHTS.map((text) => (
            <li
              key={text}
              className="flex items-center gap-1.5 text-[11px] text-gray-600"
            >
              <Check className="size-3.5 shrink-0 text-blue-600" strokeWidth={2.5} />
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
