import { BadRequestException } from '@nestjs/common'

import { EqualityContentTypeEnum } from '../models/report.enums'
import {
  MAX_EQUALITY_PDF_BYTES,
  resolveEqualityContent,
  resolveOptionalEqualityContent,
} from './equality-content'

/** A syntactically valid minimal PDF — header, one object, trailer. */
const realPdf = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<</Type/Catalog>>\nendobj\ntrailer\n<</Root 1 0 R>>\n%%EOF',
  'ascii',
)

const asBase64 = (buffer: Buffer) => buffer.toString('base64')

/** A buffer of `size` bytes that still begins with a valid PDF header. */
const pdfOfSize = (size: number) => {
  const padded = Buffer.alloc(size, 0x20)
  realPdf.copy(padded, 0)
  return padded
}

describe('resolveEqualityContent', () => {
  it('maps HTML content to the HTML type with no filename', () => {
    expect(
      resolveEqualityContent({ equalityReportContent: '<p>Áætlun</p>' }),
    ).toEqual({
      equalityReportContent: '<p>Áætlun</p>',
      equalityReportContentType: EqualityContentTypeEnum.HTML,
      equalityReportContentFilename: null,
    })
  })

  it('stores the PDF base64 verbatim rather than re-encoding it', () => {
    const base64 = asBase64(realPdf)

    const result = resolveEqualityContent({
      equalityReportPdf: base64,
      equalityReportPdfFilename: 'aaetlun.pdf',
    })

    // The exact string in, the exact string out — a decode/re-encode round trip
    // would be a chance to change bytes we promised to keep as submitted.
    expect(result.equalityReportContent).toBe(base64)
    expect(result.equalityReportContentType).toBe(EqualityContentTypeEnum.PDF)
    expect(result.equalityReportContentFilename).toBe('aaetlun.pdf')
  })

  it('trims the stored filename', () => {
    expect(
      resolveEqualityContent({
        equalityReportPdf: asBase64(realPdf),
        equalityReportPdfFilename: '  aaetlun.pdf  ',
      }).equalityReportContentFilename,
    ).toBe('aaetlun.pdf')
  })

  describe('the either/or rule', () => {
    it('rejects both content kinds at once', () => {
      expect(() =>
        resolveEqualityContent({
          equalityReportContent: '<p>Áætlun</p>',
          equalityReportPdf: asBase64(realPdf),
          equalityReportPdfFilename: 'aaetlun.pdf',
        }),
      ).toThrow(BadRequestException)
    })

    it('rejects neither', () => {
      expect(() => resolveEqualityContent({})).toThrow(BadRequestException)
    })

    // Whitespace-only is "nothing submitted", not "submitted an empty plan" —
    // otherwise a stray space would satisfy the requirement.
    it('treats blank HTML as absent', () => {
      expect(() =>
        resolveEqualityContent({ equalityReportContent: '   ' }),
      ).toThrow(BadRequestException)
    })
  })

  describe('PDF validation', () => {
    it('rejects a file with no %PDF- signature', () => {
      // A .docx renamed to .pdf is the realistic version of this: it uploads
      // fine and only fails much later, inside an approval, if it gets through.
      const docx = Buffer.from('PK not a pdf at all', 'ascii')

      expect(() =>
        resolveEqualityContent({
          equalityReportPdf: asBase64(docx),
          equalityReportPdfFilename: 'aaetlun.pdf',
        }),
      ).toThrow(/not a PDF/)
    })

    /*
     * ⚠️ These are the regression. The check used to require the signature at
     * byte 0, which rejected real PDFs at submission — a BOM from a producer
     * that wrote the file as text, or padding from a signing tool — even though
     * `pdf-lib` reads them without complaint when the report is approved.
     */
    it.each([
      ['a UTF-8 BOM', Buffer.from([0xef, 0xbb, 0xbf])],
      ['leading whitespace', Buffer.from('\r\n   ', 'ascii')],
      ['null padding', Buffer.alloc(16)],
    ])('accepts a PDF preceded by %s', (_label, prefix) => {
      expect(() =>
        resolveEqualityContent({
          equalityReportPdf: asBase64(Buffer.concat([prefix, realPdf])),
          equalityReportPdfFilename: 'aaetlun.pdf',
        }),
      ).not.toThrow()
    })

    it('does not scan past the first 1024 bytes for the signature', () => {
      // Further in than that and the file is something else that happens to
      // embed a PDF, not a PDF — the same boundary Acrobat draws.
      const buried = Buffer.concat([Buffer.alloc(2048), realPdf])

      expect(() =>
        resolveEqualityContent({
          equalityReportPdf: asBase64(buried),
          equalityReportPdfFilename: 'aaetlun.pdf',
        }),
      ).toThrow(/not a PDF/)
    })

    it('rejects a PDF over the size cap', () => {
      expect(() =>
        resolveEqualityContent({
          equalityReportPdf: asBase64(pdfOfSize(MAX_EQUALITY_PDF_BYTES + 1)),
          equalityReportPdfFilename: 'aaetlun.pdf',
        }),
      ).toThrow(/exceeds the 4MB limit/)
    })

    it('accepts a PDF exactly at the cap', () => {
      expect(() =>
        resolveEqualityContent({
          equalityReportPdf: asBase64(pdfOfSize(MAX_EQUALITY_PDF_BYTES)),
          equalityReportPdfFilename: 'aaetlun.pdf',
        }),
      ).not.toThrow()
    })

    it('rejects a value that is not base64 at all', () => {
      // `Buffer.from` skips unreadable characters rather than throwing, so this
      // decodes to nothing instead of failing — hence the explicit empty check.
      expect(() =>
        resolveEqualityContent({
          equalityReportPdf: '!!!!',
          equalityReportPdfFilename: 'aaetlun.pdf',
        }),
      ).toThrow(/empty or is not valid base64/)
    })

    it('requires a filename alongside the PDF', () => {
      expect(() =>
        resolveEqualityContent({ equalityReportPdf: asBase64(realPdf) }),
      ).toThrow(/equalityReportPdfFilename is required/)
    })
  })
})

describe('resolveOptionalEqualityContent', () => {
  it('returns null when the patch mentions neither field', () => {
    // The common PATCH: changing a phone number must not touch the narrative.
    expect(resolveOptionalEqualityContent({})).toBeNull()
  })

  it('clears to HTML/null when content is explicitly nulled', () => {
    // Not left at PDF with nothing to show — the database CHECK would reject
    // that pairing, and it would describe a file that is no longer there.
    expect(
      resolveOptionalEqualityContent({ equalityReportContent: null }),
    ).toEqual({
      equalityReportContent: null,
      equalityReportContentType: EqualityContentTypeEnum.HTML,
      equalityReportContentFilename: null,
    })
  })

  it('resolves a PDF the same way a submit does', () => {
    expect(
      resolveOptionalEqualityContent({
        equalityReportPdf: asBase64(realPdf),
        equalityReportPdfFilename: 'aaetlun.pdf',
      }),
    ).toEqual({
      equalityReportContent: asBase64(realPdf),
      equalityReportContentType: EqualityContentTypeEnum.PDF,
      equalityReportContentFilename: 'aaetlun.pdf',
    })
  })

  it('still rejects both kinds at once', () => {
    expect(() =>
      resolveOptionalEqualityContent({
        equalityReportContent: '<p>Áætlun</p>',
        equalityReportPdf: asBase64(realPdf),
        equalityReportPdfFilename: 'aaetlun.pdf',
      }),
    ).toThrow(BadRequestException)
  })
})
