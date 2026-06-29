import { CONDITION_FIELDS, getConditionField } from "@/lib/condition-fields"
import {
  createConditionRule,
  parseConditionInput,
  serializeConditionGroup,
} from "@/lib/segment-conditions"
import type {
  BlockDisplayCondition,
  ConditionMatchMode,
  ConditionOperator,
  SegmentCondition,
} from "@/types/prompt-builder"
import { ChevronDown, Plus, Trash2 } from "lucide-react"
import { forwardRef, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"

type Props = {
  rules: BlockDisplayCondition
  onChange: (rules: BlockDisplayCondition) => void
  title?: string
  titleTone?: "label" | "description"
  className?: string
  style?: CSSProperties
}

function ConditionRuleRow({
  rule,
  onChange,
  onRemove,
  canRemove,
  prefix,
}: {
  rule: SegmentCondition
  onChange: (patch: Partial<SegmentCondition>) => void
  onRemove: () => void
  canRemove: boolean
  prefix: ReactNode
}) {
  const fieldDef = getConditionField(rule.field) ?? CONDITION_FIELDS[0]
  const operators = fieldDef.operators
  const showValueSelect = fieldDef.values.length > 0
  const customValue =
    fieldDef.allowCustomValue &&
    !fieldDef.values.some((option) => option.value === rule.value)

  return (
    <div className="flex items-start gap-2">
      <div className="flex w-10 shrink-0 items-center self-center">{prefix}</div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="grid grid-cols-[1.4fr_0.8fr_1.2fr] gap-1.5">
          <select
            value={rule.field}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation()
              const nextField = getConditionField(e.target.value)
              if (!nextField) return
              const firstValue = nextField.values[0]
              onChange({
                field: nextField.field,
                operator: nextField.operators[0],
                value: firstValue?.value ?? "",
                label: firstValue?.label,
              })
            }}
            className="min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-800"
          >
            {CONDITION_FIELDS.map((field) => (
              <option key={field.field} value={field.field}>
                {field.label}
              </option>
            ))}
          </select>

          <select
            value={rule.operator}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation()
              onChange({ operator: e.target.value as ConditionOperator })
            }}
            className="min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-800"
          >
            {operators.map((op) => (
              <option key={op} value={op}>
                {op === "is" ? "is" : op === "is_not" ? "is not" : "contains"}
              </option>
            ))}
          </select>

          {showValueSelect ? (
            <select
              value={customValue ? "__custom__" : rule.value}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation()
                const selected = e.target.value
                if (selected === "__custom__") {
                  onChange({ value: "", label: "" })
                  return
                }
                const option = fieldDef.values.find((v) => v.value === selected)
                onChange({
                  value: selected,
                  label: option?.label,
                })
              }}
              className="min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-800"
            >
              {fieldDef.values.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
              {fieldDef.allowCustomValue && (
                <option value="__custom__">Custom…</option>
              )}
            </select>
          ) : (
            <input
              type="text"
              value={rule.value}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation()
                onChange({ value: e.target.value, label: e.target.value })
              }}
              placeholder="Value"
              className="min-w-0 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-800"
            />
          )}
        </div>

        {fieldDef.allowCustomValue &&
          (customValue || showValueSelect) &&
          (customValue || rule.value === "") && (
            <input
              type="text"
              value={rule.value}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation()
                onChange({ value: e.target.value, label: e.target.value })
              }}
              placeholder={`Enter ${fieldDef.label.toLowerCase()}…`}
              className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-800"
            />
          )}
          </div>

          {canRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="mt-0.5 shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove condition"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function LogicOperatorSelect({
  value,
  onChange,
}: {
  value: ConditionMatchMode
  onChange: (value: ConditionMatchMode) => void
}) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((current) => !current)
        }}
        className="inline-flex items-center gap-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600 transition-colors hover:text-blue-700"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Condition match mode"
      >
        {value}
        <ChevronDown className="size-3" />
      </button>

      {open && (
        <div
          className="absolute top-full z-10 mt-0.5 min-w-[72px] overflow-hidden rounded-md border border-gray-200 bg-white py-0.5 shadow-lg"
          role="listbox"
        >
          {(["and", "or"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={value === option}
              onClick={(e) => {
                e.stopPropagation()
                onChange(option)
                setOpen(false)
              }}
              className={`block w-full px-3 py-1 text-left text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                value === option
                  ? "bg-blue-50 text-blue-600"
                  : "text-blue-600 hover:bg-gray-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RulePrefix({
  index,
  match,
  onMatchChange,
}: {
  index: number
  match: ConditionMatchMode
  onMatchChange: (value: ConditionMatchMode) => void
}) {
  if (index === 0) {
    return (
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        WHEN
      </span>
    )
  }

  if (index === 1) {
    return <LogicOperatorSelect value={match} onChange={onMatchChange} />
  }

  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
      {match}
    </span>
  )
}

export const ConditionBuilderPanel = forwardRef<HTMLDivElement, Props>(
  function ConditionBuilderPanel(
    { rules, onChange, title, titleTone = "label", className, style },
    ref,
  ) {
  const { match, rules: normalized } = parseConditionInput(rules)

  const updateRules = (
    next: SegmentCondition[],
    nextMatch: ConditionMatchMode = match,
  ) => {
    onChange(serializeConditionGroup(nextMatch, next))
  }

  const updateRule = (index: number, patch: Partial<SegmentCondition>) => {
    const next = normalized.map((rule, i) =>
      i === index ? { ...rule, ...patch } : rule,
    )
    updateRules(next)
  }

  const removeRule = (index: number) => {
    updateRules(normalized.filter((_, i) => i !== index))
  }

  const addRule = () => {
    updateRules([...normalized, createConditionRule()])
  }

  const setMatch = (nextMatch: ConditionMatchMode) => {
    updateRules(normalized, nextMatch)
  }

  return (
    <div
      ref={ref}
      style={style}
      className={`w-[440px] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-3 shadow-lg ${className ?? ""}`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <p
        className={
          titleTone === "description"
            ? "text-[12px] font-medium leading-snug text-gray-700"
            : "text-[10px] font-semibold uppercase tracking-wide text-gray-400"
        }
      >
        {title ?? "Show"}
      </p>

      {normalized.length === 0 ? (
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          No conditions — content is always shown. Add a rule below.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {normalized.map((rule, index) => (
            <ConditionRuleRow
              key={rule.id ?? `${rule.field}-${index}`}
              rule={rule}
              onChange={(patch) => updateRule(index, patch)}
              onRemove={() => removeRule(index)}
              canRemove
              prefix={
                <RulePrefix
                  index={index}
                  match={match}
                  onMatchChange={setMatch}
                />
              }
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            addRule()
          }}
          className="flex flex-1 items-center justify-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="size-3" />
          Add condition
        </button>
        {normalized.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="rounded-md px-2 py-1.5 text-[11px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
},
)
