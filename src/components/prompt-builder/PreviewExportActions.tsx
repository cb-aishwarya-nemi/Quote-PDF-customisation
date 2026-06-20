import {
  downloadPreviewPdf,
  sharePreviewPdf,
  type SharePreviewResult,
} from "@/lib/export-template-preview"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import { Download, Loader2, Share2 } from "lucide-react"
import { useRef, useState, type RefObject } from "react"

type Props = {
  documentRef: RefObject<HTMLDivElement | null>
  variant?: "inline" | "floating"
}

export function PreviewExportActions({
  documentRef,
  variant = "inline",
}: Props) {
  const template = usePromptBuilderStore((s) => s.template)
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const [busy, setBusy] = useState<"download" | "share" | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const statusTimerRef = useRef<number | null>(null)

  const showStatus = (message: string) => {
    setStatus(message)
    if (statusTimerRef.current) window.clearTimeout(statusTimerRef.current)
    statusTimerRef.current = window.setTimeout(() => setStatus(null), 4000)
  }

  const getElement = () => documentRef.current

  const handleDownload = async () => {
    const element = getElement()
    if (!element || busy) return
    setBusy("download")
    try {
      const name = template?.name ?? "quote-preview"
      await downloadPreviewPdf(
        element,
        `${name}-${activeScenario.id}`,
      )
      showStatus("PDF downloaded")
    } catch {
      showStatus("Could not generate PDF — try again")
    } finally {
      setBusy(null)
    }
  }

  const handleShare = async () => {
    const element = getElement()
    if (!element || busy) return
    setBusy("share")
    try {
      const name = template?.name ?? "Quote preview"
      const result: SharePreviewResult = await sharePreviewPdf(element, {
        filename: `${name}-${activeScenario.id}`,
        title: name,
        text: `${name} · ${activeScenario.label}`,
      })
      if (result === "shared") showStatus("Shared successfully")
      else if (result === "downloaded") {
        showStatus("PDF downloaded — attach to share manually")
      }
    } catch {
      showStatus("Could not share — PDF downloaded instead")
      try {
        const name = template?.name ?? "quote-preview"
        await downloadPreviewPdf(element, `${name}-${activeScenario.id}`)
      } catch {
        /* ignore secondary failure */
      }
    } finally {
      setBusy(null)
    }
  }

  const disabled = busy !== null

  const iconBtnClass = `inline-flex size-7 items-center justify-center rounded border border-gray-300 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-800 disabled:opacity-50${
    variant === "floating" ? " shadow-sm" : ""
  }`

  return (
    <div className="flex shrink-0 items-center gap-2">
      {status && variant === "inline" && (
        <span className="hidden text-[10px] text-gray-500 sm:inline">{status}</span>
      )}
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={disabled}
        className={iconBtnClass}
        aria-label="Share PDF"
        title="Share"
      >
        {busy === "share" ? (
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <Share2 className="size-3.5" strokeWidth={2} />
        )}
      </button>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={disabled}
        className={iconBtnClass}
        aria-label="Download PDF"
        title="Download PDF"
      >
        {busy === "download" ? (
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <Download className="size-3.5" strokeWidth={2} />
        )}
      </button>
    </div>
  )
}
