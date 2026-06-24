import type { BuilderBlock, BuilderBlockType } from "@/types/prompt-builder"

export function findBlockIndex(
  blocks: BuilderBlock[],
  type: BuilderBlockType,
): number {
  return blocks.findIndex((block) => block.type === type)
}

export function moveBlockToStart(
  blocks: BuilderBlock[],
  type: BuilderBlockType,
): BuilderBlock[] | null {
  const index = findBlockIndex(blocks, type)
  if (index <= 0) return null
  const next = [...blocks]
  const [block] = next.splice(index, 1)
  next.unshift(block)
  return next
}

export function moveBlockToEnd(
  blocks: BuilderBlock[],
  type: BuilderBlockType,
): BuilderBlock[] | null {
  const index = findBlockIndex(blocks, type)
  if (index < 0 || index === blocks.length - 1) return null
  const next = [...blocks]
  const [block] = next.splice(index, 1)
  next.push(block)
  return next
}

export function moveBlockAfterType(
  blocks: BuilderBlock[],
  type: BuilderBlockType,
  afterType: BuilderBlockType,
): BuilderBlock[] | null {
  const typeIndex = findBlockIndex(blocks, type)
  const afterIndex = findBlockIndex(blocks, afterType)
  if (typeIndex < 0 || afterIndex < 0) return null

  const targetIndex = afterIndex + 1
  if (typeIndex === targetIndex) return null

  const next = [...blocks]
  const [block] = next.splice(typeIndex, 1)
  const insertAt = typeIndex < afterIndex ? afterIndex : afterIndex + 1
  next.splice(insertAt, 0, block)
  return next
}

export function moveBlockBeforeType(
  blocks: BuilderBlock[],
  type: BuilderBlockType,
  beforeType: BuilderBlockType,
): BuilderBlock[] | null {
  const typeIndex = findBlockIndex(blocks, type)
  const beforeIndex = findBlockIndex(blocks, beforeType)
  if (typeIndex < 0 || beforeIndex < 0) return null

  if (typeIndex === beforeIndex - 1) return null

  const next = [...blocks]
  const [block] = next.splice(typeIndex, 1)
  const insertAt = typeIndex < beforeIndex ? beforeIndex - 1 : beforeIndex
  next.splice(insertAt, 0, block)
  return next
}

/** Place signature at the end of commercial blocks, but before AE details when present. */
export function moveSignatureToClosingPosition(
  blocks: BuilderBlock[],
): BuilderBlock[] | null {
  const signatureIndex = findBlockIndex(blocks, "signature")
  if (signatureIndex < 0) return null

  const aeIndex = findBlockIndex(blocks, "ae_profile")
  if (aeIndex >= 0) {
    return moveBlockBeforeType(blocks, "signature", "ae_profile")
  }

  return moveBlockToEnd(blocks, "signature")
}

export function resolveDefaultAddBlockIndex(
  blocks: BuilderBlock[],
  type: BuilderBlockType,
): number {
  if (type === "signature") {
    const aeIndex = findBlockIndex(blocks, "ae_profile")
    if (aeIndex >= 0) return aeIndex
  }
  return blocks.length
}
