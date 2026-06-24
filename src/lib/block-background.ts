export type BlockBackgroundType = "none" | "color" | "image"

export type BlockBackground = {
  type: BlockBackgroundType
  color?: string
  imageUrl?: string
  imageFileName?: string
}

export const BACKGROUND_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "White", value: "#ffffff" },
  { label: "Warm gray", value: "#f5f5f4" },
  { label: "Light blue", value: "#eff6ff" },
  { label: "Light amber", value: "#fffbeb" },
  { label: "Mint", value: "#ecfdf5" },
  { label: "Lavender", value: "#f5f3ff" },
  { label: "Slate", value: "#1e293b" },
  { label: "Charcoal", value: "#171717" },
]

export function parseBlockBackground(
  content: Record<string, unknown>,
): BlockBackground {
  const imageUrl =
    typeof content.backgroundImageUrl === "string"
      ? content.backgroundImageUrl.trim()
      : ""
  const color =
    typeof content.backgroundColor === "string"
      ? content.backgroundColor.trim()
      : ""

  if (imageUrl) {
    return {
      type: "image",
      imageUrl,
      imageFileName:
        typeof content.backgroundImageFileName === "string"
          ? content.backgroundImageFileName
          : undefined,
    }
  }

  if (color) {
    return { type: "color", color }
  }

  return { type: "none" }
}

export function hasBlockBackground(content: Record<string, unknown>): boolean {
  return parseBlockBackground(content).type !== "none"
}
