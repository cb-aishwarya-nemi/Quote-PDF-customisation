export type BlockType =
  | "header"
  | "quote_details"
  | "billed_to"
  | "company_details"
  | "tcv_billing"
  | "pricing"
  | "signature"
  | "terms"

export type Block = {
  id: string
  type: BlockType
  order: number
  layout: {
    topPadding: number
    showBorder: boolean
  }
  content: Record<string, unknown>
}

export type TemplateStatus = "draft" | "published" | "archived"

export type Template = {
  id: string
  name: string
  status: TemplateStatus
  blocks: Block[]
  createdAt: string
  updatedAt: string
}

export type EditorSource = {
  mode?: "blank" | "preset" | "upload"
  presetId?: string
  presetName?: string
  variantId?: string
  variantName?: string
}
