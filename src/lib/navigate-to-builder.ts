import { createBuilderTemplate } from "@/lib/create-builder-template"
import { createId } from "@/lib/create-id"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderTemplate } from "@/types/prompt-builder"

export type BuilderNavigationState = {
  variantId?: string
  variantName?: string
  presetId?: string
  name?: string
  template?: BuilderTemplate
}

export function promptBuilderPath(templateId?: string) {
  return `/templates/${templateId ?? createId("tpl")}/build`
}

export function navigateToPromptBuilder(
  navigate: (to: string, options?: { state?: BuilderNavigationState }) => void,
  options?: {
    variantId?: string
    variantName?: string
    presetId?: string
    name?: string
  },
  templateId?: string,
) {
  const id = templateId ?? createId("tpl")
  const template = createBuilderTemplate(id, {
    variantId: options?.variantId,
    presetId: options?.presetId,
    name: options?.name ?? options?.variantName,
  })
  usePromptBuilderStore.getState().initTemplate(template)
  navigate(promptBuilderPath(id), {
    state: {
      variantId: options?.variantId,
      variantName: options?.variantName,
      presetId: options?.presetId,
      name: options?.name ?? options?.variantName,
      template,
    },
  })
}
