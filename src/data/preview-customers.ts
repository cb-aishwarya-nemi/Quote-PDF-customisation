import type { PreviewScenario } from "@/types/prompt-builder"
import { PREVIEW_SCENARIOS } from "@/types/prompt-builder"

export type PreviewCustomerRow = {
  item: string
  amount: string
  description?: string
}

export type PreviewEntitlementRow = {
  name: string
  limit: string
  notes: string
}

export type PreviewCustomer = {
  id: string
  label: string
  scenarioId: string
  values: Record<string, string>
  pricingRows: PreviewCustomerRow[]
  entitlementRows: PreviewEntitlementRow[]
}

const ZENITH_ANALYTICS: PreviewCustomer = {
  id: "cust-zenith",
  label: "Zenith Analytics",
  scenarioId: "new-us",
  values: {
    "company.name": "Chargebee Inc.",
    "company.address": "340 S Lemon Ave #1532\nWalnut, CA 91789",
    "company.tax_id": "Tax ID 45-6789012",
    "company.entity": "Chargebee Inc. (Delaware)",
    "quote.number": "QT-2026-0881",
    "quote.issued_date": "Jun 18, 2026",
    "quote.valid_until": "Jul 18, 2026",
    "customer.name": "Zenith Analytics",
    "quote.tcv_amount": "$284,400",
    "quote.tcv_term": "over 36 months",
    "quote.one_time_fees": "$15,000",
    "quote.recurring_amount": "$7,483 / mo",
    "contract.term_months": "36",
    "customer.billing_name": "Zenith Analytics, Inc.",
    "customer.contact_name": "Maya Chen",
    "customer.email": "maya.chen@zenithanalytics.com",
    "customer.billing_address":
      "575 Market St, Floor 12\nSan Francisco, CA 94105",
    "contract.term": "36 months",
    "contract.start_date": "Aug 1, 2026",
    "contract.billing_cycle": "Annual",
    "contract.payment_terms": "Net-30",
    "quote.salesperson": "Alex Rivera",
    "quote.subtotal": "$248,400",
    "quote.entitlements_label": "Entitlements & usage",
    "ae.name": "Alex Rivera",
    "ae.title": "Enterprise Account Executive",
    "ae.email": "alex.rivera@chargebee.com",
    "ae.phone": "+1 (415) 555-0194",
  },
  pricingRows: [
    {
      item: "Growth Plan — Annual",
      amount: "$156,000",
      description: "Core billing platform for up to 500K invoices / year.",
    },
    {
      item: "RevRec add-on",
      amount: "$48,000",
      description: "Automated revenue recognition for multi-element deals.",
    },
    {
      item: "Implementation & migration",
      amount: "$15,000",
      description: "White-glove onboarding, catalog migration, and UAT support.",
    },
  ],
  entitlementRows: [
    {
      name: "Invoices processed",
      limit: "500K / year",
      notes: "Overage billed quarterly at published rates.",
    },
    {
      name: "Admin seats",
      limit: "25 users",
      notes: "Named seats; read-only viewers excluded from count.",
    },
    {
      name: "Premium support",
      limit: "24×5",
      notes: "Dedicated CSM with monthly governance calls.",
    },
  ],
}

const MERIDIAN_HEALTH: PreviewCustomer = {
  id: "cust-meridian",
  label: "Meridian Health Systems",
  scenarioId: "new-de",
  values: {
    "company.name": "Chargebee GmbH",
    "company.address": "Friedrichstraße 123\n10117 Berlin, Germany",
    "company.tax_id": "VAT DE298765432",
    "company.entity": "Chargebee GmbH",
    "quote.number": "QT-2026-0914",
    "quote.issued_date": "Jun 20, 2026",
    "quote.valid_until": "Jul 20, 2026",
    "customer.name": "Meridian Health Systems",
    "quote.tcv_amount": "€192,600",
    "quote.tcv_term": "over 24 months",
    "quote.one_time_fees": "€12,500",
    "quote.recurring_amount": "€7,504 / mo",
    "contract.term_months": "24",
    "customer.billing_name": "Meridian Health Systems GmbH",
    "customer.contact_name": "Thomas Keller",
    "customer.email": "thomas.keller@meridian-health.de",
    "customer.billing_address": "Leopoldstraße 54\n80802 München, Germany",
    "contract.term": "24 months",
    "contract.start_date": "Sep 1, 2026",
    "contract.billing_cycle": "Annual",
    "contract.payment_terms": "Net-30",
    "quote.salesperson": "Sofia Brandt",
    "quote.subtotal": "€168,100",
    "quote.entitlements_label": "Entitlements & usage",
    "ae.name": "Sofia Brandt",
    "ae.title": "Account Executive, DACH",
    "ae.email": "sofia.brandt@chargebee.com",
    "ae.phone": "+49 30 5557 2190",
  },
  pricingRows: [
    {
      item: "Enterprise Platform — EU data residency",
      amount: "€118,000",
      description: "Hosted in Frankfurt with GDPR-compliant data processing.",
    },
    {
      item: "Professional services",
      amount: "€37,600",
      description: "ERP integration and localized tax configuration.",
    },
    {
      item: "On-site training",
      amount: "€12,500",
      description: "Two-day finance ops workshop in Munich.",
    },
  ],
  entitlementRows: [
    {
      name: "Billing entities",
      limit: "3 entities",
      notes: "Includes DE, AT, and CH legal entities.",
    },
    {
      name: "API throughput",
      limit: "2M calls / month",
      notes: "Burst up to 2.2M without overage for first 90 days.",
    },
    {
      name: "Localization pack",
      limit: "DE + EN",
      notes: "Quote PDFs and customer portal in German and English.",
    },
  ],
}

const PACIFIC_TRADE: PreviewCustomer = {
  id: "cust-pacific",
  label: "Pacific Trade Group",
  scenarioId: "new-apac",
  values: {
    "company.name": "Chargebee Pte. Ltd.",
    "company.address": "8 Marina View #43-01\nAsia Square Tower 1, Singapore 018960",
    "company.tax_id": "GST M90345678X",
    "company.entity": "Chargebee Pte. Ltd.",
    "quote.number": "QT-2026-0942",
    "quote.issued_date": "Jun 22, 2026",
    "quote.valid_until": "Jul 22, 2026",
    "customer.name": "Pacific Trade Group",
    "quote.tcv_amount": "S$186,000",
    "quote.tcv_term": "over 12 months",
    "quote.one_time_fees": "S$8,000",
    "quote.recurring_amount": "S$14,833 / mo",
    "contract.term_months": "12",
    "customer.billing_name": "Pacific Trade Group Pte Ltd",
    "customer.contact_name": "Priya Natarajan",
    "customer.email": "priya.natarajan@pacifictrade.sg",
    "customer.billing_address": "1 Raffles Place, #20-61\nSingapore 048616",
    "contract.term": "12 months",
    "contract.start_date": "Aug 15, 2026",
    "contract.billing_cycle": "Quarterly",
    "contract.payment_terms": "Prepaid",
    "quote.salesperson": "Kenji Watanabe",
    "quote.subtotal": "S$178,000",
    "quote.entitlements_label": "Entitlements & usage",
    "ae.name": "Kenji Watanabe",
    "ae.title": "Account Executive, APAC",
    "ae.email": "kenji.watanabe@chargebee.com",
    "ae.phone": "+65 6123 4401",
  },
  pricingRows: [
    {
      item: "Starter Plus — Prepaid annual",
      amount: "S$96,000",
      description: "Prepaid commitment with quarterly true-up.",
    },
    {
      item: "Usage metering module",
      amount: "S$54,000",
      description: "Event-based rating for marketplace transaction fees.",
    },
    {
      item: "Premium support",
      amount: "S$28,000",
      description: "Follow-the-sun support with 4-hour Sev-1 response.",
    },
  ],
  entitlementRows: [
    {
      name: "Transactions rated",
      limit: "1.2M / month",
      notes: "Prepaid blocks; overage invoiced monthly in arrears.",
    },
    {
      name: "Marketplace connectors",
      limit: "3 integrations",
      notes: "Shopee, Lazada, and custom REST catalog included.",
    },
    {
      name: "Support window",
      limit: "24×7",
      notes: "English support with optional Japanese business-hours escalation.",
    },
  ],
}

const NORTHWIND_RETAIL: PreviewCustomer = {
  id: "cust-northwind",
  label: "Northwind Retail",
  scenarioId: "exp-eu",
  values: {
    "company.name": "Chargebee Ltd.",
    "company.address": "10 Finsbury Square\nLondon EC2A 1AF, United Kingdom",
    "company.tax_id": "VAT GB123456789",
    "company.entity": "Chargebee Ltd.",
    "quote.number": "QT-2026-0978",
    "quote.issued_date": "Jun 24, 2026",
    "quote.valid_until": "Jul 24, 2026",
    "customer.name": "Northwind Retail",
    "quote.tcv_amount": "£94,200",
    "quote.tcv_term": "co-termed 18 months",
    "quote.one_time_fees": "£0",
    "quote.recurring_amount": "£5,233 / mo",
    "contract.term_months": "18",
    "customer.billing_name": "Northwind Retail Ltd",
    "customer.contact_name": "Elena Vasquez",
    "customer.email": "elena.vasquez@northwind-retail.co.uk",
    "customer.billing_address": "221B Baker Street\nLondon NW1 6XE, United Kingdom",
    "contract.term": "18 months (co-term)",
    "contract.start_date": "Oct 1, 2026",
    "contract.billing_cycle": "Monthly",
    "contract.payment_terms": "Net-30",
    "quote.salesperson": "James Okonkwo",
    "quote.subtotal": "£94,200",
    "quote.entitlements_label": "Expansion entitlements",
    "ae.name": "James Okonkwo",
    "ae.title": "Customer Success Manager",
    "ae.email": "james.okonkwo@chargebee.com",
    "ae.phone": "+44 20 7946 0822",
  },
  pricingRows: [
    {
      item: "Usage analytics add-on",
      amount: "£42,000",
      description: "Co-termed expansion for real-time burn-down dashboards.",
    },
    {
      item: "Additional API capacity",
      amount: "£31,200",
      description: "Adds 1M monthly API calls to existing commitment.",
    },
    {
      item: "EU e-invoicing connector",
      amount: "£21,000",
      description: "Peppol-ready invoice delivery for UK and EU entities.",
    },
  ],
  entitlementRows: [
    {
      name: "API calls",
      limit: "3M / month",
      notes: "Co-termed with master agreement through Mar 2028.",
    },
    {
      name: "Analytics workspaces",
      limit: "5 workspaces",
      notes: "One workspace per regional finance hub.",
    },
    {
      name: "E-invoice endpoints",
      limit: "2 entities",
      notes: "UK and Ireland legal entities included.",
    },
  ],
}

export const PREVIEW_CUSTOMERS: PreviewCustomer[] = [
  ZENITH_ANALYTICS,
  MERIDIAN_HEALTH,
  PACIFIC_TRADE,
  NORTHWIND_RETAIL,
]

export function findPreviewCustomer(id: string | null | undefined): PreviewCustomer | null {
  if (!id) return null
  return PREVIEW_CUSTOMERS.find((customer) => customer.id === id) ?? null
}

export function scenarioForPreviewCustomer(
  customer: PreviewCustomer,
): PreviewScenario | undefined {
  return PREVIEW_SCENARIOS.find((scenario) => scenario.id === customer.scenarioId)
}
