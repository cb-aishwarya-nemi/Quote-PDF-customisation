export type ProcessingStepStatus = "done" | "active" | "idle"

export type ProcessingStep = {
  label: string
  status: ProcessingStepStatus
}

export type GeneratedVariant = {
  id: string
  name: string
  sourceNote: string
  tags: string[]
}

export type TestScenario = {
  label: string
  values: Record<string, string>
}

export type TemplateCategory =
  | "Enterprise"
  | "SMB"
  | "Multi-region"
  | "Order form"

export type TemplateBadge = "MOST USED" | "NEW" | "EASY SETUP"

export type PredefinedTemplate = {
  id: string
  name: string
  description: string
  category: TemplateCategory
  steps: string[]
  badge?: TemplateBadge
  secondaryBadge?: string
  insight?: string
  recommended?: boolean
  accent: "blue" | "teal" | "orange" | "slate" | "violet" | "amber"
  popularity: number
}

export const templateCategories: Array<TemplateCategory | "All"> = [
  "All",
  "Enterprise",
  "SMB",
  "Multi-region",
  "Order form",
]

export const predefinedTemplates: PredefinedTemplate[] = [
  {
    id: "preset-standard",
    name: "Standard enterprise quote",
    description:
      "Full B2B layout with header, pricing table, TCV summary, and terms at the bottom.",
    category: "Enterprise",
    steps: ["Header & logo", "Pricing table", "TCV summary", "T&C block"],
    badge: "MOST USED",
    insight: "Used on 68% of published enterprise quotes in your workspace.",
    accent: "blue",
    popularity: 98,
  },
  {
    id: "preset-pricing-first",
    name: "Pricing-first layout",
    description:
      "Leads with line items and totals when price clarity matters more than narrative.",
    category: "Enterprise",
    steps: ["Compact header", "Line items", "Discounts & tax", "Terms"],
    badge: "NEW",
    accent: "teal",
    popularity: 85,
  },
  {
    id: "preset-multi-region",
    name: "Multi-region quote",
    description:
      "Conditional T&C spans for EU, US, and APAC — routing rules pre-configured.",
    category: "Multi-region",
    steps: ["Quote details", "Pricing", "Regional T&C spans", "Signatures"],
    secondaryBadge: "3 regions",
    accent: "violet",
    popularity: 72,
  },
  {
    id: "preset-header-led",
    name: "Header-led layout",
    description:
      "Brand-forward with logo and quote metadata up top, pricing mid-page.",
    category: "Enterprise",
    steps: ["Brand header", "Billed to", "Pricing", "T&C"],
    accent: "orange",
    popularity: 64,
  },
  {
    id: "preset-order-form",
    name: "Compact order form",
    description:
      "Minimal single-page layout for shorter deals — signature-ready terms.",
    category: "Order form",
    steps: ["Billed to", "Pricing", "Net total", "Terms"],
    badge: "EASY SETUP",
    accent: "slate",
    popularity: 58,
  },
  {
    id: "preset-smb-quick",
    name: "SMB quick quote",
    description:
      "Stripped-down format for fast-moving SMB deals with fewer line items.",
    category: "SMB",
    steps: ["Logo", "Pricing list", "Total", "Standard terms"],
    accent: "amber",
    popularity: 51,
  },
]

export const mockProcessingSteps: ProcessingStep[] = [
  { label: "Reading uploaded documents", status: "done" },
  { label: "Identifying common block patterns", status: "done" },
  { label: "Extracting pricing structures", status: "active" },
  { label: "Detecting T&C and legal patterns", status: "idle" },
  { label: "Assembling template variants", status: "idle" },
]

export const mockVariants: GeneratedVariant[] = [
  {
    id: "v1",
    name: "Pricing-first layout",
    sourceNote: "Pattern from 3 of 3 uploads",
    tags: ["Pricing prominent", "T&C at bottom", "2 spans detected"],
  },
  {
    id: "v2",
    name: "Header-led layout",
    sourceNote: "Pattern from 2 of 3 uploads",
    tags: ["Brand header first", "Compact pricing", "3 spans detected"],
  },
  {
    id: "v3",
    name: "Narrative layout",
    sourceNote: "AI-suggested variant",
    tags: ["Exec summary block", "Pricing mid-page", "1 span detected"],
  },
]

export const mockScenarios: TestScenario[] = [
  {
    label: "Prepaid · EU · 24 months",
    values: { payment_terms: "Prepaid", customer_region: "EU", contract_term: "24" },
  },
  {
    label: "Net-30 · US · 12 months",
    values: { payment_terms: "Net-30", customer_region: "US", contract_term: "12" },
  },
  {
    label: "Net-60 · EU · 36 months",
    values: { payment_terms: "Net-60", customer_region: "EU", contract_term: "36" },
  },
]
