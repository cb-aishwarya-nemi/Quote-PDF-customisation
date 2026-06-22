import { TEMPLATE_LIBRARY_OWNERS } from "@/lib/derive-template-library-meta"
import type { PublishedBuilderTemplate } from "@/store/template-library-store"
import type { TemplateStatus } from "@/types/template"
import { DEAL_TYPE_LABELS, type DealType } from "@/types/prompt-builder"

export type TemplateSortKey =
  | "updated_desc"
  | "updated_asc"
  | "name_asc"
  | "name_desc"
  | "quotes_desc"
  | "variables_desc"

export type TemplateStatusFilter = "all" | TemplateStatus
export type TemplateDealTypeFilter = "all" | DealType
export type TemplateOwnerFilter = "all" | (typeof TEMPLATE_LIBRARY_OWNERS)[number]["id"]

export type TemplateLibraryQuery = {
  search: string
  status: TemplateStatusFilter
  dealType: TemplateDealTypeFilter
  owner: TemplateOwnerFilter
  sort: TemplateSortKey
}

export const DEFAULT_TEMPLATE_LIBRARY_QUERY: TemplateLibraryQuery = {
  search: "",
  status: "all",
  dealType: "all",
  owner: "all",
  sort: "updated_desc",
}

export const TEMPLATE_SORT_OPTIONS: {
  value: TemplateSortKey
  label: string
}[] = [
  { value: "updated_desc", label: "Recently edited" },
  { value: "updated_asc", label: "Oldest edited" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "quotes_desc", label: "Most quotes sent" },
  { value: "variables_desc", label: "Most variables" },
]

export const TEMPLATE_STATUS_FILTERS: {
  value: TemplateStatusFilter
  label: string
}[] = [
  { value: "all", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
]

export const TEMPLATE_DEAL_TYPE_FILTERS: {
  value: TemplateDealTypeFilter
  label: string
}[] = [
  { value: "all", label: "All types" },
  ...(Object.entries(DEAL_TYPE_LABELS) as [DealType, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
]

export const TEMPLATE_OWNER_FILTERS: {
  value: TemplateOwnerFilter
  label: string
}[] = [
  { value: "all", label: "All owners" },
  ...TEMPLATE_LIBRARY_OWNERS.map((owner) => ({
    value: owner.id as TemplateOwnerFilter,
    label: owner.name,
  })),
]

function compareBySort(
  a: PublishedBuilderTemplate,
  b: PublishedBuilderTemplate,
  sort: TemplateSortKey,
): number {
  switch (sort) {
    case "updated_asc":
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    case "name_asc":
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    case "name_desc":
      return b.name.localeCompare(a.name, undefined, { sensitivity: "base" })
    case "quotes_desc":
      return b.quotesSent - a.quotesSent || compareBySort(a, b, "updated_desc")
    case "variables_desc":
      return (
        b.variableCount - a.variableCount ||
        compareBySort(a, b, "updated_desc")
      )
    case "updated_desc":
    default:
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  }
}

export function filterAndSortPublishedTemplates(
  templates: PublishedBuilderTemplate[],
  query: TemplateLibraryQuery,
): PublishedBuilderTemplate[] {
  const search = query.search.trim().toLowerCase()

  return templates
    .filter((record) => {
      if (query.status !== "all" && record.status !== query.status) return false
      if (query.owner !== "all" && record.ownerId !== query.owner) return false
      if (
        query.dealType !== "all" &&
        !record.dealTypes.includes(query.dealType)
      ) {
        return false
      }
      if (!search) return true
      return (
        record.name.toLowerCase().includes(search) ||
        record.ownerName.toLowerCase().includes(search)
      )
    })
    .sort((a, b) => compareBySort(a, b, query.sort))
}

export function hasActiveTemplateLibraryFilters(
  query: TemplateLibraryQuery,
): boolean {
  return (
    query.search.trim() !== "" ||
    query.status !== "all" ||
    query.dealType !== "all" ||
    query.owner !== "all" ||
    query.sort !== DEFAULT_TEMPLATE_LIBRARY_QUERY.sort
  )
}
