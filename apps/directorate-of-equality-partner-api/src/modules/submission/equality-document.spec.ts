import JSZip from 'jszip'

import { BadRequestException } from '@nestjs/common'

import {
  convertEqualityDocumentToHtml,
  MAX_EQUALITY_DOCUMENT_BYTES,
} from './equality-document'

/**
 * Builds a real `.docx` rather than mocking mammoth.
 *
 * The point of these specs is the boundary between a file a vendor uploads and
 * the HTML a reviewer edits, and a mocked converter would assert our own
 * mapping of our own stub. The fixtures below are archives mammoth actually
 * reads — which is also the only way the "zip but not a Word document" case
 * means anything.
 */
const docx = async (paragraphs: string[]): Promise<Buffer> => {
  const zip = new JSZip()

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
       <Default Extension="xml" ContentType="application/xml"/>
       <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
     </Types>`,
  )

  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
       <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
     </Relationships>`,
  )

  const body = paragraphs
    .map((text) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`)
    .join('')

  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
       <w:body>${body}</w:body>
     </w:document>`,
  )

  return zip.generateAsync({ type: 'nodebuffer' })
}

describe('convertEqualityDocumentToHtml', () => {
  it('converts a .docx into HTML', async () => {
    const { html } = await convertEqualityDocumentToHtml(
      await docx(['Jafnréttisáætlun', 'Markmið félagsins er jafnrétti.']),
    )

    expect(html).toContain('<p>Jafnréttisáætlun</p>')
    expect(html).toContain('Markmið félagsins er jafnrétti.')
  })

  it('preserves Icelandic characters', async () => {
    const { html } = await convertEqualityDocumentToHtml(
      await docx(['Þetta er áætlun um jöfn kjör — ÐÖÆÝ']),
    )

    expect(html).toContain('Þetta er áætlun um jöfn kjör — ÐÖÆÝ')
  })

  it('reports what the conversion could not represent, without failing', async () => {
    const { html, warnings } = await convertEqualityDocumentToHtml(
      await docx(['Plain enough']),
    )

    expect(html).toContain('Plain enough')
    expect(Array.isArray(warnings)).toBe(true)
  })

  describe('refusals', () => {
    it.each([
      ['missing', undefined],
      ['empty', Buffer.alloc(0)],
    ])('refuses a %s upload', async (_case, buffer) => {
      await expect(convertEqualityDocumentToHtml(buffer)).rejects.toThrow(
        BadRequestException,
      )
    })

    // A PDF is the format an employer is most likely to have to hand, so the
    // refusal has to say what to do instead rather than only that it is wrong.
    it('refuses a PDF, and says to save as .docx', async () => {
      const pdf = Buffer.concat([
        Buffer.from('%PDF-1.7\n', 'ascii'),
        Buffer.alloc(64, 0x20),
      ])

      await expect(convertEqualityDocumentToHtml(pdf)).rejects.toThrow(/\.docx/)
      await expect(convertEqualityDocumentToHtml(pdf)).rejects.toThrow(/PDF/)
    })

    it('refuses a legacy .doc, and says to use Save As', async () => {
      const ole2 = Buffer.concat([
        Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
        Buffer.alloc(64, 0x00),
      ])

      await expect(convertEqualityDocumentToHtml(ole2)).rejects.toThrow(
        /Save As/,
      )
    })

    it('refuses something that is not a document at all', async () => {
      await expect(
        convertEqualityDocumentToHtml(Buffer.from('just some text', 'utf-8')),
      ).rejects.toThrow(/not a Word document/)
    })

    // The case the ZIP signature alone cannot catch: .xlsx, .pptx and a plain
    // zip of files all open with the same four bytes.
    it('refuses a zip that is not a Word document', async () => {
      const zip = new JSZip()
      zip.file('notes.txt', 'this is not a plan')

      await expect(
        convertEqualityDocumentToHtml(
          await zip.generateAsync({ type: 'nodebuffer' }),
        ),
      ).rejects.toThrow(/not a Word document/)
    })

    it('refuses a document with no text in it', async () => {
      await expect(
        convertEqualityDocumentToHtml(await docx([])),
      ).rejects.toThrow(/no text/)
    })

    it('refuses an oversized upload', async () => {
      const oversized = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.alloc(MAX_EQUALITY_DOCUMENT_BYTES, 0x00),
      ])

      await expect(convertEqualityDocumentToHtml(oversized)).rejects.toThrow(
        /limit/,
      )
    })

    // Bytes that pass every gate above and still cannot be opened.
    it('refuses a corrupt archive without leaking the library’s wording', async () => {
      const corrupt = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.from('word/document.xml', 'ascii'),
        Buffer.alloc(128, 0xff),
      ])

      await expect(convertEqualityDocumentToHtml(corrupt)).rejects.toThrow(
        /could not be read/,
      )
    })
  })
})
