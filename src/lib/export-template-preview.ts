import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

function sanitizeFilename(name: string) {
  return name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-") || "quote-preview"
}

async function renderPreviewCanvas(element: HTMLElement) {
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })
}

async function canvasToPdfBlob(canvas: HTMLCanvasElement) {
  const imgData = canvas.toDataURL("image/jpeg", 0.92)
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const renderWidth = pageWidth - margin * 2
  const renderHeight = (canvas.height * renderWidth) / canvas.width
  const printableHeight = pageHeight - margin * 2

  let heightLeft = renderHeight
  let offsetY = 0

  while (heightLeft > 0) {
    if (offsetY > 0) pdf.addPage()
    pdf.addImage(
      imgData,
      "JPEG",
      margin,
      margin - offsetY,
      renderWidth,
      renderHeight,
    )
    offsetY += printableHeight
    heightLeft -= printableHeight
  }

  return pdf.output("blob")
}

export async function generatePreviewPdfBlob(element: HTMLElement) {
  const canvas = await renderPreviewCanvas(element)
  return canvasToPdfBlob(canvas)
}

export async function downloadPreviewPdf(
  element: HTMLElement,
  filename: string,
) {
  const blob = await generatePreviewPdfBlob(element)
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${sanitizeFilename(filename)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

export type SharePreviewResult = "shared" | "downloaded" | "cancelled"

export async function sharePreviewPdf(
  element: HTMLElement,
  options: { filename: string; title: string; text: string },
): Promise<SharePreviewResult> {
  const blob = await generatePreviewPdfBlob(element)
  const file = new File(
    [blob],
    `${sanitizeFilename(options.filename)}.pdf`,
    { type: "application/pdf" },
  )

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        files: [file],
      })
      return "shared"
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled"
      }
    }
  }

  await downloadPreviewPdf(element, options.filename)
  return "downloaded"
}
