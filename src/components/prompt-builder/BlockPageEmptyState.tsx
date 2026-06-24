import { AddBlockMenu } from "@/components/prompt-builder/AddBlockMenu"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlockType } from "@/types/prompt-builder"
import { LayoutTemplate, Plus } from "lucide-react"

type Props = {
  pageId: string
  allowedTypes: BuilderBlockType[]
}

export function BlockPageEmptyState({ pageId, allowedTypes }: Props) {
  const addBlock = usePromptBuilderStore((s) => s.addBlock)

  const handleAdd = (type: BuilderBlockType) => {
    addBlock(type, "__start__", pageId)
  }

  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center transition-colors hover:border-gray-300 hover:bg-gray-50/80"
      onClick={(e) => e.stopPropagation()}
    >
      <LayoutTemplate
        className="size-7 text-gray-400"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="mt-3 text-[13px] font-medium text-gray-700">Blank page</p>
      <p className="mt-1 max-w-xs text-[11px] text-gray-500">
        Add blocks to build this page — logo, pricing, terms, and more.
      </p>
      <div className="mt-5">
        <AddBlockMenu onAdd={handleAdd} allowedTypes={allowedTypes}>
          {(openMenu) => (
            <button
              type="button"
              onClick={openMenu}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-500 bg-white px-3.5 py-1.5 text-[12px] font-medium text-blue-600 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-50"
            >
              <Plus className="size-3.5" />
              Add block
            </button>
          )}
        </AddBlockMenu>
      </div>
    </div>
  )
}
