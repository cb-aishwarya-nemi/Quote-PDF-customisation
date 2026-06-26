import type { BuilderWorkflowTab } from "@/store/prompt-builder-store"
import { countReviewedMappings } from "@/lib/pdf-field-mappings"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"

const TABS: { id: BuilderWorkflowTab; label: string }[] = [
  { id: "data_mapping", label: "Data mapping" },
  { id: "canvas", label: "Template canvas" },
]

export function BuilderWorkflowTabs() {
  const activeTab = usePromptBuilderStore((s) => s.builderWorkflowTab)
  const setBuilderWorkflowTab = usePromptBuilderStore((s) => s.setBuilderWorkflowTab)
  const mappings = usePromptBuilderStore((s) => s.pdfFieldMappings)
  const { reviewed, total } = countReviewedMappings(mappings)

  if (total === 0) return null

  return (
    <div
      className="inline-flex items-center rounded-md bg-gray-100/90 p-px shadow-sm ring-1 ring-black/5"
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
            className={`inline-flex h-7 items-center gap-1 rounded-[5px] px-2.5 text-[11px] font-medium transition-all ${
              active
                ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/70"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.id === "data_mapping" && (
              <span
                className={`rounded px-1 py-px text-[9px] font-semibold leading-none ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-200/70 text-gray-600"
                }`}
              >
                {reviewed}/{total}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
