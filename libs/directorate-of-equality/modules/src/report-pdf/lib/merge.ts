import { PDFDocument } from 'pdf-lib'

/**
 * Concatenates PDFs into one document, in order.
 *
 * Used to put the Directorate's generated cover page in front of the plan a
 * company uploaded, so a PDF-backed equality report downloads as one document
 * carrying the same identification and validity metadata an HTML-backed one
 * does.
 *
 * Deliberately *not* the legal-gazette `mergePdfBuffers`: that one stamps page
 * numbers onto the result, which the equality report has never had. Copying it
 * wholesale would have changed how every existing equality PDF looks in order
 * to add a second kind.
 *
 * Throws whatever `PDFDocument.load` throws on an unreadable input. That is the
 * intended behaviour — `ReportPdfService`'s callers already treat a failed
 * render as "send the notice without the attachment", which is the right
 * outcome for one corrupt file and a much better one than silently shipping a
 * document with the plan missing from it.
 */
export async function mergePdfs(buffers: Buffer[]): Promise<Buffer> {
  const merged = await PDFDocument.create()

  for (const buffer of buffers) {
    const source = await PDFDocument.load(buffer)
    const pages = await merged.copyPages(source, source.getPageIndices())

    pages.forEach((page) => merged.addPage(page))
  }

  return Buffer.from(await merged.save())
}
