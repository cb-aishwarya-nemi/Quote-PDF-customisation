import {
  formatQuoteCurrency,
  QUOTES_LIST_SEED,
  QUOTES_LIST_TOTAL,
  quoteStatusLabel,
  type QuoteListRecord,
  type QuoteStatus,
} from "@/data/quotes-list-seed"
import { CreateQuoteModal } from "@/components/quotes/CreateQuoteModal"
import {
  ChevronDown,
  Filter,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

const STATUS_STYLES: Record<
  QuoteStatus,
  { pill: string; text: string }
> = {
  accepted: {
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    text: "text-emerald-700",
  },
  invoiced: {
    pill: "bg-sky-50 text-sky-700 ring-sky-100",
    text: "text-sky-700",
  },
  expired: {
    pill: "bg-rose-50 text-rose-700 ring-rose-100",
    text: "text-rose-700",
  },
}

function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const styles = STATUS_STYLES[status]
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles.pill}`}
    >
      {quoteStatusLabel(status)}
    </span>
  )
}

function QuoteRow({ quote }: { quote: QuoteListRecord }) {
  return (
    <tr className="group border-b border-gray-100 transition-colors hover:bg-gray-50/90 hover:shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <td className="whitespace-nowrap px-4 py-3 align-top">
        <div className="flex items-center gap-2">
          <QuoteStatusBadge status={quote.status} />
          <button
            type="button"
            className="text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            # {quote.number}
          </button>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="text-[13px] leading-snug text-gray-900">
          {quote.contactName}
        </div>
        <button
          type="button"
          className="mt-0.5 text-left text-[13px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          {quote.companyName}
        </button>
        <div className="mt-0.5 text-[12px] text-gray-500">{quote.email}</div>
        <div className="text-[12px] text-gray-500">{quote.phone}</div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-[13px] text-gray-800">
        {quote.createdAt}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-[13px] text-gray-800">
        {quote.expiryDate}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-[13px] text-gray-800">
        {formatQuoteCurrency(quote.totalContractValue)}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-top text-[13px] text-gray-800">
        {formatQuoteCurrency(quote.chargeOnAcceptance)}
      </td>
    </tr>
  )
}

export function QuotesListPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [createQuoteOpen, setCreateQuoteOpen] = useState(false)

  const filteredQuotes = useMemo(() => {
    const query = search.trim()
    if (!query) return QUOTES_LIST_SEED
    return QUOTES_LIST_SEED.filter((quote) =>
      String(quote.number).includes(query.replace(/^#\s*/, "")),
    )
  }, [search])

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 border-b border-gray-200 px-6 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-800 hover:bg-gray-50"
          >
            All Quotes
            <ChevronDown className="size-3.5 text-gray-500" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <Filter className="size-3.5 text-gray-500" />
            Filter list
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50/60 px-3 py-1.5 text-[13px] font-medium text-violet-700 hover:bg-violet-50"
          >
            <Sparkles className="size-3.5" />
            Ask AI
          </button>

          <button
            type="button"
            onClick={() => setCreateQuoteOpen(true)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 text-[13px] font-medium text-white hover:bg-blue-700"
          >
            <Plus className="size-3.5" />
            Create Quote
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="shrink-0 text-[13px] font-medium text-gray-700">
            {filteredQuotes.length === QUOTES_LIST_TOTAL
              ? `${QUOTES_LIST_TOTAL} Quotes`
              : `${filteredQuotes.length} of ${QUOTES_LIST_TOTAL} Quotes`}
          </p>

          <div className="relative min-w-[220px] flex-1 sm:max-w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for Quote Number"
              className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              aria-label="Search for Quote Number"
            />
          </div>

          <button
            type="button"
            className="ml-auto inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            aria-label="Change table view"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[960px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
            <tr className="border-b border-gray-200 text-[12px] font-semibold text-gray-600">
              <th className="px-4 py-2.5 font-semibold">Quote</th>
              <th className="px-4 py-2.5 font-semibold">Customer Info</th>
              <th className="px-4 py-2.5 font-semibold">
                <span className="inline-flex items-center gap-1">
                  Created At
                  <ChevronDown className="size-3.5" aria-hidden />
                </span>
              </th>
              <th className="px-4 py-2.5 font-semibold">Expiry Date</th>
              <th className="px-4 py-2.5 font-semibold">Total Contract Value</th>
              <th className="px-4 py-2.5 font-semibold">Charge On Acceptance</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.map((quote) => (
              <QuoteRow key={quote.id} quote={quote} />
            ))}
          </tbody>
        </table>
      </div>

      <CreateQuoteModal
        open={createQuoteOpen}
        onClose={() => setCreateQuoteOpen(false)}
        onProceed={({ customer, quoteType }) =>
          navigate("/quotes/new", { state: { customer, quoteType } })
        }
      />
    </div>
  )
}
