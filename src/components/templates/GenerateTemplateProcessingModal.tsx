import { ProcessingSteps } from "@/components/templates/ProcessingSteps"
import {
  buildGenerationStepLabels,
  getGenerationBusinessType,
} from "@/lib/template-generation-steps"
import type { ProcessingStep } from "@/mock/data"
import { Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

type Props = {
  open: boolean
  hasUploads: boolean
  onComplete: () => void
}

function initialSteps(labels: string[]): ProcessingStep[] {
  return labels.map((label, index) => ({
    label,
    status: index === 0 ? "active" : "idle",
  }))
}

export function GenerateTemplateProcessingModal({
  open,
  hasUploads,
  onComplete,
}: Props) {
  const businessType = getGenerationBusinessType()

  const stepLabels = useMemo(
    () => buildGenerationStepLabels(hasUploads, businessType),
    [hasUploads, businessType],
  )

  const [steps, setSteps] = useState<ProcessingStep[]>(() =>
    initialSteps(stepLabels),
  )

  useEffect(() => {
    if (!open) {
      setSteps(initialSteps(stepLabels))
      return
    }

    setSteps(initialSteps(stepLabels))

    let activeIndex = 0
    const interval = setInterval(() => {
      activeIndex += 1
      if (activeIndex >= stepLabels.length) {
        clearInterval(interval)
        setSteps(
          stepLabels.map((label) => ({
            label,
            status: "done" as const,
          })),
        )
        setTimeout(onComplete, 700)
        return
      }

      setSteps(
        stepLabels.map((label, index) => ({
          label,
          status:
            index < activeIndex
              ? "done"
              : index === activeIndex
                ? "active"
                : "idle",
        })),
      )
    }, 900)

    return () => clearInterval(interval)
  }, [open, stepLabels, onComplete])

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
            Generating your quote template
          </h2>

          <div className="mt-6">
            <ProcessingSteps steps={steps} />
          </div>

          <p className="mt-6 text-[13px] text-gray-500">
            Taking you to your template in a few seconds.
          </p>
        </div>
      </div>
    </div>
  )
}
