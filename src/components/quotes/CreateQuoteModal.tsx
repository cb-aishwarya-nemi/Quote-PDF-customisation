import { ChevronDown, X } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

const CUSTOMER_OPTIONS = [
  "NovaSuite",
  "SEON Technologies Inc",
  "Linnworks",
  "Zenith Analytics",
  "Nordic SaaS GmbH",
  "BrightLedger Ltd",
] as const

const QUOTE_TYPE_OPTIONS = [
  "New business",
  "Expansion",
  "Amendment",
  "Termination",
] as const

type Props = {
  open: boolean
  onClose: () => void
  onProceed?: (values: {
    customer: string
    quoteType: string
  }) => void
  userEmail?: string
}

export function CreateQuoteModal({
  open,
  onClose,
  onProceed,
  userEmail = "chris@chargebee.com",
}: Props) {
  const customerListId = useId()
  const quoteTypeListId = useId()
  const customerInputRef = useRef<HTMLInputElement>(null)

  const [customer, setCustomer] = useState<string>(CUSTOMER_OPTIONS[0])
  const [quoteType, setQuoteType] = useState<string>(QUOTE_TYPE_OPTIONS[0])
  const [customerOpen, setCustomerOpen] = useState(false)
  const [quoteTypeOpen, setQuoteTypeOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setCustomer(CUSTOMER_OPTIONS[0])
    setQuoteType(QUOTE_TYPE_OPTIONS[0])
    setCustomerOpen(false)
    setQuoteTypeOpen(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const filteredCustomers = CUSTOMER_OPTIONS.filter((option) =>
    option.toLowerCase().includes(customer.trim().toLowerCase()),
  )

  const handleProceed = () => {
    onProceed?.({ customer, quoteType })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-quote-title"
        className="relative w-full max-w-[520px] rounded-lg border border-gray-200 bg-white px-8 py-7 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="create-quote-title"
          className="text-[18px] font-semibold text-gray-900"
        >
          Create quote for {userEmail}
        </h2>

        <div className="mt-6 space-y-5">
          <div>
            <label
              htmlFor={`${customerListId}-input`}
              className="mb-1.5 block text-[13px] text-gray-700"
            >
              Select a customer
            </label>
            <div className="relative">
              <input
                ref={customerInputRef}
                id={`${customerListId}-input`}
                type="text"
                value={customer}
                onChange={(event) => {
                  setCustomer(event.target.value)
                  setCustomerOpen(true)
                }}
                onFocus={() => setCustomerOpen(true)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-16 text-[14px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                autoComplete="off"
                role="combobox"
                aria-expanded={customerOpen}
                aria-controls={customerListId}
              />
              <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2">
                {customer && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomer("")
                      setCustomerOpen(true)
                      customerInputRef.current?.focus()
                    }}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Clear customer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCustomerOpen((open) => !open)}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Toggle customer list"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>

              {customerOpen && filteredCustomers.length > 0 && (
                <ul
                  id={customerListId}
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                >
                  {filteredCustomers.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={option === customer}
                        onClick={() => {
                          setCustomer(option)
                          setCustomerOpen(false)
                        }}
                        className={`flex w-full px-3 py-2 text-left text-[14px] hover:bg-gray-50 ${
                          option === customer
                            ? "font-medium text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor={`${quoteTypeListId}-select`}
              className="mb-1.5 block text-[13px] text-gray-700"
            >
              Quote type
            </label>
            <div className="relative">
              <button
                id={`${quoteTypeListId}-select`}
                type="button"
                onClick={() => setQuoteTypeOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-[14px] text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                aria-haspopup="listbox"
                aria-expanded={quoteTypeOpen}
                aria-controls={quoteTypeListId}
              >
                <span>{quoteType}</span>
                <ChevronDown className="size-4 shrink-0 text-gray-400" />
              </button>

              {quoteTypeOpen && (
                <ul
                  id={quoteTypeListId}
                  role="listbox"
                  className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                >
                  {QUOTE_TYPE_OPTIONS.map((option) => (
                    <li key={option}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={option === quoteType}
                        onClick={() => {
                          setQuoteType(option)
                          setQuoteTypeOpen(false)
                        }}
                        className={`flex w-full px-3 py-2 text-left text-[14px] hover:bg-gray-50 ${
                          option === quoteType
                            ? "font-medium text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="text-[14px] font-medium text-gray-700 hover:text-gray-900"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={!customer.trim()}
            className="rounded-md bg-blue-600 px-5 py-2 text-[14px] font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  )
}
