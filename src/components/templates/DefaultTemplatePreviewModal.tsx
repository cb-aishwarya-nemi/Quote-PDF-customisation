import { QuotePdfPreviewDocument } from "@/components/templates/QuotePdfPreviewDocument"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import { Copy, Info, X } from "lucide-react"
import { useEffect } from "react"

type Props = {
  record: PublishedBuilderTemplate | null
  onClose: () => void
  onDuplicate?: () => void
}

export function DefaultTemplatePreviewModal({
  record,
  onClose,
  onDuplicate,
}: Props) {
  useEffect(() => {
    if (!record) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [record, onClose])

  if (!record) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#e8eaed]">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200/80 bg-white px-6 py-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium text-gray-900">
            {record.name}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <Copy className="size-3.5" />
              Duplicate to edit
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 justify-center px-6 py-3">
        <div
          className="inline-flex w-fit items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5"
          role="status"
        >
          <Info className="size-3.5 shrink-0 text-blue-600" strokeWidth={2.25} />
          <p className="text-[12px] leading-snug text-blue-900">
            This is the workspace default. Duplicate it to create an editable copy.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-8">
        <QuotePdfPreviewDocument template={{ name: record.name }} />
      </div>
    </div>
  )
}
