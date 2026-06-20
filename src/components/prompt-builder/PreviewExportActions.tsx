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
}

export function PreviewExportActions({ documentRef }: Props) {
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

  return (
    <div className="flex shrink-0 items-center gap-2">
      {status && (
        <span className="hidden text-[10px] text-gray-500 sm:inline">{status}</span>
      )}
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {busy === "share" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Share2 className="size-3.5" />
        )}
        Share
      </button>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy === "download" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        Download PDF
      </button>
    </div>
  )
}
