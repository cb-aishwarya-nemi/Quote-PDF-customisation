import { DuplicateTemplatePicker } from "@/components/templates/DuplicateTemplatePicker"
import { TemplateCreationAgentChat } from "@/components/templates/TemplateCreationAgentChat"
import { acceptImportFiles, IMPORT_ACCEPT } from "@/lib/import-upload-categories"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import { ArrowRight, Copy, FileText, Sparkles, Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type CreationMode = "assistant" | "duplicate" | "pdf"

const MODES: {
  id: CreationMode
  label: string
  icon: typeof Sparkles
}[] = [
  { id: "assistant", label: "Assistant", icon: Sparkles },
  { id: "duplicate", label: "Duplicate", icon: Copy },
  { id: "pdf", label: "From PDF", icon: FileText },
]

type Props = {
  open: boolean
  onClose: () => void
  templates: PublishedBuilderTemplate[]
  onGenerateFromDescription: (brief: string) => void
  onGenerateFromPdf: (files: File[]) => void
  onDuplicate: (templateId: string) => void
}

export function CreateAdditionalTemplateModal({
  open,
  onClose,
  templates,
  onGenerateFromDescription,
  onGenerateFromPdf,
  onDuplicate,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<CreationMode>("assistant")
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [brief, setBrief] = useState("")
  const [chatKey, setChatKey] = useState(0)

  useEffect(() => {
    if (!open) return
    setMode("assistant")
    setFiles([])
    setBrief("")
    setDragOver(false)
    setChatKey((current) => current + 1)
  }, [open])

  if (!open) return null

  const handleIncoming = (incoming: FileList | null) => {
    if (!incoming?.length) return
    const accepted = acceptImportFiles(incoming).filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"),
    )
    if (accepted.length) setFiles((prev) => [...prev, ...accepted])
  }

  const resetAndClose = () => {
    setFiles([])
    setBrief("")
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

      <div className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-3 pt-5">
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold text-gray-900">
              New quote PDF template
            </h2>
            <p className="mt-1 text-[13px] text-gray-500">
              Choose how you want to start.
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

        <div className="shrink-0 px-6 pb-4">
          <div
            className="inline-flex rounded-full border border-gray-200 bg-gray-50/80 p-0.5"
            role="tablist"
            aria-label="Template creation method"
          >
            {MODES.map(({ id, label, icon: Icon }) => {
              const active = mode === id
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "bg-white text-blue-700 shadow-sm ring-2 ring-blue-500/30 outline outline-1 outline-blue-400"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon
                    className={`size-3.5 shrink-0 ${active ? "text-blue-600" : "opacity-70"}`}
                  />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-h-[340px] flex-1 overflow-y-auto px-6 pb-4">
          {mode === "assistant" && (
            <TemplateCreationAgentChat key={chatKey} onBriefReady={setBrief} />
          )}

          {mode === "duplicate" && (
            <DuplicateTemplatePicker
              templates={templates}
              onDuplicate={onDuplicate}
              embedded
            />
          )}

          {mode === "pdf" && (
            <div className="flex h-full min-h-[340px] flex-col">
              <p className="text-[12px] text-gray-500">
                Upload a quote PDF and AI will match layout, blocks, and styling.
              </p>

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
                className={`mt-4 flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors ${
                  dragOver
                    ? "border-blue-400 bg-blue-50/50"
                    : "border-gray-200 bg-gray-50/60 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200">
                  <Upload className="size-5 text-gray-500" strokeWidth={1.75} />
                </div>
                <p className="mt-3 text-[13px] font-medium text-gray-900">
                  Drop a quote PDF here
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  or click to browse · PDF only · up to 20 MB
                </p>
                {files.length > 0 && (
                  <p className="mt-3 text-[12px] font-medium text-blue-700">
                    {files.length} PDF{files.length > 1 ? "s" : ""} ready
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
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 px-6 py-4">
          <p className="min-w-0 text-[11px] text-gray-500">
            {mode === "duplicate"
              ? "Duplicates open in the editor as a draft."
              : "Takes about 30 seconds. Edit/review before publishing."}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {mode === "assistant" && (
              <button
                type="button"
                disabled={!brief.trim()}
                onClick={() => onGenerateFromDescription(brief.trim())}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Create from description
                <ArrowRight className="size-4" />
              </button>
            )}
            {mode === "pdf" && (
              <button
                type="button"
                disabled={files.length === 0}
                onClick={() => onGenerateFromPdf(files)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Generate from PDF
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
