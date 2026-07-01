import {
  formatLogoSizePixels,
  getLogoSizePreset,
  LOGO_SIZE_PRESETS,
} from "@/lib/logo-size-presets"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock } from "@/types/prompt-builder"
import { Check, Image, Trash2, Type } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type LogoSource = "image" | "text"

const LOGO_SOURCE_OPTIONS: {
  id: LogoSource
  label: string
  description: string
  icon: typeof Image
}[] = [
  {
    id: "image",
    label: "Upload image",
    description: "Use a PNG, JPG, SVG, or other image file",
    icon: Image,
  },
  {
    id: "text",
    label: "Text",
    description: "Show your company name as text",
    icon: Type,
  },
]

type Props = {
  block: BuilderBlock
}

export function LogoBlockControls({ block }: Props) {
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const menuRef = useRef<HTMLDivElement>(null)
  const [sizeOpen, setSizeOpen] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)

  const sizeId = String(block.content.logoVariant ?? block.content.variant ?? "default")
  const sizePreset = getLogoSizePreset(sizeId)
  const logoSource: LogoSource =
    block.content.logoSource === "text" ? "text" : "image"
  const activeSourceOption =
    LOGO_SOURCE_OPTIONS.find((option) => option.id === logoSource) ??
    LOGO_SOURCE_OPTIONS[0]
  const ActiveSourceIcon = activeSourceOption.icon

  useEffect(() => {
    if (!sizeOpen && !sourceOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setSizeOpen(false)
      setSourceOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [sizeOpen, sourceOpen])

  const setLogoSize = (nextSizeId: string) => {
    updateBlockField(block.id, "variant", nextSizeId)
    updateBlockField(block.id, "logoVariant", nextSizeId)
    setSizeOpen(false)
  }

  const setLogoSource = (nextSource: LogoSource) => {
    updateBlockField(block.id, "logoSource", nextSource)
    setSourceOpen(false)
  }

  const hideLogo = () => {
    updateBlockField(block.id, "showLogo", false)
  }

  return (
    <div ref={menuRef} className="pointer-events-auto flex items-center gap-1">
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSizeOpen((open) => !open)
            setSourceOpen(false)
          }}
          className="flex min-w-[42px] items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm hover:bg-gray-50"
          aria-expanded={sizeOpen}
          aria-label="Logo size"
        >
          <span className="tabular-nums">{sizePreset.heightPx}px</span>
        </button>

        {sizeOpen && (
          <div className="pointer-events-auto absolute right-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Logo / icon size
            </p>
            {LOGO_SIZE_PRESETS.map((preset) => {
              const selected = preset.id === sizePreset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLogoSize(preset.id)
                  }}
                  className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                    selected ? "bg-blue-50/60" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-gray-900">
                        {preset.label}
                      </span>
                      {selected && (
                        <Check
                          className="size-3 shrink-0 text-blue-600"
                          strokeWidth={2.5}
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-gray-500">
                      {preset.kind === "icon" ? "Icon" : "Logo"} ·{" "}
                      {formatLogoSizePixels(preset)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSourceOpen((open) => !open)
            setSizeOpen(false)
          }}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 shadow-sm hover:bg-gray-50"
          aria-expanded={sourceOpen}
          aria-label="Logo type"
          title="Logo type"
        >
          <ActiveSourceIcon className="size-3" strokeWidth={1.75} />
        </button>

        {sourceOpen && (
          <div className="pointer-events-auto absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Logo type
            </p>
            {LOGO_SOURCE_OPTIONS.map((option) => {
              const selected = option.id === logoSource
              const Icon = option.icon
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLogoSource(option.id)
                  }}
                  className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
                    selected ? "bg-blue-50/60" : ""
                  }`}
                >
                  <Icon
                    className="mt-0.5 size-3.5 shrink-0 text-gray-500"
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[12px] font-medium text-gray-900">
                        {option.label}
                      </span>
                      {selected && (
                        <Check
                          className="size-3 shrink-0 text-blue-600"
                          strokeWidth={2.5}
                        />
                      )}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-gray-500">
                      {option.description}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="group/hide relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            hideLogo()
          }}
          className="rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          aria-label="Hide logo"
        >
          <Trash2 className="size-3.5" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute right-0 top-full z-30 mt-1 hidden w-max rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-md group-hover/hide:block"
        >
          Hide logo
        </span>
      </div>
    </div>
  )
}
