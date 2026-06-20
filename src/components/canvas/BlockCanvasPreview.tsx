import { getBlockLabel } from "@/lib/block-catalog"
import type { Block } from "@/types/template"

export function BlockCanvasPreview({ block }: { block: Block }) {
  return (
    <div className="pointer-events-none select-none">
      <BlockPreviewContent block={block} />
    </div>
  )
}

function BlockPreviewContent({ block }: { block: Block }) {
  switch (block.type) {
    case "header":
      return (
        <div className="flex items-start justify-between">
          <div>
            <div className="h-3 w-20 rounded bg-gray-300" />
            <div className="mt-2 h-2 w-32 rounded bg-gray-200" />
          </div>
          <div className="text-right">
            <p className="text-[15px] font-semibold text-gray-900">Quote</p>
            <p className="text-[11px] text-gray-500">#QT-2026-0142</p>
          </div>
        </div>
      )
    case "quote_details":
      return (
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
          <span>Quote ID: QT-2026-0142</span>
          <span>Salesperson: Jordan Lee</span>
          <span>Valid until: Jul 12, 2026</span>
        </div>
      )
    case "billed_to":
      return (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Billed to
          </p>
          <p className="mt-1 text-[13px] font-medium text-gray-900">
            Acme Corporation
          </p>
          <p className="text-[11px] text-gray-500">100 Market St, San Francisco</p>
        </div>
      )
    case "company_details":
      return (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            From
          </p>
          <p className="mt-1 text-[13px] font-medium text-gray-900">
            Chargebee Inc.
          </p>
          <p className="text-[11px] text-gray-500">340 S Lemon Ave, Walnut, CA</p>
        </div>
      )
    case "tcv_billing":
      return (
        <div className="rounded border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase text-gray-400">
            Total contract value
          </p>
          <p className="text-[16px] font-semibold text-gray-900">$223,000</p>
        </div>
      )
    case "pricing":
      return (
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-1.5 font-medium">Item</th>
              <th className="pb-1.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            <tr className="border-b border-gray-100">
              <td className="py-1.5">Enterprise Platform</td>
              <td className="py-1.5 text-right">$48,000</td>
            </tr>
            <tr>
              <td className="py-1.5">Premium Support</td>
              <td className="py-1.5 text-right">$12,000</td>
            </tr>
          </tbody>
        </table>
      )
    case "signature":
      return (
        <div className="grid grid-cols-2 gap-6 pt-4">
          <div>
            <div className="border-b border-gray-300 pb-1" />
            <p className="mt-1 text-[10px] text-gray-500">Authorized signature</p>
          </div>
          <div>
            <div className="border-b border-gray-300 pb-1" />
            <p className="mt-1 text-[10px] text-gray-500">Date</p>
          </div>
        </div>
      )
    case "terms":
      return (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Terms & conditions
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
            This quote is valid for 30 days. Payment terms are Net-30 unless
            otherwise specified…
          </p>
        </div>
      )
    default:
      return (
        <p className="text-[12px] text-gray-500">{getBlockLabel(block.type)}</p>
      )
  }
}
