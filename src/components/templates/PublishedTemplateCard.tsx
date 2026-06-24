import { BuilderTemplateThumbnail } from "@/components/templates/BuilderTemplateThumbnail"
import { formatTemplateEditedAt } from "@/lib/derive-template-stats"
import { isDefaultPublishedTemplate } from "@/lib/seed-demo-library"
import { describeConditionRulesShort } from "@/lib/segment-conditions"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import type { BlockDisplayCondition } from "@/types/prompt-builder"
import type { TemplateStatus } from "@/types/template"
import { Copy, Ellipsis, Eye, Pencil, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  record: PublishedBuilderTemplate
  highlighted?: boolean
  onOpen: () => void
  onDuplicate: () => void
  onDelete: () => void
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
  onDelete,
}: Props) {
  const status = STATUS_STYLES[record.status]
  const isDefault = isDefaultPublishedTemplate(record)
  const visibilityLabel = describeConditionRulesShort(
    (record.template.displayCondition ?? null) as BlockDisplayCondition,
  )

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [menuOpen])

  const runMenuAction = (action: () => void) => {
    setMenuOpen(false)
    action()
  }

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
      className={`group/card relative flex aspect-[1.586/1] w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-1 hover:border-blue-200/80 hover:shadow-[0_16px_40px_-12px_rgba(37,99,235,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
        highlighted
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-gray-200/90"
      }`}
    >
      <div
        ref={menuRef}
        className="absolute right-3 top-3 z-50"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex size-7 items-center justify-center rounded-md border border-gray-200/80 bg-white/95 text-gray-500 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-800"
          aria-label="Template actions"
          aria-expanded={menuOpen}
        >
          <Ellipsis className="size-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[148px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {isDefault ? (
              <button
                type="button"
                onClick={() => runMenuAction(onOpen)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Eye className="size-3.5 shrink-0" />
                Preview
              </button>
            ) : (
              <button
                type="button"
                onClick={() => runMenuAction(onOpen)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Pencil className="size-3.5 shrink-0" />
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={() => runMenuAction(onDuplicate)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Copy className="size-3.5 shrink-0" />
              Duplicate
            </button>
            <button
              type="button"
              disabled={isDefault}
              onClick={() => runMenuAction(onDelete)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
            >
              <Trash2 className="size-3.5 shrink-0" />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-gray-50">
        <BuilderTemplateThumbnail template={record.template} compact fill />

        <div className="pointer-events-none absolute right-3 top-12 z-10 flex flex-col items-end gap-1">
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200/80 backdrop-blur-sm">
            <span className="font-mono text-[9px] text-gray-500">{`{ }`}</span>{" "}
            {record.variableCount} var{record.variableCount === 1 ? "" : "s"}
          </span>
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-medium text-gray-600 shadow-sm ring-1 ring-gray-200/80 backdrop-blur-sm">
            {visibilityLabel}
          </span>
        </div>
      </div>

      <div className="relative z-0 flex shrink-0 flex-col justify-center gap-1 border-t border-gray-100 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 truncate text-[14px] font-semibold text-gray-900 transition-colors group-hover/card:text-blue-700">
            {record.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1.5">
            {isDefault && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                Default
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </div>
        {isDefault ? (
          <p className="truncate text-[11px] text-gray-500">
            Not editable · Preview only
          </p>
        ) : (
          <p className="truncate text-[11px] text-gray-500">
            Created {formatTemplateEditedAt(record.publishedAt)}
            <span className="mx-2 text-[14px] font-semibold leading-none text-gray-400" aria-hidden>
              ·
            </span>
            {record.quotesSent.toLocaleString()} quote
            {record.quotesSent === 1 ? "" : "s"} sent
          </p>
        )}
      </div>
    </article>
  )
}
