import { useEffect, useRef, useState, type RefObject } from "react"

type Options = {
  enabled?: boolean
  threshold?: number
}

export function useRevealOnScrollUp(
  scrollElement: HTMLElement | null,
  anchorRef?: RefObject<HTMLElement | null>,
  { enabled = true, threshold = 12 }: Options = {},
) {
  const [showFloating, setShowFloating] = useState(false)
  const [scrolledPast, setScrolledPast] = useState(false)
  const lastScrollTop = useRef(0)

  useEffect(() => {
    if (!enabled || !scrollElement) {
      setShowFloating(false)
      setScrolledPast(false)
      return
    }

    const scrollEl = scrollElement

    let anchorVisible = !anchorRef
    let observer: IntersectionObserver | null = null

    if (anchorRef?.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          anchorVisible = entry.isIntersecting
          if (entry.isIntersecting) setShowFloating(false)
        },
        { root: scrollEl, threshold: 0 },
      )
      observer.observe(anchorRef.current)
    }

    const onScroll = () => {
      const scrollTop = scrollEl.scrollTop
      const delta = scrollTop - lastScrollTop.current
      const past = scrollTop > threshold

      setScrolledPast(past)

      if (!past) {
        setShowFloating(false)
      } else if (anchorRef) {
        if (anchorVisible) {
          setShowFloating(false)
        } else if (delta < -4) {
          setShowFloating(true)
        } else if (delta > 4) {
          setShowFloating(false)
        }
      } else if (delta < -4) {
        setShowFloating(true)
      } else if (delta > 4) {
        setShowFloating(false)
      }

      lastScrollTop.current = scrollTop
    }

    lastScrollTop.current = scrollEl.scrollTop
    onScroll()
    scrollEl.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      observer?.disconnect()
      scrollEl.removeEventListener("scroll", onScroll)
    }
  }, [scrollElement, anchorRef, enabled, threshold])

  return { showFloating, scrolledPast }
}

export function useRevealOnScrollUpRef(
  scrollRef: RefObject<HTMLElement | null>,
  anchorRef?: RefObject<HTMLElement | null>,
  options?: Options,
) {
  return useRevealOnScrollUp(scrollRef.current, anchorRef, options)
}
