import { BadRequestException } from '@nestjs/common'

import { EqualityContentTypeEnum } from '../models/report.enums'

/**
 * Largest PDF a company may submit as its jafnréttisáætlun, decoded.
 *
 * ⚠️ **Bounded by the API's request-body limit, not by taste.** The PDF travels
 * as base64 inside a JSON body, which inflates it by 4/3 — so 4MB on disk is
 * ~5.46MB on the wire, and `apps/directorate-of-equality-api/src/main.ts` caps
 * JSON bodies at 6mb. The remaining ~0.5MB is headroom for the rest of the
 * submit payload (company block, subsidiaries, contact details).
 *
 * Raising this means raising that limit first, and that limit is global to
 * every endpoint on the API — which is why the cap landed here instead.
 */
export const MAX_EQUALITY_PDF_BYTES = 4 * 1024 * 1024

/**
 * The longest base64 string that can decode to within the cap.
 *
 * Base64 emits 4 characters per 3 input bytes, padded up to a multiple of 4.
 * Checking this *before* decoding is the point: it rejects an oversized upload
 * from the string length alone, so a caller cannot make the API allocate a
 * buffer larger than the cap in order to discover the buffer is too large.
 */
const MAX_EQUALITY_PDF_BASE64_LENGTH = Math.ceil(MAX_EQUALITY_PDF_BYTES / 3) * 4

/** The PDF file signature. */
const PDF_MAGIC = Buffer.from('%PDF-', 'ascii')

/**
 * How far into the file to look for the signature.
 *
 * ⚠️ **Not `subarray(0, 5)` — the header is not reliably at byte 0.** Plenty of
 * PDFs in the wild carry leading bytes before it: a UTF-8 BOM from a producer
 * that wrote the file as text, stray whitespace, or padding left by a signing
 * tool. Acrobat accepts the header anywhere in the first 1024 bytes and so does
 * `pdf-lib`, which is what actually has to read this file when the report is
 * approved.
 *
 * Requiring offset 0 made this validator stricter than the consumer it was
 * protecting — rejecting, at submission, files the merge step would have
 * handled perfectly. 1024 matches Adobe's own tolerance.
 */
const PDF_MAGIC_SEARCH_BYTES = 1024

const MEGABYTES = (bytes: number) => Math.round(bytes / (1024 * 1024))

export type EqualityContentInput = {
  /** Rich-text HTML, already base64-decoded by `@ApiHTML`. */
  equalityReportContent?: string | null
  /** The uploaded PDF, still base64 — never decoded in transit. */
  equalityReportPdf?: string | null
  equalityReportPdfFilename?: string | null
}

/** The three content columns, ready to write onto `ReportModel`. */
export type EqualityContentColumns = {
  equalityReportContent: string | null
  equalityReportContentType: EqualityContentTypeEnum
  equalityReportContentFilename: string | null
}

const isPresent = (value?: string | null): value is string =>
  typeof value === 'string' && value.trim().length > 0

/**
 * Validates a submitted PDF and returns the base64 unchanged.
 *
 * The bytes are decoded here only to inspect them — the base64 is what gets
 * stored, so this deliberately does not return the buffer. Round-tripping
 * through a decode/re-encode would risk normalising the very bytes we promised
 * to keep verbatim.
 */
const assertValidPdf = (base64: string): void => {
  if (base64.length > MAX_EQUALITY_PDF_BASE64_LENGTH) {
    throw new BadRequestException(
      `The equality report PDF exceeds the ${MEGABYTES(MAX_EQUALITY_PDF_BYTES)}MB limit`,
    )
  }

  const decoded = Buffer.from(base64, 'base64')

  /*
   * `Buffer.from` never throws on malformed base64 — it silently skips the
   * characters it cannot read — so an empty buffer is how "this was not base64
   * at all" actually presents. Checking it separately keeps that case from
   * being reported as a missing PDF header, which would send the caller
   * looking at the wrong thing.
   */
  if (decoded.length === 0) {
    throw new BadRequestException(
      'The equality report PDF is empty or is not valid base64',
    )
  }

  // The base64 length check above is an upper bound (padding and any stray
  // whitespace inflate it), so the decoded size is what actually decides.
  if (decoded.length > MAX_EQUALITY_PDF_BYTES) {
    throw new BadRequestException(
      `The equality report PDF exceeds the ${MEGABYTES(MAX_EQUALITY_PDF_BYTES)}MB limit`,
    )
  }

  /*
   * ⚠️ **Rejecting here is what keeps a bad file out of an approval.** Nothing
   * downstream reads these bytes until the report is approved, at which point
   * `ReportPdfService` merges them into the document mailed to the company —
   * and a failure there costs the attachment on a decision already committed.
   * A renamed .docx is caught at submission, where the applicant can still fix
   * it, or it is not caught at all.
   */
  if (decoded.subarray(0, PDF_MAGIC_SEARCH_BYTES).indexOf(PDF_MAGIC) === -1) {
    throw new BadRequestException(
      'The uploaded file is not a PDF — no "%PDF-" signature found',
    )
  }
}

/**
 * Resolves the two mutually exclusive ways an equality report's content can
 * arrive into the columns that store it.
 *
 * One definition rather than one per write path: equality content is set from
 * four places (application submit, applicant correction, admin create, draft
 * PATCH), and "exactly one of these, that size, with those magic bytes" is a
 * rule that has to mean the same thing in all four.
 *
 * Throws `BadRequestException` when neither or both are supplied, when the PDF
 * fails validation, or when a PDF arrives without a filename — the filename is
 * a PDF's only human-readable handle and the database CHECK requires it.
 */
export function resolveEqualityContent(
  input: EqualityContentInput,
): EqualityContentColumns {
  const hasHtml = isPresent(input.equalityReportContent)
  const hasPdf = isPresent(input.equalityReportPdf)

  if (hasHtml && hasPdf) {
    throw new BadRequestException(
      'Provide either equalityReportContent or equalityReportPdf, not both',
    )
  }

  if (!hasHtml && !hasPdf) {
    throw new BadRequestException(
      'An equality report requires either equalityReportContent or equalityReportPdf',
    )
  }

  if (hasHtml) {
    return {
      equalityReportContent: input.equalityReportContent as string,
      equalityReportContentType: EqualityContentTypeEnum.HTML,
      equalityReportContentFilename: null,
    }
  }

  const pdf = input.equalityReportPdf as string

  assertValidPdf(pdf)

  if (!isPresent(input.equalityReportPdfFilename)) {
    throw new BadRequestException(
      'equalityReportPdfFilename is required when submitting a PDF',
    )
  }

  return {
    equalityReportContent: pdf,
    equalityReportContentType: EqualityContentTypeEnum.PDF,
    equalityReportContentFilename: input.equalityReportPdfFilename.trim(),
  }
}

/**
 * The draft variant: a draft may legitimately carry no content yet, and a PATCH
 * that mentions neither field must leave whatever is stored alone.
 *
 * Returns `null` for "the caller said nothing about content" — distinct from
 * `resolveEqualityContent`, where saying nothing is an error because a submit
 * has to end with content.
 */
export function resolveOptionalEqualityContent(
  input: EqualityContentInput,
): EqualityContentColumns | null {
  const mentionsHtml = input.equalityReportContent !== undefined
  const mentionsPdf = input.equalityReportPdf !== undefined

  if (!mentionsHtml && !mentionsPdf) {
    return null
  }

  /*
   * An explicit null/empty on either field clears the content. Mapped to HTML
   * with a null filename because that is what an untouched draft looks like —
   * the row must not sit at type PDF with nothing to show, which the database
   * CHECK would reject anyway once the filename went null with it.
   */
  if (
    !isPresent(input.equalityReportContent) &&
    !isPresent(input.equalityReportPdf)
  ) {
    return {
      equalityReportContent: null,
      equalityReportContentType: EqualityContentTypeEnum.HTML,
      equalityReportContentFilename: null,
    }
  }

  return resolveEqualityContent(input)
}
