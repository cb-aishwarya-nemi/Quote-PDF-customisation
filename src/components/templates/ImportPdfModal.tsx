import { GeneratedVariantResultCard } from "@/components/templates/GeneratedVariantResultCard"
import { ProcessingSteps } from "@/components/templates/ProcessingSteps"
import { UploadZone } from "@/components/templates/UploadZone"
import {
  mockProcessingSteps,
  mockVariants,
  type ProcessingStep,
} from "@/mock/data"
import { Sparkles, X } from "lucide-react"
import { useEffect, useState } from "react"

type ModalStep = "upload" | "processing" | "results"

type Props = {
  open: boolean
  onClose: () => void
  onSkipUpload: () => void
  onGenerationComplete: () => void
  onViewGeneratedTemplates: () => void
}

export function ImportPdfModal({
  open,
  onClose,
  onSkipUpload,
  onGenerationComplete,
  onViewGeneratedTemplates,
}: Props) {
  const [step, setStep] = useState<ModalStep>("upload")
  const [files, setFiles] = useState<File[]>([])
  const [processingSteps, setProcessingSteps] =
    useState<ProcessingStep[]>(mockProcessingSteps)

  useEffect(() => {
    if (!open) {
      setStep("upload")
      setFiles([])
      setProcessingSteps(mockProcessingSteps)
    }
  }, [open])

  useEffect(() => {
    if (step !== "processing") return

    let index = 2
    const interval = setInterval(() => {
      index += 1
      if (index >= mockProcessingSteps.length) {
        clearInterval(interval)
        setProcessingSteps(
          mockProcessingSteps.map((s) => ({ ...s, status: "done" as const })),
        )
        setTimeout(() => {
          setStep("results")
          onGenerationComplete()
        }, 500)
        return
      }

      setProcessingSteps(
        mockProcessingSteps.map((s, i) => ({
          ...s,
          status: i < index ? "done" : i === index ? "active" : ("idle" as const),
        })),
      )
    }, 900)

    return () => clearInterval(interval)
  }, [step, onGenerationComplete])

  const handleGenerate = () => {
    if (files.length === 0) return
    setStep("processing")
  }

  const handleSkip = () => {
    onSkipUpload()
    onClose()
  }

  const handleViewGenerated = () => {
    onViewGeneratedTemplates()
    onClose()
  }

  const handleBackdropClick = () => {
    if (step === "results") handleViewGenerated()
  }

  if (!open) return null

  const backdropOpacity =
    step === "results" ? "bg-black/20" : "bg-black/40"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 ${backdropOpacity}`}
        onClick={handleBackdropClick}
      />

      <div
        className={`relative flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-xl ${
          step === "results" ? "w-full max-w-2xl" : "w-full max-w-lg"
        }`}
      >
        {step !== "processing" && (
          <button
            type="button"
            onClick={step === "upload" ? handleSkip : handleViewGenerated}
            className="absolute right-3 top-3 z-10 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        )}

        <div className="overflow-y-auto p-6">
          {step === "upload" && (
            <>
              <div className="flex items-start gap-3 pr-8">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                  <Sparkles className="size-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-[17px] font-semibold text-gray-900">
                    Import quote PDFs
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                    Upload your existing quote PDFs or order forms and we&apos;ll
                    generate layouts that match your format.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <UploadZone
                  compact
                  files={files}
                  onFilesAdded={(added) =>
                    setFiles((prev) => [...prev, ...added])
                  }
                  onRemove={(index) =>
                    setFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={files.length === 0}
                  onClick={handleGenerate}
                  className="rounded-md bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  Generate templates
                </button>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4 text-center">
                <p className="text-[12px] text-gray-500">
                  Do not have PDFs?{" "}
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    View recommended templates for your business
                  </button>
                </p>
              </div>
            </>
          )}

          {step === "processing" && (
            <>
              <h2 className="text-[17px] font-semibold text-gray-900">
                Generating your templates
              </h2>
              {files.length > 0 && (
                <p className="mt-1 text-[13px] text-gray-500">
                  Analysing {files.length} file{files.length > 1 ? "s" : ""}…
                </p>
              )}
              <div className="mt-6">
                <ProcessingSteps steps={processingSteps} />
              </div>
            </>
          )}

          {step === "results" && (
            <>
              <div className="pr-8">
                <h2 className="text-[17px] font-semibold text-gray-900">
                  Templates ready
                </h2>
                <p className="mt-1 text-[13px] text-gray-500">
                  We generated {mockVariants.length} layouts from your uploads.
                  Each preview shows the section order and structure we detected.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {mockVariants.map((variant, index) => (
                  <GeneratedVariantResultCard
                    key={variant.id}
                    variant={variant}
                    index={index}
                  />
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleViewGenerated}
                  className="rounded-md bg-gray-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-gray-800"
                >
                  View generated templates
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
