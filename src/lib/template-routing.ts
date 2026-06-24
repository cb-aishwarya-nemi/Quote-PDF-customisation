import { hasConditions } from "@/lib/segment-conditions"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import type { BlockDisplayCondition } from "@/types/prompt-builder"

export function hasMultipleTemplatesInLibrary(
  library: PublishedBuilderTemplate[],
): boolean {
  return library.length > 1
}

export function templateRequiresPublishConditions(
  library: PublishedBuilderTemplate[],
  displayCondition: BlockDisplayCondition,
): boolean {
  return (
    hasMultipleTemplatesInLibrary(library) &&
    !hasConditions(displayCondition)
  )
}
