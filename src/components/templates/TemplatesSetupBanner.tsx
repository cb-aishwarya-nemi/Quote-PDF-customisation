import { Sparkles, Upload } from "lucide-react"

type Props = {
  onImport: () => void
  onBestMatch: () => void
}

export function TemplatesSetupBanner({ onImport, onBestMatch }: Props) {
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/90 via-white to-white">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Sparkles className="size-5 text-violet-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-gray-900">
              Start with your materials — or skip uploads entirely
            </h2>
            <p className="mt-0.5 max-w-xl text-[12px] leading-relaxed text-gray-600">
              Drop quote PDFs, order forms, and brand assets into one upload area
              to generate layouts. No files? We&apos;ll pick the best match from
              your business profile.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onImport}
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3.5 py-2 text-[12px] font-medium text-white hover:bg-gray-800"
          >
            <Upload className="size-3.5" />
            Import materials
          </button>
          <button
            type="button"
            onClick={onBestMatch}
            className="rounded-md border border-gray-300 bg-white px-3.5 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50"
          >
            Get best-match template
          </button>
        </div>
      </div>
    </div>
  )
}
