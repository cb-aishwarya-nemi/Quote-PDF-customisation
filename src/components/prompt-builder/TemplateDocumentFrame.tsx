import { CANVAS_DOCUMENT_MAX_WIDTH } from "@/lib/canvas-constants"
import type { MouseEvent, ReactNode, Ref } from "react"

type Props = {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  exportRef?: Ref<HTMLDivElement>
}

/** White quote document shell — uniform padding on all four sides. */
export function TemplateDocumentFrame({ children, onClick, exportRef }: Props) {
  return (
    <div
      ref={exportRef}
      className="mx-auto w-full rounded-xl bg-white p-6 shadow-md ring-1 ring-black/5"
      style={{ maxWidth: CANVAS_DOCUMENT_MAX_WIDTH }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
