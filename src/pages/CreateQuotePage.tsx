import {
  Bold,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Italic,
  Link2,
  List,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Plus,
  Strikethrough,
  Underline,
  User,
  X,
} from "lucide-react"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  buildCreateQuotePreviewUrl,
  DEFAULT_CREATE_QUOTE_FORM,
  resolveQuoteCustomerProfile,
  type CreateQuoteFormState,
} from "@/data/create-quote-form"

type LocationState = Partial<CreateQuoteFormState>

function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[12px] text-gray-700">
      {children}
      <span className="text-red-500"> *</span>
    </label>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[12px] text-gray-700">{children}</label>
  )
}

function TextInput({
  value,
  placeholder,
  readOnly,
}: {
  value?: string
  placeholder?: string
  readOnly?: boolean
}) {
  return (
    <input
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`w-full rounded border border-gray-300 px-2.5 py-1.5 text-[13px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${
        readOnly ? "bg-gray-50 text-gray-600" : "bg-white"
      }`}
    />
  )
}

function SelectInput({ value }: { value: string }) {
  return (
    <div className="relative">
      <select
        defaultValue={value}
        className="w-full appearance-none rounded border border-gray-300 bg-white px-2.5 py-1.5 pr-8 text-[13px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        <option>{value}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between bg-gray-100 px-4 py-2.5 text-left"
    >
      <span className="text-[13px] font-semibold text-gray-800">{title}</span>
      {open ? (
        <ChevronUp className="size-4 text-gray-500" />
      ) : (
        <ChevronDown className="size-4 text-gray-500" />
      )}
    </button>
  )
}

export function CreateQuotePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? null) as LocationState | null

  const form = {
    customer: state?.customer ?? DEFAULT_CREATE_QUOTE_FORM.customer,
    quoteType: state?.quoteType ?? DEFAULT_CREATE_QUOTE_FORM.quoteType,
  }

  const profile = useMemo(
    () => resolveQuoteCustomerProfile(form.customer),
    [form.customer],
  )

  const pageTitle = `${form.quoteType} quote for ${profile.contactName}`
  const quoteName = pageTitle

  const [detailsOpen, setDetailsOpen] = useState(true)
  const [productsOpen, setProductsOpen] = useState(true)
  const [billingOpen, setBillingOpen] = useState(true)

  const openQuotePdfPreview = () => {
    const url = buildCreateQuotePreviewUrl(form)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="shrink-0 border-b border-gray-200 px-5 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/quotes")}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <h1 className="truncate text-[15px] font-semibold text-gray-900">
              {pageTitle}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={openQuotePdfPreview}
              className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-[13px] font-medium text-gray-700 hover:bg-gray-50"
            >
              Preview quote PDF
            </button>
            <button
              type="button"
              className="rounded-md bg-blue-600 px-4 py-1.5 text-[13px] font-medium text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-[12px] text-gray-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
              NewQuote
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-gray-800">
              <User className="size-3.5 text-gray-500" />
              {profile.contactName}
            </span>
            <span className="inline-flex items-center gap-1 text-gray-500">
              ID: {profile.customerId}
              <button
                type="button"
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Copy customer ID"
              >
                <Copy className="size-3" />
              </button>
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-[12px]">
            <span>
              Total discount:{" "}
              <strong className="font-semibold text-gray-900">
                $0.00 USD (0.00%)
              </strong>
            </span>
            <span>
              Total contract value:{" "}
              <strong className="font-semibold text-gray-900">
                $96,000.00 USD
              </strong>
            </span>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-gray-200">
          <SectionHeader
            title="Quote and contract details"
            open={detailsOpen}
            onToggle={() => setDetailsOpen((open) => !open)}
          />
          {detailsOpen && (
            <div className="grid gap-8 px-6 py-5 lg:grid-cols-2">
              <div>
                <h3 className="mb-4 text-[13px] font-semibold text-gray-800">
                  Quote information
                </h3>
                <div className="space-y-3">
                  <div>
                    <RequiredLabel>Quote name</RequiredLabel>
                    <TextInput value={quoteName} />
                  </div>
                  <div>
                    <RequiredLabel>Valid till</RequiredLabel>
                    <div className="relative">
                      <TextInput value="09 Jul 2026" readOnly />
                      <Calendar className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Customer tier</FieldLabel>
                    <SelectInput value="Choose" />
                  </div>
                  <div>
                    <FieldLabel>Integration Meta</FieldLabel>
                    <textarea
                      readOnly
                      defaultValue="Meta for Chargebee-HubSpot sales-driven workflow. Please do not edit this field."
                      className="min-h-[56px] w-full resize-none rounded border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-[12px] text-gray-600 outline-none"
                    />
                  </div>
                  <div>
                    <FieldLabel>Quote owner</FieldLabel>
                    <TextInput />
                  </div>
                  <div>
                    <FieldLabel>Subscription description</FieldLabel>
                    <textarea className="min-h-[56px] w-full resize-none rounded border border-gray-300 px-2.5 py-1.5 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  </div>
                  <div>
                    <RequiredLabel>Segment</RequiredLabel>
                    <SelectInput value="Choose" />
                  </div>
                  <div>
                    <FieldLabel>Industry</FieldLabel>
                    <SelectInput value="Choose" />
                  </div>
                  <div>
                    <FieldLabel>Quote notes</FieldLabel>
                    <div className="relative">
                      <textarea className="min-h-[72px] w-full resize-none rounded border border-gray-300 px-2.5 py-1.5 pr-8 text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                      <Copy className="pointer-events-none absolute right-2 top-2 size-3.5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-[13px] font-semibold text-gray-800">
                  Contract information
                </h3>
                <div className="space-y-3">
                  <div>
                    <FieldLabel>Contract start option</FieldLabel>
                    <SelectInput value="Specific Date" />
                  </div>
                  <div>
                    <RequiredLabel>Contract type</RequiredLabel>
                    <SelectInput value="Non Renewing" />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Subscription terminates at the end of the contract.
                    </p>
                  </div>
                  <div>
                    <RequiredLabel>Currency</RequiredLabel>
                    <SelectInput value="USD" />
                  </div>
                  <div>
                    <RequiredLabel>Contract start date</RequiredLabel>
                    <div className="relative">
                      <TextInput value="20 Jun 2024" readOnly />
                      <Calendar className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <RequiredLabel>Contract duration</RequiredLabel>
                    <div className="flex items-center gap-2">
                      <TextInput value="24" />
                      <span className="text-[13px] text-gray-600">months</span>
                    </div>
                  </div>
                  <label className="flex items-start gap-2 text-[12px] text-gray-700">
                    <input type="checkbox" className="mt-0.5" />
                    <span>
                      Allow free period
                      <span className="mt-0.5 block text-[11px] text-gray-500">
                        Extends the initial term by the free period length.
                      </span>
                    </span>
                  </label>
                  <div>
                    <RequiredLabel>Contract end date</RequiredLabel>
                    <TextInput value="19 Jun 2026" readOnly />
                  </div>
                  <div>
                    <FieldLabel>PO number</FieldLabel>
                    <TextInput placeholder="Enter PO number" />
                  </div>
                  <label className="flex items-center gap-2 text-[12px] text-gray-700">
                    <input type="checkbox" defaultChecked />
                    Apply contract end terms
                  </label>
                  <div>
                    <FieldLabel>On contract end</FieldLabel>
                    <SelectInput value="Contract renews" />
                  </div>
                  <div>
                    <FieldLabel>Number of billing cycles on renewal</FieldLabel>
                    <TextInput value="24" />
                  </div>
                  <div>
                    <FieldLabel>Default period for cancellation</FieldLabel>
                    <div className="flex items-center gap-2">
                      <TextInput value="10" />
                      <span className="text-[13px] text-gray-600">days</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Notice period to avoid auto-renewal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="border-b border-gray-200">
          <SectionHeader
            title="Products and pricing"
            open={productsOpen}
            onToggle={() => setProductsOpen((open) => !open)}
          />
          {productsOpen && (
            <div className="px-6 py-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-gray-800">
                  Period 1: 20 Jun 2024 to 19 Jun 2026
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700"
                  >
                    <Plus className="size-3.5" />
                    Add item
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
                    aria-label="Period actions"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="w-full min-w-[880px] border-collapse text-left text-[12px]">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr className="border-b border-gray-200">
                      <th className="px-3 py-2 font-semibold">Item name</th>
                      <th className="px-3 py-2 font-semibold">
                        Billing frequency
                      </th>
                      <th className="px-3 py-2 font-semibold">
                        Pricing model
                      </th>
                      <th className="px-3 py-2 font-semibold">Quantity</th>
                      <th className="px-3 py-2 font-semibold">
                        List unit price
                      </th>
                      <th className="px-3 py-2 font-semibold">Discount</th>
                      <th className="px-3 py-2 font-semibold">
                        Discount period
                      </th>
                      <th className="px-3 py-2 font-semibold">Net amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="px-3 py-2.5 text-[13px] text-gray-900">
                        Analytics Enterprise - Annual (USD)
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">Yearly</td>
                      <td className="px-3 py-2.5 text-gray-700">Flat Fee</td>
                      <td className="px-3 py-2.5 text-gray-700">1</td>
                      <td className="px-3 py-2.5 text-gray-700">$ 48,000.00</td>
                      <td className="px-3 py-2.5 text-gray-400">—</td>
                      <td className="px-3 py-2.5 text-gray-700">None</td>
                      <td className="px-3 py-2.5 font-medium text-gray-900">
                        $48,000.00
                      </td>
                    </tr>
                    <tr className="bg-gray-50/80">
                      <td
                        colSpan={7}
                        className="px-3 py-2 text-right font-semibold text-gray-700"
                      >
                        Net Total
                      </td>
                      <td className="px-3 py-2 font-semibold text-gray-900">
                        $48,000.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-[12px] font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              >
                <Plus className="size-3.5" />
                Create charge
              </button>

              <div className="mt-6 max-w-md space-y-2 border-t border-gray-100 pt-4 text-[13px]">
                <h4 className="font-semibold text-gray-800">Summary</h4>
                <div className="flex justify-between text-gray-600">
                  <span>Contract Summary</span>
                  <span className="text-gray-800">
                    20 Jun 2024 - 19 Jun 2026 | 24 months
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total discount</span>
                  <span className="text-gray-800">0.00 USD (0.00%)</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Total contract value</span>
                  <span>$96,000.00 USD</span>
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <SectionHeader
            title="Billing and payment terms"
            open={billingOpen}
            onToggle={() => setBillingOpen((open) => !open)}
          />
          {billingOpen && (
            <div className="space-y-4 px-6 py-5">
              <div>
                <FieldLabel>Billing address</FieldLabel>
                <div className="flex items-center gap-2 text-[13px] text-gray-800">
                  <span>{profile.billingAddress}</span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <Pencil className="size-3" />
                    Edit
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-[12px] font-medium text-gray-700 hover:border-gray-400 hover:bg-gray-50"
              >
                Add a Shipping address
              </button>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <FieldLabel>Payment terms</FieldLabel>
                  <SelectInput value="Net 30" />
                </div>
                <div>
                  <FieldLabel>Billing frequency</FieldLabel>
                  <SelectInput value="Yearly" />
                </div>
                <div>
                  <FieldLabel>First invoice on</FieldLabel>
                  <SelectInput value="Immediately on contract start date" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[12px] text-gray-700">
                <input type="checkbox" />
                Allow advance invoice
              </label>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <div className="overflow-hidden rounded border border-gray-300">
                  <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
                    <button type="button" className="rounded p-1 text-gray-500 hover:bg-white">
                      <Bold className="size-3.5" />
                    </button>
                    <button type="button" className="rounded p-1 text-gray-500 hover:bg-white">
                      <Italic className="size-3.5" />
                    </button>
                    <button type="button" className="rounded p-1 text-gray-500 hover:bg-white">
                      <Underline className="size-3.5" />
                    </button>
                    <button type="button" className="rounded p-1 text-gray-500 hover:bg-white">
                      <Strikethrough className="size-3.5" />
                    </button>
                    <button type="button" className="rounded p-1 text-gray-500 hover:bg-white">
                      <Link2 className="size-3.5" />
                    </button>
                    <button type="button" className="rounded p-1 text-gray-500 hover:bg-white">
                      <List className="size-3.5" />
                    </button>
                    <button type="button" className="rounded p-1 text-gray-500 hover:bg-white">
                      <ListOrdered className="size-3.5" />
                    </button>
                  </div>
                  <textarea
                    placeholder="Enter notes here such as legal terms, condition or more."
                    className="min-h-[100px] w-full resize-none px-3 py-2 text-[13px] outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  These notes will appear on the quote PDF.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
