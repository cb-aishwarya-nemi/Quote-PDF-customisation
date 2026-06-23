import type { BuilderBlockType } from "@/types/prompt-builder"

type Props = {
  blockType: BuilderBlockType
  variantId: string
  selected?: boolean
}

function Bar({
  w = "w-full",
  h = "h-0.5",
  className = "bg-gray-300",
}: {
  w?: string
  h?: string
  className?: string
}) {
  return <div className={`${h} ${w} rounded-full ${className}`} />
}

export function VariantPreviewThumb({ blockType, variantId, selected }: Props) {
  const accent = selected ? "bg-cb-orange" : "bg-gray-400"
  const faint = selected ? "bg-cb-orange/30" : "bg-gray-200"
  const mid = selected ? "bg-cb-orange/50" : "bg-gray-300"

  const shell = `flex h-10 w-14 shrink-0 flex-col overflow-hidden rounded border p-1 ${
    selected ? "border-cb-orange/40 bg-cb-orange/[0.04]" : "border-gray-200 bg-gray-50"
  }`

  if (blockType === "company_logo") {
    return (
      <div className={`${shell} items-center justify-center`}>
        <div className={`size-4 rounded ${accent}`} />
      </div>
    )
  }

  if (blockType === "company_address") {
    if (variantId === "compact") {
      return (
        <div className={`${shell} justify-center gap-0.5`}>
          <Bar w="w-full" className={accent} />
        </div>
      )
    }
    return (
      <div className={`${shell} gap-0.5`}>
        <Bar w="w-6" className={accent} />
        <Bar w="w-full" className={faint} />
        <Bar w="w-4" className={faint} />
      </div>
    )
  }

  if (blockType === "quote_summary_header") {
    if (variantId === "centered") {
      return (
        <div className={`${shell} items-center gap-0.5`}>
          <Bar w="w-8" className={accent} />
          <Bar w="w-6" className={faint} />
          <div className="mt-0.5 flex gap-0.5">
            <Bar w="w-2" className={faint} />
            <Bar w="w-2" className={faint} />
            <Bar w="w-2" className={faint} />
          </div>
        </div>
      )
    }
    if (variantId === "minimal") {
      return (
        <div className={`${shell} justify-center gap-0.5`}>
          <Bar w="w-full" h="h-1" className={accent} />
        </div>
      )
    }
    return (
      <div className={`${shell} gap-0.5`}>
        <Bar w="w-7" className={accent} />
        <Bar w="w-5" className={faint} />
        <div className="mt-auto grid grid-cols-3 gap-0.5">
          <Bar className={faint} />
          <Bar className={faint} />
          <Bar className={faint} />
        </div>
      </div>
    )
  }

  if (blockType === "tcv_summary") {
    if (variantId === "cards") {
      return (
        <div className={`${shell} gap-0 p-0 overflow-hidden`}>
          <div className={`h-3.5 w-full ${selected ? "bg-[#012A38]" : "bg-gray-600"}`} />
          <div className="-mt-1 flex flex-1 gap-0.5 px-0.5 pb-0.5">
            <div className={`flex-1 rounded-sm border shadow-sm ${selected ? "border-cb-orange/30 bg-white" : "border-gray-200 bg-white"}`} />
            <div className={`flex-1 rounded-sm border shadow-sm ${selected ? "border-cb-orange/30 bg-white" : "border-gray-200 bg-white"}`} />
            <div className={`flex-1 rounded-sm border shadow-sm ${selected ? "border-cb-orange/30 bg-white" : "border-gray-200 bg-white"}`} />
          </div>
        </div>
      )
    }
    if (variantId === "inline") {
      return (
        <div className={`${shell} flex-row items-center gap-1 px-1`}>
          <Bar w="w-3.5" h="h-1.5" className={accent} />
          <div className={`h-2.5 w-px shrink-0 ${faint}`} />
          <Bar w="w-2" className={faint} />
          <Bar w="w-2" className={faint} />
        </div>
      )
    }
    return (
      <div className={`${shell} gap-0 p-0 overflow-hidden`}>
        <div className="flex flex-1 gap-0.5 p-1">
          <div className={`w-0.5 shrink-0 rounded-full ${accent}`} />
          <div className="flex flex-1 flex-col gap-0.5">
            <Bar w="w-5" h="h-1" className={accent} />
            <Bar w="w-3" className={faint} />
          </div>
        </div>
        <div className={`flex gap-0.5 border-t px-1 py-0.5 ${selected ? "border-cb-orange/20 bg-cb-orange/[0.03]" : "border-gray-200 bg-gray-50"}`}>
          <Bar w="w-3" className={faint} />
          <Bar w="w-3" className={faint} />
          <Bar w="w-3" className={faint} />
        </div>
      </div>
    )
  }

  if (blockType === "billed_to") {
    if (variantId === "two_column") {
      return (
        <div className={`${shell} flex-row gap-0.5`}>
          <div className="flex flex-1 flex-col gap-0.5">
            <Bar className={accent} />
            <Bar className={faint} />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <Bar className={mid} />
            <Bar className={faint} />
          </div>
        </div>
      )
    }
    if (variantId === "card") {
      return (
        <div className={`${shell} border-2 p-0`}>
          <div className={`h-1 w-full ${selected ? "bg-cb-orange" : "bg-gray-400"}`} />
          <div className="flex flex-1 flex-col gap-0.5 p-1">
            <Bar className={accent} />
            <Bar className={faint} />
          </div>
        </div>
      )
    }
    return (
      <div className={`${shell} gap-0.5`}>
        <Bar className={accent} />
        <Bar className={faint} />
        <Bar w="w-4/5" className={faint} />
      </div>
    )
  }

  if (blockType === "contract_details") {
    if (variantId === "list") {
      return (
        <div className={`${shell} gap-1`}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-0.5">
              <Bar w="w-3" className={faint} />
              <Bar w="w-5" className={mid} />
            </div>
          ))}
        </div>
      )
    }
    if (variantId === "timeline") {
      return (
        <div className={`${shell} flex-row gap-1`}>
          <div className="flex flex-col items-center gap-0.5 py-0.5">
            <div className={`size-1 rounded-full ${accent}`} />
            <div className={`w-px flex-1 ${faint}`} />
            <div className={`size-1 rounded-full ${mid}`} />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <Bar className={mid} />
            <Bar className={faint} />
          </div>
        </div>
      )
    }
    return (
      <div className={`${shell} grid grid-cols-2 gap-0.5`}>
        <Bar className={faint} />
        <Bar className={faint} />
        <Bar className={faint} />
        <Bar className={faint} />
      </div>
    )
  }

  if (blockType === "pricing") {
    if (variantId === "quote") {
      return (
        <div className={`${shell} justify-center gap-1`}>
          <div className="flex items-center gap-0.5">
            <Bar w="w-4" className={mid} />
            <div className={`h-px flex-1 border-t border-dotted ${selected ? "border-cb-orange/40" : "border-gray-300"}`} />
            <Bar w="w-2" className={accent} />
          </div>
          <div className="flex items-center gap-0.5">
            <Bar w="w-3" className={mid} />
            <div className={`h-px flex-1 border-t border-dotted ${selected ? "border-cb-orange/40" : "border-gray-300"}`} />
            <Bar w="w-2" className={accent} />
          </div>
        </div>
      )
    }
    if (variantId === "compact") {
      return (
        <div className={`${shell} gap-0 p-0`}>
          <div className={`h-1.5 w-full ${faint}`} />
          <div className={`h-1.5 w-full bg-white`} />
          <div className={`h-1.5 w-full ${faint}`} />
        </div>
      )
    }
    if (variantId === "with_descriptions") {
      return (
        <div className={`${shell} gap-0 p-0`}>
          <div
            className={`h-1.5 w-full border-b ${selected ? "border-cb-orange/30 bg-cb-orange/10" : "border-gray-200 bg-gray-100"}`}
          />
          <div className="flex flex-1 flex-col justify-center gap-1 px-0.5 py-0.5">
            <Bar className={mid} />
            <Bar w="w-full" className={faint} />
            <Bar className={mid} />
            <Bar w="w-full" className={faint} />
          </div>
        </div>
      )
    }
    return (
      <div className={`${shell} gap-0 p-0`}>
        <div className={`h-1.5 w-full border-b ${selected ? "border-cb-orange/30 bg-cb-orange/10" : "border-gray-200 bg-gray-100"}`} />
        <div className="flex flex-1 flex-col justify-center gap-0.5 px-0.5">
          <Bar className={faint} />
          <Bar className={faint} />
        </div>
      </div>
    )
  }

  if (blockType === "entitlements") {
    if (variantId === "list") {
      return (
        <div className={`${shell} gap-1 border-l-2 ${selected ? "border-cb-orange/40" : "border-gray-200"} pl-1`}>
          <Bar className={mid} />
          <Bar w="w-4/5" className={faint} />
          <Bar w="w-3/4" className={faint} />
        </div>
      )
    }
    if (variantId === "compact") {
      return (
        <div className={`${shell} gap-0.5`}>
          <Bar className={mid} />
          <Bar className={faint} />
        </div>
      )
    }
    return (
      <div className={`${shell} gap-0 p-0`}>
        <div className={`h-1.5 w-full border-b ${selected ? "border-cb-orange/30 bg-cb-orange/10" : "border-gray-200 bg-gray-100"}`} />
        <div className="flex flex-1 flex-col justify-center gap-0.5 px-0.5">
          <Bar className={faint} />
          <Bar className={faint} />
        </div>
      </div>
    )
  }

  if (blockType === "terms") {
    if (variantId === "numbered") {
      return (
        <div className={`${shell} gap-1`}>
          {[1, 2].map((n) => (
            <div key={n} className="flex items-start gap-0.5">
              <div className={`flex size-2 shrink-0 items-center justify-center rounded-full text-[6px] font-bold text-white ${accent}`}>
                {n}
              </div>
              <Bar w="w-full" className={faint} />
            </div>
          ))}
        </div>
      )
    }
    if (variantId === "legal") {
      return (
        <div className={`${shell} gap-px`}>
          <Bar h="h-px" className={faint} />
          <Bar h="h-px" className={faint} />
          <Bar h="h-px" className={faint} />
          <Bar h="h-px" w="w-4/5" className={faint} />
        </div>
      )
    }
    return (
      <div className={`${shell} gap-0.5`}>
        <div className={`rounded-sm border p-0.5 ${selected ? "border-cb-orange/30" : "border-gray-200"}`}>
          <Bar className={faint} />
        </div>
        <div className={`rounded-sm border p-0.5 ${selected ? "border-cb-orange/30" : "border-gray-200"}`}>
          <Bar className={faint} />
        </div>
      </div>
    )
  }

  if (blockType === "signature") {
    if (variantId === "boxed") {
      return (
        <div className={`${shell} justify-center p-0.5`}>
          <div className={`flex h-full w-full flex-col justify-end rounded border p-0.5 ${selected ? "border-cb-orange/40" : "border-gray-300"}`}>
            <Bar w="w-full" className={mid} />
          </div>
        </div>
      )
    }
    if (variantId === "single") {
      return (
        <div className={`${shell} justify-end`}>
          <Bar w="w-full" className={mid} />
        </div>
      )
    }
    if (variantId === "dual_party") {
      return (
        <div className={`${shell} flex-row items-end gap-1`}>
          <Bar w="w-1/2" className={mid} />
          <Bar w="w-1/2" className={mid} />
        </div>
      )
    }
    return (
      <div className={`${shell} flex-row items-end gap-1`}>
        <Bar w="w-1/2" className={mid} />
        <Bar w="w-1/2" className={faint} />
      </div>
    )
  }

  if (blockType === "ae_profile") {
    if (variantId === "banner") {
      return (
        <div className={`${shell} flex-row items-center gap-0.5 p-0 ${selected ? "bg-[#012A38]" : "bg-gray-600"}`}>
          <div className="size-2 rounded-full bg-white/30" />
          <div className="flex flex-1 flex-col gap-0.5">
            <Bar w="w-full" className="bg-white/80" />
            <Bar w="w-2/3" className="bg-white/40" />
          </div>
        </div>
      )
    }
    if (variantId === "inline") {
      return (
        <div className={`${shell} flex-row items-center gap-0.5`}>
          <div className={`size-3 rounded-full ${faint}`} />
          <div className="flex flex-1 flex-col gap-0.5">
            <Bar className={accent} />
            <Bar w="w-2/3" className={faint} />
          </div>
        </div>
      )
    }
    return (
      <div className={`${shell} flex-row gap-0.5`}>
        <div className={`size-4 rounded-full ${faint}`} />
        <div className="flex flex-1 flex-col gap-0.5">
          <Bar className={accent} />
          <Bar className={faint} />
          <Bar w="w-2/3" className={faint} />
        </div>
      </div>
    )
  }

  // custom_text, custom_table, custom_image — generic
  if (blockType === "custom_text" && variantId === "callout") {
    return (
      <div className={`${shell} flex-row gap-0.5 p-0.5`}>
        <div className={`w-0.5 rounded-full ${accent}`} />
        <Bar w="w-full" className={faint} />
      </div>
    )
  }
  if (blockType === "custom_text" && variantId === "pull_quote") {
    return (
      <div className={`${shell} items-center justify-center gap-0.5`}>
        <Bar w="w-6" h="h-1" className={accent} />
        <Bar w="w-4" className={faint} />
      </div>
    )
  }
  if (blockType === "custom_image" && variantId === "full_bleed") {
    return (
      <div className={`${shell} p-0`}>
        <div className={`h-full w-full ${mid}`} />
      </div>
    )
  }
  if (blockType === "custom_image" && variantId === "framed") {
    return (
      <div className={`${shell} items-center justify-center bg-white p-0.5 shadow-sm`}>
        <div className={`h-5 w-5 border ${selected ? "border-cb-orange/30" : "border-gray-200"}`} />
      </div>
    )
  }

  return (
    <div className={`${shell} gap-0.5`}>
      <Bar className={accent} />
      <Bar className={faint} />
      <Bar w="w-3/4" className={faint} />
    </div>
  )
}
