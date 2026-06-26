import { TemplateCreationGuidedChat } from "@/components/templates/TemplateCreationGuidedChat"
import {
  acceptImportFiles,
  IMPORT_ACCEPT,
} from "@/lib/import-upload-categories"
import { MessageSquareText, Sparkles, Upload, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Step = "choose" | "guided"

type Props = {
  open: boolean
  onClose: () => void
  onGenerate: (files: File[]) => void
  onGuidedComplete: (brief: string) => void
  dismissible?: boolean
}

export function CreateQuoteTemplateModal({
  open,
  onClose,
  onGenerate,
  onGuidedComplete,
  dismissible = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>("choose")
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep("choose")
    setFiles([])
    setDragOver(false)
  }, [open])

  if (!open) return null

  const handleIncoming = (incoming: FileList | null) => {
    if (!incoming?.length) return
    const accepted = acceptImportFiles(incoming)
    if (accepted.length) setFiles((prev) => [...prev, ...accepted])
  }

  const closeModal = () => {
    setStep("choose")
    setFiles([])
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {dismissible ? (
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/45"
          onClick={closeModal}
        />
      ) : (
        <div className="absolute inset-0 bg-black/45" aria-hidden />
      )}

      <div
        className={`relative flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ${
          step === "guided"
            ? "h-[min(720px,calc(100vh-2rem))] max-w-3xl"
            : "max-h-[calc(100vh-2rem)] max-w-2xl"
        }`}
      >
        {dismissible && step === "choose" && (
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-4 top-4 z-10 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        )}

        {step === "guided" ? (
          <TemplateCreationGuidedChat
            onBack={() => setStep("choose")}
            onComplete={(brief) => {
              onGuidedComplete(brief)
              closeModal()
            }}
          />
        ) : (
          <>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-8 pb-6 pt-8">
              <h2 className="pr-8 text-[24px] font-semibold leading-tight text-gray-900">
                Let&apos;s build a quote pdf template for you
              </h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-gray-500">
                Upload sample documents or answer a few questions — either way
                we&apos;ll draft a template you can refine in the studio.
              </p>

              <div className="mt-8 grid items-stretch gap-4 sm:grid-cols-2">
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
                  className={`flex h-full cursor-pointer flex-col rounded-xl border p-5 text-left transition-all ${
                    dragOver || files.length > 0
                      ? "border-blue-300 bg-blue-50/40 shadow-sm ring-1 ring-blue-100"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gray-50 ring-1 ring-gray-200">
                    <Upload className="size-4 text-gray-600" strokeWidth={1.75} />
                  </div>
                  <h3 className="mt-4 text-[14px] font-semibold text-gray-900">
                    I have quote PDFs, order forms
                  </h3>
                  <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-gray-500">
                    Upload them and we&apos;ll learn your layout, tone, and
                    block structure.
                  </p>
                  <p className="mt-4 text-[11px] text-gray-400">
                    PDF, DOCX, PNG, JPG, SVG
                  </p>
                  {files.length > 0 && (
                    <p className="mt-2 text-[12px] font-medium text-blue-700">
                      {files.length} file{files.length > 1 ? "s" : ""} added
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

                <button
                  type="button"
                  onClick={() => setStep("guided")}
                  className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-gray-300 hover:shadow-sm"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gray-50 ring-1 ring-gray-200">
                    <MessageSquareText
                      className="size-4 text-gray-600"
                      strokeWidth={1.75}
                    />
                  </div>
                  <h3 className="mt-4 text-[14px] font-semibold text-gray-900">
                    Help me create one
                  </h3>
                  <p className="mt-1.5 flex-1 text-[12px] leading-relaxed text-gray-500">
                    No samples handy? Answer a few quick questions and we&apos;ll
                    shape a starting template for how you sell.
                  </p>
                  <p className="mt-4 text-[11px] text-gray-400">
                    Guided setup in chat
                  </p>
                </button>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/60 px-8 py-4">
              <p className="min-w-0 text-[12px] text-gray-500">
                Takes a few minutes. Edit/review before publishing.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                {dismissible && (
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  disabled={files.length === 0}
                  onClick={() => onGenerate(files)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <Sparkles className="size-4" />
                  Generate template
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
