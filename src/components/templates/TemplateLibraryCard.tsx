import type { PredefinedTemplate } from "@/mock/data"

const categoryColors: Record<string, string> = {
  Enterprise: "text-blue-600",
  SMB: "text-amber-600",
  "Multi-region": "text-violet-600",
  "Order form": "text-slate-600",
}

type Props = {
  template: PredefinedTemplate
  onUse: () => void
  onPreview: () => void
}

export function TemplateLibraryCard({
  template,
  onUse,
  onPreview,
}: Props) {
  return (
    <article className="group flex flex-col rounded-lg border border-gray-200/90 bg-white p-3.5 shadow-sm shadow-transparent transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-blue-200/70 hover:shadow-[0_8px_24px_-6px_rgba(37,99,235,0.12),0_4px_8px_-4px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`text-[11px] font-medium ${
            categoryColors[template.category] ?? "text-gray-500"
          }`}
        >
          {template.category}
        </span>
        {template.recommended && (
          <>
            <span className="text-[11px] text-gray-300">·</span>
            <span className="text-[11px] font-medium text-amber-700">
              Recommended
            </span>
          </>
        )}
        {template.badge && (
          <>
            <span className="text-[11px] text-gray-300">·</span>
            <span className="text-[11px] font-medium text-gray-500">
              {template.badge}
            </span>
          </>
        )}
      </div>

      <h3 className="mt-1.5 text-[14px] font-semibold leading-snug text-gray-900 group-hover:text-blue-700">
        {template.name}
      </h3>
      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-gray-500 transition-colors duration-200 group-hover:text-gray-600">
        {template.description}
      </p>

      <p className="mt-2.5 truncate text-[11px] text-gray-400 transition-colors duration-200 group-hover:text-gray-500">
        {template.steps.join(" · ")}
      </p>

      <div className="mt-2.5 flex items-center justify-end gap-1 border-t border-gray-100 pt-2 transition-colors duration-200 group-hover:border-gray-200">
        <button
          type="button"
          onClick={onPreview}
          className="rounded px-1.5 py-0.5 text-[11px] font-medium text-gray-500 transition-colors duration-200 group-hover:text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={onUse}
          className="rounded border border-blue-600 px-1.5 py-0.5 text-[11px] font-medium text-blue-600 transition-all duration-200 group-hover:border-blue-700 group-hover:shadow-sm hover:bg-blue-600 hover:text-white"
        >
          Use template
        </button>
      </div>
    </article>
  )
}
