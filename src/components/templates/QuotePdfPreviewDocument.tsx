import type { QuotePdfPreviewContext } from "@/data/create-quote-form"

export type PreviewTemplate = {
  name: string
  steps?: string[]
}

const defaultLineItems = [
  { name: "Enterprise Platform — Annual", qty: 1, unit: "$48,000", total: "$48,000" },
  { name: "Premium Support", qty: 1, unit: "$12,000", total: "$12,000" },
  { name: "Implementation services", qty: 1, unit: "$8,500", total: "$8,500" },
]

type Props = {
  template: PreviewTemplate
  context?: QuotePdfPreviewContext
}

export function QuotePdfPreviewDocument({ template, context }: Props) {
  const lineItems = context
    ? context.lineItems
    : defaultLineItems
  const subtotal = context?.subtotal ?? "$68,500"
  const totalContractValue = context?.totalContractValue ?? "$223,000"
  const showTcv = context ? true : template.steps?.some((s) => s.toLowerCase().includes("tcv"))

  return (
    <div className="mx-auto w-full max-w-[640px] bg-white px-10 py-12 shadow-lg ring-1 ring-black/5">
      <div className="flex items-start justify-between border-b border-gray-200 pb-6">
        <div>
          <div className="flex size-10 items-center justify-center rounded bg-[#ff6b35] text-sm font-bold text-white">
            C
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Chargebee Inc.
          </p>
          <p className="text-[11px] text-gray-500">
            340 S Lemon Ave #1532
            <br />
            Walnut, CA 91789, USA
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-[22px] font-semibold text-gray-900">Quote</h1>
          <p className="mt-2 text-[12px] text-gray-600">
            Quote #{context?.quoteNumber ?? "QT-2026-0142"}
          </p>
          <p className="text-[12px] text-gray-600">
            Date: {context?.quoteDate ?? "Jun 12, 2026"}
          </p>
          <p className="text-[12px] text-gray-600">
            Valid until: {context?.validUntil ?? "Jul 12, 2026"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Billed to
          </p>
          <p className="mt-2 text-[13px] font-medium text-gray-900">
            {context?.customerCompany ?? "Acme Corporation"}
          </p>
          <p className="text-[12px] text-gray-600">
            {context?.contactName ?? "Acme Corporation"}
            <br />
            {context?.billingAddress ?? (
              <>
                100 Market Street
                <br />
                San Francisco, CA 94105
                <br />
                United States
              </>
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Prepared by
          </p>
          <p className="mt-2 text-[13px] text-gray-900">Jordan Lee</p>
          <p className="text-[12px] text-gray-600">jordan.lee@chargebee.com</p>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Line items
        </p>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 text-right font-medium">Unit price</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.name} className="border-b border-gray-100">
                <td className="py-2.5 text-gray-900">{item.name}</td>
                <td className="py-2.5 text-gray-600">{item.qty}</td>
                <td className="py-2.5 text-right text-gray-600">{item.unit}</td>
                <td className="py-2.5 text-right font-medium text-gray-900">
                  {item.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="w-48 space-y-1 text-[12px]">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{subtotal}</span>
          </div>
          {!context && (
            <div className="flex justify-between text-gray-600">
              <span>Tax (8.5%)</span>
              <span>$5,822</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900">
            <span>Total</span>
            <span>{context ? subtotal : "$74,322"}</span>
          </div>
        </div>
      </div>

      {showTcv && (
        <div className="mt-8 rounded border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Total contract value
          </p>
          <p className="mt-1 text-[18px] font-semibold text-gray-900">
            {totalContractValue}
          </p>
          <p className="text-[11px] text-gray-500">
            {context
              ? "24-month term · Billed yearly"
              : "36-month term · Billed annually"}
          </p>
        </div>
      )}

      <div className="mt-8 border-t border-gray-200 pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Terms &amp; conditions
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
          This quote is valid for 30 days from the date above. Payment terms are
          Net-30 unless otherwise specified. Services commence upon signed order
          form and receipt of purchase order. Standard data processing terms
          apply for EU customers per our DPA.
        </p>
      </div>

      <p className="mt-8 text-center text-[10px] text-gray-400">
        Preview — {context?.quoteName ?? template.name}
      </p>
    </div>
  )
}
