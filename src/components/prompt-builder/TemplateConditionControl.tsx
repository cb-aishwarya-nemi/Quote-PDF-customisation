import { ConditionBuilderPanel } from "@/components/prompt-builder/ConditionBuilderPanel"
import { useIsTemplateEditMode } from "@/hooks/use-builder-editor-mode"
import {
  describeConditionRules,
  describeConditionRulesShort,
  hasConditions,
  normalizeConditionRules,
} from "@/lib/segment-conditions"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BlockDisplayCondition } from "@/types/prompt-builder"
import { Filter } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type Props = {
  variant?: "inline" | "floating"
}

function conditionBtnClass(
  variant: "inline" | "floating",
  hasCondition: boolean,
  open?: boolean,
) {
  const base =
    variant === "floating"
      ? "inline-flex shrink-0 items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-medium shadow-sm transition-colors"
      : "inline-flex shrink-0 items-center gap-1.5 rounded border px-2.5 py-1 text-[11px] font-medium transition-colors"

  if (hasCondition) {
    return `${base} border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/80${
      open ? " ring-2 ring-amber-200/80" : ""
    }`
  }

  return `${base} border-gray-300 bg-white text-gray-700 hover:bg-gray-50${
    open ? " ring-2 ring-blue-200/80" : ""
  }`
}

const tooltipClass =
  "pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max max-w-[260px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium leading-snug text-slate-700 shadow-md group-hover/condition:block"

export function TemplateConditionControl({ variant = "inline" }: Props) {
  const template = usePromptBuilderStore((s) => s.template)
  const setTemplateDisplayCondition = usePromptBuilderStore(
    (s) => s.setTemplateDisplayCondition,
  )
  const isTemplateEdit = useIsTemplateEditMode()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const displayCondition = (template?.displayCondition ??
    null) as BlockDisplayCondition
  const hasCondition = hasConditions(displayCondition)
  const label = describeConditionRulesShort(displayCondition)
  const tooltip = hasCondition
    ? describeConditionRules(displayCondition)
    : "Set when this template applies to a quote"

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  if (!template) return null

  const content = (
    <>
      <Filter className="size-3.5 shrink-0" strokeWidth={2} />
      <span className="max-w-[160px] truncate">{label}</span>
    </>
  )

  if (!isTemplateEdit) {
    return (
      <span
        className={`group/condition relative ${conditionBtnClass(variant, hasCondition)}`}
      >
        {content}
        <span role="tooltip" className={tooltipClass}>
          {tooltip}
        </span>
      </span>
    )
  }

  return (
    <div ref={rootRef} className="group/condition relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={conditionBtnClass(variant, hasCondition, open)}
        aria-expanded={open}
        aria-label="Quote-level conditions"
      >
        {content}
      </button>
      {!open && (
        <span role="tooltip" className={tooltipClass}>
          {tooltip}
        </span>
      )}

      {open && (
        <div className="absolute right-0 top-full z-40 mt-1.5">
          <ConditionBuilderPanel
            title="Use this template when"
            rules={normalizeConditionRules(displayCondition)}
            onChange={(rules) => {
              setTemplateDisplayCondition(rules)
            }}
          />
        </div>
      )}
    </div>
  )
}
