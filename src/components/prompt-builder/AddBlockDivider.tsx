import { AddBlockMenu } from "@/components/prompt-builder/AddBlockMenu"
import { ADDABLE_BLOCKS } from "@/lib/block-variants"
import { canBlocksFormPair } from "@/lib/block-layout-rules"
import { findBlockInTemplate, getBlocksForPage, findBlockPageId } from "@/lib/page-blocks"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { IMAGE_BLOCK_ACCEPT } from "@/types/image-block"
import type { BuilderBlock, BuilderBlockType } from "@/types/prompt-builder"
import { Plus } from "lucide-react"
import { useRef, useState, type ReactNode } from "react"

function edgePositionClass(side: "left" | "right") {
  return side === "left"
    ? "left-0 -translate-x-1/2"
    : "right-0 translate-x-1/2"
}

function edgeVisibilityClass(visible?: boolean) {
  if (visible) {
    return "opacity-100"
  }
  return "opacity-0 group-hover/row:opacity-100"
}

function EdgeAddShell({
  side,
  visible,
  onInsertHover,
  children,
}: {
  side: "left" | "right"
  visible?: boolean
  onInsertHover?: (active: boolean) => void
  children: ReactNode
}) {
  return (
    <div
      className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 transition-opacity duration-150 ${edgePositionClass(side)} ${edgeVisibilityClass(visible)}`}
      onPointerEnter={() => onInsertHover?.(true)}
      onPointerLeave={() => onInsertHover?.(false)}
    >
      <div className="pointer-events-auto">{children}</div>
    </div>
  )
}

function BesideAddPlusButton({
  onClick,
  side,
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  side: "left" | "right"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-blue-500 bg-white text-blue-600 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-50"
      aria-label={
        side === "left" ? "Add block to the left" : "Add block to the right"
      }
      title={side === "left" ? "Add block to the left" : "Add block to the right"}
    >
      <Plus className="size-3" />
    </button>
  )
}

function canPairBeside(
  side: "left" | "right",
  anchor: BuilderBlock,
  type: BuilderBlockType,
): boolean {
  if (side === "right") {
    return canBlocksFormPair(anchor, type)
  }

  const leftStub = {
    type,
    content: { layoutColumn: "left" },
  } as unknown as BuilderBlock
  return canBlocksFormPair(leftStub, anchor.type)
}

type BesideProps = {
  blockId: string
  pageId?: string
  allowedTypes?: BuilderBlockType[]
  side?: "left" | "right"
}

export function AddBesideBlockDivider({
  blockId,
  pageId,
  allowedTypes,
  side = "right",
}: BesideProps) {
  const addBlock = usePromptBuilderStore((s) => s.addBlock)
  const addBlockBeside = usePromptBuilderStore((s) => s.addBlockBeside)
  const addBlockBesideLeft = usePromptBuilderStore((s) => s.addBlockBesideLeft)
  const addImageBlockFromFile = usePromptBuilderStore((s) => s.addImageBlockFromFile)
  const addImageBlockFromFileBeside = usePromptBuilderStore(
    (s) => s.addImageBlockFromFileBeside,
  )
  const addImageBlockFromFileBesideLeft = usePromptBuilderStore(
    (s) => s.addImageBlockFromFileBesideLeft,
  )
  const template = usePromptBuilderStore((s) => s.template)
  const anchorBlock = template
    ? findBlockInTemplate(template, blockId)
    : undefined
  const fileInputRef = useRef<HTMLInputElement>(null)
  const insertBesideRef = useRef(true)
  const [fileAccept, setFileAccept] = useState(IMAGE_BLOCK_ACCEPT)

  const menuTypes = allowedTypes ?? ADDABLE_BLOCKS.map((entry) => entry.type)

  const handleAdd = (
    type: BuilderBlockType,
    options?: { fileAccept?: string },
  ) => {
    const canPair = anchorBlock
      ? canPairBeside(side, anchorBlock, type)
      : false

    if (type === "custom_image") {
      insertBesideRef.current = canPair
      setFileAccept(options?.fileAccept ?? IMAGE_BLOCK_ACCEPT)
      requestAnimationFrame(() => fileInputRef.current?.click())
      return
    }

    if (canPair) {
      if (side === "left") {
        addBlockBesideLeft(blockId, type, pageId)
      } else {
        addBlockBeside(blockId, type, pageId)
      }
      return
    }

    if (side === "left" && template) {
      const targetPageId =
        pageId ??
        findBlockPageId(template, blockId) ??
        usePromptBuilderStore.getState().activePageId
      const pageBlocks = getBlocksForPage(template, targetPageId)
      const index = pageBlocks.findIndex((block) => block.id === blockId)
      const insertAfter = index > 0 ? pageBlocks[index - 1]?.id : "__start__"
      addBlock(type, insertAfter, pageId)
      return
    }

    addBlock(type, blockId, pageId)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={fileAccept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (!file) return
          if (!insertBesideRef.current) {
            addImageBlockFromFile(file, blockId, pageId)
            return
          }
          if (side === "left") {
            addImageBlockFromFileBesideLeft(file, blockId)
          } else {
            addImageBlockFromFileBeside(file, blockId)
          }
        }}
      />
      <EdgeAddShell side={side}>
        <AddBlockMenu
          onAdd={handleAdd}
          align={side === "left" ? "left" : "right"}
          allowedTypes={menuTypes}
        >
          {(toggleMenu) => (
            <BesideAddPlusButton
              side={side}
              onClick={(e) => {
                e.stopPropagation()
                toggleMenu(e)
              }}
            />
          )}
        </AddBlockMenu>
      </EdgeAddShell>
    </>
  )
}

type RowInsertProps = {
  side: "left" | "right"
  afterId?: string
  atStart?: boolean
  visible?: boolean
  onInsertHover?: (active: boolean) => void
  pageId?: string
  allowedTypes?: BuilderBlockType[]
}

export function BlockEdgeRowInsert({
  side,
  afterId,
  atStart,
  visible = false,
  onInsertHover,
  pageId,
  allowedTypes,
}: RowInsertProps) {
  const addBlock = usePromptBuilderStore((s) => s.addBlock)
  const addImageBlockFromFile = usePromptBuilderStore((s) => s.addImageBlockFromFile)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingInsertRef = useRef<string | undefined>(undefined)
  const [fileAccept, setFileAccept] = useState(IMAGE_BLOCK_ACCEPT)

  const menuTypes =
    allowedTypes ?? ADDABLE_BLOCKS.map((entry) => entry.type)

  const handleAdd = (
    type: BuilderBlockType,
    options?: { fileAccept?: string },
  ) => {
    if (type === "custom_image") {
      pendingInsertRef.current = atStart ? "__start__" : afterId
      setFileAccept(options?.fileAccept ?? IMAGE_BLOCK_ACCEPT)
      requestAnimationFrame(() => fileInputRef.current?.click())
      return
    }
    addBlock(type, atStart ? "__start__" : afterId, pageId)
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={fileAccept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          const insertAfter = pendingInsertRef.current
          pendingInsertRef.current = undefined
          if (file) addImageBlockFromFile(file, insertAfter, pageId)
        }}
      />
      <EdgeAddShell
        side={side}
        visible={visible}
        onInsertHover={onInsertHover}
      >
        <AddBlockMenu
          onAdd={handleAdd}
          align={side === "left" ? "left" : "right"}
          allowedTypes={menuTypes}
        >
          {(openMenu) => (
            <BesideAddPlusButton
              side={side}
              onClick={(e) => {
                e.stopPropagation()
                openMenu(e)
              }}
            />
          )}
        </AddBlockMenu>
      </EdgeAddShell>
    </>
  )
}
