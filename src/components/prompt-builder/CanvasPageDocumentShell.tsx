import { PreviewScenarioStrip } from "@/components/prompt-builder/PreviewScenarioStrip"
import { TemplateDocumentFrame } from "@/components/prompt-builder/TemplateDocumentFrame"
import { CANVAS_DOCUMENT_MAX_WIDTH } from "@/lib/canvas-constants"
import type { MouseEvent, ReactNode, Ref } from "react"

type Props = {
  children: ReactNode
  pageId?: string
  exportRef?: Ref<HTMLDivElement>
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  showFooter?: boolean
  showPreviewScenarioStrip?: boolean
}

export function CanvasPageDocumentShell({
  children,
  pageId,
  exportRef,
  onClick,
  showFooter = true,
  showPreviewScenarioStrip = false,
}: Props) {
  return (
    <div className="mx-auto w-full" style={{ maxWidth: CANVAS_DOCUMENT_MAX_WIDTH }}>
      {showPreviewScenarioStrip && <PreviewScenarioStrip />}
      <TemplateDocumentFrame
        exportRef={exportRef}
        onClick={onClick}
        pageId={pageId}
        showFooter={showFooter}
        className={showPreviewScenarioStrip ? "rounded-t-none" : undefined}
      >
        {children}
      </TemplateDocumentFrame>
    </div>
  )
}
