import { GeneratedTemplateCard } from "@/components/templates/GeneratedTemplateCard"
import { ImportPdfModal } from "@/components/templates/ImportPdfModal"
import { TemplateLibraryCard } from "@/components/templates/TemplateLibraryCard"
import {
  TemplatePreviewModal,
  type PreviewTarget,
} from "@/components/templates/TemplatePreviewModal"
import {
  predefinedTemplates,
  templateCategories,
  type PredefinedTemplate,
  type TemplateCategory,
} from "@/mock/data"
import { navigateToPromptBuilder } from "@/lib/navigate-to-builder"
import { navigateToCanvas } from "@/lib/navigate-to-canvas"
import {
  useTemplateLibraryStore,
} from "@/store/template-library-store"
import { ChevronRight, Plus, Search, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

type BackgroundMode = "hidden" | "recommended" | "generated"

function selectTemplate(
  template: PredefinedTemplate,
  navigate: ReturnType<typeof useNavigate>,
) {
  navigateToPromptBuilder(navigate, {
    presetId: template.id,
    name: template.name,
  })
}

export function QuotePdfTemplatesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const ensureInitialized = useTemplateLibraryStore((s) => s.ensureInitialized)
  const generatedTemplates = useTemplateLibraryStore((s) => s.templates)
  const publishedVariantId = useTemplateLibraryStore((s) => s.publishedVariantId)
  const [importOpen, setImportOpen] = useState(true)
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("hidden")
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<TemplateCategory | "All">("All")
  const [sort, setSort] = useState<"popular" | "name">("popular")

  useEffect(() => {
    ensureInitialized()
  }, [ensureInitialized])

  useEffect(() => {
    const state = location.state as { viewGenerated?: boolean } | null
    if (state?.viewGenerated || publishedVariantId) {
      setBackgroundMode("generated")
      setImportOpen(false)
    }
  }, [location.state, publishedVariantId])

  const filteredRecommended = useMemo(() => {
    let list = [...predefinedTemplates]
    if (category !== "All") {
      list = list.filter((t) => t.category === category)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q),
      )
    }
    if (sort === "popular") {
      list.sort((a, b) => b.popularity - a.popularity)
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return list
  }, [search, category, sort])

  const showRecommendations = backgroundMode === "recommended"
  const showGenerated = backgroundMode === "generated"

  const sortedGeneratedTemplates = useMemo(() => {
    return [...generatedTemplates].sort((a, b) => {
      if (a.status === "published") return -1
      if (b.status === "published") return 1
      return 0
    })
  }, [generatedTemplates])

  const backgroundDimmed =
    importOpen && (backgroundMode === "hidden" || backgroundMode === "generated")

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pb-16">
      <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-8 py-2.5">
        <div className="min-w-0">
          <nav className="flex items-center gap-1 text-[11px] text-gray-500">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="hover:text-gray-700"
            >
              Configure Chargebee
            </button>
            <ChevronRight className="size-2.5 shrink-0" />
            <button
              type="button"
              onClick={() => navigate("/cpq")}
              className="hover:text-gray-700"
            >
              Chargebee CPQ
            </button>
            <ChevronRight className="size-2.5 shrink-0" />
            <span className="truncate text-gray-600">Quote PDF templates</span>
          </nav>
          <h1 className="mt-0.5 text-[14px] font-semibold text-gray-900">
            Quote PDF templates
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <Sparkles className="size-3 text-violet-500" />
            Import quote PDFs
          </button>
          <button
            type="button"
            onClick={() => navigateToCanvas(navigate, { mode: "blank" })}
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
          >
            <Plus className="size-3" />
            Start from scratch
          </button>
        </div>
      </header>

      <section
        className={`px-8 pt-5 transition-opacity duration-300 ${
          backgroundDimmed ? "pointer-events-none opacity-40" : "opacity-100"
        }`}
      >
        {backgroundMode === "hidden" && (
          <div className="flex min-h-[320px] items-center justify-center">
            <p className="max-w-sm text-center text-[13px] text-gray-400">
              Upload your quote PDFs to generate custom layouts, or browse
              recommended templates for your business.
            </p>
          </div>
        )}

        {showRecommendations && (
          <>
            <div className="mb-5 max-w-2xl">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-violet-500" />
                <h2 className="text-[14px] font-semibold text-gray-900">
                  Recommended for you
                </h2>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                Matched to your company type, industry and customers you cater to.
              </p>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="shrink-0 text-[13px] text-gray-500">
                {predefinedTemplates.length} templates
              </p>
              <div className="relative w-full min-w-[160px] max-w-[220px] sm:w-[220px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search templates…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 py-1.5 pl-8 pr-3 text-[13px] placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {templateCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors ${
                      category === cat
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "popular" | "name")}
                className="ml-auto shrink-0 cursor-pointer rounded border-0 bg-transparent py-0.5 pl-0 pr-4 text-[11px] font-medium text-gray-500 focus:outline-none focus:ring-0"
              >
                <option value="popular">Most popular</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRecommended.map((template) => (
                <TemplateLibraryCard
                  key={template.id}
                  template={template}
                  onUse={() => {
                    setImportOpen(false)
                    selectTemplate(template, navigate)
                  }}
                  onPreview={() =>
                    setPreviewTarget({ kind: "predefined", id: template.id })
                  }
                />
              ))}
            </div>

            {filteredRecommended.length === 0 && (
              <p className="py-12 text-center text-[14px] text-gray-500">
                No templates match your search.
              </p>
            )}
          </>
        )}

        {showGenerated && (
          <>
            <div className="mb-5 max-w-2xl">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-violet-500" />
                <h2 className="text-[14px] font-semibold text-gray-900">
                  Generated from your PDFs
                </h2>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                {generatedTemplates.length} layouts created from your uploaded quote
                PDFs and order forms.
              </p>
            </div>

            <p className="mb-3 text-[13px] text-gray-500">
              {generatedTemplates.length} templates
              {publishedVariantId && (
                <span className="ml-2 text-emerald-700">
                  · 1 published
                </span>
              )}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedGeneratedTemplates.map((variant) => (
                <GeneratedTemplateCard
                  key={variant.id}
                  template={variant}
                  publishedVariantId={publishedVariantId}
                  onUse={() =>
                    navigateToPromptBuilder(navigate, {
                      variantId: variant.id,
                      variantName: variant.name,
                    }, variant.builderTemplateId)
                  }
                  onPreview={() =>
                    setPreviewTarget({ kind: "generated", id: variant.id })
                  }
                />
              ))}
            </div>
          </>
        )}
      </section>

      <ImportPdfModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSkipUpload={() => setBackgroundMode("recommended")}
        onGenerationComplete={() => {
          ensureInitialized()
          setBackgroundMode("generated")
        }}
        onViewGeneratedTemplates={() => setImportOpen(false)}
      />
      <TemplatePreviewModal
        target={previewTarget}
        onClose={() => setPreviewTarget(null)}
      />
    </div>
  )
}
