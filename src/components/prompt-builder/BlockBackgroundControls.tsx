import {
  BACKGROUND_COLOR_PRESETS,
  hasBlockBackground,
  parseBlockBackground,
} from "@/lib/block-background"
import { isImageFile } from "@/lib/pdf-page-render"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock } from "@/types/prompt-builder"
import { Check, Image, Loader2, Paintbrush, Trash2, Upload } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const IMAGE_ACCEPT =
  ".png,.jpg,.jpeg,.svg,.webp,.gif,image/png,image/jpeg,image/svg+xml,image/webp,image/gif"

async function readImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

type Props = {
  block: BuilderBlock
}

export function BlockBackgroundControls({ block }: Props) {
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const inputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const background = parseBlockBackground(block.content)
  const active = hasBlockBackground(block.content)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  const clearBackground = () => {
    updateBlockField(block.id, "backgroundColor", "")
    updateBlockField(block.id, "backgroundImageUrl", "")
    updateBlockField(block.id, "backgroundImageFileName", "")
  }

  const setColor = (color: string) => {
    updateBlockField(block.id, "backgroundColor", color)
    updateBlockField(block.id, "backgroundImageUrl", "")
    updateBlockField(block.id, "backgroundImageFileName", "")
  }

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !isImageFile(file)) return

    setLoading(true)
    try {
      const url = await readImageDataUrl(file)
      updateBlockField(block.id, "backgroundImageUrl", url)
      updateBlockField(block.id, "backgroundImageFileName", file.name)
      updateBlockField(block.id, "backgroundColor", "")
      setOpen(false)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={`rounded-md border p-1 shadow-sm ${
          active
            ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100/80"
            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        }`}
        aria-label="Section background"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Paintbrush className="size-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label="Section background"
        >
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Background
          </p>

          <p className="mb-1.5 text-[11px] font-medium text-gray-700">Color</p>
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {BACKGROUND_COLOR_PRESETS.map((preset) => {
              const selected =
                background.type === "color" && background.color === preset.value
              return (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => setColor(preset.value)}
                  className={`relative size-7 rounded-md border transition-all ${
                    selected
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: preset.value }}
                >
                  {selected && (
                    <Check
                      className={`absolute inset-0 m-auto size-3 ${
                        preset.value === "#ffffff" ||
                        preset.value === "#f5f5f4" ||
                        preset.value === "#eff6ff" ||
                        preset.value === "#fffbeb" ||
                        preset.value === "#ecfdf5" ||
                        preset.value === "#f5f3ff"
                          ? "text-gray-800"
                          : "text-white"
                      }`}
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <label className="mb-3 flex items-center gap-2">
            <span className="text-[11px] text-gray-500">Custom</span>
            <input
              type="color"
              value={
                background.type === "color" && background.color
                  ? background.color
                  : "#ffffff"
              }
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-10 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
              onClick={(e) => e.stopPropagation()}
            />
          </label>

          <div className="mb-3 border-t border-gray-100 pt-3">
            <p className="mb-1.5 text-[11px] font-medium text-gray-700">Image</p>
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : background.type === "image" ? (
                <Image className="size-3.5" />
              ) : (
                <Upload className="size-3.5" />
              )}
              {background.type === "image" ? "Replace image" : "Upload image"}
            </button>
            {background.type === "image" && background.imageFileName && (
              <p className="mt-1 truncate text-[10px] text-gray-400">
                {background.imageFileName}
              </p>
            )}
          </div>

          {active && (
            <button
              type="button"
              onClick={() => {
                clearBackground()
                setOpen(false)
              }}
              className="flex w-full items-center justify-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-3" />
              Remove background
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}

/** @deprecated Use BlockBackgroundControls */
export function HeaderBackgroundControls({ block }: Props) {
  return <BlockBackgroundControls block={block} />
}
