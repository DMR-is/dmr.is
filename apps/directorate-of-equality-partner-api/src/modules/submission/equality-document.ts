import * as mammoth from 'mammoth'

import { BadRequestException } from '@nestjs/common'

import { ONE_MEGA_BYTE } from '@dmr.is/constants'

/**
 * Largest equality plan a vendor may upload.
 *
 * Unlike the base64 PDF path on the island.is contract, this is not bounded by
 * the JSON body limit: `express.json()` does not parse `multipart/form-data`, so
 * the cap here is ours to choose and is enforced by multer per route rather than
 * globally. 10MB is generous for a narrative document — a plan that exceeds it
 * is carrying embedded images we are about to discard anyway, since only the
 * text becomes HTML.
 *
 * `ONE_MEGA_BYTE` is decimal (1000 × 1000) in this repo, matching the other
 * upload limits.
 */
export const MAX_EQUALITY_DOCUMENT_BYTES = 10 * ONE_MEGA_BYTE

/** What a `.docx` part should declare. Not trusted — see `sniff` below. */
export const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * A `.docx` is a ZIP archive, so it opens with the ZIP local file header.
 *
 * ⚠️ **The declared content type is not evidence.** Multer takes `file.mimetype`
 * from the `Content-Type` the client put on the part, so it is a claim by the
 * caller. `FileTypeValidationPipe` checks exactly that claim — and for a single
 * file it compares against the repo-wide `ALLOWED_MIME_TYPES`, which includes
 * `application/pdf` and `application/msword`, so it would admit both of the
 * formats this route exists to refuse. The bytes are what decide here.
 */
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])

/** `%PDF-`, so a PDF gets told what to do rather than a generic refusal. */
const PDF_MAGIC = Buffer.from('%PDF-', 'ascii')

/**
 * The OLE2 compound-file header that opens a legacy binary `.doc`.
 *
 * Worth detecting separately: it is the one wrong format a user is likely to
 * produce by accident, from an old template or an old Word, and the fix is one
 * Save As away. A generic "not a .docx" would leave them guessing.
 */
const OLE2_MAGIC = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

/**
 * The entry every Word document contains and no other ZIP has a reason to.
 *
 * Checked as a literal byte scan rather than by opening the archive: ZIP stores
 * entry names uncompressed in both the local headers and the central directory,
 * so the name is present in the file verbatim. This distinguishes a `.docx` from
 * an `.xlsx`, a `.pptx` or a plain zip of documents — all of which pass the ZIP
 * signature and none of which mammoth can convert into anything useful.
 */
const DOCX_ENTRY = Buffer.from('word/document.xml', 'ascii')

const MEGABYTES = (bytes: number) => Math.round(bytes / ONE_MEGA_BYTE)

/**
 * Names the format we were actually given, for the refusal message.
 *
 * Only as far as the formats worth naming — anything else is reported as "not a
 * Word document" rather than guessed at.
 */
const sniff = (
  buffer: Buffer,
): 'docx-zip' | 'pdf' | 'legacy-doc' | 'unknown' => {
  if (buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    return 'pdf'
  }

  if (buffer.subarray(0, OLE2_MAGIC.length).equals(OLE2_MAGIC)) {
    return 'legacy-doc'
  }

  if (buffer.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC)) {
    return 'docx-zip'
  }

  return 'unknown'
}

export type EqualityDocumentConversion = {
  /** The plan as HTML, ready for `equalityReportContent`. */
  html: string
  /**
   * What mammoth could not represent — unsupported styles, dropped elements.
   *
   * Not returned to the vendor: the conversion is ours to get right, and a
   * warning about an unmapped paragraph style is not something a payroll system
   * can act on. It is worth logging, because conversion quality lands on
   * Jafnréttisstofa's reviewers and this is the only signal that something was
   * lost.
   */
  warnings: string[]
}

/**
 * Turns an uploaded `.docx` into the HTML an equality report stores.
 *
 * Most employers keep the plan in Word, so asking a vendor for HTML pushed a
 * conversion problem onto the party least equipped to solve it. This moves it
 * here.
 *
 * **`.pdf` is refused rather than converted.** A PDF carries no structure, only
 * positioned glyphs; there is no honest conversion into the markup the PDF
 * renderer and the reviewer's editor both expect, and mangled output is worse
 * than a clear refusal — it would reach a reviewer looking like the employer's
 * own work.
 *
 * **The original is not kept.** The reviewer edits and approves the HTML, so the
 * approved HTML is the record and the upload is transport. That is a deliberate
 * decision, not an omission.
 */
export async function convertEqualityDocumentToHtml(
  buffer: Buffer | undefined,
): Promise<EqualityDocumentConversion> {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException(
      'The equality report document is missing or empty — upload the plan as a .docx file in the "document" part',
    )
  }

  // Before anything reads the bytes: a caller cannot make us hold a buffer
  // larger than the cap in order to discover it is too large. Multer enforces
  // the same limit at the route, so reaching this is a misconfiguration rather
  // than a request — it is checked anyway, because the cap is the contract.
  if (buffer.length > MAX_EQUALITY_DOCUMENT_BYTES) {
    throw new BadRequestException(
      `The equality report document exceeds the ${MEGABYTES(MAX_EQUALITY_DOCUMENT_BYTES)}MB limit`,
    )
  }

  const format = sniff(buffer)

  if (format === 'pdf') {
    throw new BadRequestException(
      'A PDF cannot be accepted as the equality report. A PDF carries no document structure, so it cannot be converted into the content a reviewer edits — export or save the plan as .docx and upload that',
    )
  }

  if (format === 'legacy-doc') {
    throw new BadRequestException(
      'This is a legacy .doc file, which is not supported. Open it in Word and use Save As to produce a .docx, then upload that',
    )
  }

  if (format === 'unknown') {
    throw new BadRequestException(
      'The uploaded file is not a Word document — expected a .docx',
    )
  }

  if (buffer.indexOf(DOCX_ENTRY) === -1) {
    throw new BadRequestException(
      'The uploaded file is a zip archive but not a Word document — expected a .docx',
    )
  }

  let result: { value: string; messages: { message: string }[] }
  try {
    result = await mammoth.convertToHtml({ buffer })
  } catch {
    // Mammoth's own failures are about the file's internals — a corrupt archive,
    // an unreadable part. Nothing in its message helps a caller, and passing it
    // through would publish our dependency's wording as contract.
    throw new BadRequestException(
      'The equality report document could not be read. It may be corrupt — try re-saving it from Word',
    )
  }

  const html = result.value.trim()

  // A document that converts to nothing is almost always the wrong file, or a
  // plan whose text lives entirely in images. Either way it cannot be reviewed,
  // and storing an empty plan would put an unreviewable report in the queue.
  if (html.length === 0) {
    throw new BadRequestException(
      'The equality report document contains no text. If the plan is an image or a scan, the text has to be present as text for a reviewer to work with it',
    )
  }

  return {
    html,
    warnings: result.messages.map((message) => message.message),
  }
}
