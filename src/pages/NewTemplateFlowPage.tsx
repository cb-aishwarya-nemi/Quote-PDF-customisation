import { mockProcessingSteps, mockVariants } from "@/mock/data"
import type { GeneratedVariant, ProcessingStep } from "@/mock/data"
import { ArrowLeft, Check, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

type FlowState = {
  mode: "blank" | "preset" | "upload"
  presetId?: string
  presetName?: string
  fileNames?: string[]
}

type Step = "confirm" | "processing" | "picker"

function ProcessingSteps({ steps }: { steps: ProcessingStep[] }) {
  return (
    <ul className="space-y-4">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-3">
          <span
            className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
              step.status === "done"
                ? "bg-green-100 text-green-600"
                : step.status === "active"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {step.status === "done" ? (
              <Check className="size-3.5" strokeWidth={2.5} />
            ) : step.status === "active" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <span className="size-1.5 rounded-full bg-current" />
            )}
          </span>
          <span
            className={`text-[14px] ${
              step.status === "idle" ? "text-gray-400" : "text-gray-800"
            }`}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ul>
  )
}

function VariantCard({
  variant,
  selected,
  onClick,
}: {
  variant: GeneratedVariant
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        selected
          ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <h3 className="text-[15px] font-semibold text-gray-900">{variant.name}</h3>
      <p className="mt-1 text-[12px] text-gray-500">{variant.sourceNote}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {variant.tags.map((tag) => (
          <span
            key={tag}
            className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}

export function NewTemplateFlowPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const flow = (location.state as FlowState | null) ?? { mode: "blank" }

  const [step, setStep] = useState<Step>(
    flow.mode === "upload" ? "processing" : "confirm",
  )
  const [processingSteps, setProcessingSteps] =
    useState<ProcessingStep[]>(mockProcessingSteps)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)

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
        setTimeout(() => setStep("picker"), 600)
        return
      }

      setProcessingSteps(
        mockProcessingSteps.map((s, i) => ({
          ...s,
          status:
            i < index ? "done" : i === index ? "active" : ("idle" as const),
        })),
      )
    }, 900)

    return () => clearInterval(interval)
  }, [step])

  const title =
    step === "processing"
      ? "Analysing your documents"
      : step === "picker"
        ? "Pick a generated layout"
        : flow.mode === "blank"
          ? "Blank template"
          : flow.mode === "preset"
            ? flow.presetName ?? "Predefined template"
            : "New template"

  return (
    <div className="flex min-h-full flex-col px-8 pb-16 pt-6">
      <button
        type="button"
        onClick={() => navigate("/templates")}
        className="mb-4 flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="size-3.5" />
        Quote PDF templates
      </button>

      <h1 className="mb-6 text-[22px] font-semibold text-gray-900">{title}</h1>

      <div className="w-full max-w-[640px]">
        {step === "confirm" && flow.mode === "blank" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-[14px] text-gray-600">
              You&apos;ll start with an empty canvas. Add blocks from the tray
              and configure each one in the properties panel.
            </p>
            <button
              type="button"
              className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
              onClick={() => {
                /* Canvas editor — next build step */
              }}
            >
              Open in canvas editor
            </button>
          </div>
        )}

        {step === "confirm" && flow.mode === "preset" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <p className="text-[14px] text-gray-600">
              Starting from <strong>{flow.presetName}</strong>. Blocks will be
              pre-arranged — you can reorder and customise everything in the
              canvas editor.
            </p>
            <button
              type="button"
              className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700"
              onClick={() => {
                /* Canvas editor — next build step */
              }}
            >
              Open in canvas editor
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            {flow.fileNames && flow.fileNames.length > 0 && (
              <p className="mb-6 text-[13px] text-gray-500">
                Processing {flow.fileNames.length} file
                {flow.fileNames.length > 1 ? "s" : ""}:{" "}
                {flow.fileNames.join(", ")}
              </p>
            )}
            <ProcessingSteps steps={processingSteps} />
          </div>
        )}

        {step === "picker" && (
          <div className="space-y-4">
            <p className="text-[14px] text-gray-600">
              AI found {mockVariants.length} layout variants based on your
              uploads. Select one to open in the canvas editor — you can still
              change every block.
            </p>
            <div className="space-y-3">
              {mockVariants.map((variant) => (
                <VariantCard
                  key={variant.id}
                  variant={variant}
                  selected={selectedVariantId === variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                />
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="text-[13px] text-blue-600 hover:text-blue-800"
                onClick={() => {
                  setStep("processing")
                  setProcessingSteps(mockProcessingSteps)
                }}
              >
                Regenerate variants
              </button>
              <button
                type="button"
                disabled={!selectedVariantId}
                className="rounded-md bg-blue-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                onClick={() => {
                  /* Canvas editor — next build step */
                }}
              >
                Open in canvas editor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
