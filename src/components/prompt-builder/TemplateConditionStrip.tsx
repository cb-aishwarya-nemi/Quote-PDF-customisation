import { ConditionBuilderPanel } from "@/components/prompt-builder/ConditionBuilderPanel"
import { useIsTemplateEditMode } from "@/hooks/use-builder-editor-mode"
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

const PLACEHOLDER_MESSAGE =
  "Set the conditions that determine when this quote pdf will be used"

const HIGHLIGHT_MESSAGE =
  "Define quote-level conditions before publishing — more than one template exists"

const STRIP_WIDTH_CLASS = "w-full"

function describeStripMessage(
  displayCondition: BlockDisplayCondition,
  canEdit: boolean,
  highlighted: boolean,
): string {
  if (!hasConditions(displayCondition)) {
    if (highlighted) return HIGHLIGHT_MESSAGE
    return canEdit ? PLACEHOLDER_MESSAGE : "Used for all quotes"
  }

  const { match, rules } = parseConditionInput(displayCondition)
  if (rules.length === 1) {
    return `Used when ${describeConditionRule(rules[0])}`
  }
  const join = match === "or" ? " OR " : " AND "
  return `Used when ${rules.map(describeConditionRule).join(join)}`
}

export function TemplateConditionStrip({
  variant = "inline",
}: {
  variant?: "inline" | "floating"
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
  const isTemplateEdit = useIsTemplateEditMode()
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const stripRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayCondition = (template?.displayCondition ??
    null) as BlockDisplayCondition
  const hasCondition = hasConditions(displayCondition)
  const showStrip = hasMultipleTemplatesInLibrary(publishedTemplates)
  const message = describeStripMessage(
    displayCondition,
    isTemplateEdit,
    highlighted && !hasCondition,
  )

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
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
    })
  }, [])

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
    isTemplateEdit &&
    createPortal(
      <ConditionBuilderPanel
        ref={menuRef}
        className="fixed z-[200]"
        style={{ top: menuPos.top, left: menuPos.left }}
        title="Use this template"
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

  return (
    <>
      <div
        ref={stripRef}
        className={`${STRIP_WIDTH_CLASS} overflow-hidden rounded-lg border border-amber-200/90 bg-amber-50 transition-[box-shadow,ring-color] duration-300 ${
          highlighted && !hasCondition
            ? "ring-2 ring-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.25)]"
            : ""
        } ${variant === "floating" ? "shadow-sm" : ""}`}
        onClick={(event) => event.stopPropagation()}
      >
        {isTemplateEdit ? (
          <button
            type="button"
            onClick={() => {
              clearConditionStripHighlight()
              setOpen((value) => !value)
            }}
            className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-amber-100/60"
            aria-expanded={open}
            aria-label="Quote-level conditions"
            title={message}
          >
            <Filter
              className={`size-3.5 shrink-0 ${hasCondition ? "text-amber-800" : "text-amber-700/80"}`}
              strokeWidth={2}
            />
            <p
              className={`min-w-0 truncate text-[11px] leading-snug ${
                hasCondition || highlighted
                  ? "font-medium text-amber-950"
                  : "text-amber-900/90"
              }`}
            >
              {message}
            </p>
          </button>
        ) : (
          <div
            className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5"
            title={message}
          >
            <Filter
              className={`size-3.5 shrink-0 ${hasCondition ? "text-amber-800" : "text-amber-700/80"}`}
              strokeWidth={2}
            />
            <p
              className={`min-w-0 truncate text-[11px] leading-snug ${
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
