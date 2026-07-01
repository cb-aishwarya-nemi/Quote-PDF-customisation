import { PdfMappingSectionViewer } from "@/components/prompt-builder/PdfMappingSectionViewer"
import { readPdfMappingViewerSession } from "@/lib/pdf-mapping-viewer-session"
import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"

export function PdfMappingViewerPage() {
  const [searchParams] = useSearchParams()
  const sectionId = searchParams.get("section") ?? ""

  const session = useMemo(
    () => (sectionId ? readPdfMappingViewerSession(sectionId) : null),
    [sectionId],
  )

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e8eaed] px-6">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-[14px] font-medium text-gray-900">
            PDF viewer unavailable
          </p>
          <p className="mt-2 text-[13px] text-gray-500">
            Open this page from a PDF thumbnail in the data mapping panel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <PdfMappingSectionViewer
      sectionLabel={session.sectionLabel}
      pdfSource={session.pdfSource}
      mappings={session.mappings}
    />
  )
}
