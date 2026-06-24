import { CompanyAddressBlockView } from "@/components/prompt-builder/variants/CompanyAddressBlockView"
import { CompanyLogoBlockView } from "@/components/prompt-builder/variants/CompanyLogoBlockView"
import { EntitlementsBlockView } from "@/components/prompt-builder/variants/EntitlementsBlockView"
import { InlineEditable } from "@/components/prompt-builder/InlineEditable"
import { CustomTableBlockView } from "@/components/prompt-builder/variants/CustomTableBlockView"
import { ImageBlockEditor } from "@/components/prompt-builder/ImageBlockEditor"
import { QuoteSummaryHeaderView } from "@/components/prompt-builder/QuoteSummaryHeaderView"
import { TermsBlockView } from "@/components/prompt-builder/TermsBlockView"
import { AeProfileView } from "@/components/prompt-builder/variants/AeProfileView"
import { BilledToView } from "@/components/prompt-builder/variants/BilledToView"
import { ContractDetailsView } from "@/components/prompt-builder/variants/ContractDetailsView"
import { CustomTextBlockView } from "@/components/prompt-builder/variants/CustomTextBlockView"
import { PricingTableView } from "@/components/prompt-builder/variants/PricingTableView"
import { SignatureBlockView } from "@/components/prompt-builder/variants/SignatureBlockView"
import { TcvSummaryView } from "@/components/prompt-builder/variants/TcvSummaryView"
import { usePromptBuilderStore } from "@/store/prompt-builder-store"
import type { BuilderBlock } from "@/types/prompt-builder"

type Props = {
  block: BuilderBlock
}

export function BuilderBlockView({ block }: Props) {
  const updateBlockField = usePromptBuilderStore((s) => s.updateBlockField)
  const c = block.content
  const variant = String(c.variant ?? "classic")

  const onField = (field: string, value: unknown) =>
    updateBlockField(block.id, field, value)

  switch (block.type) {
    case "company_logo":
      return <CompanyLogoBlockView block={block} />

    case "company_address":
      return (
        <CompanyAddressBlockView
          block={block}
          onField={(field, value) => onField(field, value)}
        />
      )

    case "quote_summary_header":
      return (
        <QuoteSummaryHeaderView
          block={block}
          onField={(field, value) => onField(field, value)}
        />
      )

    case "tcv_summary":
      return (
        <TcvSummaryView
          block={block}
          onField={(field, value) => onField(field, value)}
        />
      )

    case "billed_to":
      return (
        <BilledToView
          block={block}
          onField={(field, value) => onField(field, value)}
        />
      )

    case "contract_details":
      return <ContractDetailsView block={block} onField={onField} />

    case "pricing":
      return <PricingTableView block={block} onField={onField} />

    case "entitlements":
      return <EntitlementsBlockView block={block} onField={onField} />

    case "terms":
      return (
        <TermsBlockView
          block={block}
          onField={(field, value) => onField(field, value)}
        />
      )

    case "custom_text":
      return (
        <CustomTextBlockView
          block={block}
          onField={(field, value) => onField(field, value)}
        />
      )

    case "custom_table":
      return <CustomTableBlockView block={block} onField={onField} />

    case "custom_image":
      return (
        <ImageBlockEditor
          blockId={block.id}
          content={c}
          caption={
            variant === "framed" ? (
              <InlineEditable
                blockId={block.id}
                value={String(c.caption ?? c.alt ?? "Figure caption")}
                onChange={(v) => onField("caption", v)}
                className="block text-center text-[10px] italic text-gray-500"
              />
            ) : undefined
          }
        />
      )

    case "signature":
      return (
        <SignatureBlockView
          block={block}
          onField={(field, value) => onField(field, value)}
        />
      )

    case "ae_profile":
      return (
        <AeProfileView
          block={block}
          onField={(field, value) => onField(field, value)}
        />
      )

    default:
      return null
  }
}
