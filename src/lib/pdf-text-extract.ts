import { isPdfFile, loadPdfDocument, readFileAsDataUrl } from "@/lib/pdf-page-render"

export type PdfPageText = {
  pageNumber: number
  lines: string[]
  text: string
}

export type PdfDocumentText = {
  fileName: string
  pageCount: number
  pages: PdfPageText[]
  fullText: string
}

type TextFragment = {
  str: string
  x: number
  y: number
}

function groupTextItemsIntoLines(
  items: Array<{ str?: string; transform?: number[]; hasEOL?: boolean }>,
): string[] {
  const fragments: TextFragment[] = []

  for (const item of items) {
    const str = item.str?.trim()
    if (!str) continue
    const transform = item.transform ?? [1, 0, 0, 1, 0, 0]
    fragments.push({
      str,
      x: transform[4] ?? 0,
      y: transform[5] ?? 0,
    })
  }

  if (fragments.length === 0) return []

  fragments.sort((a, b) => {
    const yDiff = b.y - a.y
    if (Math.abs(yDiff) > 4) return yDiff
    return a.x - b.x
  })

  const lines: string[] = []
  let currentLine: TextFragment[] = []
  let currentY = fragments[0].y

  const flushLine = () => {
    if (currentLine.length === 0) return
    currentLine.sort((a, b) => a.x - b.x)
    const line = currentLine
      .map((f) => f.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
    if (line) lines.push(line)
    currentLine = []
  }

  for (const fragment of fragments) {
    if (Math.abs(fragment.y - currentY) > 4) {
      flushLine()
      currentY = fragment.y
    }
    currentLine.push(fragment)
  }
  flushLine()

  return lines
}

export async function extractTextFromPdfDataUrl(
  pdfDataUrl: string,
  fileName: string,
): Promise<PdfDocumentText> {
  const pdf = await loadPdfDocument(pdfDataUrl)
  const pages: PdfPageText[] = []

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber)
    const content = await page.getTextContent()
    const lines = groupTextItemsIntoLines(content.items as Parameters<typeof groupTextItemsIntoLines>[0])
    const text = lines.join("\n")
    pages.push({ pageNumber, lines, text })
  }

  const fullText = pages.map((page) => page.text).join("\n\n")

  return {
    fileName,
    pageCount: pdf.numPages,
    pages,
    fullText,
  }
}

export async function extractTextFromPdfFile(file: File): Promise<PdfDocumentText> {
  if (!isPdfFile(file)) {
    throw new Error("Not a PDF file")
  }
  const pdfDataUrl = await readFileAsDataUrl(file)
  return extractTextFromPdfDataUrl(pdfDataUrl, file.name)
}

export function pickPrimaryQuotePdf(files: File[]): File | undefined {
  return files.find((file) => isPdfFile(file))
}
