import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { useCanEditBlockContent, useIsAdminPreview, useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import { isImageFile } from "@/lib/pdf-page-render"
import { getLogoSizePreset } from "@/lib/logo-size-presets"
import {
  describeConditionRulesShort,
  hasConditions,
} from "@/lib/segment-conditions"
import { DEFAULT_COMPANY_LOGO_URL } from "@/lib/default-company-logo"
import { mockBusinessProfile } from "@/mock/data"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BlockDisplayCondition, BuilderBlock } from "@/types/prompt-builder"
import { blockIsVisible } from "@/types/prompt-builder"
import { Loader2 } from "lucide-react"
import { useRef, useState, type CSSProperties } from "react"

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  const logoDisplayCondition = (content.displayCondition ??
    content.logoDisplayCondition ??
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

  return (
    <div className={`min-w-0 max-w-full ${centered ? "flex justify-center" : ""}`}>
      {isImageMode ? (
        <button
          type="button"
          onClick={openPicker}
          disabled={isReadOnly || loading}
          className={`relative inline-flex min-w-0 max-w-full items-center justify-start overflow-hidden bg-transparent ${
            !isReadOnly && !loading ? "cursor-pointer" : ""
          }`}
          style={markStyle}
          aria-label="Replace logo"
        >
          {renderImageMark()}
        </button>
      ) : (
        <div
          className="inline-flex w-fit min-w-0 max-w-full items-center justify-start overflow-hidden rounded-lg bg-[#012A38]"
          style={markStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {renderTextMark()}
        </div>
      )}

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
