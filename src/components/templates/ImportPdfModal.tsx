import { BestMatchResultCard } from "@/components/templates/BestMatchResultCard"
import { BusinessProfileSnapshot } from "@/components/templates/BusinessProfileSnapshot"
import { GeneratedVariantResultCard } from "@/components/templates/GeneratedVariantResultCard"
import { ProcessingSteps } from "@/components/templates/ProcessingSteps"
import { UploadZone } from "@/components/templates/UploadZone"
import { summarizeImportFiles } from "@/lib/import-upload-categories"
import {
  mockBestMatchTemplate,
  mockBusinessProfile,
  mockProcessingSteps,
  mockVariants,
  profileMatchProcessingSteps,
  type ProcessingStep,
} from "@/mock/data"
import { Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type ModalStep = "upload" | "processing" | "results"
type GenerationMode = "uploads" | "profile"

type Props = {
  open: boolean
  initialMode?: "upload" | "profile"
  onClose: () => void
  onSkipUpload: () => void
  onGenerationComplete: () => void
  onViewGeneratedTemplates: () => void
  onUseBestMatch: (presetId: string, name: string) => void
}

export function ImportPdfModal({
  open,
  initialMode = "upload",
  onClose,
  onSkipUpload,
  onGenerationComplete,
  onViewGeneratedTemplates,
  onUseBestMatch,
}: Props) {
  const [step, setStep] = useState<ModalStep>("upload")
  const [generationMode, setGenerationMode] = useState<GenerationMode>("uploads")
  const [files, setFiles] = useState<File[]>([])
  const [processingSteps, setProcessingSteps] =
    useState<ProcessingStep[]>(mockProcessingSteps)
  const profileStartedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      setStep("upload")
      setGenerationMode("uploads")
      setFiles([])
      setProcessingSteps(mockProcessingSteps)
      profileStartedRef.current = false
      return
    }

    if (initialMode === "profile" && !profileStartedRef.current) {
      profileStartedRef.current = true
      setGenerationMode("profile")
      setProcessingSteps(profileMatchProcessingSteps)
      setStep("processing")
    }
  }, [open, initialMode])

  useEffect(() => {
    if (step !== "processing") return

    const stepsSource =
      generationMode === "profile"
        ? profileMatchProcessingSteps
        : mockProcessingSteps

    let index = 2
    const interval = setInterval(() => {
      index += 1
      if (index >= stepsSource.length) {
        clearInterval(interval)
        setProcessingSteps(
          stepsSource.map((s) => ({ ...s, status: "done" as const })),
        )
        setTimeout(() => {
          setStep("results")
          if (generationMode === "uploads") onGenerationComplete()
        }, 500)
        return
      }

      setProcessingSteps(
        stepsSource.map((s, i) => ({
          ...s,
          status: i < index ? "done" : i === index ? "active" : ("idle" as const),
        })),
      )
    }, 900)

    return () => clearInterval(interval)
  }, [step, generationMode, onGenerationComplete])

  const startProcessing = (mode: GenerationMode) => {
    setGenerationMode(mode)
    setProcessingSteps(
      mode === "profile" ? profileMatchProcessingSteps : mockProcessingSteps,
    )
    setStep("processing")
  }

  const handleGenerateFromUploads = () => {
    if (files.length === 0) return
    startProcessing("uploads")
  }

  const handleBestMatchWithoutUploads = () => {
    startProcessing("profile")
  }

  const handleBrowseRecommended = () => {
    onSkipUpload()
    onClose()
  }

  const handleViewGenerated = () => {
    onViewGeneratedTemplates()
    onClose()
  }

  const handleBackdropClick = () => {
    if (step === "results" && generationMode === "uploads") {
      handleViewGenerated()
    }
  }

  if (!open) return null

  const fileSummary = summarizeImportFiles(files)

  const backdropOpacity =
    step === "results" ? "bg-black/20" : "bg-black/40"

  const modalWidth = step === "results" ? "max-w-2xl" : "max-w-lg"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className={`absolute inset-0 ${backdropOpacity}`}
        onClick={handleBackdropClick}
      />

      <div
        className={`relative flex max-h-[90vh] w-full ${modalWidth} flex-col overflow-hidden rounded-xl bg-white shadow-xl`}
      >
        {step !== "processing" && (
          <button
            type="button"
            onClick={
              step === "upload"
                ? onClose
                : generationMode === "profile"
                  ? () =>
                      onUseBestMatch(
                        mockBestMatchTemplate.presetId,
                        mockBestMatchTemplate.name,
                      )
                  : handleViewGenerated
            }
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
                    Import your materials
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                    One upload area for everything. We detect file types and build
                    templates that match your quotes, branding, and deal patterns.
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

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  disabled={files.length === 0}
                  onClick={handleGenerateFromUploads}
                  className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {files.length > 0
                    ? `Generate templates from ${files.length} file${files.length > 1 ? "s" : ""}`
                    : "Generate templates from uploads"}
                </button>
                {files.length > 0 && fileSummary.length > 0 && (
                  <p className="text-center text-[11px] text-gray-500">
                    Detected: {fileSummary.join(" · ")}
                  </p>
                )}

                <div className="relative flex items-center py-1">
                  <div className="flex-1 border-t border-gray-100" />
                  <span className="px-3 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    or
                  </span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>

                <button
                  type="button"
                  onClick={handleBestMatchWithoutUploads}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Get best-match template without uploads
                </button>
                <p className="text-center text-[11px] text-gray-400">
                  Uses your business profile — no files needed
                </p>
              </div>

              <div className="mt-5 border-t border-gray-100 pt-4 text-center">
                <button
                  type="button"
                  onClick={handleBrowseRecommended}
                  className="text-[12px] font-medium text-blue-600 hover:text-blue-800"
                >
                  Browse all recommended templates
                </button>
              </div>
            </>
          )}

          {step === "processing" && (
            <>
              <h2 className="text-[17px] font-semibold text-gray-900">
                {generationMode === "profile"
                  ? "Finding your best match"
                  : "Generating your templates"}
              </h2>
              <p className="mt-1 text-[13px] text-gray-500">
                {generationMode === "profile"
                  ? "Matching layouts to your business type, branding, and deal patterns…"
                  : `Analysing ${files.length} uploaded file${files.length > 1 ? "s" : ""}…`}
              </p>
              {generationMode === "profile" && (
                <div className="mt-4">
                  <BusinessProfileSnapshot profile={mockBusinessProfile} compact />
                </div>
              )}
              {generationMode === "uploads" && files.length > 0 && (
                <ul className="mt-3 space-y-1 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                  {files.slice(0, 4).map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="truncate text-[11px] text-gray-600"
                    >
                      {file.name}
                    </li>
                  ))}
                  {files.length > 4 && (
                    <li className="text-[11px] text-gray-400">
                      +{files.length - 4} more
                    </li>
                  )}
                </ul>
              )}
              <div className="mt-6">
                <ProcessingSteps steps={processingSteps} />
              </div>
            </>
          )}

          {step === "results" && generationMode === "profile" && (
            <>
              <div className="pr-8">
                <h2 className="text-[17px] font-semibold text-gray-900">
                  Your best-fit template
                </h2>
                <p className="mt-1 text-[13px] text-gray-500">
                  Matched to your business profile and branding — ready to
                  customise in the builder.
                </p>
              </div>
              <div className="mt-5">
                <BestMatchResultCard
                  match={mockBestMatchTemplate}
                  onUse={() =>
                    onUseBestMatch(
                      mockBestMatchTemplate.presetId,
                      mockBestMatchTemplate.name,
                    )
                  }
                  onBrowseAll={handleBrowseRecommended}
                />
              </div>
            </>
          )}

          {step === "results" && generationMode === "uploads" && (
            <>
              <div className="pr-8">
                <h2 className="text-[17px] font-semibold text-gray-900">
                  Templates ready
                </h2>
                <p className="mt-1 text-[13px] text-gray-500">
                  We generated {mockVariants.length} layouts from your materials.
                  Brand guidelines and assets informed section order and styling.
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
