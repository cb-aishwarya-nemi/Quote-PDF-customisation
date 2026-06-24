import { ProcessingSteps } from "@/components/templates/ProcessingSteps"
import { createBuilderTemplate } from "@/lib/create-builder-template"
import { createId } from "@/lib/create-id"
import {
  extractTemplateFromFiles,
  type PdfExtractionSummary,
} from "@/lib/pdf-template-extractor"
import { getGenerationBusinessType } from "@/lib/template-generation-steps"
import type { BuilderTemplate } from "@/types/prompt-builder"
import type { ProcessingStep } from "@/mock/data"
import { Sparkles } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

export type TemplateGenerationResult = {
  template: BuilderTemplate
  extractionSummary: PdfExtractionSummary | null
  stepLabels: string[]
}

type Props = {
  open: boolean
  files: File[]
  onComplete: (result: TemplateGenerationResult) => void
}

function initialSteps(labels: string[]): ProcessingStep[] {
  return labels.map((label, index) => ({
    label,
    status: index === 0 ? "active" : "idle",
  }))
}

function buildStepLabels(hasPdf: boolean, businessType: string): string[] {
  if (!hasPdf) {
    return [
      "Analysing your business context",
      `Selecting layout for ${businessType}`,
      "Applying sensible defaults in your brand style",
      "Drafting template",
    ]
  }

  return [
    "Reading uploaded PDF",
    "Extracting text and section markers",
    "Mapping sections to template blocks",
    "Applying layout rules",
    "Drafting template",
  ]
}

function stepsForProgress(labels: string[], completedCount: number): ProcessingStep[] {
  const activeIndex = Math.min(completedCount, labels.length - 1)
  return labels.map((label, index) => ({
    label,
    status:
      index < completedCount
        ? "done"
        : index === activeIndex
          ? "active"
          : "idle",
  }))
}

export function GenerateTemplateProcessingModal({
  open,
  files,
  onComplete,
}: Props) {
  const businessType = getGenerationBusinessType()
  const hasPdf = useMemo(
    () =>
      files.some(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),
      ),
    [files],
  )

  const stepLabels = useMemo(
    () => buildStepLabels(hasPdf, businessType),
    [hasPdf, businessType],
  )

  const [steps, setSteps] = useState<ProcessingStep[]>(() =>
    initialSteps(stepLabels),
  )
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (!open) {
      setSteps(initialSteps(stepLabels))
      return
    }

    setSteps(initialSteps(stepLabels))

    let cancelled = false
    let completedCount = 0

    const markProgress = () => {
      completedCount = Math.min(completedCount + 1, stepLabels.length)
      setSteps(stepsForProgress(stepLabels, completedCount))
    }

    void (async () => {
      const templateId = createId("tpl")

      try {
        const result = await extractTemplateFromFiles(templateId, files, () => {
          if (!cancelled) markProgress()
        })

        if (cancelled) return

        while (completedCount < stepLabels.length) {
          markProgress()
        }

        setSteps(
          stepLabels.map((label) => ({ label, status: "done" as const })),
        )

        window.setTimeout(() => {
          if (cancelled) return
          onCompleteRef.current({
            template: result.template,
            extractionSummary: result.summary,
            stepLabels,
          })
        }, 700)
      } catch {
        if (cancelled) return
        onCompleteRef.current({
          template: createBuilderTemplate(templateId),
          extractionSummary: null,
          stepLabels,
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, files, stepLabels])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="px-6 pb-6 pt-6">
          <span className="pill-gradient-animate inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
            <Sparkles className="size-3 text-blue-500" />
            Working on it
          </span>

          <h2 className="mt-3 text-[20px] font-semibold leading-snug text-gray-900">
            {hasPdf ? "Extracting your quote layout" : "Generating your quote template"}
          </h2>

          <div className="mt-6">
            <ProcessingSteps steps={steps} />
          </div>

          <p className="mt-6 text-[13px] text-gray-500">
            {hasPdf
              ? "Reading your PDF and mapping sections to editable blocks."
              : "Taking you to your template in a few seconds."}
          </p>
        </div>
      </div>
    </div>
  )
}
