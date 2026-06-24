import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import {
  formatFooterPageNumber,
  findQuoteSummaryBlock,
  normalizeDocumentFooter,
  resolveFooterCustomerName,
  resolveFooterQuoteNumber,
} from "@/lib/document-footer"
import {
  useCanEditBlockStructure,
  useIsAdminPreview,
  useIsPreviewMode,
} from "@/hooks/use-builder-editor-mode"
import { toPlainText } from "@/lib/rich-text"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { ReactNode } from "react"

type Props = {
  pageId: string
}

export function DocumentFooter({ pageId }: Props) {
  const template = usePromptBuilderStore((s) => s.template)
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const setDocumentFooter = usePromptBuilderStore((s) => s.setDocumentFooter)
  const isPreview = useIsPreviewMode()
  const isAdminPreview = useIsAdminPreview()
  const canEditStructure = useCanEditBlockStructure()

  if (!template) return null

  const footer = normalizeDocumentFooter(template.documentFooter)
  const pageLabel = formatFooterPageNumber(template, pageId)
  const quoteNumber = resolveFooterQuoteNumber(template)
  const customerName = resolveFooterCustomerName(template)
  const quoteBlock = findQuoteSummaryBlock(template)
  const isReadOnly = isPreview || isAdminPreview || !canEditStructure

  const parts: ReactNode[] = []

  if (footer.showPageNumber && pageLabel) {
    parts.push(
      <span
        key="page"
        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap tabular-nums text-gray-400"
      >
        <span>{pageLabel}</span>
      </span>,
    )
  }

  if (footer.showQuoteNumber) {
    parts.push(
      <span key="quote" className="inline-flex shrink-0 items-baseline whitespace-nowrap">
        {isReadOnly ? (
          <span className="text-gray-500">{quoteNumber || "—"}</span>
        ) : quoteBlock ? (
          <InlineEditable
            blockId={quoteBlock.id}
            value={String(quoteBlock.content.quoteNumber ?? "")}
            onChange={(value) =>
              updateBlockField(quoteBlock.id, "quoteNumber", toPlainText(value))
            }
            className="text-gray-500"
            hoverAffordance={false}
            width="hug"
            enableFormatting={false}
            enableVariablePicker={false}
          />
        ) : (
          <InlineEditable
            value={footer.quoteNumber ?? ""}
            onChange={(value) => setDocumentFooter({ quoteNumber: toPlainText(value) })}
            className="text-gray-500"
            hoverAffordance={false}
            width="hug"
            enableFormatting={false}
            enableVariablePicker={false}
          />
        )}
      </span>,
    )
  }

  if (footer.showCustomerName) {
    parts.push(
      <span key="customer" className="inline-flex shrink-0 items-baseline whitespace-nowrap">
        {isReadOnly ? (
          <span className="text-gray-500">{customerName || "—"}</span>
        ) : quoteBlock ? (
          <InlineEditable
            blockId={quoteBlock.id}
            value={String(quoteBlock.content.customerName ?? "")}
            onChange={(value) =>
              updateBlockField(quoteBlock.id, "customerName", toPlainText(value))
            }
            className="text-gray-500"
            hoverAffordance={false}
            width="hug"
            enableFormatting={false}
            enableVariablePicker={false}
          />
        ) : (
          <InlineEditable
            value={footer.customerName ?? ""}
            onChange={(value) => setDocumentFooter({ customerName: toPlainText(value) })}
            className="text-gray-500"
            hoverAffordance={false}
            width="hug"
            enableFormatting={false}
            enableVariablePicker={false}
          />
        )}
      </span>,
    )
  }

  if (parts.length === 0) return null

  return (
    <footer
      className="group/footer mt-8 shrink-0 border-t border-gray-100 pt-3"
      aria-label="Document footer"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-medium">
        {parts.map((part, index) => (
          <span key={index} className="inline-flex items-center gap-3">
            {index > 0 && (
              <span className="text-gray-300" aria-hidden>
                ·
              </span>
            )}
            {part}
          </span>
        ))}
      </div>
    </footer>
  )
}
