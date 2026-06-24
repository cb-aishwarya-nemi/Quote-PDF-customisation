import { AddBlockMenu } from "@/components/prompt-builder/AddBlockMenu"
import { ADDABLE_BLOCKS } from "@/lib/block-variants"
import { filterTypesForBesideAdd } from "@/lib/block-layout"
import { findBlockInTemplate } from "@/lib/page-blocks"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { IMAGE_BLOCK_ACCEPT } from "@/types/image-block"
import type { BuilderBlockType } from "@/types/prompt-builder"
import { Plus } from "lucide-react"
import { useRef } from "react"

type Props = {
  afterId?: string
  atStart?: boolean
  visible?: boolean
  onInsertHover?: (active: boolean) => void
  pageId?: string
  allowedTypes?: BuilderBlockType[]
}

export function AddBlockDivider({
  afterId,
  atStart,
  visible = false,
  onInsertHover,
  pageId,
  allowedTypes,
}: Props) {
  const addBlock = usePromptBuilderStore((s) => s.addBlock)
  const addImageBlockFromFile = usePromptBuilderStore((s) => s.addImageBlockFromFile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingInsertRef = useRef<string | undefined>(undefined)

  const menuTypes =
    allowedTypes ?? ADDABLE_BLOCKS.map((entry) => entry.type)

  const handleAdd = (type: BuilderBlockType) => {
    if (type === "custom_image") {
      pendingInsertRef.current = atStart ? "__start__" : afterId
      fileInputRef.current?.click()
      return
    }
    addBlock(type, atStart ? "__start__" : afterId, pageId)
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
      <div
        className={`group/divider relative transition-all duration-150 ${
          visible
            ? "py-1 opacity-100"
            : "pointer-events-none max-h-0 overflow-hidden py-0 opacity-0"
        }`}
        onPointerEnter={() => onInsertHover?.(true)}
        onPointerLeave={() => onInsertHover?.(false)}
      >
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-blue-300 transition-colors group-hover/divider:bg-blue-400" />
          <AddBlockMenu onAdd={handleAdd} allowedTypes={menuTypes}>
            {(openMenu) => (
              <button
                type="button"
                onClick={openMenu}
                className="flex items-center gap-1 rounded-full border border-blue-500 bg-white px-2.5 py-0.5 text-[11px] font-medium text-blue-600 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-50"
              >
                <Plus className="size-3" />
                Add block
              </button>
            )}
          </AddBlockMenu>
          <div className="h-px flex-1 bg-blue-300 transition-colors group-hover/divider:bg-blue-400" />
        </div>
      </div>
    </>
  )
}

type BesideProps = {
  blockId: string
  pageId?: string
  allowedTypes?: BuilderBlockType[]
  betweenColumns?: boolean
}

function BesideAddPlusButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pointer-events-auto flex size-6 shrink-0 items-center justify-center rounded-full border border-blue-500 bg-white text-blue-600 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-50"
      aria-label="Add block beside"
      title="Add block to the right"
    >
      <Plus className="size-3" />
    </button>
  )
}

export function AddBesideBlockDivider({
  blockId,
  pageId,
  allowedTypes,
  betweenColumns = false,
}: BesideProps) {
  const addBlockBeside = usePromptBuilderStore((s) => s.addBlockBeside)
  const addImageBlockFromFileBeside = usePromptBuilderStore(
    (s) => s.addImageBlockFromFileBeside,
  )
  const template = usePromptBuilderStore((s) => s.template)
  const leftBlock = template
    ? findBlockInTemplate(template, blockId)
    : undefined
  const fileInputRef = useRef<HTMLInputElement>(null)

  const baseTypes = allowedTypes ?? ADDABLE_BLOCKS.map((entry) => entry.type)
  const allowedBesideTypes = leftBlock
    ? filterTypesForBesideAdd(leftBlock, baseTypes)
    : baseTypes

  const handleAdd = (type: BuilderBlockType) => {
    if (type === "custom_image") {
      fileInputRef.current?.click()
      return
    }
    addBlockBeside(blockId, type, pageId)
  }

  const positionClass = betweenColumns
    ? "pointer-events-none absolute inset-y-0 left-1/2 z-10 flex w-6 -translate-x-1/2 items-center justify-center opacity-0 transition-opacity group-hover/row:opacity-100"
    : "pointer-events-none absolute -right-3 inset-y-0 z-10 flex w-6 items-center justify-center opacity-0 transition-opacity group-hover/row:opacity-100"

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
      <div className={positionClass}>
        <div className="group/divider flex h-full flex-col items-center py-1">
          <div className="w-px flex-1 bg-blue-300 transition-colors group-hover/divider:bg-blue-400" />
          <AddBlockMenu
            onAdd={handleAdd}
            align="right"
            allowedTypes={allowedBesideTypes}
          >
            {(toggleMenu) => (
              <BesideAddPlusButton
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMenu(e)
                }}
              />
            )}
          </AddBlockMenu>
          <div className="w-px flex-1 bg-blue-300 transition-colors group-hover/divider:bg-blue-400" />
        </div>
      </div>
    </>
  )
}
