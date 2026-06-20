import type { BusinessProfileSnapshot } from "@/mock/data"
import { Building2 } from "lucide-react"

type Props = {
  profile: BusinessProfileSnapshot
  compact?: boolean
}

export function BusinessProfileSnapshot({ profile, compact = false }: Props) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-gray-50/80 ${
        compact ? "px-3 py-2.5" : "p-3"
      }`}
    >
      <div className="flex items-center gap-2">
        <Building2 className="size-3.5 shrink-0 text-gray-500" />
        <span className="text-[11px] font-medium text-gray-700">
          {profile.companyName}
        </span>
      </div>
      <dl
        className={`mt-2 grid gap-x-4 gap-y-1 ${
          compact ? "grid-cols-2 text-[10px]" : "grid-cols-2 text-[11px] sm:grid-cols-4"
        }`}
      >
        {profile.attributes.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-gray-400">{label}</dt>
            <dd className="font-medium text-gray-700">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
