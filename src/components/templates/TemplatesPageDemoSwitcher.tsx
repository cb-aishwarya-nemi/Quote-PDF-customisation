import {
  readTemplatesPageDemoView,
  type TemplatesPageDemoView,
  writeTemplatesPageDemoView,
} from "@/lib/seed-demo-library"
import { useState } from "react"

const OPTIONS: { value: TemplatesPageDemoView; label: string }[] = [
  { value: "empty", label: "Empty state" },
  { value: "data", label: "With templates" },
]

type Props = {
  value: TemplatesPageDemoView
  onChange: (view: TemplatesPageDemoView) => void
}

export function TemplatesPageDemoSwitcher({ value, onChange }: Props) {
  return (
    <div className="pointer-events-auto fixed bottom-5 left-5 z-[70]">
      <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 shadow-md">
        <span className="font-medium text-gray-500">Demo</span>
        <select
          value={value}
          onChange={(event) => {
            const next = event.target.value as TemplatesPageDemoView
            onChange(next)
            writeTemplatesPageDemoView(next)
          }}
          className="cursor-pointer border-0 bg-transparent py-0 pl-0 pr-6 text-[12px] font-medium text-gray-900 focus:outline-none focus:ring-0"
        >
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export function useTemplatesPageDemoView() {
  const [demoView, setDemoView] = useState<TemplatesPageDemoView>(() =>
    readTemplatesPageDemoView(),
  )

  return [demoView, setDemoView] as const
}
