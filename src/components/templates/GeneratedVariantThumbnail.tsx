import type { GeneratedVariant } from "@/mock/data"

type Props = {
  variant: GeneratedVariant
  selected?: boolean
  onClick: () => void
}

export function GeneratedVariantThumbnail({
  variant,
  selected,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col overflow-hidden rounded-lg border bg-white text-left transition-all hover:shadow-md ${
        selected
          ? "border-blue-500 ring-1 ring-blue-500"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="border-b bg-gray-50 px-3 py-4">
        <div className="mx-auto w-full max-w-[100px] rounded border border-white bg-white p-2 shadow-sm">
          <div className="mb-1.5 h-1.5 w-2/3 rounded bg-gray-300" />
          <div className="mb-1 h-1 w-full rounded bg-gray-200" />
          <div className="mb-1 h-1 w-5/6 rounded bg-gray-200" />
          <div className="mt-2 h-5 w-full rounded bg-blue-100" />
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-[12px] font-semibold text-gray-900">{variant.name}</p>
        <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-500">
          {variant.sourceNote}
        </p>
      </div>
    </button>
  )
}
