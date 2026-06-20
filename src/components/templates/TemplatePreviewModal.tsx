import { GeneratedVariantPreviewDocument, isGeneratedVariantId } from "@/components/templates/GeneratedVariantPreview"
import { QuotePdfPreviewDocument } from "@/components/templates/QuotePdfPreviewDocument"
import { navigateToPromptBuilder } from "@/lib/navigate-to-builder"
import { mockVariants, predefinedTemplates } from "@/mock/data"
import { X } from "lucide-react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export type PreviewTarget =
  | { kind: "predefined"; id: string }
  | { kind: "generated"; id: string }

type Props = {
  target: PreviewTarget | null
  onClose: () => void
}

export function TemplatePreviewModal({ target, onClose }: Props) {
  const navigate = useNavigate()

  const predefined = target?.kind === "predefined"
    ? predefinedTemplates.find((t) => t.id === target.id)
    : null

  const generated = target?.kind === "generated"
    ? mockVariants.find((v) => v.id === target.id)
    : null

  const name = predefined?.name ?? generated?.name
  const previewTemplate = predefined ?? (generated
    ? { name: generated.name, steps: generated.tags }
  : null)

  const handleEditTemplate = () => {
    if (!target) return
    onClose()
    if (target.kind === "predefined" && predefined) {
      navigateToPromptBuilder(navigate, {
        presetId: predefined.id,
        name: predefined.name,
      })
    } else if (target.kind === "generated" && generated) {
      navigateToPromptBuilder(navigate, {
        variantId: generated.id,
        variantName: generated.name,
      })
    }
  }

  useEffect(() => {
    if (!target) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [target, onClose])

  if (!target || !name || !previewTemplate) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#e8eaed]">
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200/80 bg-white px-6 py-3">
        <div>
          <p className="text-[14px] font-medium text-gray-900">{name}</p>
          <p className="text-[12px] text-gray-500">Quote PDF preview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleEditTemplate}
            className="rounded-md border border-blue-600 bg-white px-3 py-1.5 text-[13px] font-medium text-blue-600 hover:bg-blue-50"
          >
            Use template
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-8">
        {generated && isGeneratedVariantId(generated.id) ? (
          <GeneratedVariantPreviewDocument
            variantId={generated.id}
            templateName={generated.name}
          />
        ) : (
          <QuotePdfPreviewDocument template={previewTemplate} />
        )}
      </div>
    </div>
  )
}
