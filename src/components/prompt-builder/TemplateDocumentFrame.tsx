import { DocumentFooter } from "@/components/prompt-builder/DocumentFooter"
import {
  CANVAS_DOCUMENT_MAX_WIDTH,
  CANVAS_DOCUMENT_PADDING_PX,
} from "@/lib/canvas-constants"
import type { MouseEvent, ReactNode, Ref } from "react"

type Props = {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  exportRef?: Ref<HTMLDivElement>
  className?: string
  pageId?: string
  showFooter?: boolean
}

/** White quote document shell — uniform padding on all four sides. */
export function TemplateDocumentFrame({
  children,
  onClick,
  exportRef,
  className,
  pageId,
  showFooter = true,
}: Props) {
  return (
    <div
      ref={exportRef}
      className={`mx-auto flex w-full flex-col rounded-xl bg-white shadow-md ring-1 ring-black/5 [container-type:inline-size] ${className ?? ""}`}
      style={{
        maxWidth: CANVAS_DOCUMENT_MAX_WIDTH,
        padding: CANVAS_DOCUMENT_PADDING_PX,
        ["--canvas-doc-padding" as string]: `${CANVAS_DOCUMENT_PADDING_PX}px`,
      }}
      onClick={onClick}
    >
      <div className="min-h-0 flex-1">{children}</div>
      {showFooter && pageId ? <DocumentFooter pageId={pageId} /> : null}
    </div>
  )
}
