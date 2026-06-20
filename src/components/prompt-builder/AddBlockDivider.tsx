import { AddBlockMenu } from "@/components/prompt-builder/AddBlockMenu"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { IMAGE_BLOCK_ACCEPT } from "@/types/image-block"
import type { BuilderBlockType } from "@/types/prompt-builder"
import { Plus } from "lucide-react"
import { useRef } from "react"

type Props = {
  afterId?: string
  atStart?: boolean
}

export function AddBlockDivider({ afterId, atStart }: Props) {
  const addBlock = usePromptBuilderStore((s) => s.addBlock)
  const addImageBlockFromFile = usePromptBuilderStore((s) => s.addImageBlockFromFile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingInsertRef = useRef<string | undefined>(undefined)

  const handleAdd = (type: BuilderBlockType) => {
    if (type === "custom_image") {
      pendingInsertRef.current = atStart ? "__start__" : afterId
      fileInputRef.current?.click()
      return
    }
    addBlock(type, atStart ? "__start__" : afterId)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_BLOCK_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          const insertAfter = pendingInsertRef.current
          pendingInsertRef.current = undefined
          if (file) addImageBlockFromFile(file, insertAfter)
        }}
      />
      <div className="group/divider relative py-1">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gray-200 transition-colors group-hover/divider:bg-gray-300" />
          <AddBlockMenu onAdd={handleAdd}>
            {(openMenu) => (
              <button
                type="button"
                onClick={openMenu}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-500 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600"
              >
                <Plus className="size-3" />
                Add block
              </button>
            )}
          </AddBlockMenu>
          <div className="h-px flex-1 bg-gray-200 transition-colors group-hover/divider:bg-gray-300" />
        </div>
      </div>
    </>
  )
}

type BesideProps = {
  blockId: string
  alwaysVisible?: boolean
}

export function AddBesideBlockDivider({ blockId, alwaysVisible }: BesideProps) {
  const addBlockBeside = usePromptBuilderStore((s) => s.addBlockBeside)
  const addImageBlockFromFileBeside = usePromptBuilderStore(
    (s) => s.addImageBlockFromFileBeside,
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAdd = (type: BuilderBlockType) => {
    if (type === "custom_image") {
      fileInputRef.current?.click()
      return
    }
    addBlockBeside(blockId, type)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_BLOCK_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) addImageBlockFromFileBeside(file, blockId)
        }}
      />
      <div
        className={`pointer-events-none absolute -right-3 top-1/2 z-10 -translate-y-1/2 transition-opacity ${
          alwaysVisible ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
        }`}
      >
        <AddBlockMenu onAdd={handleAdd} align="right">
          {(toggleMenu) => (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toggleMenu(e)
              }}
              className="pointer-events-auto flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-blue-300 hover:text-blue-600"
              aria-label="Add block beside"
              title="Add block to the right"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </AddBlockMenu>
      </div>
    </>
  )
}
