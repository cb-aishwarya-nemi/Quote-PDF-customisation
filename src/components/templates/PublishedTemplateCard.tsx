import { BuilderTemplateThumbnail } from "@/components/templates/BuilderTemplateThumbnail"
import { formatTemplateEditedAt } from "@/lib/derive-template-stats"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import type { TemplateStatus } from "@/types/template"
import { Copy, Pencil } from "lucide-react"

type Props = {
  record: PublishedBuilderTemplate
  highlighted?: boolean
  onOpen: () => void
  onDuplicate: () => void
}

const STATUS_STYLES: Record<
  TemplateStatus,
  { label: string; className: string }
> = {
  published: {
    label: "Published",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600 ring-gray-200",
  },
  archived: {
    label: "Archived",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
}

export function PublishedTemplateCard({
  record,
  highlighted,
  onOpen,
  onDuplicate,
}: Props) {
  const status = STATUS_STYLES[record.status]

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
      className={`group/card flex aspect-[1.586/1] w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-blue-200/80 hover:shadow-[0_16px_40px_-12px_rgba(37,99,235,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
        highlighted
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-gray-200/90"
      }`}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-gray-50">
        <BuilderTemplateThumbnail template={record.template} compact fill />

        <div className="pointer-events-none absolute right-3 top-3 z-10 flex flex-wrap justify-end gap-1.5">
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200/80 backdrop-blur-sm">
            {record.variableCount} var{record.variableCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200/80 backdrop-blur-sm">
            {record.conditionCount} condition
            {record.conditionCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2.5 opacity-0 transition-opacity duration-150 group-hover/card:pointer-events-auto group-hover/card:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onOpen()
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-800 shadow-md hover:bg-gray-50"
          >
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDuplicate()
            }}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-800 shadow-md hover:bg-gray-50"
          >
            <Copy className="size-3.5" />
            Duplicate
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-col justify-center gap-1 border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-[14px] font-semibold text-gray-900 transition-colors group-hover/card:text-blue-700">
            {record.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <p className="truncate text-[11px] text-gray-500">
          Edited {formatTemplateEditedAt(record.updatedAt)}
          <span className="mx-1.5 text-gray-300">·</span>
          {record.quotesSent.toLocaleString()} quote
          {record.quotesSent === 1 ? "" : "s"} sent
        </p>
      </div>
    </article>
  )
}
