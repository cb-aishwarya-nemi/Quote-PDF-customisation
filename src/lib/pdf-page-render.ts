import { getDocument, GlobalWorkerOptions } from "pdfjs-dist"
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url"

GlobalWorkerOptions.workerSrc = pdfWorker

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ""))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? ""
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function renderPdfPageToDataUrl(
  pdfDataUrl: string,
  pageNumber: number,
  scale = 1.5,
): Promise<string> {
  const pdf = await getDocument({ data: dataUrlToUint8Array(pdfDataUrl) }).promise
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas not supported")

  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({ canvas, canvasContext: context, viewport }).promise
  return canvas.toDataURL("image/png")
}

export async function renderPdfPageThumbnail(
  pdfDataUrl: string,
  pageNumber: number,
): Promise<string> {
  return renderPdfPageToDataUrl(pdfDataUrl, pageNumber, 0.4)
}

export async function renderPdfPagesToDataUrls(
  pdfDataUrl: string,
  pageNumbers: number[],
  scale = 1.5,
): Promise<{ page: number; previewUrl: string }[]> {
  const sorted = [...pageNumbers].sort((a, b) => a - b)
  const results: { page: number; previewUrl: string }[] = []
  for (const page of sorted) {
    const previewUrl = await renderPdfPageToDataUrl(pdfDataUrl, page, scale)
    results.push({ page, previewUrl })
  }
  return results
}

export async function preparePdfUpload(file: File): Promise<{
  fileName: string
  pdfDataUrl: string
  pageCount: number
}> {
  const pdfDataUrl = await readFileAsDataUrl(file)
  const pageCount = await getPdfPageCount(pdfDataUrl)
  return { fileName: file.name, pdfDataUrl, pageCount }
}

export async function getPdfPageCount(pdfDataUrl: string): Promise<number> {
  const pdf = await getDocument({ data: dataUrlToUint8Array(pdfDataUrl) }).promise
  return pdf.numPages
}

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  )
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

export async function loadImageBlockFromFile(file: File): Promise<{
  fileName: string
  mediaType: "image" | "pdf"
  previewUrl: string
  pdfDataUrl?: string
  pageCount?: number
  selectedPage?: number
  selectedPages?: number[]
  importedPages?: { page: number; previewUrl: string }[]
}> {
  if (isPdfFile(file)) {
    const { fileName, pdfDataUrl, pageCount } = await preparePdfUpload(file)
    const importedPages = await renderPdfPagesToDataUrls(pdfDataUrl, [1])
    return {
      fileName,
      mediaType: "pdf",
      previewUrl: importedPages[0]?.previewUrl ?? "",
      pdfDataUrl,
      pageCount,
      selectedPage: 1,
      selectedPages: [1],
      importedPages,
    }
  }

  if (isImageFile(file)) {
    const previewUrl = await readFileAsDataUrl(file)
    return {
      fileName: file.name,
      mediaType: "image",
      previewUrl,
    }
  }

  throw new Error("Unsupported file type")
}
