import { blocksForVariant, getBlockLabel } from "@/lib/block-catalog"
import type { BlockType } from "@/types/template"

export type GeneratedVariantId = "v1" | "v2" | "v3"

const lineItems = [
  { name: "Enterprise Platform — Annual", qty: 1, unit: "$48,000", total: "$48,000" },
  { name: "Premium Support", qty: 1, unit: "$12,000", total: "$12,000" },
  { name: "Implementation services", qty: 1, unit: "$8,500", total: "$8,500" },
]

const compactLineItems = lineItems.slice(0, 2)

function TermsBlock({ spans = 0 }: { spans?: number }) {
  return (
    <div className="border-t border-gray-200 pt-6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Terms &amp; conditions
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-gray-600">
        This quote is valid for 30 days from the date above. Payment terms are{" "}
        {spans > 0 ? (
          <span className="rounded bg-amber-50 px-1 text-amber-900 ring-1 ring-amber-200">
            Net-30 unless otherwise specified
          </span>
        ) : (
          "Net-30 unless otherwise specified"
        )}
        . Services commence upon signed order form.
        {spans > 1 && (
          <>
            {" "}
            <span className="rounded bg-amber-50 px-1 text-amber-900 ring-1 ring-amber-200">
              EU customers: standard DPA applies
            </span>
          </>
        )}
      </p>
    </div>
  )
}

function PricingBlockV1() {
  return (
    <div className="rounded-lg border-2 border-blue-100 bg-blue-50/40 px-5 py-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
        Investment summary
      </p>
      <table className="mt-3 w-full text-[13px]">
        <thead>
          <tr className="border-b border-blue-200 text-left text-gray-600">
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr key={item.name} className="border-b border-blue-100/80">
              <td className="py-2.5 font-medium text-gray-900">{item.name}</td>
              <td className="py-2.5 text-right font-semibold text-gray-900">
                {item.total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex justify-end border-t border-blue-200 pt-3">
        <div className="text-right">
          <p className="text-[12px] text-gray-600">Annual total</p>
          <p className="text-[22px] font-bold text-gray-900">$68,500</p>
        </div>
      </div>
    </div>
  )
}

function PricingBlockV2() {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Pricing
      </p>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-1.5 font-medium">Item</th>
            <th className="pb-1.5 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {compactLineItems.map((item) => (
            <tr key={item.name} className="border-b border-gray-100">
              <td className="py-1.5 text-gray-800">{item.name}</td>
              <td className="py-1.5 text-right text-gray-800">{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-right text-[12px] font-semibold text-gray-900">
        Total $60,000
      </p>
    </div>
  )
}

function PricingBlockV3() {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Line items
      </p>
      <table className="w-full text-[12px]">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr key={item.name} className="border-b border-gray-100">
              <td className="py-2 text-gray-900">{item.name}</td>
              <td className="py-2 text-right text-gray-900">{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HeaderV1() {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
      <p className="text-[12px] text-gray-500">Quote #QT-2026-0142 · Jun 12, 2026</p>
      <p className="text-[13px] font-medium text-gray-700">Acme Corporation</p>
    </div>
  )
}

function HeaderV2() {
  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-lg bg-[#ff6b35] text-xl font-bold text-white shadow-sm">
          C
        </div>
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-gray-900">
            Chargebee
          </h1>
          <p className="text-[12px] text-gray-500">
            Subscription billing &amp; revenue management
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-between text-[12px] text-gray-600">
        <span>Quote #QT-2026-0142</span>
        <span>Valid until Jul 12, 2026</span>
      </div>
    </div>
  )
}

function HeaderV3() {
  return (
    <div className="flex items-start justify-between border-b border-gray-200 pb-5">
      <div>
        <div className="flex size-9 items-center justify-center rounded bg-[#ff6b35] text-sm font-bold text-white">
          C
        </div>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          Chargebee Inc.
        </p>
      </div>
      <div className="text-right">
        <h1 className="text-[20px] font-semibold text-gray-900">Quote</h1>
        <p className="mt-1 text-[12px] text-gray-600">#QT-2026-0142</p>
      </div>
    </div>
  )
}

function CompanyDetailsV2() {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        From
      </p>
      <p className="mt-1 text-[14px] font-semibold text-gray-900">Chargebee Inc.</p>
      <p className="text-[12px] text-gray-600">
        340 S Lemon Ave #1532, Walnut, CA 91789
        <br />
        Tax ID: 46-1234567 · Delaware C-Corp
      </p>
      <div className="mt-3 border-t border-gray-200 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Prepared for
        </p>
        <p className="mt-1 text-[13px] font-medium text-gray-900">Acme Corporation</p>
        <p className="text-[12px] text-gray-600">100 Market St, San Francisco, CA</p>
      </div>
    </div>
  )
}

function ExecSummaryV3() {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Executive summary
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-700">
        This proposal outlines a 36-month enterprise subscription for Acme
        Corporation, including platform access, premium support, and
        implementation services. The package is designed to support your
        multi-region billing rollout with prepaid annual terms.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-[11px] text-gray-600">
        <div>
          <span className="block text-gray-400">Term</span>
          <span className="font-medium text-gray-800">36 months</span>
        </div>
        <div>
          <span className="block text-gray-400">Sales contact</span>
          <span className="font-medium text-gray-800">Jordan Lee</span>
        </div>
        <div>
          <span className="block text-gray-400">Valid until</span>
          <span className="font-medium text-gray-800">Jul 12, 2026</span>
        </div>
      </div>
    </div>
  )
}

function TcvBlock() {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        Total contract value
      </p>
      <p className="mt-1 text-[22px] font-bold text-gray-900">$223,000</p>
      <p className="text-[11px] text-gray-500">36-month term · Billed annually</p>
    </div>
  )
}

type FullPreviewProps = {
  variantId: GeneratedVariantId
  templateName: string
}

export function GeneratedVariantPreviewDocument({
  variantId,
  templateName,
}: FullPreviewProps) {
  return (
    <div className="mx-auto w-full max-w-[640px] bg-white px-10 py-12 shadow-lg ring-1 ring-black/5">
      {variantId === "v1" && (
        <>
          <HeaderV1 />
          <div className="mt-5">
            <PricingBlockV1 />
          </div>
          <div className="mt-5">
            <TcvBlock />
          </div>
          <div className="mt-6">
            <TermsBlock spans={2} />
          </div>
        </>
      )}

      {variantId === "v2" && (
        <>
          <HeaderV2 />
          <div className="mt-6">
            <CompanyDetailsV2 />
          </div>
          <div className="mt-6">
            <PricingBlockV2 />
          </div>
          <div className="mt-6">
            <TermsBlock spans={3} />
          </div>
        </>
      )}

      {variantId === "v3" && (
        <>
          <HeaderV3 />
          <div className="mt-6">
            <ExecSummaryV3 />
          </div>
          <div className="mt-8">
            <PricingBlockV3 />
          </div>
          <div className="mt-4 flex justify-end">
            <p className="text-[13px] font-semibold text-gray-900">Total $68,500</p>
          </div>
          <div className="mt-8">
            <TermsBlock spans={1} />
          </div>
        </>
      )}

      <p className="mt-8 text-center text-[10px] text-gray-400">
        Preview — {templateName}
      </p>
    </div>
  )
}

/** Mini block visuals tuned per variant narrative */
export function VariantMiniBlockVisual({
  variantId,
  type,
}: {
  variantId: string
  type: BlockType
}) {
  const emphasized =
    (variantId === "v1" && type === "pricing") ||
    (variantId === "v2" && (type === "header" || type === "company_details")) ||
    (variantId === "v3" && type === "quote_details")

  const compact = variantId === "v2" && type === "pricing"

  if (type === "header" && variantId === "v2") {
    return (
      <div className="flex items-center gap-1">
        <div className="size-4 shrink-0 rounded bg-[#ff6b35]" />
        <div className="h-1 flex-1 rounded bg-gray-300" />
      </div>
    )
  }

  if (type === "header" && variantId === "v1") {
    return <div className="h-0.5 w-full rounded bg-gray-200" />
  }

  if (type === "quote_details" && variantId === "v3") {
    return (
      <div className="space-y-0.5 rounded bg-gray-50 p-0.5">
        <div className="h-0.5 w-full bg-gray-300" />
        <div className="h-0.5 w-11/12 bg-gray-200" />
        <div className="h-0.5 w-10/12 bg-gray-200" />
        <div className="h-0.5 w-9/12 bg-gray-100" />
      </div>
    )
  }

  if (type === "company_details" && variantId === "v2") {
    return (
      <div className="rounded bg-gray-50 p-0.5">
        <div className="h-0.5 w-2/3 bg-gray-300" />
        <div className="mt-0.5 h-0.5 w-full bg-gray-200" />
        <div className="mt-0.5 h-0.5 w-4/5 bg-gray-100" />
      </div>
    )
  }

  if (type === "pricing" && variantId === "v1") {
    return (
      <div className="space-y-0.5 rounded border border-blue-100 bg-blue-50/60 p-0.5">
        <div className="flex justify-between border-b border-blue-100 pb-0.5">
          <div className="h-1 w-2/5 rounded bg-blue-200" />
          <div className="h-1 w-1/4 rounded bg-blue-200" />
        </div>
        <div className="flex justify-between">
          <div className="h-0.5 w-1/2 bg-gray-300" />
          <div className="h-0.5 w-1/5 bg-gray-300" />
        </div>
        <div className="flex justify-between">
          <div className="h-0.5 w-2/5 bg-gray-200" />
          <div className="h-0.5 w-1/5 bg-gray-200" />
        </div>
        <div className="mt-0.5 h-1 w-1/3 self-end rounded bg-gray-400" />
      </div>
    )
  }

  if (type === "pricing" && compact) {
    return (
      <div className="space-y-0.5">
        <div className="flex justify-between">
          <div className="h-0.5 w-2/5 bg-gray-200" />
          <div className="h-0.5 w-1/5 bg-gray-200" />
        </div>
        <div className="flex justify-between">
          <div className="h-0.5 w-1/3 bg-gray-100" />
          <div className="h-0.5 w-1/5 bg-gray-100" />
        </div>
      </div>
    )
  }

  if (type === "tcv_billing") {
    return (
      <div className="rounded border border-gray-200 bg-gray-50 px-1 py-0.5">
        <div className="h-0.5 w-1/2 bg-gray-300" />
        <div className="mt-0.5 text-[7px] font-bold text-gray-800">$223k</div>
      </div>
    )
  }

  if (type === "terms") {
    return (
      <div className="space-y-0.5">
        <div className="h-0.5 w-full bg-gray-200" />
        <div className="h-0.5 w-4/5 bg-gray-100" />
      </div>
    )
  }

  if (type === "header") {
    return (
      <div className="flex items-start justify-between gap-1">
        <div className="size-2.5 shrink-0 rounded-sm bg-[#ff6b35]" />
        <div className="text-[6px] font-semibold text-gray-700">Quote</div>
      </div>
    )
  }

  if (type === "pricing") {
    return (
      <div className={`space-y-0.5 ${emphasized ? "rounded bg-gray-50 p-0.5" : ""}`}>
        <div className="flex justify-between border-b border-gray-200 pb-0.5">
          <div className="h-0.5 w-1/3 bg-gray-300" />
          <div className="h-0.5 w-1/4 bg-gray-300" />
        </div>
        <div className="flex justify-between">
          <div className="h-0.5 w-2/5 bg-gray-200" />
          <div className="h-0.5 w-1/5 bg-gray-200" />
        </div>
      </div>
    )
  }

  return <div className="h-0.5 w-full bg-gray-200" />
}

export function isGeneratedVariantId(id: string): id is GeneratedVariantId {
  return id === "v1" || id === "v2" || id === "v3"
}

export function variantBlockLabel(variantId: string, type: BlockType): string {
  if (variantId === "v3" && type === "quote_details") return "Executive summary"
  if (variantId === "v1" && type === "pricing") return "Investment summary"
  return getBlockLabel(type)
}

export function variantBlocksForPreview(variantId: string): BlockType[] {
  return blocksForVariant(variantId)
}
