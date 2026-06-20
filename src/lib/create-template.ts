import { blocksForSource, createBlock } from "@/lib/block-catalog"
import type { EditorSource, Template } from "@/types/template"

export function createTemplate(
  id: string,
  source?: EditorSource & { name?: string },
): Template {
  const now = new Date().toISOString()
  const name =
    source?.variantName ??
    source?.presetName ??
    source?.name ??
    "Untitled template"

  const blockTypes = blocksForSource(source)
  const blocks = blockTypes.map((type, index) => createBlock(type, index))

  return {
    id,
    name,
    status: "draft",
    blocks,
    createdAt: now,
    updatedAt: now,
  }
}
