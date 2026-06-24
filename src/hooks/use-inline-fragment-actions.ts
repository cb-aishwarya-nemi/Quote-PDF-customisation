import {
  createTextFragment,
  createVariableFragment,
  INLINE_FRAGMENTS_KEY,
  resolveInlineFragments,
} from "@/lib/content-fragments"
import { getBlockFieldDefs, getVariableCatalog, getVariableDummyValue, normalizeVariableKey } from "@/lib/derive-template-variables"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock, InlineFragment } from "@/types/prompt-builder"
import { useMemo } from "react"

export function useInlineFragmentActions(block: BuilderBlock) {
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)

  const fragments = useMemo(
    () => resolveInlineFragments(block),
    [block.content, block.id, block.type],
  )

  const persistFragments = (next: InlineFragment[]) => {
    updateBlockField(block.id, INLINE_FRAGMENTS_KEY, next)
  }

  const variablePickerOptions = useMemo(() => {
    const blockDefs = getBlockFieldDefs(block.type).map((d) => ({
      key: d.key,
      label: d.label,
    }))
    const catalog = getVariableCatalog().map((d) => ({
      key: d.key,
      label: d.label,
    }))
    const seen = new Set<string>()
    const merged: { key: string; label: string }[] = []
    for (const entry of [...blockDefs, ...catalog]) {
      if (seen.has(entry.key)) continue
      seen.add(entry.key)
      merged.push(entry)
    }
    return merged
  }, [block.type])

  const updateFragment = (id: string, patch: Partial<InlineFragment>) => {
    persistFragments(
      fragments.map((fragment) => {
        if (fragment.id !== id) return fragment
        return { ...fragment, ...patch } as InlineFragment
      }),
    )
  }

  const removeFragment = (id: string) => {
    persistFragments(fragments.filter((f) => f.id !== id))
  }

  const addText = () => {
    persistFragments([...fragments, createTextFragment("")])
  }

  const addVariable = (variableKey: string, label: string) => {
    const normalizedKey = normalizeVariableKey(variableKey)
    const existingFields = new Set(
      fragments
        .filter(
          (f): f is Extract<InlineFragment, { kind: "variable" }> =>
            f.kind === "variable",
        )
        .map((f) => f.field),
    )
    const fragment = createVariableFragment(normalizedKey, label, existingFields)
    const existingValue = block.content[fragment.field]
    if (existingValue == null || String(existingValue).trim() === "") {
      updateBlockField(block.id, fragment.field, getVariableDummyValue(normalizedKey))
    }
    const keys = {
      ...((block.content.variableKeys as Record<string, string> | undefined) ??
        {}),
      [fragment.field]: normalizedKey,
    }
    updateBlockField(block.id, "variableKeys", keys)
    persistFragments([...fragments, fragment])
  }

  const setFieldValue = (field: string, value: string) => {
    updateBlockField(block.id, field, value)
  }

  return {
    fragments,
    variablePickerOptions,
    updateFragment,
    removeFragment,
    addText,
    addVariable,
    setFieldValue,
  }
}
