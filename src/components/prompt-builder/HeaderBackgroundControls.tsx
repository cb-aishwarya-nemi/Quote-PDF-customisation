import { isImageFile } from "@/lib/pdf-page-render"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock } from "@/types/prompt-builder"
import { Image, Loader2, Trash2 } from "lucide-react"
import { useRef, useState } from "react"

const ACCEPT =
  ".png,.jpg,.jpeg,.svg,.webp,.gif,image/png,image/jpeg,image/svg+xml,image/webp,image/gif"

const tooltipClass =
  "pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-md group-hover/action:block"

async function readImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function HeaderBackgroundControls({ block }: { block: BuilderBlock }) {
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  const content = block.content
  const backgroundUrl =
    typeof content.backgroundImageUrl === "string" ? content.backgroundImageUrl : ""
  const hasBackground = backgroundUrl.length > 0

  const clearBackground = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateBlockField(block.id, "backgroundImageUrl", "")
    updateBlockField(block.id, "backgroundImageFileName", "")
  }

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    if (!isImageFile(file)) return

    setLoading(true)
    try {
      const url = await readImageDataUrl(file)
      updateBlockField(block.id, "backgroundImageUrl", url)
      updateBlockField(block.id, "backgroundImageFileName", file.name)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  const openPicker = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (loading) return
    inputRef.current?.click()
  }

  return (
    <>
      <div className="group/action relative">
        <button
          type="button"
          onClick={openPicker}
          disabled={loading}
          className={`rounded-md border p-1 shadow-sm disabled:opacity-50 ${
            hasBackground
              ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100/80"
              : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          }`}
          aria-label={hasBackground ? "Background set" : "Add background"}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Image className="size-3.5" />
          )}
        </button>
        <span role="tooltip" className={tooltipClass}>
          {hasBackground ? "Background set" : "Add background"}
        </span>
      </div>
      {hasBackground && (
        <div className="group/action relative">
          <button
            type="button"
            onClick={clearBackground}
            className="rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Remove background"
          >
            <Trash2 className="size-3.5" />
          </button>
          <span role="tooltip" className={tooltipClass}>
            Remove background
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </>
  )
}
