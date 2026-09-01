import { createHash, randomUUID } from 'crypto'
import { mkdir, readFile, rm, stat, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common'

import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import { IAWSService } from '@dmr.is/shared-modules'
import { getDoeImportsBucket } from '@dmr.is/utils-server/serverUtils'

import { PresignUploadResponseDto } from './dto/presign-upload-response.dto'
import {
  IImportUploadService,
  ImportUploadBoundary,
} from './import-upload.service.interface'

const LOGGING_CONTEXT = 'ImportUploadService'

/**
 * Facet on `@errorCode:IMPORT_CLEANUP_KEY_REFUSED` to find a delete attempted
 * outside a boundary's own prefix.
 *
 * This is client-reachable, not impossible: `ImportKeyDto` validates only
 * length, so any authenticated caller POSTing `{"key":"x"}` fails
 * `assertKeyWithinBoundary`, and the resulting 400 is terminal — so the delete
 * path runs and refuses here. A pattern on the DTO would not help; the DTO does
 * not know the caller's boundary, so it could only carry a weaker second copy
 * of the rule.
 *
 * What is worth investigating is this firing for a *well-formed* key, which
 * means a call site passed one it had not validated against its own boundary.
 * Kept at `warn` rather than `debug` for that: a detector switched off in
 * production catches nothing.
 */
const IMPORT_CLEANUP_KEY_REFUSED = 'IMPORT_CLEANUP_KEY_REFUSED'

/**
 * The outcomes after which a staged upload may be destroyed.
 *
 * Deliberately an allow-list of *deletes* rather than a deny-list of keeps, and
 * that direction is the whole point. Every status invented later — a retryable
 * `429`, an ownership `403` — lands outside this set and keeps the object,
 * which is the cheap failure. A stale object costs one bucket-lifecycle sweep;
 * deleting one the caller is about to retry with costs them the presign, the
 * PUT and the preview over again.
 *
 * The earlier rule here was "not a `ServiceUnavailableException`", which reads
 * as the same idea and is not: a transient S3 error arrives from
 * `ResultWrapper.unwrap` as a plain `HttpException`, so it fell through to the
 * delete.
 *
 * `BAD_REQUEST` covers both an unreadable workbook and a key that failed
 * validation. The second is safe to have in this set only because `cleanup`
 * re-checks the key and refuses — do not collapse the two guards.
 */
const TERMINAL_STATUSES: ReadonlySet<number> = new Set([
  HttpStatus.BAD_REQUEST,
  HttpStatus.PAYLOAD_TOO_LARGE,
])

/** No `error` means the import succeeded, which is terminal for the object. */
const isTerminalForUpload = (error?: unknown): boolean =>
  error === undefined ||
  (error instanceof HttpException && TERMINAL_STATUSES.has(error.getStatus()))

const KEY_PREFIX = 'doe-imports'
const ONE_MB = 1024 * 1024
const MAX_UPLOAD_BYTES = ONE_MB * 20

/** Single wording for every place the cap is enforced. */
const TOO_LARGE_MESSAGE = `Uploaded workbook exceeds the ${MAX_UPLOAD_BYTES / ONE_MB}MB limit`

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'

/** doe-imports/<boundary>/<uuid>.xlsx */
const keyPattern = (boundary: ImportUploadBoundary) =>
  new RegExp(`^${KEY_PREFIX}/${boundary}/${UUID}\\.xlsx$`)

/** Matches a key for any known boundary — used when the boundary isn't known yet. */
const anyKeyPattern = new RegExp(
  `^${KEY_PREFIX}/(${Object.values(ImportUploadBoundary).join('|')})/${UUID}\\.xlsx$`,
)

/** Short, stable digest so a refused key can be correlated but not echoed. */
const hashKey = (key: string): string =>
  createHash('sha256').update(key).digest('hex').slice(0, 12)

/** Where local-mode uploads are staged on disk instead of S3. */
const LOCAL_UPLOAD_DIR = join(tmpdir(), 'doe-import-uploads')

@Injectable()
export class ImportUploadService implements IImportUploadService {
  constructor(
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    @Inject(IAWSService) private readonly aws: IAWSService,
  ) {}

  /**
   * Local development has no S3 bucket configured. When that's the case we skip
   * S3 entirely: `createUpload` hands back a URL pointing at this API's own
   * local PUT endpoint, and fetch/cleanup read and delete from a temp dir. The
   * `AWS_SALARY_ANALYSIS_FILES_BUCKET` env var is the signal — it's always set
   * in deployed environments and never set locally, so this can't trip in prod.
   */
  private get isLocal(): boolean {
    return !process.env.AWS_SALARY_ANALYSIS_FILES_BUCKET
  }

  async createUpload(
    boundary: ImportUploadBoundary,
  ): Promise<PresignUploadResponseDto> {
    const key = `${KEY_PREFIX}/${boundary}/${randomUUID()}.xlsx`

    if (this.isLocal) {
      // The web's putWorkbookToPresignedUrl PUTs the file to whatever URL it's
      // given, so we point it at our own endpoint instead of S3.
      const url = this.localUploadUrl(key)

      this.logger.debug('Issued local import upload URL (S3 bypassed)', {
        context: LOGGING_CONTEXT,
        boundary,
        key,
      })

      return { url, key }
    }

    const { url } = (
      await this.aws.getPresignedUrl(key, getDoeImportsBucket())
    ).unwrap()

    this.logger.debug('Issued presigned import upload URL', {
      context: LOGGING_CONTEXT,
      boundary,
      key,
    })

    return { url, key }
  }

  /**
   * Reject anything outside this boundary's own prefix — the key is
   * client-supplied and must not become an arbitrary-object read or delete.
   *
   * Public so a caller can run it *before* acquiring a parse slot.
   * `fetchWorkbook` allocates, so the gate is taken ahead of it; validating
   * inside the gated region would let an invalid key sit in the queue and
   * delay its own 400.
   */
  assertKeyWithinBoundary(key: string, boundary: ImportUploadBoundary): void {
    if (!keyPattern(boundary).test(key)) {
      throw new BadRequestException('Invalid import upload key')
    }
  }

  async fetchWorkbook(
    key: string,
    boundary: ImportUploadBoundary,
  ): Promise<Buffer> {
    // Repeated even though gated callers assert this first: this method is the
    // one that touches storage, so the check belongs where the read happens
    // rather than only at the call sites that remember it.
    this.assertKeyWithinBoundary(key, boundary)

    try {
      // The cap has to be pushed down into the download itself. The presigned
      // PUT signs neither Content-Length nor Content-Type, so the staged object
      // can be arbitrarily large, and the URL stays valid for an hour against a
      // key the caller owns — so it can be swapped after any size check we do
      // up front. Capping the stream is the only bound that holds; capping the
      // finished buffer means we already read the whole thing into memory.
      const buffer = this.isLocal
        ? await this.readLocal(key)
        : (
            await this.aws.getObjectBuffer(key, getDoeImportsBucket(), {
              maxBytes: MAX_UPLOAD_BYTES,
            })
          ).unwrap()

      // Backstop only — both branches above already cap the read. This asserts
      // the contract of the functions we just called rather than adding
      // protection.
      if (buffer.length > MAX_UPLOAD_BYTES) {
        throw new PayloadTooLargeException(TOO_LARGE_MESSAGE)
      }

      return buffer
    } catch (error) {
      // An object we refused for its size can never become importable, so drop
      // it now rather than leaving it for the bucket lifecycle rule. The
      // controllers only reach cleanup() through their try/finally *after* this
      // method returns, so on a 413 the object would otherwise stay in the
      // bucket — and a caller could loop presign -> PUT something huge ->
      // import -> 413 to park unbounded data there. Rejecting cheaply made that
      // loop fast, so this is the half that closes it.
      //
      // Deleting here is safe precisely because the keyPattern check above has
      // already proven the key sits inside this boundary's own prefix; cleanup()
      // does not validate keys, which is also why the fix does not belong in the
      // controllers' try/finally, where the invalid-key path would reach it.
      //
      // Only for 413. A transient S3 or disk failure must not destroy the
      // caller's upload. The S3 branch's 413 arrives from ResultWrapper.unwrap
      // as a bare HttpException rather than a PayloadTooLargeException, so match
      // on the status, not the subclass.
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.PAYLOAD_TOO_LARGE
      ) {
        // cleanup() is best-effort and swallows its own failures, so this cannot
        // turn the 413 into a 500.
        await this.cleanup(key, boundary)
      }

      throw error
    }
  }

  async cleanupAfter(
    key: string,
    boundary: ImportUploadBoundary,
    error?: unknown,
  ): Promise<void> {
    if (!isTerminalForUpload(error)) {
      // Debug, not warn: this is the *designed* outcome of a transient
      // failure, not an anomaly. It fires on every shed 503.
      this.logger.debug('Keeping the staged upload after a transient failure', {
        context: LOGGING_CONTEXT,
        boundary,
        keyHash: hashKey(key),
      })
      return
    }

    await this.cleanup(key, boundary)
  }

  /**
   * Unconditional delete. Private so the terminal-vs-transient decision cannot
   * be bypassed by reaching past {@link cleanupAfter}; `fetchWorkbook`'s 413
   * path is the one internal caller that has already established terminality.
   */
  private async cleanup(
    key: string,
    boundary: ImportUploadBoundary,
  ): Promise<void> {
    // The controllers' cleanup paths are reachable on the invalid-key path now
    // that the download happens inside the service call rather than ahead of
    // it, so this can be handed a key that never passed `fetchWorkbook`'s
    // check. Validating here is what keeps a 400 from becoming a delete.
    //
    // Refuses rather than throws: every caller invokes this from a `finally` or
    // a `catch` with another error already in flight, and throwing would
    // replace the error the client is owed.
    if (!keyPattern(boundary).test(key)) {
      this.logger.warn('Refused to delete a staged object outside its prefix', {
        context: LOGGING_CONTEXT,
        errorCode: IMPORT_CLEANUP_KEY_REFUSED,
        boundary,
        // Not the key itself: it is up to 256 bytes of caller-controlled text
        // on a line somebody may alert on. The hash correlates repeats without
        // putting request input in the log.
        keyHash: hashKey(key),
      })
      return
    }

    try {
      if (this.isLocal) {
        await rm(this.localPath(key), { force: true })
        return
      }

      await this.aws.deleteObject(key, getDoeImportsBucket())
    } catch (error) {
      // Best-effort: a stale object is reaped by the bucket lifecycle rule
      // (or, locally, by the OS temp dir).
      this.logger.warn('Failed to delete staged import object', {
        context: LOGGING_CONTEXT,
        key,
        error,
      })
    }
  }

  async storeLocalUpload(key: string, data: Buffer): Promise<void> {
    // Hard guard: this path only exists for local development. In a deployed
    // environment the bucket is set and we must never accept raw uploads here.
    if (!this.isLocal) {
      throw new BadRequestException('Local import upload is disabled')
    }

    if (!anyKeyPattern.test(key)) {
      throw new BadRequestException('Invalid import upload key')
    }

    if (data.length > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(TOO_LARGE_MESSAGE)
    }

    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true })
    await writeFile(this.localPath(key), data)

    this.logger.debug('Staged local import upload (S3 bypassed)', {
      context: LOGGING_CONTEXT,
      key,
    })
  }

  private async readLocal(key: string): Promise<Buffer> {
    const path = this.localPath(key)

    let size: number
    try {
      size = (await stat(path)).size
    } catch {
      throw new BadRequestException('Import upload not found')
    }

    // Dev-only path, but it must not read an arbitrarily large file into memory
    // either — check the size on disk before opening it.
    if (size > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException(TOO_LARGE_MESSAGE)
    }

    try {
      return await readFile(path)
    } catch {
      throw new BadRequestException('Import upload not found')
    }
  }

  /** Flatten the namespaced key to a single safe filename. Key is pre-validated. */
  private localPath(key: string): string {
    return join(LOCAL_UPLOAD_DIR, key.replace(/\//g, '_'))
  }

  private localUploadUrl(key: string): string {
    const port = process.env.DIRECTORATE_OF_EQUALITY_API_PORT || 5100
    // Matches the API's global prefix ('api') + URI version ('v1'); the endpoint
    // is unguarded and gated by the local-mode check in storeLocalUpload.
    return `http://localhost:${port}/api/v1/imports/local?key=${encodeURIComponent(key)}`
  }
}
