import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import {
  resolveFooterDisplayText,
  resolveFooterEditText,
} from "@/lib/document-footer"
import {
  useCanEditBlockStructure,
  useIsAdminPreview,
  useIsPreviewMode,
} from "@/hooks/use-builder-editor-mode"
import { useActivePreviewCustomer } from "@/hooks/use-active-preview-customer"
import { toPlainText } from "@/lib/rich-text"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"

type Props = {
  pageId: string
}

export function DocumentFooter({ pageId }: Props) {
  const template = usePromptBuilderStore((s) => s.template)
  const setDocumentFooter = usePromptBuilderStore((s) => s.setDocumentFooter)
  const setSelectedBlockId = usePromptBuilderStore((s) => s.setSelectedBlockId)
  const isPreview = useIsPreviewMode()
  const isAdminPreview = useIsAdminPreview()
  const canEditStructure = useCanEditBlockStructure()
  const activeCustomer = useActivePreviewCustomer()

  if (!template) return null

  const isReadOnly = isPreview || isAdminPreview || !canEditStructure

  const previewCustomerName = activeCustomer?.values["customer.name"]?.trim()
  const displayText = resolveFooterDisplayText(template, pageId, {
    previewCustomerName,
  })
  const editText = resolveFooterEditText(template)

  if (isReadOnly && !displayText.trim()) return null

  return (
    <footer
      className={`group/footer mt-8 shrink-0 border-t pt-3 transition-colors ${
        isReadOnly
          ? "border-gray-100"
          : "border-gray-100 hover:border-gray-200 focus-within:border-gray-200"
      }`}
      aria-label="Document footer"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={() => {
        if (!isReadOnly) setSelectedBlockId(null)
      }}
    >
      {isReadOnly ? (
        <p className="whitespace-pre-wrap text-center text-[11px] font-medium text-gray-500">
          {displayText}
        </p>
      ) : (
        <InlineEditable
          value={editText}
          onChange={(value) =>
            setDocumentFooter({ text: toPlainText(value) })
          }
          multiline
          width="full"
          lineBreaks="wrap"
          enableFormatting={false}
          enableVariablePicker
          hoverAffordance={false}
          placeholder="{page} · Quote for {customer}"
          className="min-h-[2.5rem] text-center text-[11px] font-medium text-gray-500"
        />
      )}
    </footer>
  )
}
