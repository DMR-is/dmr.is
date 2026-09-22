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
 * Largest total the archive may **declare** once inflated.
 *
 * A cheap first pass, read from the central directory, costing a header parse
 * and no allocation. It is not the bound that protects the process — a header is
 * the archive's own claim about itself, and an attacker writes it. It is here to
 * refuse the honest-but-enormous before anything is inflated at all.
 *
 * The bound that actually holds is `MAX_INFLATED_ARCHIVE_BYTES`, measured.
 */
export const MAX_DECLARED_ARCHIVE_BYTES = 20 * ONE_MEGA_BYTE

/**
 * Total inflated bytes we will read out of the archive, **measured as it
 * inflates**.
 *
 * A budget across every part, not a cap on one. The first version of this bound
 * guarded `word/document.xml` alone, which is the part that carries the plan —
 * but mammoth also reads `[Content_Types].xml`, both `_rels` parts, `styles`,
 * `numbering`, `footnotes`, `endnotes` and `comments`, each as a full
 * `async('uint8array')` with no cap of its own. Bounding one of nine left the
 * other eight behind nothing but the declared-size pass, whose own docblock says
 * why that is not a defence: the header is the caller's to write. A 6.8MB upload
 * with one forged entry reached 2167MB RSS against a 1536MB task — a container
 * kill, not a refusal.
 *
 * Budgeting the archive rather than enumerating mammoth's reads is deliberate.
 * Which parts it opens is its business and can change with a version bump; a
 * list of them here would be a defence that silently stops covering what it
 * names.
 *
 * The number comes from the
 * heap rather than from roundness. Mammoth does not hold the XML: it builds a
 * DOM from it and then an HTML string, and the peak is tens of times the XML —
 * 38MB of declared XML was measured reaching 3.6GB RSS, about 96×. The deployed
 * task has a 1152MB heap, so anything past roughly 5MB of XML is a fatal OOM
 * rather than a refusal. 4MB keeps the peak near a third of the heap.
 *
 * It is generous for the documents this route exists for: WordprocessingML runs
 * a few kilobytes per page of prose, so this is several hundred pages of an
 * equality plan — far past what any employer files, and far below what the
 * process survives.
 *
 * **Measured, not declared**, which is the point of the second pass. An archive
 * that understates its sizes passes the header check and then inflates anyway,
 * and the cost is paid before anything downstream notices the mismatch.
 * Counting bytes as they arrive is the only bound a lying header cannot pass.
 */
export const MAX_INFLATED_ARCHIVE_BYTES = 4 * ONE_MEGA_BYTE

/**
 * Largest HTML the conversion may produce.
 *
 * Third line, and the weakest, because it can only be read once mammoth has
 * already allocated everything. With `MAX_INFLATED_ARCHIVE_BYTES` in front of it
 * this should be unreachable through the route — 4MB of WordprocessingML does
 * not become 4MB of HTML, since the markup is smaller than the XML it came
 * from. It stays as what catches a wrong assumption about that, and is tested
 * directly rather than through a fixture that cannot reach it.
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
/**
 * Where a `.docx` keeps its pictures, and the one thing the budget skips.
 *
 * Mammoth never inflates these: `MAMMOTH_OPTIONS.convertImage` answers without
 * reading the image part, so their bytes are not an attack surface — and
 * inflating them here to count them would spend exactly the memory the budget
 * exists to protect, on the one kind of part a real plan legitimately fills.
 * A bomb hidden in `word/media` costs nothing because nothing ever opens it.
 */
const MEDIA_PREFIX = 'word/media/'

const DOCX_ENTRY_PATH = 'word/document.xml'
const DOCX_ENTRY = Buffer.from(DOCX_ENTRY_PATH, 'ascii')

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

  // Two passes, cheapest first: refuse what the archive admits to, then measure
  // what it actually does. Neither alone is enough — see each constant.
  const zip = await openArchive(buffer)

  if (zip) {
    assertDeclaredSizeWithinBound(zip)
    await assertArchiveInflatesWithinBudget(zip)
  }

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
  assertConvertedHtmlWithinBound(html)

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
 * Opens the archive's directory without inflating anything.
 *
 * `loadAsync` parses headers and defers every entry's content, so this costs a
 * header parse and no allocation. An archive it cannot open returns `null` and
 * is left to `mammoth` to reject, keeping the corrupt-file message in one place.
 */
async function openArchive(buffer: Buffer): Promise<JSZip | null> {
  try {
    return await JSZip.loadAsync(buffer)
  } catch {
    return null
  }
}

/**
 * Refuses what the archive admits to, before anything is inflated.
 *
 * Cheap, and easily evaded — an attacker writes these numbers. It rejects the
 * honest-but-enormous at no cost; it is not what carries the weight.
 */
function assertDeclaredSizeWithinBound(zip: JSZip): void {
  let declared = 0

  zip.forEach((_path, entry) => {
    // Not in JSZip's published types, but it is what the central directory holds
    // and where JSZip 3 keeps it. Absent or unreadable, the entry contributes
    // nothing — the measured pass below is the one that matters.
    const size = (entry as { _data?: { uncompressedSize?: number } })._data
      ?.uncompressedSize

    if (typeof size === 'number' && Number.isFinite(size) && size > 0) {
      declared += size
    }
  })

  if (declared > MAX_DECLARED_ARCHIVE_BYTES) {
    throw new BadRequestException(
      `The equality report document expands to more than ${MEGABYTES(MAX_DECLARED_ARCHIVE_BYTES)}MB and was not read. A plan this large is usually one with images or scans embedded in it — a reviewer needs the text`,
    )
  }
}

/**
 * Refuses an archive that inflates past the budget, **while it inflates**.
 *
 * The one construction a forged header cannot beat. JSZip streams each entry, so
 * the count costs a chunk at a time rather than the whole part, and the stream
 * is paused the moment the running total goes over — the refusal happens instead
 * of the allocation rather than after it.
 *
 * One budget across every part, spent in order, because the cost that matters is
 * what the archive makes us hold in total and not what any single entry does.
 * It runs before `mammoth.convertToHtml`, which is what covers the parts it
 * reads first — `[Content_Types].xml` and the `_rels` are opened before anything
 * structural is validated, so a guard attached to the document part alone would
 * already have been too late.
 *
 * Mammoth inflates all of it again afterwards, deliberately: a second pass over
 * something known to be under 4MB is cheap, and the alternative is handing it
 * bytes we decompressed ourselves, which means owning a WordprocessingML reader
 * we have no reason to own.
 */
async function assertArchiveInflatesWithinBudget(zip: JSZip): Promise<void> {
  const parts: JSZip.JSZipObject[] = []

  zip.forEach((path, entry) => {
    if (!entry.dir && !path.startsWith(MEDIA_PREFIX)) {
      parts.push(entry)
    }
  })

  let spent = 0

  for (const part of parts) {
    spent = await countInflatedBytes(part, spent)
  }
}

/**
 * Streams one entry, adding to the running total, and refuses the moment the
 * budget is gone.
 *
 * Resolves with the new total so the next entry continues from it — the budget
 * is archive-wide, and nine entries each just under it would be nine times the
 * memory a single one is allowed.
 */
function countInflatedBytes(
  entry: JSZip.JSZipObject,
  alreadySpent: number,
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    let spent = alreadySpent
    let settled = false
    const stream = entry.nodeStream('nodebuffer')

    const finish = (error?: Error) => {
      if (settled) {
        return
      }
      settled = true

      // Stop pulling. Without this the worker keeps inflating into a promise
      // nobody is waiting on any more — which is the allocation being refused.
      try {
        stream.pause()
      } catch {
        // Already finished or already broken; nothing to stop.
      }

      if (error) {
        reject(error)
      } else {
        resolve(spent)
      }
    }

    stream.on('data', (chunk: Buffer) => {
      spent += chunk.length

      if (spent > MAX_INFLATED_ARCHIVE_BYTES) {
        finish(
          new BadRequestException(
            `The equality report document expands to more than ${MEGABYTES(MAX_INFLATED_ARCHIVE_BYTES)}MB of content and was not read. A plan this large is usually one with images or scans embedded in it — a reviewer needs the text`,
          ),
        )
      }
    })

    // A stream that fails mid-inflate is a corrupt archive, which `mammoth`
    // reports in its own words one step later. Resolving keeps that message in
    // one place rather than growing a second one.
    stream.on('error', () => finish())
    stream.on('end', () => finish())
  })
}

/**
 * The last bound, on what the conversion produced.
 *
 * Exported because it cannot be reached through the route once the input is
 * bounded, and a bound no fixture can exercise is a bound that quietly stops
 * working. Tested directly instead.
 */
export function assertConvertedHtmlWithinBound(html: string): void {
  if (Buffer.byteLength(html, 'utf-8') > MAX_CONVERTED_HTML_BYTES) {
    throw new BadRequestException(
      `The equality report converts to more than ${MEGABYTES(MAX_CONVERTED_HTML_BYTES)}MB of content. A plan this large is usually one with images or scans embedded in it — a reviewer needs the text`,
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
