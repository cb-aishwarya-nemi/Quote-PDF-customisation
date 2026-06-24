import { AddIntroPageDivider } from "@/components/prompt-builder/AddIntroPageDivider"

type Props = {
  showAddDivider: boolean
  onInsertHover: (active: boolean) => void
}

/** Hover affordance to add an intro page above the quote canvas. */
export function IntroPageSection({ showAddDivider, onInsertHover }: Props) {
  return (
    <AddIntroPageDivider
      visible={showAddDivider}
      onInsertHover={onInsertHover}
    />
  )
}
