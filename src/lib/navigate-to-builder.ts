import { createBuilderTemplate } from "@/lib/create-builder-template"
import { createId } from "@/lib/create-id"
import {
  buildGenerationStepLabels,
} from "@/lib/template-generation-steps"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderTemplate } from "@/types/prompt-builder"

export type BuilderNavigationState = {
  variantId?: string
  variantName?: string
  presetId?: string
  name?: string
  template?: BuilderTemplate
  fromGeneration?: boolean
  generationStepLabels?: string[]
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
    hasUploads?: boolean
    template?: BuilderTemplate
  },
  templateId?: string,
) {
  const id = templateId ?? options?.template?.id ?? createId("tpl")
  const template =
    options?.template ??
    createBuilderTemplate(id, {
      variantId: options?.variantId,
      presetId: options?.presetId,
      name: options?.name ?? options?.variantName,
    })
  const generationStepLabels =
    options?.hasUploads !== undefined
      ? buildGenerationStepLabels(options.hasUploads)
      : undefined

  usePromptBuilderStore.getState().initTemplate(template, {
    generationStepLabels,
  })
  navigate(promptBuilderPath(id), {
    state: {
      variantId: options?.variantId ?? template.variantId,
      variantName: options?.variantName,
      presetId: options?.presetId ?? template.presetId,
      name: options?.name ?? template.name,
      template,
      fromGeneration: options?.hasUploads !== undefined,
      generationStepLabels,
    },
  })
}
