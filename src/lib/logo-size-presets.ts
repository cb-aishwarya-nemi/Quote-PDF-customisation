export type LogoSizePresetId = "compact" | "default" | "wide"

export type LogoSizePreset = {
  id: LogoSizePresetId
  label: string
  kind: "icon" | "logo"
  heightPx: number
  maxWidthPx: number
}

export const LOGO_SIZE_PRESETS: LogoSizePreset[] = [
  {
    id: "compact",
    label: "Compact",
    kind: "icon",
    heightPx: 28,
    maxWidthPx: 96,
  },
  {
    id: "default",
    label: "Default",
    kind: "logo",
    heightPx: 40,
    maxWidthPx: 140,
  },
  {
    id: "wide",
    label: "Wide",
    kind: "logo",
    heightPx: 72,
    maxWidthPx: 320,
  },
]

export function getLogoSizePreset(id: string): LogoSizePreset {
  return (
    LOGO_SIZE_PRESETS.find((preset) => preset.id === id) ?? LOGO_SIZE_PRESETS[1]
  )
}

export function formatLogoSizePixels(preset: LogoSizePreset): string {
  if (preset.id === "wide") {
    return `${preset.heightPx}px × ${preset.maxWidthPx}px`
  }
  return `${preset.heightPx}px`
}
