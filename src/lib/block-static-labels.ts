export function staticLabel(
  content: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const raw = content[key]
  if (raw == null || String(raw).trim() === "") return fallback
  return String(raw)
}

export function contractFieldLabel(
  content: Record<string, unknown>,
  field: string,
  fallback: string,
): string {
  const labels = content.fieldLabels as Record<string, string> | undefined
  const custom = labels?.[field]
  if (custom != null && custom.trim() !== "") return custom
  return fallback
}

export const DEFAULT_LABELS = {
  company_details: {
    sectionLabel: "From",
  },
  quote_summary_header: {
    preparedForLabel: "Prepared for",
    quoteNumberLabel: "Quote #",
    issuedLabel: "Issued",
    validUntilLabel: "Valid until",
    validShortLabel: "Valid",
  },
  tcv_summary: {
    label: "Total contract value",
    inlineLabel: "TCV",
    oneTimeLabel: "One-time",
    recurringLabel: "Recurring / mo",
    termMonthsLabel: "Term (months)",
  },
  billed_to: {
    sectionLabel: "Billed to",
    contactColumnLabel: "Primary contact",
  },
  contract_details: {
    term: "Term",
    startDate: "Start date",
    billingCycle: "Billing cycle",
    paymentTerms: "Payment terms",
    salesperson: "Sales contact",
  },
  pricing: {
    label: "Line items",
    itemColumnLabel: "Item",
    amountColumnLabel: "Amount",
    subtotalLabel: "Subtotal",
  },
  entitlements: {
    label: "Entitlements & usage",
    nameColumnLabel: "Entitlement",
    limitColumnLabel: "Included",
    notesColumnLabel: "Notes",
  },
  terms: {
    sectionLabel: "Terms & conditions",
  },
  signature: {
    acceptanceLabel: "Acceptance",
    dateLabel: "Date",
    customerLabel: "Customer signature",
    vendorLabel: "Vendor signature",
    footerText:
      "By signing, the customer agrees to the terms and pricing in this quote.",
  },
  ae_profile: {
    sectionLabel: "Your account executive",
  },
} as const