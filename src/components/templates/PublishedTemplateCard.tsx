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
      className={`group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200/80 hover:shadow-[0_12px_32px_-14px_rgba(37,99,235,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
        highlighted
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-gray-200/90"
      }`}
    >
      <div className="relative aspect-[4/3] shrink-0">
        <BuilderTemplateThumbnail template={record.template} compact />

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200/80 backdrop-blur-sm">
            {record.variableCount} var{record.variableCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200/80 backdrop-blur-sm">
            {record.conditionCount} condition
            {record.conditionCount === 1 ? "" : "s"}
          </span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-2.5 bg-gray-900/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onOpen()
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-800 shadow-sm transition hover:bg-gray-50"
          >
            <Copy className="size-3.5" />
            Duplicate
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 truncate text-[15px] font-semibold text-gray-900 group-hover:text-blue-700">
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
