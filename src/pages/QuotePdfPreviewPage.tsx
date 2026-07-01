import { QuotePdfPreviewDocument } from "@/components/templates/QuotePdfPreviewDocument"
import {
  parseCreateQuotePreviewSearch,
  resolveCreateQuotePreviewContext,
} from "@/data/create-quote-form"
import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"

export function QuotePdfPreviewPage() {
  const [searchParams] = useSearchParams()

  const form = useMemo(
    () => parseCreateQuotePreviewSearch(searchParams.toString()),
    [searchParams],
  )

  const context = useMemo(
    () => resolveCreateQuotePreviewContext(form),
    [form],
  )

  return (
    <div className="min-h-screen bg-[#e8eaed]">
      <header className="border-b border-gray-200/80 bg-white px-6 py-3">
        <p className="text-[14px] font-medium text-gray-900">Quote PDF preview</p>
        <p className="mt-0.5 text-[12px] text-gray-500">{context.quoteName}</p>
      </header>

      <main className="px-6 py-8">
        <QuotePdfPreviewDocument
          template={{ name: context.quoteName }}
          context={context}
        />
      </main>
    </div>
  )
}
