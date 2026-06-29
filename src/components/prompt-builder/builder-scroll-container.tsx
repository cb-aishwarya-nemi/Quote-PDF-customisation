import { createContext, useCallback, useContext } from "react"

type ScrollContainerSetter = (element: HTMLDivElement | null) => void

const BuilderScrollContainerSetterContext =
  createContext<ScrollContainerSetter | null>(null)

export function BuilderScrollContainerProvider({
  onScrollContainerChange,
  children,
}: {
  onScrollContainerChange: ScrollContainerSetter
  children: React.ReactNode
}) {
  return (
    <BuilderScrollContainerSetterContext.Provider
      value={onScrollContainerChange}
    >
      {children}
    </BuilderScrollContainerSetterContext.Provider>
  )
}

export function useBuilderScrollContainerRef() {
  const setScrollContainer = useContext(BuilderScrollContainerSetterContext)

  return useCallback(
    (node: HTMLDivElement | null) => {
      setScrollContainer?.(node)
    },
    [setScrollContainer],
  )
}
