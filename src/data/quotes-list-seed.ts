export type QuoteStatus = "accepted" | "invoiced" | "expired"

export type QuoteListRecord = {
  id: string
  number: number
  status: QuoteStatus
  contactName: string
  companyName: string
  email: string
  phone: string
  createdAt: string
  expiryDate: string
  totalContractValue: number
  chargeOnAcceptance: number
}

const SEON = {
  contactName: "Mohit S",
  companyName: "SEON Technologies Inc",
  email: "mohit.s@seon.io",
  phone: "(929) 999-9999",
} as const

const LINNWORKS = {
  contactName: "Sean O.",
  companyName: "Linnworks",
  email: "sean.o@linnworks.com",
  phone: "(415) 555-0182",
} as const

const BASE_ROWS: Omit<QuoteListRecord, "id" | "number">[] = [
  {
    status: "accepted",
    ...SEON,
    createdAt: "26-Jun-2026 05:09",
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue: 251_656,
    chargeOnAcceptance: 317_500,
  },
  {
    status: "invoiced",
    ...SEON,
    createdAt: "26-Jun-2026 05:09",
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue: 251_656,
    chargeOnAcceptance: 317_500,
  },
  {
    status: "expired",
    ...LINNWORKS,
    createdAt: "26-Jun-2026 05:09",
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue: 251_656,
    chargeOnAcceptance: 317_500,
  },
  {
    status: "accepted",
    ...SEON,
    createdAt: "26-Jun-2026 05:09",
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue: 251_656,
    chargeOnAcceptance: 317_500,
  },
  {
    status: "expired",
    ...LINNWORKS,
    createdAt: "26-Jun-2026 05:09",
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue: 251_656,
    chargeOnAcceptance: 317_500,
  },
  {
    status: "invoiced",
    ...SEON,
    createdAt: "26-Jun-2026 05:09",
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue: 251_656,
    chargeOnAcceptance: 317_500,
  },
  {
    status: "expired",
    ...SEON,
    createdAt: "26-Jun-2026 05:09",
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue: 251_656,
    chargeOnAcceptance: 317_500,
  },
  {
    status: "expired",
    ...SEON,
    createdAt: "26-Jun-2026 05:09",
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue: 251_656,
    chargeOnAcceptance: 317_500,
  },
]

const EXTRA_CUSTOMERS = [
  {
    contactName: "Alex Rivera",
    companyName: "Zenith Analytics",
    email: "alex.rivera@zenith.io",
    phone: "(628) 555-0144",
  },
  {
    contactName: "Sofia Brandt",
    companyName: "Nordic SaaS GmbH",
    email: "sofia.b@nordicsaas.de",
    phone: "+49 30 555 0198",
  },
  {
    contactName: "James Okonkwo",
    companyName: "BrightLedger Ltd",
    email: "james@brightledger.co.uk",
    phone: "+44 20 7946 0958",
  },
  {
    contactName: "Kenji Watanabe",
    companyName: "Pacific RevOps",
    email: "kenji@pacrevops.sg",
    phone: "+65 6123 4567",
  },
] as const

const STATUSES: QuoteStatus[] = ["accepted", "invoiced", "expired"]

function buildQuote(number: number): QuoteListRecord {
  const template = BASE_ROWS[(974 - number) % BASE_ROWS.length]
  const customer = EXTRA_CUSTOMERS[number % EXTRA_CUSTOMERS.length]
  const useAltCustomer = number % 5 === 0

  const day = 26 - Math.floor((974 - number) / 4)
  const paddedDay = String(Math.max(1, day)).padStart(2, "0")

  return {
    id: `quote-${number}`,
    number,
    status: STATUSES[number % STATUSES.length],
    contactName: useAltCustomer ? customer.contactName : template.contactName,
    companyName: useAltCustomer ? customer.companyName : template.companyName,
    email: useAltCustomer ? customer.email : template.email,
    phone: useAltCustomer ? customer.phone : template.phone,
    createdAt: `${paddedDay}-Jun-2026 05:09`,
    expiryDate: "06-Jul-2026 23:59",
    totalContractValue:
      template.totalContractValue - ((974 - number) % 7) * 1_250,
    chargeOnAcceptance:
      template.chargeOnAcceptance - ((974 - number) % 5) * 2_500,
  }
}

/** Demo library — 73 quotes, newest first. */
export const QUOTES_LIST_SEED: QuoteListRecord[] = Array.from(
  { length: 73 },
  (_, index) => buildQuote(974 - index),
)

export const QUOTES_LIST_TOTAL = QUOTES_LIST_SEED.length

export function formatQuoteCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`
}

export function quoteStatusLabel(status: QuoteStatus): string {
  switch (status) {
    case "accepted":
      return "ACCEPTED"
    case "invoiced":
      return "INVOICED"
    case "expired":
      return "EXPIRED"
  }
}
