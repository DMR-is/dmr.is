import { BadRequestException } from '@nestjs/common'

import { hasPdfSignature } from '../../report/lib/equality-content'
import { ReportAttachmentExtensionEnum } from '../models/report-attachment.model'

/** Most attachments one equality report may carry. */
export const MAX_REPORT_ATTACHMENTS = 6

/**
 * Largest single attachment, decoded. Mirrors the table's CHECK and the main
 * plan's PDF cap. The cap is enforced while the staged object is downloaded
 * (`fetchObject`), so an oversized upload is never read into memory whole.
 */
export const MAX_REPORT_ATTACHMENT_BYTES = 4 * 1024 * 1024

/** Mirrors the table's CHECK on `filename`. */
const MAX_FILENAME_LENGTH = 255

/** Zip local-file header: every .docx and .xlsx starts with it. */
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])

/** OLE compound file header: legacy .xls (and .doc) start with it. */
const OLE_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

/**
 * The part a macro-enabled Office file carries (`xl/vbaProject.bin`,
 * `word/vbaProject.bin`). Zip stores entry names uncompressed in both the local
 * headers and the central directory, so a byte search finds it without
 * unzipping. A `.xlsm` renamed to `.xlsx` passes the zip check alone; this is
 * what stops it.
 */
const VBA_PROJECT = Buffer.from('vbaProject.bin', 'ascii')

/**
 * The content type a download is served with — derived from the stored
 * extension, never from anything the uploader sent.
 */
export const ATTACHMENT_CONTENT_TYPES: Record<
  ReportAttachmentExtensionEnum,
  string
> = {
  [ReportAttachmentExtensionEnum.PDF]: 'application/pdf',
  [ReportAttachmentExtensionEnum.DOCX]:
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  [ReportAttachmentExtensionEnum.XLSX]:
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [ReportAttachmentExtensionEnum.XLS]: 'application/vnd.ms-excel',
}

const ALLOWED_EXTENSIONS: ReadonlySet<string> = new Set(
  Object.values(ReportAttachmentExtensionEnum),
)

/** The lower-cased extension of `name`, without the dot, or `''`. */
export const extensionOf = (name: string): string => {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

/** Narrows an extension string to one an attachment may have, or throws 400. */
export const toAttachmentExtension = (
  value: string,
): ReportAttachmentExtensionEnum => {
  const extension = value.toLowerCase().replace(/^\./, '')
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new BadRequestException(
      `Unsupported attachment type: .${extension}. Allowed: ${[
        ...ALLOWED_EXTENSIONS,
      ]
        .map((e) => `.${e}`)
        .join(', ')}`,
    )
  }
  return extension as ReportAttachmentExtensionEnum
}

/**
 * The filename as it will be stored and served: path components dropped
 * (a browser may send `C:\fakepath\…`), control characters removed, trimmed.
 * Throws 400 when nothing usable is left or it is too long.
 */
export const sanitizeAttachmentFilename = (raw: string): string => {
  const base = raw.split(/[\\/]/).pop() ?? ''
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim()

  if (cleaned.length === 0) {
    throw new BadRequestException('Attachment filename is empty')
  }
  if (cleaned.length > MAX_FILENAME_LENGTH) {
    throw new BadRequestException(
      `Attachment filename exceeds ${MAX_FILENAME_LENGTH} characters`,
    )
  }
  return cleaned
}

/**
 * Throws 400 unless `bytes` really is a file of type `extension`.
 *
 * The extension is what decides the download's content type, so a file whose
 * bytes disagree with it is refused rather than served under a type it is not.
 */
export const assertAttachmentContent = (
  bytes: Buffer,
  extension: ReportAttachmentExtensionEnum,
): void => {
  if (bytes.length === 0) {
    throw new BadRequestException('The attachment is empty')
  }

  // Backstop: the download is already capped at this size.
  if (bytes.length > MAX_REPORT_ATTACHMENT_BYTES) {
    throw new BadRequestException(
      `The attachment exceeds the ${MAX_REPORT_ATTACHMENT_BYTES / (1024 * 1024)}MB limit`,
    )
  }

  const mismatch = () =>
    new BadRequestException(
      `The attachment's contents do not match its .${extension} extension`,
    )

  switch (extension) {
    case ReportAttachmentExtensionEnum.PDF:
      if (!hasPdfSignature(bytes)) throw mismatch()
      return

    case ReportAttachmentExtensionEnum.DOCX:
    case ReportAttachmentExtensionEnum.XLSX:
      if (!bytes.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC)) {
        throw mismatch()
      }
      if (bytes.indexOf(VBA_PROJECT) !== -1) {
        throw new BadRequestException(
          'Files containing macros are not accepted',
        )
      }
      return

    case ReportAttachmentExtensionEnum.XLS:
      // Macros in a legacy .xls cannot be detected this cheaply; reviewers'
      // Excel opens downloaded files in Protected View.
      if (!bytes.subarray(0, OLE_MAGIC.length).equals(OLE_MAGIC)) {
        throw mismatch()
      }
      return
  }
}
