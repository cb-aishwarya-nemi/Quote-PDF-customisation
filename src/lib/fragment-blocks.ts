import type { BuilderBlockType } from "@/types/prompt-builder"

/** Blocks that use the add-component / inline-fragment composer. */
const FRAGMENT_COMPOSER_BLOCKS: BuilderBlockType[] = []

export function blockSupportsFragments(type: BuilderBlockType): boolean {
  return FRAGMENT_COMPOSER_BLOCKS.includes(type)
}

export function blockShowsAddComponent(
  blockType: BuilderBlockType,
  isSelected: boolean,
  isTemplateEdit: boolean,
): boolean {
  return isTemplateEdit && isSelected && blockSupportsFragments(blockType)
}
