import JSZip from 'jszip'
import * as mammoth from 'mammoth'

import { BadRequestException } from '@nestjs/common'

import { ONE_MEGA_BYTE } from '@dmr.is/constants'

/**
 * Largest equality plan a vendor may upload.
 *
 * Unlike the base64 PDF path on the island.is contract, this is not bounded by
 * the JSON body limit: `express.json()` does not parse `multipart/form-data`, so
 * the cap here is ours to choose and is enforced by multer per route rather than
 * globally. 10MB is generous for a narrative document.
 *
 * ⚠️ **This bounds the compressed archive and nothing else.** A `.docx` is a ZIP,
 * and the ratio between what a caller uploads and what we allocate reading it is
 * unbounded in principle — see `MAX_INFLATED_DOCUMENT_BYTES`, which is the bound
 * that actually protects the process.
 *
 * `ONE_MEGA_BYTE` is decimal (1000 × 1000) in this repo, matching the other
 * upload limits.
 */
export const MAX_EQUALITY_DOCUMENT_BYTES = 10 * ONE_MEGA_BYTE

/**
 * Largest total the archive may declare once inflated.
 *
 * **The compressed cap is not a proxy for this one**, and treating it as one is
 * how a 10MB upload becomes gigabytes of resident memory. A ZIP's compression
 * ratio is attacker-chosen: a small archive of highly repetitive XML inflates by
 * three orders of magnitude, and `mammoth` builds the whole HTML string in
 * memory, synchronously, on the event loop — so the process stalls every other
 * request on its way to being OOM-killed.
 *
 * The sibling path already learned this and wrote it down: `equality-content.ts`
 * bounds a base64 body *before* decoding it, precisely so a caller cannot make
 * the API allocate past the cap in order to discover it is past the cap. This is
 * the same rule for a different container.
 *
 * 40MB against a 10MB upload allows a ratio of four, which is more than a real
 * document of text and formatting needs, and far below the ratios that make this
 * an attack. Checked from the archive's own declared sizes before anything is
 * inflated, so refusing costs nothing.
 */
export const MAX_INFLATED_DOCUMENT_BYTES = 40 * ONE_MEGA_BYTE

/**
 * Largest HTML the conversion may produce.
 *
 * Second line, behind the declared-size check: a ZIP header can lie, and the
 * entry sizes are the archive's own claim about itself. This one is measured on
 * the result, so nothing a caller can declare gets past it.
 *
 * It also bounds what reaches storage. The HTML lands in `TEXT`, which has no
 * length of its own, and `equalityContentForRead` returns it on report detail,
 * on draft detail and on the linked-equality block of every salary report — so
 * an oversized plan is not a one-off cost, it is paid on every read of that
 * report for as long as it exists.
 */
export const MAX_CONVERTED_HTML_BYTES = 4 * ONE_MEGA_BYTE

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

/**
 * Conversion options, and the one thing they change.
 *
 * **Mammoth inlines images as base64 `data:` URIs by default**
 * (`images.dataUri`), so without this every photograph in a plan is re-encoded
 * into the HTML at four thirds of its original size. That HTML is written to a
 * `TEXT` column and returned by `equalityContentForRead` on report detail, on
 * draft detail and on the linked-equality block of every salary report — so a
 * few embedded screenshots become a permanent cost on every read of that report,
 * and the single largest source of the inflation the size bounds exist to stop.
 *
 * Dropping them is also what the contract already claims: the guide tells a
 * vendor a scanned plan is refused because a reviewer needs text. With images
 * inlined that refusal could not fire — a page of scans converted to a page of
 * `<img>` elements, which is a non-empty string and an unreviewable document.
 *
 * The plan's *text* is what is being filed. An employer whose plan depends on a
 * diagram is not served by a base64 blob in a rich-text editor either.
 */
const MAMMOTH_OPTIONS = {
  // `src: ''` rather than dropping the element: mammoth's types require an
  // attribute set, and an empty `<img>` is a truthful marker that the plan had a
  // picture there without carrying it. `textContentOf` ignores it, so a plan
  // that is *only* pictures still reads as empty and is refused.
  convertImage: mammoth.images.imgElement(() => Promise.resolve({ src: '' })),
}

/** Decimal, to match `ONE_MEGA_BYTE` — so a message names the same number the constant does. */
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

  await assertInflatedSizeWithinBound(buffer)

  let result: { value: string; messages: { message: string }[] }
  try {
    result = await mammoth.convertToHtml({ buffer }, MAMMOTH_OPTIONS)
  } catch {
    // Mammoth's own failures are about the file's internals — a corrupt archive,
    // an unreadable part. Nothing in its message helps a caller, and passing it
    // through would publish our dependency's wording as contract.
    throw new BadRequestException(
      'The equality report document could not be read. It may be corrupt — try re-saving it from Word',
    )
  }

  const html = result.value.trim()

  // Measured rather than declared, so a lying ZIP header does not get past the
  // check above. Bytes, not characters: the column and the wire both count bytes.
  if (Buffer.byteLength(html, 'utf-8') > MAX_CONVERTED_HTML_BYTES) {
    throw new BadRequestException(
      `The equality report converts to more than ${MEGABYTES(MAX_CONVERTED_HTML_BYTES)}MB of content. A plan this large is usually one with images or scans embedded in it — a reviewer needs the text`,
    )
  }

  // A document that converts to nothing is almost always the wrong file, or a
  // plan whose text lives entirely in images. Either way it cannot be reviewed,
  // and storing an empty plan would put an unreviewable report in the queue.
  //
  // Measured on the *text*, not on the markup. A scanned plan converts to a
  // page of `<img>` elements, which is a non-empty string and an empty document:
  // checking `html.length` alone accepted exactly the file this refusal exists
  // to catch.
  if (textContentOf(html).length === 0) {
    throw new BadRequestException(
      'The equality report document contains no text. If the plan is an image or a scan, the text has to be present as text for a reviewer to work with it',
    )
  }

  return {
    html,
    warnings: result.messages.map((message) => message.message),
  }
}

/**
 * Refuses an archive that declares more content than we will hold, before any
 * of it is inflated.
 *
 * ZIP entries carry their uncompressed size in the central directory, so this
 * costs a header parse and no allocation — which is the whole point. Inflating
 * first to find out how big it is would be the bug.
 *
 * A truthful archive is bounded here; a lying one is bounded by
 * `MAX_CONVERTED_HTML_BYTES` on the way out. An archive JSZip cannot open at all
 * is left to `mammoth` to reject, so the corrupt-file message stays in one place.
 */
async function assertInflatedSizeWithinBound(buffer: Buffer): Promise<void> {
  let declared = 0

  try {
    const zip = await JSZip.loadAsync(buffer)

    zip.forEach((_path, entry) => {
      // Not part of JSZip's published types, but it is what the central
      // directory holds and what every version of JSZip 3 stores here. Absent
      // or unreadable, the entry contributes nothing and the output bound
      // catches what this one misses.
      const size = (entry as { _data?: { uncompressedSize?: number } })._data
        ?.uncompressedSize

      if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
        declared += size
      }
    })
  } catch {
    return
  }

  if (declared > MAX_INFLATED_DOCUMENT_BYTES) {
    throw new BadRequestException(
      `The equality report document expands to more than ${MEGABYTES(MAX_INFLATED_DOCUMENT_BYTES)}MB and was not read. A plan this large is usually one with images or scans embedded in it — a reviewer needs the text`,
    )
  }
}

/** The document's readable text, with markup and entities' whitespace removed. */
function textContentOf(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}
