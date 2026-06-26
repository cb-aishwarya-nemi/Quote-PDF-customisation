import { groupBlocksForLayout, type BlockLayoutRow } from "@/lib/block-layout"
import type { BuilderBlock, BuilderBlockType, BuilderTemplate } from "@/types/prompt-builder"

function Bar({
  w = "w-full",
  className = "bg-gray-200",
}: {
  w?: string
  className?: string
}) {
  return <div className={`h-[2px] rounded-full ${w} ${className}`} />
}

function BlockSilhouette({
  block,
  compact,
}: {
  block: BuilderBlock
  compact?: boolean
}) {
  const variant = String(block.content.variant ?? "classic")
  const shell = `h-full w-full overflow-hidden rounded-[2px] ${
    compact ? "min-h-[5px]" : "min-h-[8px]"
  }`

  switch (block.type) {
    case "company_logo":
      return (
        <div className={`${shell} flex items-center justify-center bg-gray-50/80`}>
          <div
            className={`rounded-[2px] bg-[#012A38] ${
              variant === "compact" ? "size-[45%]" : "h-[70%] w-[55%]"
            }`}
          />
        </div>
      )

    case "company_details":
      return (
        <div className={`${shell} flex flex-col justify-center gap-[2px] px-1 py-0.5`}>
          <Bar w="w-4/5" className="bg-slate-400/75" />
          <Bar className="bg-gray-200/90" />
          {!compact && <Bar w="w-3/5" className="bg-gray-100" />}
        </div>
      )

    case "quote_summary_header":
      return (
        <div className={`${shell} flex flex-col justify-center gap-[2px] px-1 py-0.5`}>
          <Bar w="w-3/5" className="bg-blue-500/70" />
          <Bar w="w-2/5" className="bg-gray-200" />
        </div>
      )

    case "tcv_summary":
      return (
        <div className={`${shell} flex bg-[#012A38]`}>
          <div className="w-[2px] shrink-0 bg-cb-orange" />
          <div className="flex flex-1 flex-col justify-center gap-[1px] px-1 py-0.5">
            <Bar w="w-1/2" className="bg-white/45" />
            <Bar w="w-1/3" className="bg-white/25" />
          </div>
        </div>
      )

    case "billed_to":
      return (
        <div className={`${shell} flex flex-col justify-center gap-[2px] px-1 py-0.5`}>
          <Bar w="w-3/4" className="bg-violet-400/70" />
          <Bar className="bg-gray-200/90" />
          <Bar w="w-4/5" className="bg-gray-100" />
        </div>
      )

    case "contract_details":
      return (
        <div className={`${shell} grid grid-cols-2 gap-[2px] p-0.5 content-center`}>
          <Bar className="bg-amber-300/70" />
          <Bar className="bg-gray-200" />
          <Bar className="bg-gray-100" />
          <Bar className="bg-gray-100" />
        </div>
      )

    case "pricing":
      return (
        <div className={`${shell} flex flex-col gap-[1px] border border-emerald-100 bg-white p-0.5`}>
          <div className="flex gap-[1px]">
            <div className="h-[2px] flex-[2] rounded-[1px] bg-emerald-500/45" />
            <div className="h-[2px] flex-1 rounded-[1px] bg-gray-200/80" />
            <div className="h-[2px] flex-1 rounded-[1px] bg-gray-200/80" />
          </div>
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex gap-[1px]">
              <div className="h-[1.5px] flex-[2] rounded-full bg-gray-200/90" />
              <div className="h-[1.5px] flex-1 rounded-full bg-gray-100" />
              <div className="h-[1.5px] flex-1 rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      )

    case "entitlements":
      return (
        <div className={`${shell} flex flex-col justify-center gap-[2px] border-l-2 border-cyan-300/60 px-1 py-0.5`}>
          <Bar w="w-4/5" className="bg-cyan-400/55" />
          <Bar className="bg-gray-200/80" />
          <Bar w="w-3/4" className="bg-gray-100" />
        </div>
      )

    case "terms":
      return (
        <div className={`${shell} flex flex-col justify-center gap-[1.5px] px-1 py-0.5`}>
          <Bar w="w-2/5" className="bg-orange-400/55" />
          <Bar className="bg-gray-200/80" />
          <Bar w="w-full" className="bg-gray-100" />
          <Bar w="w-11/12" className="bg-gray-100" />
          {!compact && <Bar w="w-4/5" className="bg-gray-100" />}
        </div>
      )

    case "signature":
      return (
        <div className={`${shell} grid grid-cols-2 gap-1 p-0.5`}>
          <div className="flex flex-col justify-end gap-[2px] border-t border-gray-300/80 pt-0.5">
            <Bar w="w-3/4" className="bg-gray-300/70" />
          </div>
          <div className="flex flex-col justify-end gap-[2px] border-t border-gray-300/80 pt-0.5">
            <Bar w="w-3/4" className="bg-gray-300/70" />
          </div>
        </div>
      )

    case "ae_profile":
      return (
        <div className={`${shell} flex items-center gap-1 px-1 py-0.5`}>
          <div className="size-[45%] max-h-full max-w-[28%] shrink-0 rounded-full bg-indigo-300/70" />
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <Bar w="w-4/5" className="bg-indigo-400/55" />
            <Bar className="bg-gray-200/80" />
          </div>
        </div>
      )

    case "custom_text":
      return (
        <div className={`${shell} flex flex-col justify-center gap-[1.5px] px-1 py-0.5`}>
          <Bar w="w-4/5" className="bg-gray-300/70" />
          <Bar className="bg-gray-200/80" />
          <Bar w="w-11/12" className="bg-gray-100" />
        </div>
      )

    case "custom_table":
      return (
        <div className={`${shell} grid grid-cols-3 gap-[1px] p-0.5`}>
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`h-[2px] rounded-[1px] ${
                index < 3 ? "bg-gray-300/70" : "bg-gray-100"
              }`}
            />
          ))}
        </div>
      )

    case "custom_image":
      return (
        <div
          className={`${shell} bg-gradient-to-br from-gray-100 to-gray-200/80`}
        />
      )

    default:
      return (
        <div className={`${shell} flex flex-col justify-center gap-[2px] px-1 py-0.5`}>
          <Bar w="w-3/5" className="bg-gray-300/70" />
          <Bar className="bg-gray-200/80" />
        </div>
      )
  }
}

function rowHeightClass(blockType: BuilderBlockType, compact?: boolean): string {
  if (blockType === "pricing") return compact ? "h-[13px]" : "h-7"
  if (blockType === "terms") return compact ? "h-[11px]" : "h-6"
  if (blockType === "tcv_summary") return compact ? "h-[8px]" : "h-4"
  if (blockType === "signature") return compact ? "h-[7px]" : "h-4"
  return compact ? "h-[6px]" : "h-3.5"
}

function LayoutRow({ row, compact }: { row: BlockLayoutRow; compact?: boolean }) {
  if (row.type === "pair") {
    return (
      <div className="grid grid-cols-2 gap-[2px]">
        <div className={rowHeightClass(row.left.type, compact)}>
          <BlockSilhouette block={row.left} compact={compact} />
        </div>
        <div className={rowHeightClass(row.right.type, compact)}>
          <BlockSilhouette block={row.right} compact={compact} />
        </div>
      </div>
    )
  }

  return (
    <div className={rowHeightClass(row.block.type, compact)}>
      <BlockSilhouette block={row.block} compact={compact} />
    </div>
  )
}

type Props = {
  template: BuilderTemplate
  compact?: boolean
  fill?: boolean
}

/** Mini document preview for builder page sidebar only. */
export function PageThumbnailPreview({ template, compact = true, fill }: Props) {
  const sortedBlocks = [...template.blocks].sort((a, b) => a.order - b.order)
  const rows = groupBlocksForLayout(sortedBlocks)
  const maxRows = compact ? 7 : 9
  const previewRows = rows.slice(0, maxRows)
  const remainingRows = rows.length - previewRows.length

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        fill ? "" : "rounded-lg"
      }`}
    >
      <div className="h-full w-full overflow-hidden rounded-[6px] bg-white shadow-sm ring-1 ring-gray-200/90">
        <div
          className={`flex h-full min-h-0 w-full flex-col overflow-hidden bg-white ${
            compact ? "gap-[2px] p-[3px]" : "gap-1 p-1.5"
          }`}
        >
          {previewRows.map((row, index) => (
            <LayoutRow key={`row-${index}`} row={row} compact={compact} />
          ))}
          {remainingRows > 0 && (
            <p
              className={`shrink-0 text-center font-medium text-gray-400 ${
                compact ? "text-[5px] leading-none" : "text-[7px]"
              }`}
            >
              +{remainingRows} more
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
