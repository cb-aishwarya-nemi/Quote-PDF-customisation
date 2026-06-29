import { BuilderWorkflowTabs } from "@/components/prompt-builder/BuilderWorkflowTabs"
import { BuilderScrollContainerProvider } from "@/components/prompt-builder/builder-scroll-container"
import { useRevealOnScrollUp } from "@/hooks/use-reveal-on-scroll-up"
import { useCallback, useState } from "react"

export function BuilderWorkflowTabsRegion({
  enabled,
  children,
}: {
  enabled: boolean
  children: React.ReactNode
}) {
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(
    null,
  )
  const handleScrollContainerChange = useCallback(
    (element: HTMLDivElement | null) => {
      setScrollContainer(element)
    },
    [],
  )

  const { showFloating, scrolledPast } = useRevealOnScrollUp(scrollContainer, undefined, {
    enabled,
  })

  const hideInlineTabs = scrolledPast && !showFloating

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <BuilderScrollContainerProvider onScrollContainerChange={handleScrollContainerChange}>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {showFloating && (
          <div className="absolute inset-x-0 top-0 z-40 bg-white shadow-sm">
            <BuilderWorkflowTabs />
          </div>
        )}
        <div
          className={
            hideInlineTabs
              ? "pointer-events-none invisible h-0 overflow-hidden"
              : undefined
          }
          aria-hidden={hideInlineTabs}
        >
          <BuilderWorkflowTabs />
        </div>
        {children}
      </div>
    </BuilderScrollContainerProvider>
  )
}
