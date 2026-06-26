import { createBuilderTemplate } from "@/lib/create-builder-template"
import { createId } from "@/lib/create-id"
import {
  applyCreationContextToTemplate,
  type CreationContext,
} from "@/lib/derive-template-from-creation"
import { isDefaultPublishedTemplate } from "@/lib/seed-demo-library"
import {
  buildGenerationStepLabels,
} from "@/lib/template-generation-steps"
import type { PdfExtractionSummary } from "@/lib/pdf-template-extractor"
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
  creationBrief?: string
  uploadedFileNames?: string[]
  extractionSummary?: PdfExtractionSummary
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
    creationBrief?: string
    uploadedFileNames?: string[]
    extractionSummary?: PdfExtractionSummary
    generationStepLabels?: string[]
  },
  templateId?: string,
) {
  const id = templateId ?? options?.template?.id ?? createId("tpl")
  if (isDefaultPublishedTemplate(id)) return
  const creationContext: CreationContext = {
    creationBrief: options?.creationBrief,
    uploadedFileNames: options?.uploadedFileNames,
  }
  const baseTemplate =
    options?.template ??
    createBuilderTemplate(id, {
      variantId: options?.variantId,
      presetId: options?.presetId,
      name: options?.name ?? options?.variantName,
    })
  const template = applyCreationContextToTemplate(baseTemplate, creationContext)
  const generationStepLabels =
    options?.generationStepLabels ??
    (options?.hasUploads !== undefined
      ? buildGenerationStepLabels(options.hasUploads)
      : undefined)

  usePromptBuilderStore.getState().initTemplate(template, {
    generationStepLabels,
    creationBrief: options?.creationBrief,
    extractionSummary: options?.extractionSummary,
  })
  navigate(promptBuilderPath(id), {
    state: {
      variantId: options?.variantId ?? template.variantId,
      variantName: options?.variantName,
      presetId: options?.presetId ?? template.presetId,
      name: template.name,
      template,
      fromGeneration: options?.hasUploads !== undefined,
      generationStepLabels,
      creationBrief: options?.creationBrief,
      uploadedFileNames: options?.uploadedFileNames,
      extractionSummary: options?.extractionSummary,
    },
  })
}
