import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { useCanEditBlockContent, useIsAdminPreview, useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import { isImageFile } from "@/lib/pdf-page-render"
import {
  formatLogoSizePixels,
  getLogoSizePreset,
  LOGO_SIZE_PRESETS,
} from "@/lib/logo-size-presets"
import {
  describeConditionRulesShort,
  hasConditions,
} from "@/lib/segment-conditions"
import { DEFAULT_COMPANY_LOGO_URL } from "@/lib/default-company-logo"
import { mockBusinessProfile } from "@/mock/data"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BlockDisplayCondition, BuilderBlock } from "@/types/prompt-builder"
import { blockIsVisible } from "@/types/prompt-builder"
import { Check, Image, Loader2, Trash2, Type } from "lucide-react"
import { useEffect, useRef, useState, type CSSProperties } from "react"

const ACCEPT =
  ".png,.jpg,.jpeg,.svg,.webp,.gif,image/png,image/jpeg,image/svg+xml,image/webp,image/gif"

type LogoSource = "image" | "text"

type Props = {
  block: BuilderBlock
  centered?: boolean
}

async function readImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function textMarkClass(sizeId: string) {
  if (sizeId === "compact") return "px-1.5 text-[9px] leading-tight"
  if (sizeId === "wide") return "px-2.5 text-[11px] leading-tight"
  return "px-2 text-[10px] leading-tight"
}

const iconBtnClass =
  "rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600"

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

function resolveLogoSource(content: Record<string, unknown>): LogoSource {
  return content.logoSource === "text" ? "text" : "image"
}

export function HeaderLogo({ block, centered = false }: Props) {
  const isPreview = useIsPreviewMode()
  const isAdminPreview = useIsAdminPreview()
  const canEdit = useCanEditBlockContent(block.id)
  const isReadOnly = isAdminPreview || !canEdit
  const activeScenario = usePromptBuilderStore((s) => s.activeScenario)
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const inputRef = useRef<HTMLInputElement>(null)
  const sizeMenuRef = useRef<HTMLDivElement>(null)
  const sourceMenuRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sizeOpen, setSizeOpen] = useState(false)
  const [sourceOpen, setSourceOpen] = useState(false)

  const content = block.content
  const showLogo = content.showLogo !== false
  const logoSource = resolveLogoSource(content)
  const isImageMode = logoSource === "image"
  const logoUrl = typeof content.logoUrl === "string" ? content.logoUrl.trim() : ""
  const displayLogoUrl = logoUrl || DEFAULT_COMPANY_LOGO_URL
  const sizeId = String(content.logoVariant ?? content.variant ?? "default")
  const sizePreset = getLogoSizePreset(sizeId)
  const companyName = String(
    content.companyName ?? mockBusinessProfile.companyName,
  )
  const logoDisplayCondition = (content.logoDisplayCondition ??
    null) as BlockDisplayCondition
  const hasCondition = hasConditions(logoDisplayCondition)
  const conditionSummary = describeConditionRulesShort(logoDisplayCondition)
  const logoVisible =
    !isPreview ||
    blockIsVisible(logoDisplayCondition, activeScenario)

  const isWide = sizePreset.id === "wide"

  const markStyle: CSSProperties = {
    height: `${sizePreset.heightPx}px`,
    maxWidth: `${sizePreset.maxWidthPx}px`,
    ...(isWide
      ? { width: `${sizePreset.maxWidthPx}px` }
      : isImageMode
        ? {}
        : { minWidth: `${Math.min(sizePreset.maxWidthPx, 72)}px` }),
  }

  useEffect(() => {
    if (!sizeOpen && !sourceOpen) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (sizeOpen && sizeMenuRef.current?.contains(target)) return
      if (sourceOpen && sourceMenuRef.current?.contains(target)) return
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

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    if (!isImageFile(file)) {
      setError("Use PNG, JPG, SVG, WebP, or GIF.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const url = await readImageDataUrl(file)
      updateBlockField(block.id, "logoUrl", url)
      updateBlockField(block.id, "logoFileName", file.name)
      updateBlockField(block.id, "logoSource", "image")
      updateBlockField(block.id, "showLogo", true)
    } catch {
      setError("Could not load image.")
    } finally {
      setLoading(false)
    }
  }

  const openPicker = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isReadOnly || loading || !isImageMode) return
    inputRef.current?.click()
  }

  const renderTextMark = () => {
    if (isReadOnly) {
      return (
        <span
          className={`block truncate font-semibold text-white ${textMarkClass(sizeId)}`}
        >
          {companyName.trim() || "Company name"}
        </span>
      )
    }

    return (
      <InlineEditable
        blockId={block.id}
        value={companyName}
        onChange={(value) => updateBlockField(block.id, "companyName", value)}
        placeholder="Company name"
        hoverAffordance={false}
        width="hug"
        className={`block max-w-full truncate font-semibold text-white outline-none ${textMarkClass(sizeId)}`}
      />
    )
  }

  const renderImageMark = () => {
    if (loading) {
      return <Loader2 className="size-4 animate-spin text-gray-400" />
    }

    return (
      <img
        src={displayLogoUrl}
        alt={companyName || "Company logo"}
        className={
          isWide
            ? "h-full w-full object-contain object-left"
            : "h-full w-auto max-w-full object-contain object-left"
        }
      />
    )
  }

  if (!showLogo) {
    if (isReadOnly) return null

    return (
      <div className={centered ? "flex justify-center" : ""}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            updateBlockField(block.id, "showLogo", true)
            updateBlockField(block.id, "logoSource", "image")
          }}
          className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
        >
          Add logo
        </button>
      </div>
    )
  }

  if (!logoVisible) return null

  const activeSourceOption =
    LOGO_SOURCE_OPTIONS.find((option) => option.id === logoSource) ??
    LOGO_SOURCE_OPTIONS[0]

  return (
    <div className={centered ? "flex justify-center" : ""}>
      <div
        className="group/logo inline-flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {isImageMode ? (
          <button
            type="button"
            onClick={openPicker}
            disabled={isReadOnly || loading}
            className={`relative inline-flex shrink-0 items-center justify-start overflow-hidden bg-transparent ${
              !isReadOnly && !loading ? "cursor-pointer" : ""
            }`}
            style={markStyle}
            aria-label="Replace logo"
          >
            {renderImageMark()}
          </button>
        ) : (
          <div
            className="inline-flex shrink-0 items-center justify-start overflow-hidden rounded-lg bg-[#012A38]"
            style={markStyle}
          >
            {renderTextMark()}
          </div>
        )}

        {!isReadOnly && !loading && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/logo:opacity-100 group-focus-within/logo:opacity-100">
            <div ref={sizeMenuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSizeOpen((open) => !open)
                  setSourceOpen(false)
                }}
                className={`${iconBtnClass} min-w-[42px] px-1.5`}
                aria-expanded={sizeOpen}
                aria-label="Logo size"
              >
                <span className="block text-[10px] font-medium leading-none text-gray-600 tabular-nums">
                  {sizePreset.heightPx}px
                </span>
              </button>

              {sizeOpen && (
                <div className="absolute left-0 top-full z-30 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
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

            <div ref={sourceMenuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSourceOpen((open) => !open)
                  setSizeOpen(false)
                }}
                className={`${iconBtnClass} px-1.5`}
                aria-expanded={sourceOpen}
                aria-label="Logo type"
              >
                <activeSourceOption.icon className="size-3.5" strokeWidth={1.75} />
              </button>

              {sourceOpen && (
                <div className="absolute left-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
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

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                hideLogo()
              }}
              className={`${iconBtnClass} hover:border-red-200 hover:bg-red-50 hover:text-red-600`}
              aria-label="Remove logo block"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {hasCondition && !isPreview && (
        <p className={`mt-1 text-[10px] text-amber-800 ${centered ? "text-center" : ""}`}>
          Logo shows when {conditionSummary}
        </p>
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

      {error && !isReadOnly && (
        <p className={`mt-1 text-[10px] text-red-600 ${centered ? "text-center" : ""}`}>
          {error}
        </p>
      )}
    </div>
  )
}
