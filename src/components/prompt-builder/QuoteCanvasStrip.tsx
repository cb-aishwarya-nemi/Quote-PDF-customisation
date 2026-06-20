import { PreviewExportActions } from "@/components/prompt-builder/PreviewExportActions"
import { PreviewScenarioPicker } from "@/components/prompt-builder/PreviewScenarioPicker"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { Eye, Pencil } from "lucide-react"
import type { Ref, RefObject } from "react"

type ActionsProps = {
  documentRef: RefObject<HTMLDivElement | null>
  variant?: "inline" | "floating"
  className?: string
}

export function CanvasDocumentActions({
  documentRef,
  variant = "inline",
  className,
}: ActionsProps) {
  const editorMode = usePromptBuilderStore((s) => s.editorMode)
  const openPreview = usePromptBuilderStore((s) => s.openPreview)
  const closePreview = usePromptBuilderStore((s) => s.closePreview)
  const isPreview = editorMode === "preview"

  const actionBtnClass =
    variant === "floating"
      ? "flex shrink-0 items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      : "flex shrink-0 items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"

  return (
    <div
      className={`flex shrink-0 items-center ${variant === "floating" ? "gap-2" : "gap-3"} ${className ?? ""}`}
    >
      <PreviewExportActions documentRef={documentRef} variant={variant} />
      {isPreview ? (
        <button
          type="button"
          onClick={closePreview}
          className={actionBtnClass}
        >
          <Pencil className="size-3.5" />
          Back to edit
        </button>
      ) : (
        <button
          type="button"
          onClick={openPreview}
          className={actionBtnClass}
        >
          <Eye className="size-3.5" />
          Preview
        </button>
      )}
    </div>
  )
}

type ToolbarRowProps = {
  documentRef: RefObject<HTMLDivElement | null>
  variant?: "inline" | "floating"
  className?: string
}

export function CanvasToolbarRow({
  documentRef,
  variant = "inline",
  className,
}: ToolbarRowProps) {
  const editorMode = usePromptBuilderStore((s) => s.editorMode)
  const isPreview = editorMode === "preview"
  const isFloating = variant === "floating"

  return (
    <div
      className={`flex w-full items-center gap-x-3 ${
        isFloating ? "flex-nowrap justify-between" : "flex-wrap gap-y-2"
      } ${className ?? ""}`}
    >
      {isPreview && (
        <PreviewScenarioPicker variant={variant} className="min-w-0 shrink-0" />
      )}
      {!isFloating && <div className="min-w-0 flex-1" />}
      <CanvasDocumentActions
        documentRef={documentRef}
        variant={variant}
        className="shrink-0"
      />
    </div>
  )
}

type InlineToolbarProps = {
  documentRef: RefObject<HTMLDivElement | null>
  anchorRef?: Ref<HTMLDivElement>
}

export function CanvasInlineToolbar({ documentRef, anchorRef }: InlineToolbarProps) {
  return (
    <div ref={anchorRef} className="mb-4">
      <CanvasToolbarRow documentRef={documentRef} />
    </div>
  )
}
