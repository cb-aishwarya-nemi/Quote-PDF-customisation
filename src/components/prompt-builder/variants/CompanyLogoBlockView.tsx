import { HeaderLogo } from "@/components/prompt-builder/HeaderLogo"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
}

export function CompanyLogoBlockView({ block }: Props) {
  const variant = String(block.content.variant ?? "default")
  const compact = variant === "compact"

  return <HeaderLogo block={block} compact={compact} />
}
