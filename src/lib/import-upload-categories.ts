import type { LucideIcon } from "lucide-react"
import { FileText, ClipboardList, Palette, ImageIcon } from "lucide-react"

export type ImportUploadCategoryId =
  | "quote_pdf"
  | "order_form"
  | "brand_guidelines"
  | "assets"

export type ImportUploadCategory = {
  id: ImportUploadCategoryId
  label: string
  description: string
  accept: string
  mimeHint: string
  icon: LucideIcon
}

export type CategorizedImportFiles = Record<ImportUploadCategoryId, File[]>

export const IMPORT_UPLOAD_CATEGORIES: ImportUploadCategory[] = [
  {
    id: "quote_pdf",
    label: "Quote PDFs",
    description: "Existing quote documents",
    accept: ".pdf,application/pdf",
    mimeHint: "PDF",
    icon: FileText,
  },
  {
    id: "order_form",
    label: "Order forms",
    description: "Signed order forms & MSAs",
    accept: ".pdf,application/pdf",
    mimeHint: "PDF",
    icon: ClipboardList,
  },
  {
    id: "brand_guidelines",
    label: "Brand guidelines",
    description: "Logo usage, colors, typography",
    accept: ".pdf,.doc,.docx,application/pdf",
    mimeHint: "PDF, Word",
    icon: Palette,
  },
  {
    id: "assets",
    label: "Brand assets",
    description: "Logos, letterhead, stationery",
    accept: ".pdf,.png,.jpg,.jpeg,.svg,.webp,image/*",
    mimeHint: "PDF, PNG, SVG",
    icon: ImageIcon,
  },
]

export function emptyCategorizedFiles(): CategorizedImportFiles {
  return {
    quote_pdf: [],
    order_form: [],
    brand_guidelines: [],
    assets: [],
  }
}

export function totalImportFiles(files: CategorizedImportFiles): number {
  return Object.values(files).reduce((sum, list) => sum + list.length, 0)
}

export function flattenImportFiles(files: CategorizedImportFiles): File[] {
  return IMPORT_UPLOAD_CATEGORIES.flatMap((cat) => files[cat.id])
}

function extensionOk(name: string, accept: string): boolean {
  const lower = name.toLowerCase()
  return accept.split(",").some((token) => {
    const t = token.trim()
    if (t.startsWith(".")) return lower.endsWith(t)
    if (t.endsWith("/*")) {
      const prefix = t.replace("/*", "/")
      return lower.endsWith(prefix.replace("/", ".")) // fallback
    }
    return false
  })
}

export function filterFilesForCategory(
  category: ImportUploadCategory,
  incoming: FileList | File[],
): File[] {
  const list = Array.from(incoming)
  return list.filter((file) => {
    if (category.id === "quote_pdf" || category.id === "order_form") {
      return (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      )
    }
    if (category.id === "brand_guidelines") {
      return (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf") ||
        file.name.toLowerCase().endsWith(".doc") ||
        file.name.toLowerCase().endsWith(".docx")
      )
    }
    if (file.type.startsWith("image/")) return true
    return extensionOk(file.name, category.accept)
  })
}

const IMPORT_ACCEPT =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,.svg,.webp,application/pdf,image/*"

export function acceptImportFiles(incoming: FileList | File[]): File[] {
  const list = Array.from(incoming)
  const accepted: File[] = []
  for (const file of list) {
    const matched = IMPORT_UPLOAD_CATEGORIES.some(
      (cat) => filterFilesForCategory(cat, [file]).length > 0,
    )
    if (matched) accepted.push(file)
  }
  return accepted
}

export function detectImportCategoryLabel(file: File): string {
  const name = file.name.toLowerCase()
  if (name.includes("order") || name.includes("msa") || name.includes("form")) {
    return "Order form"
  }
  if (
    name.includes("brand") ||
    name.includes("guideline") ||
    name.includes("style")
  ) {
    return "Brand guidelines"
  }
  if (
    file.type.startsWith("image/") ||
    name.includes("logo") ||
    name.includes("letterhead")
  ) {
    return "Brand asset"
  }
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return "Quote PDF"
  }
  return "Document"
}

export function summarizeImportFiles(files: File[]): string[] {
  const counts = new Map<string, number>()
  for (const file of files) {
    const label = detectImportCategoryLabel(file)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return Array.from(counts.entries()).map(
    ([label, count]) => `${count} ${label}${count > 1 ? "s" : ""}`,
  )
}

export { IMPORT_ACCEPT }
