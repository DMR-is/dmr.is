/**
 * How far an uploaded archive is allowed to inflate.
 *
 * `ImportUploadService` caps an upload at 20MB, but that counts *compressed*
 * bytes, and deflate reaches ~400:1 on repetitive cell markup — so the cap
 * upstream says almost nothing about what a workbook costs once opened. This
 * is the limit that does.
 *
 * It sits in this module because the two are the same decision measured at
 * different points, and every parser taking a buffer from `fetchWorkbook`
 * needs the second as much as the first. Note the two are only co-located, not
 * linked: `MAX_UPLOAD_BYTES` is private to `import-upload.service.ts` and
 * nothing here reads it, so changing one does not prompt a look at the other.
 */
import JSZip from 'jszip'

/**
 * Raised when an archive inflates past {@link MAX_INFLATED_ARCHIVE_BYTES}.
 *
 * Deliberately not an HTTP exception: the two importers that use this speak
 * to different audiences and word their errors differently, so each maps this
 * to its own response rather than inheriting a message chosen here.
 */
export class ArchiveTooLargeError extends Error {
  constructor(readonly limitBytes: number) {
    super(`Archive inflates past the ${limitBytes} byte budget`)
    this.name = 'ArchiveTooLargeError'
  }
}

/**
 * Total inflated size allowed for one uploaded archive, across every member.
 *
 * ## Where the number comes from
 *
 * It is derived from the container, not picked. The DoE API task runs with
 * 1536MB (`doe_api_memory`, the same in dev and prod) and the task definition
 * sets `--max-old-space-size` to 75% of that, so the heap ceiling is 1152MB.
 *
 * exceljs does not hold the XML, it holds an object graph built from it:
 * measured against the real template, 9.2MB of inflated XML retains 73.6MB of
 * heap after `xlsx.load`, so roughly **8x**.
 *
 *     32MB x 8 x 2 parses = ~520MB, or about 45% of the 1152MB heap
 *
 * That leaves the rest of the API its working set. 64MB would have implied
 * ~1040MB across two parses — nearly the whole ceiling, with the process
 * dying rather than answering 400.
 *
 * ## Headroom
 *
 * Measured on the real template, not guessed: it inflates to 9.2MB empty, and
 * a realistic employee row costs ~450 bytes of worksheet XML. At
 * `MAX_EMPLOYEES` (10 000) that is **13.5MB — about 2.4x under this budget**.
 * `ABSOLUTE_MAX_EMPLOYEE_ROWS` (50 000) extrapolates to ~31MB and sits on the
 * line, which is acceptable: `employees.parser.ts` documents that row count as
 * "almost certainly a corrupt or adversarial upload".
 *
 * That figure counts worksheet XML only. An embedded `xl/media` part — a
 * customer's logo pasted into the workbook — spends the same budget and is not
 * in the measurement, so the real headroom for a decorated report is lower
 * than 2.4x.
 *
 * ## What the "x 2" covers
 *
 * The 2 is the shared parse gate in `ParseGateCoreModule`, and it means two
 * workbooks *per process*: `parseWorkbook` and `parseCompanyImport` both
 * acquire from the same `Semaphore` instance, and each holds its slot from the
 * download through to the end of the parse, so no third workbook of either
 * kind can be in memory at once. Both consumers are counted because a company import retains
 * the same heap as a report import.
 *
 * Per process, not per deployment. `directorate-of-equality-partner-api` is a
 * separate task that also imports `ReportExcelCoreModule` and reads the same
 * env var, so it carries its own gate of 2 against its own heap. The budget
 * holds because each task is sized independently — but a change to
 * `doe_api_memory` has to be checked against both.
 *
 * The gate is deliberately one provider rather than one per module. Two gates
 * of 2 would permit four concurrent parses and ~1040MB — the same figure that
 * made a 64MB budget wrong above — while each module still read as correctly
 * bounded on its own, which is what would make it hard to catch.
 *
 * ## Why the queue costs nothing
 *
 * A slot is permission to *hold a workbook in memory*, not permission to burn
 * CPU — so the gate has to start where the allocation does. `fetchWorkbook` is
 * therefore called inside the gated region, by `ReportExcelService` and
 * `CompanyImportService` themselves, and the controllers hand those services a
 * key rather than a buffer. A caller waiting for a slot holds its pending HTTP
 * request and nothing else.
 *
 * That is what makes the figure above the *whole* cost rather than part of it.
 * It was not always true: while the controllers downloaded first, every queued
 * caller held up to `MAX_UPLOAD_BYTES` (20MB) for the length of its wait, so
 * the default queue of 20 quietly added ~400MB beside the ~520MB here — ~80% of
 * the ceiling, none of it in this derivation. `company-import.service.spec.ts`
 * pins the ordering ("does not download while it is queued for a slot"),
 * because nothing else about the code makes it visible.
 *
 * The trade is that a slot is now held across the S3 read as well as the parse,
 * which costs some parse throughput at only two slots. Worth it: the
 * alternative is an accounting that is wrong by ~400MB.
 *
 * ⚠️ Coupled to `DOE_EXCEL_MAX_CONCURRENT_PARSES` (default 2) and to
 * `doe_api_memory` in the infrastructure repo. Raising either without
 * revisiting this number spends heap that was accounted for here.
 */
export const MAX_INFLATED_ARCHIVE_BYTES = 32 * 1024 * 1024

/**
 * The member's uncompressed size as the archive declares it.
 *
 * jszip reads this from the central directory when the archive is opened, so
 * it is available before anything is inflated — but it is not on the public
 * `JSZipObject` type, and it is part of the archive, which makes it a claim
 * rather than a measurement.
 *
 * jszip does compare the claim against reality, but only on `end`
 * (`compressedObject.js`, "uncompressed data size mismatch") — its length
 * probe counts and never interrupts. A member that under-declares is
 * therefore inflated in full before the mismatch surfaces, which is exactly
 * the cost we are trying not to pay. So this is a cheap way to refuse an
 * archive that admits it is too large, and nothing more; the bound itself
 * comes from counting bytes as they arrive.
 */
const declaredUncompressedSize = (entry: JSZip.JSZipObject): number | null => {
  const { _data } = entry as unknown as {
    _data?: { uncompressedSize?: number }
  }
  return typeof _data?.uncompressedSize === 'number'
    ? _data.uncompressedSize
    : null
}

/**
 * What `nodeStream` hands back, described by the two members used here.
 *
 * jszip's own typings stop at `ReadableStream`, which has no `destroy`, and
 * the object is not an instance of Node's `Readable` either — jszip bundles
 * its own copy of `readable-stream`, so `instanceof` fails even though the
 * constructor reports that name. Casting to Node's `Readable` would therefore
 * assert something untrue; naming the two methods keeps the cast narrow.
 */
type AbortableByteStream = {
  on(event: 'data', listener: (chunk: Buffer) => void): unknown
  on(event: 'end', listener: () => void): unknown
  on(event: 'error', listener: (error: Error) => void): unknown
  destroy(): void
}

/**
 * Inflate one member, counting as it goes, and stop consuming once the count
 * passes what is left of the budget. Returns the bytes seen, which is at most
 * `remaining` plus one chunk.
 *
 * Discarding each chunk after counting is the point: this measures a member
 * without ever holding it.
 *
 * ## What `destroy()` does and does not do
 *
 * It stops delivery immediately — no `data` event arrives afterwards — but it
 * does not halt the inflate worker on the spot. jszip's `nodeStream` adapter
 * has no `_destroy` of its own, so the chain runs on until backpressure and
 * EOF stop it, pushing chunks that the destroyed stream rejects (those surface
 * as "push after EOF" on `error`, which the listener below absorbs — the
 * promise has already settled, so `reject` is a no-op).
 *
 * The overshoot is a small multiple of the budget, not of the member.
 * Measured on a 400MB member with a 32MB budget: 42.9MB actually inflated
 * (~1.34x budget) and 41.6MB peak RSS growth, against a member that would
 * otherwise have landed in full. Other runs of the same shape have reached
 * ~2x. So the guarantee is "bounded by the budget times a small constant",
 * which is what matters here — never "bounded by the member".
 */
const countInflatedBytes = (
  entry: JSZip.JSZipObject,
  remaining: number,
): Promise<number> =>
  new Promise((resolve, reject) => {
    let seen = 0
    const stream = entry.nodeStream(
      'nodebuffer',
    ) as unknown as AbortableByteStream

    stream.on('data', (chunk: Buffer) => {
      seen += chunk.length
      if (seen > remaining) {
        stream.destroy()
        resolve(seen)
      }
    })
    stream.on('end', () => resolve(seen))
    stream.on('error', reject)
  })

/**
 * Refuse an archive that inflates past the budget, before anything inflates
 * it for real.
 *
 * Call this after `JSZip.loadAsync` and before handing the buffer to exceljs.
 * `workbook.xlsx.load` has no ceiling of its own and uses this same jszip, so
 * this is the only thing standing between a 20MB upload and several GB of
 * inflation.
 *
 * Costs one extra inflate pass over a legitimate upload — ~25ms for the
 * template — and is capped at the budget for everything else.
 *
 * @throws {ArchiveTooLargeError}
 */
export const assertArchiveWithinBudget = async (
  zip: JSZip,
): Promise<void> => {
  let inflatedBytes = 0

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue

    const declared = declaredUncompressedSize(entry)
    if (
      declared !== null &&
      inflatedBytes + declared > MAX_INFLATED_ARCHIVE_BYTES
    ) {
      throw new ArchiveTooLargeError(MAX_INFLATED_ARCHIVE_BYTES)
    }

    inflatedBytes += await countInflatedBytes(
      entry,
      MAX_INFLATED_ARCHIVE_BYTES - inflatedBytes,
    )
    if (inflatedBytes > MAX_INFLATED_ARCHIVE_BYTES) {
      throw new ArchiveTooLargeError(MAX_INFLATED_ARCHIVE_BYTES)
    }
  }
}
