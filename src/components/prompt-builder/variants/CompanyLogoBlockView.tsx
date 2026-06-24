import { HeaderLogo } from "@/components/prompt-builder/HeaderLogo"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
}

export function CompanyLogoBlockView({ block }: Props) {
  return <HeaderLogo block={block} />
}
