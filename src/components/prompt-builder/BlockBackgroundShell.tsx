import { CANVAS_DOCUMENT_PADDING_VAR } from "@/lib/canvas-constants"
import { parseBlockBackground } from "@/lib/block-background"
import { blockIsHalfWidth } from "@/lib/block-layout-rules"
import type { BuilderBlock } from "@/types/prompt-builder"
import type { CSSProperties, ReactNode } from "react"

type Props = {
  block: BuilderBlock
  children: ReactNode
  className?: string
}

/** Background band — full-bleed on 100% blocks; contained within column on 50% blocks. */
export function BlockBackgroundShell({ block, children, className }: Props) {
  const background = parseBlockBackground(block.content)

  if (background.type === "none") {
    return <>{children}</>
  }

  const isHalfWidth = blockIsHalfWidth(block)

  const bleedStyle: CSSProperties = {
    width: "100cqw",
    marginLeft: "calc(50% - 50cqw)",
    marginRight: "calc(50% - 50cqw)",
  }

  const style: CSSProperties = isHalfWidth ? {} : { ...bleedStyle }
  if (background.type === "image" && background.imageUrl) {
    style.backgroundImage = `url(${background.imageUrl})`
    style.backgroundSize = "cover"
    style.backgroundPosition = "center"
  } else if (background.type === "color" && background.color) {
    style.backgroundColor = background.color
  }

  return (
    <div
      className={`relative overflow-hidden ${isHalfWidth ? "rounded-lg" : ""} ${className ?? ""}`}
      style={style}
    >
      {background.type === "image" && (
        <div
          className="pointer-events-none absolute inset-0 bg-white/55"
          aria-hidden
        />
      )}
      <div
        className={isHalfWidth ? "relative p-5" : "relative py-5"}
        style={
          isHalfWidth
            ? undefined
            : {
                paddingLeft: CANVAS_DOCUMENT_PADDING_VAR,
                paddingRight: CANVAS_DOCUMENT_PADDING_VAR,
              }
        }
      >
        {children}
      </div>
    </div>
  )
}
