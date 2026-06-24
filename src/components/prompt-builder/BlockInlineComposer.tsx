import { BlockFragmentContent } from "@/components/prompt-builder/BlockFragmentContent"
import { useInlineFragmentActions } from "@/hooks/use-inline-fragment-actions"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
  className?: string
  textClassName?: string
}

export function BlockInlineComposer({ block, className, textClassName }: Props) {
  const {
    fragments,
    updateFragment,
    removeFragment,
    setFieldValue,
  } = useInlineFragmentActions(block)

  return (
    <div className={className}>
      <BlockFragmentContent
        block={block}
        fragments={fragments}
        onUpdateFragment={updateFragment}
        onRemoveFragment={removeFragment}
        onFieldChange={setFieldValue}
        textClassName={textClassName}
      />
    </div>
  )
}
