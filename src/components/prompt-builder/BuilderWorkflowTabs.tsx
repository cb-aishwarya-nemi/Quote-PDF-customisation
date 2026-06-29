import type { BuilderWorkflowTab } from "@/store/prompt-builder-store"
import { BUILDER_PANEL_HEADER_CLASS, BUILDER_STRIP_HEIGHT_CLASS } from "@/lib/canvas-constants"
import { summarizeMappingCoverage } from "@/lib/pdf-field-mappings"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"

const TABS: { id: BuilderWorkflowTab; label: string }[] = [
  { id: "data_mapping", label: "Data mapping" },
  { id: "canvas", label: "Template canvas" },
]

export function BuilderWorkflowTabs({ className = "" }: { className?: string }) {
  const activeTab = usePromptBuilderStore((s) => s.builderWorkflowTab)
  const setBuilderWorkflowTab = usePromptBuilderStore((s) => s.setBuilderWorkflowTab)
  const mappings = usePromptBuilderStore((s) => s.pdfFieldMappings)
  const coverage = summarizeMappingCoverage(mappings)

  if (coverage.total === 0) return null

  return (
    <header
      className={`${BUILDER_PANEL_HEADER_CLASS} justify-center bg-white ${BUILDER_STRIP_HEIGHT_CLASS} ${className}`}
    >
      <div
        className="flex h-full items-center gap-8"
        role="tablist"
        aria-label="Builder workflow"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setBuilderWorkflowTab(tab.id)}
              className={`-mb-px flex h-full items-center gap-1.5 border-b-2 px-1 text-[13px] font-medium transition-colors ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}
            >
                {tab.label}
                {tab.id === "data_mapping" && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {coverage.mapped}/{coverage.total}
                  </span>
                )}
              </button>
            )
          })}
      </div>
    </header>
  )
}
