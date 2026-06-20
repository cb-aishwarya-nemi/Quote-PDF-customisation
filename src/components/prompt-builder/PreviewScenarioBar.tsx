import { PreviewExportActions } from "@/components/prompt-builder/PreviewExportActions"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { PREVIEW_SCENARIOS } from "@/types/prompt-builder"
import type { RefObject } from "react"

type Props = {
  documentRef: RefObject<HTMLDivElement | null>
}

export function PreviewScenarioBar({ documentRef }: Props) {
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const setScenario = usePromptBuilderStore((s) => s.setActiveScenario)

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200/80 bg-white px-4 py-2">
      <span className="text-[11px] font-medium text-gray-500">Preview scenario</span>
      {PREVIEW_SCENARIOS.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          onClick={() => setScenario(scenario)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
            activeScenario.id === scenario.id
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {scenario.label}
        </button>
      ))}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <span className="hidden text-[10px] text-gray-400 lg:inline">
          Conditional blocks and terms resolve for this scenario
        </span>
        <PreviewExportActions documentRef={documentRef} />
      </div>
    </div>
  )
}
