import { formatAutosaveAgo } from "@/lib/derive-template-stats"
import { Check } from "lucide-react"
import { useEffect, useState } from "react"

type Props = {
  lastSavedAt: string | null
  visible?: boolean
}

export function AutosaveIndicator({
  lastSavedAt,
  visible = true,
}: Props) {
  const [, tick] = useState(0)

  useEffect(() => {
    if (!lastSavedAt) return
    const interval = window.setInterval(() => tick((n) => n + 1), 60_000)
    return () => window.clearInterval(interval)
  }, [lastSavedAt])

  if (!visible || !lastSavedAt) return null

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] font-medium text-gray-500">
      <Check className="size-3.5 shrink-0 text-emerald-600" />
      Saved {formatAutosaveAgo(lastSavedAt)}
    </span>
  )
}
