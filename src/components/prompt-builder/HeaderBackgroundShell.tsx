import type { BuilderBlock } from "@/types/prompt-builder"
import type { ReactNode } from "react"

type ShellVariant = "centered" | "classic" | "minimal"

type Props = {
  block: BuilderBlock
  variant: ShellVariant
  children: ReactNode
}

const DEFAULT_SHELL: Record<ShellVariant, string> = {
  centered: "rounded-lg border border-gray-100 bg-gray-50/80 px-6 py-5 text-center",
  classic: "",
  minimal: "",
}

const BACKGROUND_SHELL: Record<ShellVariant, string> = {
  centered: "rounded-lg border border-gray-200/80 px-6 py-5 text-center",
  classic: "rounded-lg border border-gray-200/80 px-4 py-4",
  minimal: "rounded-lg border border-gray-200/80 px-3 py-3",
}

export function HeaderBackgroundShell({ block, variant, children }: Props) {
  const content = block.content
  const backgroundUrl =
    typeof content.backgroundImageUrl === "string" ? content.backgroundImageUrl : ""
  const hasBackground = backgroundUrl.length > 0

  const shellClass = hasBackground
    ? BACKGROUND_SHELL[variant]
    : DEFAULT_SHELL[variant]

  return (
    <div
      className={`relative ${hasBackground ? "overflow-hidden" : ""} ${shellClass}`}
      style={
        hasBackground
          ? {
              backgroundImage: `url(${backgroundUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {hasBackground && (
        <div className="pointer-events-none absolute inset-0 bg-white/55" aria-hidden />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}
