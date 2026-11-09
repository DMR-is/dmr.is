import { BadRequestException } from '@nestjs/common'

import { ReportAttachmentExtensionEnum } from '../models/report-attachment.model'
import {
  assertAttachmentContent,
  extensionOf,
  MAX_REPORT_ATTACHMENT_BYTES,
  sanitizeAttachmentFilename,
  toAttachmentExtension,
} from './attachment-file'

const { PDF, DOCX, XLSX, XLS } = ReportAttachmentExtensionEnum

const pdf = Buffer.from('%PDF-1.7\n…')
const zip = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.from('[Content_Types].xml xl/workbook.xml'),
])
const ole = Buffer.concat([
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  Buffer.alloc(32),
])

describe('assertAttachmentContent', () => {
  it.each([
    [PDF, pdf],
    [DOCX, zip],
    [XLSX, zip],
    [XLS, ole],
  ])('accepts a real .%s', (extension, bytes) => {
    expect(() => assertAttachmentContent(bytes, extension)).not.toThrow()
  })

  it('accepts a PDF whose header sits after a BOM, as Acrobat does', () => {
    const withBom = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), pdf])
    expect(() => assertAttachmentContent(withBom, PDF)).not.toThrow()
  })

  it.each([
    ['a .docx renamed to .pdf', zip, PDF],
    ['a PDF renamed to .xlsx', pdf, XLSX],
    ['a legacy .xls renamed to .xlsx', ole, XLSX],
    ['an .xlsx renamed to .xls', zip, XLS],
  ])('refuses %s', (_label, bytes, extension) => {
    expect(() => assertAttachmentContent(bytes, extension)).toThrow(
      /do not match/,
    )
  })

  it.each([XLSX, DOCX])(
    'refuses a macro-enabled file renamed to .%s',
    (extension) => {
      const macro = Buffer.concat([zip, Buffer.from('xl/vbaProject.bin')])
      expect(() => assertAttachmentContent(macro, extension)).toThrow(/macros/)
    },
  )

  it('refuses an empty file', () => {
    expect(() => assertAttachmentContent(Buffer.alloc(0), PDF)).toThrow(
      BadRequestException,
    )
  })

  it('refuses a file over the cap', () => {
    const big = Buffer.concat([pdf, Buffer.alloc(MAX_REPORT_ATTACHMENT_BYTES)])
    expect(() => assertAttachmentContent(big, PDF)).toThrow(/limit/)
  })
})

describe('toAttachmentExtension', () => {
  it('normalises case and a leading dot', () => {
    expect(toAttachmentExtension('.XLSX')).toBe(XLSX)
  })

  it.each(['xlsm', 'docm', 'csv', 'html', 'svg', 'exe', ''])(
    'refuses %p',
    (value) => {
      expect(() => toAttachmentExtension(value)).toThrow(BadRequestException)
    },
  )
})

describe('extensionOf', () => {
  it('reads the last extension, lower-cased', () => {
    expect(extensionOf('aðgerðaáætlun.2026.XLSX')).toBe('xlsx')
    expect(extensionOf('doe-imports/equality-attachment/u.pdf')).toBe('pdf')
    expect(extensionOf('no-extension')).toBe('')
  })
})

describe('sanitizeAttachmentFilename', () => {
  it('keeps Icelandic characters', () => {
    expect(sanitizeAttachmentFilename('Aðgerðaáætlun 2026.xlsx')).toBe(
      'Aðgerðaáætlun 2026.xlsx',
    )
  })

  it('drops a path a browser may prefix', () => {
    expect(sanitizeAttachmentFilename('C:\\fakepath\\plan.pdf')).toBe(
      'plan.pdf',
    )
    expect(sanitizeAttachmentFilename('../../etc/plan.pdf')).toBe('plan.pdf')
  })

  it('strips control characters, so a CR/LF cannot reach a header', () => {
    expect(sanitizeAttachmentFilename('pl\r\nan.pdf')).toBe('plan.pdf')
  })

  it('refuses a name with nothing left, or one too long', () => {
    expect(() => sanitizeAttachmentFilename('  ')).toThrow(BadRequestException)
    expect(() => sanitizeAttachmentFilename(`${'a'.repeat(252)}.pdf`)).toThrow(
      /255/,
    )
  })
})
