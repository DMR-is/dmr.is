import JSZip from 'jszip'

import { BadRequestException } from '@nestjs/common'

import { ONE_MEGA_BYTE } from '@dmr.is/constants'

import {
  assertConvertedHtmlWithinBound,
  convertEqualityDocumentToHtml,
  MAX_CONVERTED_HTML_BYTES,
  MAX_DOCUMENT_XML_BYTES,
  MAX_EQUALITY_DOCUMENT_BYTES,
} from './equality-document'

/** Mirrors the converter's own rounding, so a message assertion matches it. */
const MEGABYTES = (bytes: number) => Math.round(bytes / ONE_MEGA_BYTE)

/**
 * Builds a real `.docx` rather than mocking mammoth.
 *
 * The point of these specs is the boundary between a file a vendor uploads and
 * the HTML a reviewer edits, and a mocked converter would assert our own
 * mapping of our own stub. The fixtures below are archives mammoth actually
 * reads — which is also the only way the "zip but not a Word document" case
 * means anything.
 */
const docx = async (
  paragraphs: string[],
  /**
   * JSZip writes `STORE` by default, which makes an archive exactly as large as
   * its contents. Real `.docx` files are deflated, and so is any archive built
   * to inflate — so the ratio only exists when this is on.
   */
  compression: 'STORE' | 'DEFLATE' = 'STORE',
  /**
   * Level 1, not 9. The fixture below deflates tens of megabytes of one
   * repeated character, where the ratio is enormous at any level and the only
   * thing level 9 buys is CPU — enough of it to blow Jest's default timeout on
   * a CI runner.
   */
  level = 1,
): Promise<Buffer> => {
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

  return zip.generateAsync({
    type: 'nodebuffer',
    compression,
    compressionOptions: { level },
  })
}

/**
 * A `.docx` whose `word/document.xml` declares far more than it costs to send.
 *
 * Highly repetitive XML is what makes this cheap: a megabyte of one repeated
 * paragraph compresses to a few kilobytes, so the archive stays trivially small
 * while the inflated document does not. This is the shape of the request the
 * size bounds exist for — a valid key, a valid Word document, and an allocation
 * the process cannot survive.
 */
const inflatingDocx = async (inflatedBytes: number): Promise<Buffer> => {
  const paragraph = 'a'.repeat(1000)
  const count = Math.ceil(inflatedBytes / paragraph.length)

  return docx(
    Array.from({ length: count }, () => paragraph),
    'DEFLATE',
  )
}

/**
 * A plan containing a picture, and optionally text alongside it.
 *
 * With no paragraphs this is a scan: the case the "no text" refusal exists for.
 * With paragraphs it is an ordinary plan that happens to have a diagram in it,
 * which is what pins that images are dropped rather than inlined — the
 * scan-only case cannot pin that, because it is refused either way.
 */
const imageDocx = async (paragraphs: string[] = []): Promise<Buffer> => {
  const zip = new JSZip()

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
       <Default Extension="xml" ContentType="application/xml"/>
       <Default Extension="png" ContentType="image/png"/>
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
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
     <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
       <Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/scan.png"/>
     </Relationships>`,
  )
  zip.file('word/media/scan.png', Buffer.alloc(64 * 1024, 7))
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
     <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
                 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                 xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
       <w:body>
         ${paragraphs
           .map((text) => `<w:p><w:r><w:t>${text}</w:t></w:r></w:p>`)
           .join('')}
         <w:p><w:r><w:drawing><wp:inline>
           <a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
             <pic:pic><pic:blipFill><a:blip r:embed="rIdImg"/></pic:blipFill></pic:pic>
           </a:graphicData></a:graphic>
         </wp:inline></w:drawing></w:r></w:p>
       </w:body>
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

  /**
   * The bound that matters, and the one the first version of this file did not
   * have. Every other guard here measures the *compressed* buffer — which is
   * the size of the request, not the size of the allocation. A `.docx` is a ZIP,
   * so those two numbers are related only by a ratio the caller chooses.
   */
  describe('inflation', () => {
    // Built once: assembling tens of megabytes and deflating it is the expensive
    // part of this file, and both assertions below are about the same archive.
    let bomb: Buffer

    beforeAll(async () => {
      bomb = await inflatingDocx(MAX_DOCUMENT_XML_BYTES * 2)
    }, 60_000)

    /**
     * Sized to clear the declared-size filter and be caught by the measured one,
     * because that is the bound that has to hold: the declared sizes are the
     * archive's own claim, and an attacker writes them. Asserting the 4MB
     * message rather than just "expands to more than" is what distinguishes the
     * two — the header check firing here would mean the streaming check was
     * never exercised.
     */
    it('refuses it on measured bytes, not on the declared header', async () => {
      await expect(convertEqualityDocumentToHtml(bomb)).rejects.toThrow(
        new RegExp(`${MEGABYTES(MAX_DOCUMENT_XML_BYTES)}MB of content`),
      )
    })

    /**
     * The measurement the finding rested on: the archive is a rounding error
     * against the upload cap, and inflating it is what costs. If this ever
     * stops holding, the fixture stopped being a bomb and the test above stopped
     * testing anything.
     */
    it('refuses it while being far below the upload limit', () => {
      expect(bomb.length).toBeLessThan(MAX_EQUALITY_DOCUMENT_BYTES / 10)
    })

    it('still accepts an ordinary plan', async () => {
      const { html } = await convertEqualityDocumentToHtml(
        await docx(['Jafnréttisáætlun 2026', 'Markmið og aðgerðir']),
      )

      expect(html).toContain('Jafnréttisáætlun 2026')
    })
  })

  /**
   * Reachable only here. Once the input is bounded at 4MB of WordprocessingML,
   * no document that converts at all can produce 4MB of HTML — so a fixture
   * cannot exercise this, and an untested bound is one that quietly stops
   * working. It is the backstop for the input bound being wrong, which is
   * exactly the assumption that was wrong last time.
   */
  describe('the converted-size backstop', () => {
    it('accepts output at the bound', () => {
      expect(() =>
        assertConvertedHtmlWithinBound('a'.repeat(MAX_CONVERTED_HTML_BYTES)),
      ).not.toThrow()
    })

    it('refuses output past it', () => {
      expect(() =>
        assertConvertedHtmlWithinBound(
          'a'.repeat(MAX_CONVERTED_HTML_BYTES + 1),
        ),
      ).toThrow(/converts to more than/)
    })

    it('counts bytes rather than characters', () => {
      // Icelandic prose is multi-byte, so a character count would admit
      // roughly twice the bytes the column and the wire actually carry.
      const twoByteChars = 'á'.repeat(MAX_CONVERTED_HTML_BYTES / 2 + 1)

      expect(() => assertConvertedHtmlWithinBound(twoByteChars)).toThrow()
    })
  })

  /**
   * Mammoth inlines images as base64 `data:` URIs unless told otherwise, which
   * made two promises false at once: the HTML was unbounded, and a scanned plan
   * converted to a page of `<img>` elements — a non-empty string, so the
   * "no text" refusal the guide advertises could never fire on the file it was
   * written for.
   */
  describe('images', () => {
    it('refuses a plan whose content is only a picture', async () => {
      await expect(
        convertEqualityDocumentToHtml(await imageDocx()),
      ).rejects.toThrow(/contains no text/)
    })

    /**
     * The assertion that actually pins `MAMMOTH_OPTIONS`. A plan with text *and*
     * a picture is accepted either way, so the only thing distinguishing a
     * dropped image from an inlined one is whether its bytes are in the output.
     * Without this, removing `convertImage` left the whole suite green.
     */
    it('keeps the text and drops the image data', async () => {
      const { html } = await convertEqualityDocumentToHtml(
        await imageDocx(['Jafnréttisáætlun 2026']),
      )

      expect(html).toContain('Jafnréttisáætlun 2026')
      expect(html).not.toContain('data:')
      expect(html).not.toContain('base64')
    })
  })
})
