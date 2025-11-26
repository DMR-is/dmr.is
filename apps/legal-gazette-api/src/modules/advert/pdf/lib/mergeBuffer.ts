import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

type PageNumberOptions = {
  startNum?: number
  skipFirst?: boolean
}

export type PdfBufferInformation = { buffer: Buffer; totalPages: number }

export async function mergePdfBuffers(
  buffers: Buffer[],
  startNum = 1,
): Promise<PdfBufferInformation> {
  const mergedPdf = await PDFDocument.create()
  let totalPages = 0

  for (const buffer of buffers) {
    const pdf = await PDFDocument.load(buffer)

    // count pages in this source PDF
    const pageIndices = pdf.getPageIndices()
    const copiedPages = await mergedPdf.copyPages(pdf, pageIndices)
    copiedPages.forEach((p) => mergedPdf.addPage(p))

    totalPages += pageIndices.length
  }

  const mergedBytes = await mergedPdf.save()
  const finalBytes = await addPageNumbers(mergedBytes, {
    startNum,
    skipFirst: true,
  })

  return { buffer: Buffer.from(finalBytes), totalPages }
}

export async function addPageNumbers(
  mergedBytes: Uint8Array | ArrayBuffer,
  options: PageNumberOptions = {},
): Promise<Uint8Array> {
  const { startNum = 1, skipFirst = false } = options

  const pdfDoc = await PDFDocument.load(mergedBytes)
  const pages = pdfDoc.getPages()
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const fontSize = 10

  pages.forEach((page, index) => {
    if (skipFirst && index === 0) return // no number on page 1

    const { width, height } = page.getSize()

    // index 0 is first page, so:
    const pageNumber = startNum + index - (skipFirst ? 1 : 0)

    page.drawText(String(pageNumber), {
      x: 26,
      y: height - 29,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
  })

  return pdfDoc.save()
}
