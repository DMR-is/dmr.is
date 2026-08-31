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
 * ## What the "x 2" does and does not cover
 *
 * The 2 is `MAX_CONCURRENT_PARSES`, and it gates `parseWorkbook` only — it is
 * a private semaphore inside `ReportExcelService`. `parseCompanyImport` also
 * uses this budget and runs through no gate at all, so each concurrent company
 * import adds ~260MB on top of the ~520MB accounted for above. That path is
 * admin-only and realistically serial, which is why the number stands, but it
 * is a gap in the derivation rather than something it covers.
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
 * Inflate one member, counting as it goes, and stop the moment it exceeds
 * what is left of the budget. Returns the bytes seen — which is at most
 * `remaining` plus one chunk, never the member's full size.
 *
 * Discarding each chunk after counting is the point: this measures a member
 * without ever holding it.
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
