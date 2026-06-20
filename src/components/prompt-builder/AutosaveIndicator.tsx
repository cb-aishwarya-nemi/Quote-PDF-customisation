import { formatAutosaveAgo } from "@/lib/derive-template-stats"
import type { AutosaveStatus } from "@/hooks/use-builder-autosave"
import { Check, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

type Props = {
  status: AutosaveStatus
  lastSavedAt: string | null
  visible?: boolean
}

export function AutosaveIndicator({
  status,
  lastSavedAt,
  visible = true,
}: Props) {
  const [, tick] = useState(0)

  useEffect(() => {
    if (!lastSavedAt || status === "saving") return
    const interval = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(interval)
  }, [lastSavedAt, status])

  if (!visible) return null

  if (status === "saving") {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-gray-600"
        aria-live="polite"
      >
        <Loader2 className="size-3.5 animate-spin text-gray-500" />
        Saving…
      </span>
    )
  }

  if (lastSavedAt) {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-gray-600"
        aria-live="polite"
      >
        <Check className="size-3.5 shrink-0 text-emerald-600" />
        Saved {formatAutosaveAgo(lastSavedAt)}
      </span>
    )
  }

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-gray-500"
      aria-live="polite"
    >
      <Loader2 className="size-3.5 animate-spin" />
      Saving…
    </span>
  )
}
