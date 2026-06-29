import type { PdfFieldMapping } from "@/lib/pdf-field-mappings"
import type { PdfMappingLearning } from "@/lib/pdf-mapping-learnings"
import type { BuilderTemplate } from "@/types/prompt-builder"

export type BuilderPdfSession = {
  pdfFieldMappings: PdfFieldMapping[]
  pdfSourceFileName: string | null
  pdfSourceDataUrl: string | null
  pdfMappingLearnings: PdfMappingLearning[]
}

export function withPersistedPdfImport(
  template: BuilderTemplate,
  session: BuilderPdfSession,
): BuilderTemplate {
  const {
    pdfFieldMappings,
    pdfSourceFileName,
    pdfSourceDataUrl,
    pdfMappingLearnings,
  } = session

  if (pdfFieldMappings.length === 0) {
    if (!template.pdfImport) return template
    const { pdfImport: _removed, ...rest } = template
    return rest
  }

  const sourceFileName =
    pdfSourceFileName?.trim() ||
    template.pdfImport?.sourceFileName ||
    "Uploaded PDF"

  return {
    ...template,
    pdfImport: {
      sourceFileName,
      sourcePdfDataUrl:
        pdfSourceDataUrl ?? template.pdfImport?.sourcePdfDataUrl,
      fieldMappings: pdfFieldMappings,
      mappingLearnings: pdfMappingLearnings,
    },
  }
}

export function templateHasPdfImport(template: BuilderTemplate): boolean {
  return (template.pdfImport?.fieldMappings.length ?? 0) > 0
}
