import type { PublishChecklistItem } from "@/lib/publish-checklist"
import { publishChecklistCanPublish } from "@/lib/publish-checklist"
import { Check, Loader2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const CHECK_START_DELAY_MS = 450
const CHECK_RESOLVE_DELAY_MS = 750
const CHECK_NEXT_DELAY_MS = 350

function ChecklistStatusIcon({ status }: { status: "checking" | "pass" | "fail" }) {
  if (status === "checking") {
    return (
      <span
        className="flex size-[18px] shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50"
        aria-hidden
      >
        <Loader2 className="size-3 animate-spin text-blue-500" />
      </span>
    )
  }

  if (status === "pass") {
    return (
      <span
        className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500"
        aria-hidden
      >
        <Check className="size-3 text-white" strokeWidth={3} />
      </span>
    )
  }

  return (
    <span
      className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-amber-500"
      aria-hidden
    >
      <X className="size-3 text-white" strokeWidth={3} />
    </span>
  )
}

type Props = {
  items: PublishChecklistItem[]
  animate?: boolean
  onAction: (action: NonNullable<PublishChecklistItem["action"]>) => void
  onIgnore?: (itemId: string) => void
  onPublish: () => void
  onScanComplete?: () => void
  isPublishing?: boolean
}

const FIXED_CHECKLIST_IDS = new Set([
  "template-name",
  "routing-conditions",
  "billed-to-block",
  "sender-address-block",
  "entitlements-block",
  "signature-block",
  "ae-details-block",
])

type RowPhase = "pending" | "checking" | "resolved"

function isItemResolved(
  itemId: string,
  liveItems: PublishChecklistItem[],
): boolean {
  const live = liveItems.find((item) => item.id === itemId)
  if (!live) return true
  return live.checked
}

function mergeResolvedStatus(
  snapshot: PublishChecklistItem[],
  liveItems: PublishChecklistItem[],
): PublishChecklistItem[] {
  return snapshot.map((item) => ({
    ...item,
    checked: isItemResolved(item.id, liveItems),
  }))
}

function resolveSummary(
  items: PublishChecklistItem[],
  isPublishing: boolean,
  hadFailuresAtScan: boolean,
): string {
  const failed = items.filter((item) => !item.checked)

  if (failed.length === 0) {
    if (isPublishing) return "Publishing your template…"
    if (hadFailuresAtScan) {
      return "All checks are passing now."
    }
    return "All checks passed — publishing your template…"
  }

  if (failed.length === 1) {
    return "I found 1 thing to fix before publishing."
  }
  return `I found ${failed.length} things to fix before publishing.`
}

export function PublishChecklistMessage({
  items,
  animate = true,
  onAction,
  onIgnore,
  onPublish,
  onScanComplete,
  isPublishing = false,
}: Props) {
  const [checkingIndex, setCheckingIndex] = useState<number | null>(
    animate ? null : -1,
  )
  const [resolvedCount, setResolvedCount] = useState(
    animate ? 0 : items.length,
  )
  const [frozenItems, setFrozenItems] = useState<PublishChecklistItem[] | null>(
    animate ? null : items,
  )
  const [hadFailuresAtScan, setHadFailuresAtScan] = useState(
    () => !animate && items.some((item) => !item.checked),
  )
  const scanCompleteRef = useRef(!animate)
  const autoPublishTriggeredRef = useRef(false)
  const onScanCompleteRef = useRef(onScanComplete)
  const onPublishRef = useRef(onPublish)
  onScanCompleteRef.current = onScanComplete
  onPublishRef.current = onPublish

  const scanComplete = items.length === 0 || resolvedCount >= items.length
  const displayItems = frozenItems ?? items
  const resolvedItems = mergeResolvedStatus(displayItems, items)
  const canPublish = publishChecklistCanPublish(resolvedItems)

  useEffect(() => {
    if (!scanComplete || frozenItems) return
    setFrozenItems(items.map((item) => ({ ...item })))
    setHadFailuresAtScan(items.some((item) => !item.checked))
  }, [scanComplete, frozenItems, items])

  useEffect(() => {
    if (!animate) return
    if (items.length === 0) {
      onScanCompleteRef.current?.()
      return
    }

    if (scanComplete) {
      if (!scanCompleteRef.current) {
        scanCompleteRef.current = true
        onScanCompleteRef.current?.()
      }
      return
    }

    if (checkingIndex === null && resolvedCount === 0) {
      const timer = window.setTimeout(() => setCheckingIndex(0), CHECK_START_DELAY_MS)
      return () => window.clearTimeout(timer)
    }

    if (checkingIndex !== null && resolvedCount === checkingIndex) {
      const timer = window.setTimeout(
        () => setResolvedCount((count) => count + 1),
        CHECK_RESOLVE_DELAY_MS,
      )
      return () => window.clearTimeout(timer)
    }

    if (checkingIndex !== null && resolvedCount === checkingIndex + 1) {
      if (resolvedCount >= items.length) return
      const timer = window.setTimeout(
        () => setCheckingIndex(resolvedCount),
        CHECK_NEXT_DELAY_MS,
      )
      return () => window.clearTimeout(timer)
    }
  }, [animate, checkingIndex, resolvedCount, items.length, scanComplete])

  useEffect(() => {
    if (
      !animate ||
      !scanComplete ||
      !canPublish ||
      hadFailuresAtScan ||
      autoPublishTriggeredRef.current ||
      isPublishing
    ) {
      return
    }

    autoPublishTriggeredRef.current = true
    const timer = window.setTimeout(() => {
      onPublishRef.current()
    }, 500)

    return () => window.clearTimeout(timer)
  }, [animate, scanComplete, canPublish, hadFailuresAtScan, isPublishing])

  function rowPhase(index: number): RowPhase {
    if (scanComplete) return "resolved"
    if (!animate) return "resolved"
    if (index < resolvedCount) return "resolved"
    if (checkingIndex === index) return "checking"
    return "pending"
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[13px] leading-relaxed text-gray-800">
        {scanComplete
          ? resolveSummary(resolvedItems, isPublishing, hadFailuresAtScan)
          : "Let me review your template before we publish…"}
      </p>

      {displayItems.length > 0 && (
        <ul className="space-y-1">
          {resolvedItems.map((item, index) => {
            const phase = rowPhase(index)
            if (phase === "pending") return null

            const isChecking = phase === "checking"

            return (
              <li key={item.id} className="flex items-start gap-2.5 py-0.5">
                <ChecklistStatusIcon
                  status={
                    isChecking ? "checking" : item.checked ? "pass" : "fail"
                  }
                />
                <div className="min-w-0 flex-1 pt-px">
                  <p
                    className={`text-[12px] leading-snug ${
                      isChecking
                        ? "text-gray-600"
                        : item.checked
                          ? "text-gray-700"
                          : "font-medium text-amber-900"
                    }`}
                  >
                    {isChecking
                      ? item.checkingLabel
                      : item.checked
                        ? item.label
                        : `${item.label} — needs attention`}
                  </p>
                  {!isChecking && !item.checked && (
                    <div className="mt-1 space-y-1.5">
                      <p className="text-[11px] leading-snug text-gray-600">
                        {item.nextStep}
                      </p>
                      {item.action && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onAction(item.action!)}
                            className="rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-amber-700"
                          >
                            {item.action.label}
                          </button>
                          {onIgnore && !FIXED_CHECKLIST_IDS.has(item.id) && (
                            <button
                              type="button"
                              onClick={() => onIgnore(item.id)}
                              className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[10px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                            >
                              Ignore
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {scanComplete && !canPublish && (
        <p className="text-[11px] leading-snug text-gray-500">
          Fix the flagged items above to continue.
        </p>
      )}

      {scanComplete && canPublish && hadFailuresAtScan && !isPublishing && (
        <button
          type="button"
          onClick={onPublish}
          className="rounded-full bg-blue-600 px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Publish
        </button>
      )}

      {scanComplete && canPublish && isPublishing && (
        <div className="flex items-center gap-2 text-[11px] text-gray-600">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          <span>Publishing…</span>
        </div>
      )}
    </div>
  )
}
