import type { LibraryGeneratedTemplate } from "@/store/template-library-store"
import {
  isDimmedGeneratedTemplate,
} from "@/store/template-library-store"

type Props = {
  template: LibraryGeneratedTemplate
  publishedVariantId: string | null
  onUse: () => void
  onPreview: () => void
}

export function GeneratedTemplateCard({
  template,
  publishedVariantId,
  onUse,
  onPreview,
}: Props) {
  const dimmed = isDimmedGeneratedTemplate(template, publishedVariantId)
  const isPublished = template.status === "published"

  return (
    <article
      className={`group flex flex-col rounded-lg border bg-white p-3.5 shadow-sm transition-all duration-200 ease-out ${
        isPublished
          ? "border-emerald-200/80 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.12)] ring-1 ring-emerald-100"
          : dimmed
            ? "border-gray-200/70 opacity-[0.58] saturate-[0.85] hover:opacity-[0.72]"
            : "border-gray-200/90 shadow-transparent hover:-translate-y-0.5 hover:border-violet-200/70 hover:shadow-[0_8px_24px_-6px_rgba(124,58,237,0.12),0_4px_8px_-4px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`text-[11px] font-medium ${
            isPublished ? "text-emerald-700" : "text-violet-600"
          }`}
        >
          {isPublished ? "Published" : "AI generated"}
        </span>
        {isPublished && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            Live
          </span>
        )}
      </div>

      <h3
        className={`mt-1.5 text-[14px] font-semibold leading-snug ${
          isPublished
            ? "text-gray-900"
            : dimmed
              ? "text-gray-600"
              : "text-gray-900 group-hover:text-violet-700"
        }`}
      >
        {template.name}
      </h3>
      <p
        className={`mt-1 line-clamp-2 text-[12px] leading-relaxed ${
          dimmed ? "text-gray-400" : "text-gray-500 transition-colors duration-200 group-hover:text-gray-600"
        }`}
      >
        {template.sourceNote}
      </p>

      <p
        className={`mt-2.5 truncate text-[11px] ${
          dimmed ? "text-gray-300" : "text-gray-400 transition-colors duration-200 group-hover:text-gray-500"
        }`}
      >
        {template.tags.join(" · ")}
      </p>

      <div
        className={`mt-2.5 flex items-center justify-end gap-1 border-t pt-2 ${
          dimmed ? "border-gray-100" : "border-gray-100 transition-colors duration-200 group-hover:border-gray-200"
        }`}
      >
        <button
          type="button"
          onClick={onPreview}
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium hover:bg-gray-100 ${
            dimmed ? "text-gray-400 hover:text-gray-600" : "text-gray-500 transition-colors duration-200 group-hover:text-gray-700 hover:text-gray-900"
          }`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={onUse}
          className={`rounded border px-1.5 py-0.5 text-[11px] font-medium transition-all duration-200 ${
            isPublished
              ? "border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white"
              : dimmed
                ? "border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700"
                : "border-blue-600 text-blue-600 group-hover:border-blue-700 group-hover:shadow-sm hover:bg-blue-600 hover:text-white"
          }`}
        >
          {isPublished ? "Edit template" : "Use template"}
        </button>
      </div>
    </article>
  )
}
