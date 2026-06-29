import { ConditionBuilderPanel } from "@/components/prompt-builder/ConditionBuilderPanel"
import {
  describeConditionRule,
  hasConditions,
  parseConditionInput,
} from "@/lib/segment-conditions"
import { hasMultipleTemplatesInLibrary } from "@/lib/template-routing"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { useTemplateLibraryStore } from "@/store/template-library-store"
import type { BlockDisplayCondition } from "@/types/prompt-builder"
import { Filter } from "lucide-react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

const PANEL_WIDTH_PX = 440

export const TEMPLATE_CONDITION_MENU_TITLE =
  "Set the conditions that determine when this quote pdf will be used"

const HIGHLIGHT_MESSAGE =
  "Define quote-level conditions before publishing — more than one template exists"

function describeStripMessage(
  displayCondition: BlockDisplayCondition,
  canEdit: boolean,
  highlighted: boolean,
): string {
  if (!hasConditions(displayCondition)) {
    if (highlighted) return HIGHLIGHT_MESSAGE
    return canEdit ? TEMPLATE_CONDITION_MENU_TITLE : "Used for all quotes"
  }

  const { match, rules } = parseConditionInput(displayCondition)
  if (rules.length === 1) {
    return `Used when ${describeConditionRule(rules[0])}`
  }
  const join = match === "or" ? " OR " : " AND "
  return `Used when ${rules.map(describeConditionRule).join(join)}`
}

function menuTitle(highlighted: boolean, hasCondition: boolean): string {
  if (highlighted && !hasCondition) return HIGHLIGHT_MESSAGE
  return TEMPLATE_CONDITION_MENU_TITLE
}

export function TemplateConditionStrip({
  variant = "inline",
}: {
  variant?: "inline" | "floating" | "icon"
}) {
  const template = usePromptBuilderStore((s) => s.template)
  const editorMode = usePromptBuilderStore((s) => s.editorMode)
  const highlighted = usePromptBuilderStore((s) => s.conditionStripHighlighted)
  const clearConditionStripHighlight = usePromptBuilderStore(
    (s) => s.clearConditionStripHighlight,
  )
  const publishedTemplates = useTemplateLibraryStore((s) => s.publishedTemplates)
  const ensureInitialized = useTemplateLibraryStore((s) => s.ensureInitialized)
  const setTemplateDisplayCondition = usePromptBuilderStore(
    (s) => s.setTemplateDisplayCondition,
  )
  const isTemplateEdit = editorMode === "edit"
  const isPreview = editorMode === "preview"
  const showEditChrome = isTemplateEdit || isPreview
  const isIcon = variant === "icon"
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const stripRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayCondition = (template?.displayCondition ??
    null) as BlockDisplayCondition
  const hasCondition = hasConditions(displayCondition)
  const conditionCount = parseConditionInput(displayCondition).rules.length
  const showStrip = hasMultipleTemplatesInLibrary(publishedTemplates)
  const message = describeStripMessage(
    displayCondition,
    showEditChrome,
    highlighted && !hasCondition,
  )

  useEffect(() => {
    if (editorMode !== "edit") setOpen(false)
  }, [editorMode])

  useEffect(() => {
    ensureInitialized()
  }, [ensureInitialized])

  useEffect(() => {
    if (!highlighted) return
    stripRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    if (isTemplateEdit) setOpen(true)
  }, [highlighted, isTemplateEdit])

  const updatePosition = useCallback(() => {
    const strip = stripRef.current
    if (!strip) return
    const rect = strip.getBoundingClientRect()
    const left = isIcon
      ? Math.max(8, rect.right - PANEL_WIDTH_PX)
      : rect.left
    setMenuPos({
      top: rect.bottom + 4,
      left,
    })
  }, [isIcon])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => updatePosition()
    window.addEventListener("resize", onScrollOrResize)
    window.addEventListener("scroll", onScrollOrResize, true)
    return () => {
      window.removeEventListener("resize", onScrollOrResize)
      window.removeEventListener("scroll", onScrollOrResize, true)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        stripRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  if (!template || editorMode === "sales" || !showStrip) {
    return null
  }

  const menu =
    open &&
    editorMode === "edit" &&
    createPortal(
      <ConditionBuilderPanel
        ref={menuRef}
        className="fixed z-[200]"
        style={{ top: menuPos.top, left: menuPos.left }}
        title={menuTitle(highlighted && !hasCondition, hasCondition)}
        titleTone="description"
        rules={displayCondition}
        onChange={(condition) => {
          setTemplateDisplayCondition(condition)
          if (hasConditions(condition)) {
            clearConditionStripHighlight()
          }
        }}
      />,
      document.body,
    )

  if (isIcon) {
    const iconBtnClass = [
      "relative inline-flex size-7 shrink-0 items-center justify-center rounded-md border bg-white transition-colors",
      hasCondition
        ? "border-amber-200 text-amber-700 hover:bg-amber-50"
        : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800",
      highlighted && !hasCondition
        ? "ring-2 ring-amber-400 ring-offset-1"
        : "",
    ].join(" ")

    const conditionBadge =
      conditionCount > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 py-px text-[9px] font-bold leading-none text-white ring-2 ring-white">
          {conditionCount}
        </span>
      ) : null

    const conditionAriaLabel =
      conditionCount > 0
        ? `Quote-level conditions, ${conditionCount} rule${conditionCount === 1 ? "" : "s"}`
        : "Quote-level conditions"

    return (
      <>
        <div ref={stripRef} onClick={(event) => event.stopPropagation()}>
          {isTemplateEdit ? (
            <button
              type="button"
              onClick={() => {
                clearConditionStripHighlight()
                setOpen((value) => !value)
              }}
              className={iconBtnClass}
              aria-expanded={open}
              aria-label={conditionAriaLabel}
              title={message}
            >
              <Filter className="size-3.5" strokeWidth={2} />
              {conditionBadge}
            </button>
          ) : (
            <span
              className={`${iconBtnClass} pointer-events-none`}
              title={message}
              aria-label={conditionAriaLabel}
            >
              <Filter className="size-3.5" strokeWidth={2} />
              {conditionBadge}
            </span>
          )}
        </div>
        {menu}
      </>
    )
  }

  return (
    <>
      <div
        ref={stripRef}
        className={`w-fit max-w-full shrink-0 overflow-hidden rounded-lg border border-amber-200/90 bg-amber-50 transition-[box-shadow,ring-color] duration-300 ${
          highlighted && !hasCondition
            ? "ring-2 ring-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]"
            : ""
        } ${variant === "floating" ? "shadow-sm" : ""} ${isPreview ? "pointer-events-none" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        {isTemplateEdit ? (
          <button
            type="button"
            onClick={() => {
              clearConditionStripHighlight()
              setOpen((value) => !value)
            }}
            className="inline-flex max-w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-amber-100/60"
            aria-expanded={open}
            aria-label="Quote-level conditions"
            title={message}
          >
            <Filter
              className={`size-3.5 shrink-0 ${hasCondition ? "text-amber-800" : "text-amber-700/80"}`}
              strokeWidth={2}
            />
            <p
              className={`text-[11px] leading-snug ${
                hasCondition || highlighted
                  ? "font-medium text-amber-950"
                  : "text-amber-900/90"
              }`}
            >
              {message}
            </p>
          </button>
        ) : showEditChrome ? (
          <div
            className="inline-flex max-w-full items-center gap-2 px-3 py-1.5"
            title={message}
            aria-label="Quote-level conditions"
          >
            <Filter
              className={`size-3.5 shrink-0 ${hasCondition ? "text-amber-800" : "text-amber-700/80"}`}
              strokeWidth={2}
            />
            <p
              className={`text-[11px] leading-snug ${
                hasCondition || highlighted
                  ? "font-medium text-amber-950"
                  : "text-amber-900/90"
              }`}
            >
              {message}
            </p>
          </div>
        ) : (
          <div
            className="inline-flex max-w-full items-center gap-2 px-3 py-1.5"
            title={message}
          >
            <Filter
              className={`size-3.5 shrink-0 ${hasCondition ? "text-amber-800" : "text-amber-700/80"}`}
              strokeWidth={2}
            />
            <p
              className={`text-[11px] leading-snug ${
                hasCondition || highlighted
                  ? "font-medium text-amber-950"
                  : "text-amber-900/90"
              }`}
            >
              {message}
            </p>
          </div>
        )}
      </div>
      {menu}
    </>
  )
}
