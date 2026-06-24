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
  pageNumber?: number
}

/** White quote document shell — uniform padding on all four sides. */
export function TemplateDocumentFrame({
  children,
  onClick,
  exportRef,
  className,
  pageNumber,
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
      {pageNumber !== undefined && (
        <footer
          className="mt-8 flex shrink-0 justify-center border-t border-gray-100 pt-3"
          aria-label={`Page ${pageNumber}`}
        >
          <span className="text-[11px] font-medium tabular-nums text-gray-400">
            {pageNumber}
          </span>
        </footer>
      )}
    </div>
  )
}
