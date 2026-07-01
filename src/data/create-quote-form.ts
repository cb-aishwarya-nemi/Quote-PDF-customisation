export type QuoteCustomerProfile = {
  contactName: string
  customerId: string
  billingAddress: string
}

export const QUOTE_CUSTOMER_PROFILES: Record<string, QuoteCustomerProfile> = {
  NovaSuite: {
    contactName: "Chris Dias Richard",
    customerId: "Customer_6bgv67u6ygt6542",
    billingAddress: "Chennai, Tamil Nadu, India",
  },
  "SEON Technologies Inc": {
    contactName: "Mohit S",
    customerId: "Customer_seon_001",
    billingAddress: "New York, NY, United States",
  },
  Linnworks: {
    contactName: "Sean O.",
    customerId: "Customer_linn_002",
    billingAddress: "London, United Kingdom",
  },
  "Zenith Analytics": {
    contactName: "Alex Rivera",
    customerId: "Customer_zen_003",
    billingAddress: "San Francisco, CA, United States",
  },
  "Nordic SaaS GmbH": {
    contactName: "Sofia Brandt",
    customerId: "Customer_nord_004",
    billingAddress: "Berlin, Germany",
  },
  "BrightLedger Ltd": {
    contactName: "James Okonkwo",
    customerId: "Customer_bright_005",
    billingAddress: "London, United Kingdom",
  },
}

export function resolveQuoteCustomerProfile(
  customerName: string,
): QuoteCustomerProfile {
  return (
    QUOTE_CUSTOMER_PROFILES[customerName] ?? {
      contactName: customerName,
      customerId: `Customer_${customerName.toLowerCase().replace(/\s+/g, "_")}`,
      billingAddress: "Chennai, Tamil Nadu, India",
    }
  )
}

export type CreateQuoteFormState = {
  customer: string
  quoteType: string
}

export const DEFAULT_CREATE_QUOTE_FORM: CreateQuoteFormState = {
  customer: "NovaSuite",
  quoteType: "New business",
}

export type QuotePdfPreviewContext = {
  quoteName: string
  quoteNumber: string
  customerCompany: string
  contactName: string
  billingAddress: string
  validUntil: string
  quoteDate: string
  lineItems: { name: string; qty: number; unit: string; total: string }[]
  subtotal: string
  totalContractValue: string
}

export function resolveCreateQuotePreviewContext(
  form: CreateQuoteFormState,
): QuotePdfPreviewContext {
  const profile = resolveQuoteCustomerProfile(form.customer)
  const quoteName = `${form.quoteType} quote for ${profile.contactName}`

  return {
    quoteName,
    quoteNumber: "QT-2026-0142",
    customerCompany: form.customer,
    contactName: profile.contactName,
    billingAddress: profile.billingAddress,
    validUntil: "09 Jul 2026",
    quoteDate: "20 Jun 2024",
    lineItems: [
      {
        name: "Analytics Enterprise - Annual (USD)",
        qty: 1,
        unit: "$48,000.00",
        total: "$48,000.00",
      },
    ],
    subtotal: "$48,000.00",
    totalContractValue: "$96,000.00",
  }
}

export function buildCreateQuotePreviewUrl(form: CreateQuoteFormState): string {
  const params = new URLSearchParams({
    customer: form.customer,
    quoteType: form.quoteType,
  })
  return `/quotes/preview?${params.toString()}`
}

export function parseCreateQuotePreviewSearch(
  search: string,
): CreateQuoteFormState {
  const params = new URLSearchParams(search)
  return {
    customer: params.get("customer") ?? DEFAULT_CREATE_QUOTE_FORM.customer,
    quoteType: params.get("quoteType") ?? DEFAULT_CREATE_QUOTE_FORM.quoteType,
  }
}
