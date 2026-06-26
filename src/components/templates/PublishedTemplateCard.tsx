import {
  formatTemplateCardConditionsLabel,
  formatTemplateRoutingConditionsSummary,
} from "@/lib/derive-template-library-meta"
import { formatTemplateEditedAt } from "@/lib/derive-template-stats"
import { isDefaultPublishedTemplate } from "@/lib/seed-demo-library"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import type { TemplateStatus } from "@/types/template"
import { Copy, Ellipsis, Eye, Pencil, Trash2 } from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

type Props = {
  record: PublishedBuilderTemplate
  highlighted?: boolean
  hasConditionalTemplates?: boolean
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
  hasConditionalTemplates = false,
  onOpen,
  onDuplicate,
  onDelete,
}: Props) {
  const status = STATUS_STYLES[record.status]
  const isDefault = isDefaultPublishedTemplate(record)
  const conditionsLabel = formatTemplateCardConditionsLabel(
    record,
    hasConditionalTemplates,
  )
  const conditionsSummary = formatTemplateRoutingConditionsSummary(
    record,
    hasConditionalTemplates,
  )

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const rowRef = useRef<HTMLElement>(null)

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.right,
    })
  }, [])

  useLayoutEffect(() => {
    if (!menuOpen) return
    updateMenuPosition()
  }, [menuOpen, updateMenuPosition])

  useEffect(() => {
    if (!menuOpen) return
    const onScrollOrResize = () => updateMenuPosition()
    window.addEventListener("resize", onScrollOrResize)
    window.addEventListener("scroll", onScrollOrResize, true)
    return () => {
      window.removeEventListener("resize", onScrollOrResize)
      window.removeEventListener("scroll", onScrollOrResize, true)
    }
  }, [menuOpen, updateMenuPosition])

  useEffect(() => {
    if (!highlighted) return
    const frame = window.requestAnimationFrame(() => {
      rowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [highlighted])

  useEffect(() => {
    if (!menuOpen) return
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return
      }
      setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [menuOpen])

  const runMenuAction = (action: () => void) => {
    setMenuOpen(false)
    action()
  }

  const menu =
    menuOpen &&
    createPortal(
      <div
        ref={menuRef}
        className="fixed z-[200] min-w-[148px] -translate-x-full overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        style={{ top: menuPos.top, left: menuPos.left }}
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
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
      </div>,
      document.body,
    )

  return (
    <article
      ref={rowRef}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen()
        }
      }}
      className={`group/row relative flex w-full min-w-0 cursor-pointer gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-500 ${
        highlighted ? "animate-template-highlight bg-blue-50/40" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-[14px] font-semibold text-gray-900 transition-colors group-hover/row:text-blue-700">
                {record.name}
              </h3>
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

            {isDefault ? (
              <p className="mt-1 text-[11px] text-gray-500">
                Not editable · Preview only
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-500">
                Created {formatTemplateEditedAt(record.publishedAt)}
                <span
                  className="mx-2 text-[14px] font-semibold leading-none text-gray-400"
                  aria-hidden
                >
                  ·
                </span>
                {record.quotesSent.toLocaleString()} quote
                {record.quotesSent === 1 ? "" : "s"} sent
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200/80 sm:inline-flex sm:items-center sm:gap-1">
              <span className="font-mono text-[9px] text-gray-500">{`{ }`}</span>
              {record.variableCount} var{record.variableCount === 1 ? "" : "s"}
            </span>
            {conditionsLabel && (
              <span className="hidden rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200/80 sm:inline-flex">
                {conditionsLabel}
              </span>
            )}
          </div>
        </div>

        <p className="text-[12px] leading-relaxed text-gray-600">
          {conditionsSummary}
        </p>

        <div className="flex flex-wrap items-center gap-2 sm:hidden">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200/80">
            <span className="font-mono text-[9px] text-gray-500">{`{ }`}</span>
            {record.variableCount} var{record.variableCount === 1 ? "" : "s"}
          </span>
          {conditionsLabel && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600 ring-1 ring-gray-200/80">
              {conditionsLabel}
            </span>
          )}
        </div>
      </div>

      <div
        className="relative shrink-0 self-start"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200/80 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-800"
          aria-label="Template actions"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
        >
          <Ellipsis className="size-4" />
        </button>
      </div>
      {menu}
    </article>
  )
}
