import { useCanEditBlockContent, useIsAdminPreview, useIsPreviewMode } from "@/hooks/use-builder-editor-mode"
import { isImageFile } from "@/lib/pdf-page-render"
import {
  describeConditionRulesShort,
  hasConditions,
} from "@/lib/segment-conditions"
import { mockBusinessProfile } from "@/mock/data"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BlockDisplayCondition, BuilderBlock } from "@/types/prompt-builder"
import { blockIsVisible } from "@/types/prompt-builder"
import { Loader2, Pencil, Trash2 } from "lucide-react"
import { useRef, useState } from "react"

const ACCEPT =
  ".png,.jpg,.jpeg,.svg,.webp,.gif,image/png,image/jpeg,image/svg+xml,image/webp,image/gif"

type Props = {
  block: BuilderBlock
  centered?: boolean
  compact?: boolean
}

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

async function readImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function logoSizeClasses(logoVariant: string, compact?: boolean) {
  if (logoVariant === "wide") {
    return { box: "h-10 max-w-[168px]", mark: "size-10 text-[13px]" }
  }
  if (logoVariant === "compact" || compact) {
    return { box: "h-7 max-w-[96px]", mark: "size-7 text-[10px]" }
  }
  return { box: "h-10 max-w-[140px]", mark: "size-10 text-[13px]" }
}

const iconBtnClass =
  "rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600"

export function HeaderLogo({ block, centered = false, compact = false }: Props) {
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
  const logoUrl = typeof content.logoUrl === "string" ? content.logoUrl : ""
  const hasUploadedLogo = logoUrl.length > 0
  const logoVariant = String(content.logoVariant ?? content.variant ?? "default")
  const { box: sizeClass, mark: markClass } = logoSizeClasses(logoVariant, compact)
  const initials = companyInitials(mockBusinessProfile.companyName)
  const logoDisplayCondition = (content.logoDisplayCondition ??
    null) as BlockDisplayCondition
  const hasCondition = hasConditions(logoDisplayCondition)
  const conditionSummary = describeConditionRulesShort(logoDisplayCondition)
  const logoVisible =
    !isPreview ||
    blockIsVisible(logoDisplayCondition, activeScenario)

  const clearUploadedLogo = () => {
    updateBlockField(block.id, "logoUrl", "")
    updateBlockField(block.id, "logoFileName", "")
    setError(null)
  }

  const hideLogo = () => {
    clearUploadedLogo()
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
      updateBlockField(block.id, "showLogo", true)
    } catch {
      setError("Could not load image.")
    } finally {
      setLoading(false)
    }
  }

  const openPicker = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (isReadOnly || loading) return
    inputRef.current?.click()
  }

  if (!showLogo) {
    if (isReadOnly) return null

    return (
      <div className={`${centered ? "flex justify-center" : ""} ${compact ? "mb-2" : "mb-4"}`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            updateBlockField(block.id, "showLogo", true)
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
    <div className={`${centered ? "flex justify-center" : ""} ${compact ? "mb-2" : "mb-4"}`}>
      <div
        className="group/logo inline-flex items-center gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={openPicker}
          disabled={isReadOnly || loading}
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-gray-200/90 ${
            hasUploadedLogo
              ? `bg-white ${sizeClass}`
              : `bg-[#012A38] font-semibold text-white ${markClass}`
          } ${!isReadOnly && !loading ? "cursor-pointer" : ""}`}
          aria-label={hasUploadedLogo ? "Replace logo" : "Edit logo"}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin text-gray-400" />
          ) : hasUploadedLogo ? (
            <img
              src={logoUrl}
              alt="Company logo"
              className="max-h-full max-w-full object-contain p-1"
            />
          ) : (
            <span aria-hidden>{initials}</span>
          )}
        </button>

        {!isReadOnly && !loading && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/logo:opacity-100 group-focus-within/logo:opacity-100">
            <button
              type="button"
              onClick={openPicker}
              className={iconBtnClass}
              aria-label={hasUploadedLogo ? "Replace logo" : "Edit logo"}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (hasUploadedLogo) {
                  clearUploadedLogo()
                } else {
                  hideLogo()
                }
              }}
              className={`${iconBtnClass} hover:border-red-200 hover:bg-red-50 hover:text-red-600`}
              aria-label="Remove logo"
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
