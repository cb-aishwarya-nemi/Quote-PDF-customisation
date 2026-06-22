import { BuilderTemplateThumbnail } from "@/components/templates/BuilderTemplateThumbnail"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import { Copy } from "lucide-react"

type Props = {
  templates: PublishedBuilderTemplate[]
  onDuplicate: (templateId: string) => void
  embedded?: boolean
}

export function DuplicateTemplatePicker({
  templates,
  onDuplicate,
  embedded = false,
}: Props) {
  if (templates.length === 0) {
    return (
      <p className="py-8 text-center text-[13px] text-gray-500">
        No templates to duplicate yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {!embedded && (
        <div>
          <h3 className="text-[13px] font-semibold text-gray-900">
            Duplicate existing
          </h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Start from a template you already have and customize from there.
          </p>
        </div>
      )}

      {embedded && (
        <p className="text-[12px] text-gray-500">
          Pick a template to copy as your starting point.
        </p>
      )}

      <ul
        className={`space-y-2 overflow-y-auto pr-0.5 ${embedded ? "max-h-[360px]" : "max-h-[220px]"}`}
      >
        {templates.map((record) => (
          <li key={record.id}>
            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-2.5 transition-colors hover:border-gray-300">
              <div className="h-12 w-[72px] shrink-0 overflow-hidden rounded-md border border-gray-100">
                <BuilderTemplateThumbnail
                  template={record.template}
                  compact
                  fill
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-gray-900">
                  {record.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] capitalize text-gray-500">
                  {record.status}
                  <span className="mx-1 text-gray-300">·</span>
                  {record.ownerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDuplicate(record.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Copy className="size-3.5" />
                Duplicate
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
