import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PDFJS_DOCUMENT_OPTIONS } from './pdf.service'

/*
 * `PdfService.getPdfJsLegacy` loads pdfjs-dist's ESM legacy build with a plain
 * `require`, which works only because Node 24 can `require()` an ES module that
 * has no top-level await. Jest's own module registry cannot do that, so this
 * runs the same load and the same `getDocument` options in a real Node child
 * process. A pdfjs upgrade that adds top-level await would otherwise surface as
 * ERR_REQUIRE_ASYNC_MODULE only when someone first generates an issue PDF.
 *
 * The specifier is read from the service's source rather than shared through a
 * constant: webpack only leaves a `require` of a string literal external.
 */
const PDFJS_SPECIFIER = readFileSync(
  join(__dirname, 'pdf.service.ts'),
  'utf8',
).match(/require\('(pdfjs-dist\/[^']+)'\)/)?.[1]

const RESULT = 'RESULT:'

const script = (specifier: string) => `
const { PDFDocument, StandardFonts } = require('pdf-lib')

;(async () => {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  for (const text of ['Cover', 'MARKER-1 first', 'MARKER-2 second']) {
    doc.addPage().drawText(text, { x: 50, y: 700, font, size: 12 })
  }

  const pdfjs = require(${JSON.stringify(specifier)})
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await doc.save()),
    ...${JSON.stringify(PDFJS_DOCUMENT_OPTIONS)},
  }).promise

  const pages = []
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent()
    pages.push(content.items.map((item) => item.str ?? '').join(''))
  }
  await pdf.destroy()
  // pdfjs logs its own warnings to stdout, so the result gets a marker.
  process.stdout.write(${JSON.stringify(RESULT)} + JSON.stringify(pages))
})().catch((error) => {
  process.stderr.write(String(error && error.stack ? error.stack : error))
  process.exit(1)
})
`

describe('pdfjs-dist legacy build', () => {
  it('finds the pdfjs require in pdf.service.ts', () => {
    expect(PDFJS_SPECIFIER).toBeDefined()
  })

  it('loads through require(esm) and extracts page text', () => {
    const output = execFileSync(
      process.execPath,
      ['-e', script(PDFJS_SPECIFIER ?? '')],
      { cwd: __dirname, encoding: 'utf8', timeout: 30_000 },
    )

    expect(
      JSON.parse(output.slice(output.indexOf(RESULT) + RESULT.length)),
    ).toEqual(['Cover', 'MARKER-1 first', 'MARKER-2 second'])
  })
})
