import type { ProcessingStep } from "@/mock/data"
import { Check, Loader2 } from "lucide-react"

export function ProcessingSteps({ steps }: { steps: ProcessingStep[] }) {
  return (
    <ul className="space-y-3">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-2.5">
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
              step.status === "done"
                ? "bg-green-100 text-green-600"
                : step.status === "active"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {step.status === "done" ? (
              <Check className="size-3" strokeWidth={2.5} />
            ) : step.status === "active" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <span className="size-1 rounded-full bg-current" />
            )}
          </span>
          <span
            className={`text-[13px] ${
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
